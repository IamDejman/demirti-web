'use client';

import { useState } from 'react';
import { useToast } from '../components/ToastProvider';

export default function BulkEmailPage() {
  const [recipients, setRecipients] = useState([]); // Changed to array of objects {name, email}
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const { showToast } = useToast();

  const addRecipient = () => {
    if (emailInput.trim() && emailInput.includes('@')) {
      setRecipients([...recipients, { 
        name: nameInput.trim() || '', 
        email: emailInput.trim() 
      }]);
      setEmailInput('');
      setNameInput('');
    }
  };

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          showToast({ type: 'error', message: 'CSV file is empty.' });
          return;
        }

        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname');
        const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail' || h === 'email address');

        if (emailIndex === -1) {
          showToast({ type: 'error', message: 'CSV must contain an "email" column.' });
          return;
        }

        // Parse data rows
        const newRecipients = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const email = values[emailIndex];
          const name = nameIndex !== -1 ? values[nameIndex] : '';

          if (email && email.includes('@')) {
            newRecipients.push({ name: name || '', email: email });
          }
        }

        if (newRecipients.length === 0) {
          showToast({ type: 'error', message: 'No valid email addresses found in CSV.' });
          return;
        }

        setRecipients([...recipients, ...newRecipients]);
        showToast({ 
          type: 'success', 
          message: `Imported ${newRecipients.length} recipient(s) from CSV.` 
        });
      } catch (error) {
        showToast({ type: 'error', message: 'Error parsing CSV file: ' + error.message });
      }
    };

    reader.onerror = () => {
      showToast({ type: 'error', message: 'Error reading CSV file.' });
    };

    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handlePasteEmails = (e) => {
    const text = e.clipboardData.getData('text');
    const emails = text
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    if (emails.length > 0) {
      const newRecipients = emails.map(email => ({ name: '', email }));
      setRecipients([...recipients, ...newRecipients]);
      e.preventDefault();
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result.split(',')[1]; // Remove data:image/...;base64, prefix
          setAttachments([...attachments, {
            name: file.name,
            content: base64,
            type: file.type
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleHTMLFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's an HTML file
    if (!file.name.endsWith('.html') && !file.type.includes('html')) {
      showToast({ type: 'error', message: 'Please upload an HTML file (.html).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const htmlContent = event.target.result;
        setHtmlContent(htmlContent);
        showToast({ 
          type: 'success', 
          message: 'HTML content loaded successfully from file.' 
        });
      } catch (error) {
        showToast({ type: 'error', message: 'Error reading HTML file: ' + error.message });
      }
    };

    reader.onerror = () => {
      showToast({ type: 'error', message: 'Error reading HTML file.' });
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const loadTestData = () => {
    const testRecipients = [
      { name: 'Timi Ojo', email: 'timilehinojo76@yahoo.com' },
      { name: 'Ayo Elu', email: 'ayodejieluwande@gmail.com' }
    ];
    setRecipients(testRecipients);
    showToast({ 
      type: 'success', 
      message: `Loaded ${testRecipients.length} test recipient(s).` 
    });
  };

  const testBrevoConfig = async () => {
    try {
      const response = await fetch('/api/test-brevo');
      const data = await response.json();
      
      if (data.success) {
        showToast({ 
          type: 'success', 
          message: `Brevo configuration OK. Sender: ${data.senderEmail || 'N/A'}.` 
        });
      } else {
        showToast({ 
          type: 'error', 
          message: `Brevo configuration issue: ${data.error || 'Unknown error.'}` 
        });
      }
    } catch (error) {
      showToast({ 
        type: 'error', 
        message: `Error testing Brevo: ${error.message}` 
      });
    }
  };

  const loadDefaultTemplate = () => {
    const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      margin-bottom: 20px;
    }
    .content {
      margin-bottom: 20px;
    }
    .event-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .event-details h3 {
      margin-top: 0;
      color: #007bff;
    }
    .event-details p {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <p>Hi {{name}},</p>
  </div>

  <div class="content">
    <p>Because you've joined us for one of our previous sessions, we know you are serious about your career growth. That's why we wanted to make sure you didn't miss this one.</p>

    <p>If you've been thinking about making a career shift into Tech Project Management but aren't sure where to start (or how your current skills apply), this session is designed specifically for you.</p>

    <p>Join us tomorrow, Saturday, Dec 6th, for <strong>"Breaking into Tech: Pivoting to Project Management."</strong></p>

    <p>We are hosting <strong>Oge Achomadu (Project Operations/Lead at Check)</strong>, who will move beyond the buzzwords and break down exactly what it takes to transition into a PM role—no matter your background.</p>

    <p>Whether you're coming from a completely different industry or looking to formalize your project coordination experience, you'll walk away with a clear roadmap.</p>
  </div>

  <div class="event-details">
    <h3>Event Details:</h3>
    <p><strong>Topic:</strong> Breaking into Tech: Pivoting to Project Management</p>
    <p><strong>Date:</strong> Saturday, 6 December, 2025</p>
    <p><strong>Time:</strong> 3:00PM - 4:00PM GMT+1</p>
    <p style="margin-top: 20px;">
      <a href="https://luma.com/xwf4hwyr" class="cta-button">Register Here to Save Your Spot</a>
    </p>
  </div>

  <div class="content">
    <p>See you there!</p>
  </div>

  <div class="footer">
    <p><strong>The CVERSE Team</strong></p>
  </div>
</body>
</html>`;
    setHtmlContent(defaultTemplate);
    setStatus({ 
      type: 'success', 
      message: 'Default template loaded successfully' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Filter out invalid recipients
    const validRecipients = recipients.filter(r => r.email && r.email.trim() && r.email.includes('@'));

    if (validRecipients.length === 0) {
      showToast({ type: 'error', message: 'Please add at least one valid email address.' });
      setIsSubmitting(false);
      return;
    }

    if (!subject.trim()) {
      showToast({ type: 'error', message: 'Please enter a subject.' });
      setIsSubmitting(false);
      return;
    }

    if (!htmlContent.trim() && !textContent.trim()) {
      showToast({ type: 'error', message: 'Please enter email content.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: validRecipients.map(r => ({ name: r.name, email: r.email })),
          subject: subject.trim(),
          htmlContent: htmlContent.trim(),
          textContent: textContent.trim(),
          senderName: senderName.trim() || 'CVERSE by Demirti',
          senderEmail: senderEmail.trim() || process.env.NEXT_PUBLIC_DEFAULT_SENDER_EMAIL || 'admin@demirti.com',
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.failedCount > 0 && data.errors) {
          showToast({ 
            type: 'error', 
            message: `Sent ${data.sentCount} email(s), but ${data.failedCount} failed.` 
          });
        } else {
          showToast({ 
            type: 'success', 
            message: `Successfully sent ${data.sentCount || validRecipients.length} email(s).` 
          });
          // Reset form only on complete success
          setRecipients([]);
          setSubject('');
          setHtmlContent('');
          setTextContent('');
          setSenderName('');
          setSenderEmail('');
          setAttachments([]);
        }
      } else {
        const errorMsg = data.error || 'Failed to send emails. Please try again.';
        const details = data.details ? ` Details: ${data.details}` : '';
        showToast({ 
          type: 'error', 
          message: errorMsg + details
        });
      }
    } catch (error) {
      showToast({ 
        type: 'error', 
        message: 'An error occurred while sending emails. Please try again.' 
      });
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '1.5rem', color: '#333' }}>Bulk Email Sender</h1>
        
        {status.message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '4px',
            backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
            color: status.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {status.message}
            {status.type === 'error' && status.message.includes('403') && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                <strong>How to fix 403 errors:</strong>
                <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Go to your Brevo dashboard: <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>app.brevo.com</a></li>
                  <li>Navigate to Settings → Senders & IP</li>
                  <li>Verify the sender email address you&apos;re using (check the &quot;Sender Email&quot; field above)</li>
                  <li>If the email isn&apos;t listed, add and verify it</li>
                  <li>Wait a few minutes for verification to complete, then try again</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sender Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#555' }}>Sender Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Sender Name (optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="CVERSE by Demirti"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Sender Email (optional)
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="admin@demirti.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
              <strong>⚠️ Important:</strong> The sender email must be verified in your Brevo account. 
              Go to <a href="https://app.brevo.com/settings/senders" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>Brevo Settings → Senders & IP</a> to verify your email address.
            </p>
          </div>

          {/* Recipients */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#555', margin: 0 }}>Recipients</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={testBrevoConfig}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                  title="Test Brevo API configuration"
                >
                  Test Brevo Config
                </button>
                <button
                  type="button"
                  onClick={loadTestData}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                >
                  Load Test Data
                </button>
              </div>
            </div>
            
            {/* CSV Upload */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Upload CSV File (with Name and Email columns)
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                CSV format: <code>name,email</code> or <code>email</code> (header row required). Example:
                <br />
                <code style={{ display: 'block', marginTop: '0.25rem', padding: '0.25rem', backgroundColor: 'white', borderRadius: '2px' }}>
                  name,email<br />
                  John Doe,john@example.com<br />
                  Jane Smith,jane@example.com
                </code>
              </p>
            </div>

            {/* Manual Entry */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Add Recipient Manually
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Name (optional)"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  disabled={isSubmitting}
                />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  placeholder="Email address"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={addRecipient}
                  disabled={isSubmitting || !emailInput.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    opacity: (!emailInput.trim() || isSubmitting) ? 0.5 : 1
                  }}
                >
                  Add
                </button>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                Or paste multiple emails (comma/line separated) - names will be empty
              </p>
            </div>

            {/* Recipient List */}
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '1rem',
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9'
            }}>
              {recipients.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No recipients added yet. Upload a CSV or add manually.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recipients.map((recipient, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        backgroundColor: 'white',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {recipient.name && (
                          <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#333' }}>
                            {recipient.name}
                          </div>
                        )}
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {recipient.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        disabled={isSubmitting}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              Total recipients: {recipients.length}
            </p>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Subject <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Email subject"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Attachments (Images)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              multiple
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
            {attachments.length > 0 && (
              <div style={{ 
                marginTop: '0.5rem', 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem' 
              }}>
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#f8f9fa',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '0.875rem'
                    }}
                  >
                    <span>{att.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HTML Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: '500' }}>
                HTML Content <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={loadDefaultTemplate}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    opacity: isSubmitting ? 0.5 : 1
                  }}
                >
                  Load Default Template
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleHTMLFileUpload}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  backgroundColor: '#f8f9fa'
                }}
              />
            </div>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              required
              placeholder="Enter your HTML email content here, or upload an HTML file above..."
              rows={10}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                fontFamily: 'monospace'
              }}
              disabled={isSubmitting}
            />
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              <strong>Personalization:</strong> Use <code>{'{{name}}'}</code> or <code>{'{name}'}</code> in your email content to insert recipient names. 
              If names are provided, emails will be sent individually with personalization.
              <br />
              <strong>Tip:</strong> Upload an HTML file or click &quot;Load Default Template&quot; to get started quickly.
            </p>
          </div>

          {/* Text Content (optional) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Plain Text Content (optional, fallback)
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter plain text version (optional)"
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                fontFamily: 'monospace'
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: isSubmitting ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Sending...' : `Send to ${recipients.length} recipient(s)`}
          </button>
        </form>
      </div>
    </div>
  );
}

