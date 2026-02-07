import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function POST(request) {
  const admin = await getAdminOrUserFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recipients, subject, htmlContent, textContent, senderName, senderEmail, attachments } = body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required and must contain at least one email' },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!htmlContent || !htmlContent.trim()) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'Brevo API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    // Prepare recipient list - handle both string emails and {name, email} objects
    const recipientList = recipients
      .map(recipient => {
        // Handle string format (backward compatibility)
        if (typeof recipient === 'string') {
          return recipient.trim() && recipient.includes('@') 
            ? { email: recipient.trim(), name: '' } 
            : null;
        }
        // Handle object format {name, email}
        if (recipient && recipient.email && recipient.email.includes('@')) {
          return { 
            email: recipient.email.trim(), 
            name: recipient.name ? recipient.name.trim() : '' 
          };
        }
        return null;
      })
      .filter(r => r !== null);

    if (recipientList.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses found in recipients list' },
        { status: 400 }
      );
    }

    // Prepare email data
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Set sender
    sendSmtpEmail.sender = {
      name: senderName || 'CVERSE by Demirti',
      email: senderEmail || process.env.BREVO_FROM_EMAIL || process.env.BREVO_TO_EMAIL || 'admin@demirti.com'
    };

    // Set recipients
    sendSmtpEmail.to = recipientList;

    // Set subject
    sendSmtpEmail.subject = subject.trim();

    // Check if we have names for personalization
    const hasNames = recipientList.some(r => r.name && r.name.trim());
    
    // If we have names, send personalized emails individually
    if (hasNames) {
      const results = [];
      const errors = [];
      const senderEmailAddress = sendSmtpEmail.sender.email;
      
      for (const recipient of recipientList) {
        let personalizedEmail = null;
        try {
          personalizedEmail = new brevo.SendSmtpEmail();
          personalizedEmail.sender = sendSmtpEmail.sender;
          personalizedEmail.to = [{ email: recipient.email, name: recipient.name || '' }];
          personalizedEmail.subject = subject.trim();
          
          // Personalize content with recipient name
          let personalizedHtml = htmlContent.trim();
          let personalizedText = textContent && textContent.trim() 
            ? textContent.trim() 
            : htmlContent
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .trim();
          
          // Replace {{name}} or {name} placeholders with actual name
          if (recipient.name) {
            personalizedHtml = personalizedHtml.replace(/\{\{name\}\}|\{name\}/gi, recipient.name);
            personalizedText = personalizedText.replace(/\{\{name\}\}|\{name\}/gi, recipient.name);
          }
          
          personalizedEmail.htmlContent = personalizedHtml;
          personalizedEmail.textContent = personalizedText;
          
          // Add attachments if provided
          if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            personalizedEmail.attachment = attachments.map(att => ({
              name: att.name,
              content: att.content
            }));
          }
          
          const result = await apiInstance.sendTransacEmail(personalizedEmail);
          results.push({ email: recipient.email, messageId: result.messageId });
        } catch (error) {
          let errorMessage = error.message || 'Unknown error';
          let errorDetails = '';
          
          // Log full error for debugging
          console.error('Brevo API Error:', {
            message: error.message,
            response: error.response,
            body: error.body,
            code: error.code,
            status: error.status
          });
          
          // Extract more details from Brevo error response
          if (error.response) {
            const status = error.response.status || error.response.statusCode;
            const body = error.response.body || error.response.data;
            
            if (status === 403) {
              errorMessage = '403 Forbidden - Sender email not verified or insufficient permissions';
              
              // Try to get more specific error message from Brevo
              if (body) {
                if (typeof body === 'string') {
                  errorDetails = body;
                } else if (body.message) {
                  errorDetails = body.message;
                } else if (body.error) {
                  errorDetails = body.error;
                } else {
                  errorDetails = JSON.stringify(body);
                }
              }
              
              if (!errorDetails) {
                errorDetails = `The sender email "${senderEmailAddress}" must be verified in your Brevo account. Go to Brevo Settings > Senders & IP to verify. Also check: 1) API key has "Send emails" permission, 2) Account is not suspended, 3) Domain is verified if using custom domain.`;
              }
            } else if (status === 401) {
              errorMessage = '401 Unauthorized - Invalid API key';
              errorDetails = 'Please check your BREVO_API_KEY in environment variables.';
            } else if (body && body.message) {
              errorDetails = body.message;
            }
          } else if (error.body) {
            errorDetails = error.body.message || JSON.stringify(error.body);
          } else if (error.message) {
            // Check if error message contains useful info
            if (error.message.includes('403') || error.message.includes('Forbidden')) {
              errorMessage = '403 Forbidden - Sender email not verified or insufficient permissions';
              errorDetails = `Sender: ${senderEmailAddress}. Verify in Brevo Settings > Senders & IP. Also ensure API key has "Send emails" permission.`;
            }
          }
          
          errors.push({ 
            email: recipient.email, 
            error: errorMessage,
            details: errorDetails,
            senderEmail: senderEmailAddress
          });
        }
      }
      
      return NextResponse.json(
        { 
          success: true, 
          message: `Sent ${results.length} personalized email(s)${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
          sentCount: results.length,
          failedCount: errors.length,
          recipients: results.map(r => r.email),
          errors: errors.length > 0 ? errors : undefined
        },
        { status: 200 }
      );
    } else {
      // No names, send bulk email to all recipients
      sendSmtpEmail.to = recipientList.map(r => ({ email: r.email }));
      sendSmtpEmail.subject = subject.trim();
      sendSmtpEmail.htmlContent = htmlContent.trim();

      // Set text content (fallback)
      if (textContent && textContent.trim()) {
        sendSmtpEmail.textContent = textContent.trim();
      } else {
        // Generate plain text from HTML if not provided
        sendSmtpEmail.textContent = htmlContent
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();
      }

      // Add attachments if provided
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        sendSmtpEmail.attachment = attachments.map(att => ({
          name: att.name,
          content: att.content
        }));
      }

      // Send email to all recipients
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Bulk email sent successfully',
          messageId: result.messageId,
          sentCount: recipientList.length,
          recipients: recipientList.map(r => r.email)
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error sending bulk email:', error);
    
    let errorMessage = 'Failed to send bulk email';
    let errorDetails = error.message || 'Unknown error';
    
    // Extract more details from Brevo error response
    if (error.response) {
      const status = error.response.status || error.response.statusCode;
      const body = error.response.body || error.response.data;
      
      if (status === 403) {
        errorMessage = '403 Forbidden - Sender email not verified';
        errorDetails = 'The sender email address must be verified in your Brevo account. Go to Brevo Settings > Senders & IP to verify your sender email.';
      } else if (status === 401) {
        errorMessage = '401 Unauthorized - Invalid API key';
        errorDetails = 'Please check your BREVO_API_KEY in environment variables.';
      } else if (body && body.message) {
        errorDetails = body.message;
      }
    } else if (error.body) {
      errorDetails = error.body.message || JSON.stringify(error.body);
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

