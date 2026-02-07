import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';
import { getAdminOrUserFromRequest } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await getAdminOrUserFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Validate API key
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { 
          error: 'BREVO_API_KEY is not configured',
          configured: false
        },
        { status: 500 }
      );
    }

    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    // Try to get account info to verify API key
    try {
      const accountApi = new brevo.AccountApi();
      accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);
      
      const accountInfo = await accountApi.getAccount();
      
      return NextResponse.json({
        success: true,
        apiKeyConfigured: true,
        account: {
          email: accountInfo.email,
          firstName: accountInfo.firstName,
          lastName: accountInfo.lastName,
          companyName: accountInfo.companyName
        },
        senderEmail: process.env.BREVO_FROM_EMAIL || process.env.BREVO_TO_EMAIL || 'admin@demirti.com',
        message: 'API key is valid. Check Brevo dashboard to verify sender email is added and verified.'
      });
    } catch (accountError) {
      console.error('Account API Error:', accountError);
      
      // If account API fails, try a simple email send test (but don't actually send)
      return NextResponse.json({
        success: false,
        apiKeyConfigured: true,
        error: 'Could not verify account. API key may be invalid or have insufficient permissions.',
        details: accountError.message || 'Unknown error',
        senderEmail: process.env.BREVO_FROM_EMAIL || process.env.BREVO_TO_EMAIL || 'admin@demirti.com',
        troubleshooting: [
          '1. Verify BREVO_API_KEY is correct in your .env.local file',
          '2. Ensure API key has "Send emails" permission in Brevo',
          '3. Check that admin@demirti.com is added and verified in Brevo Settings > Senders & IP',
          '4. If using a free account, check sending limits',
          '5. Verify your Brevo account is not suspended'
        ]
      });
    }

  } catch (error) {
    console.error('Test Brevo Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Brevo configuration',
        details: error.message || 'Unknown error',
        configured: !!process.env.BREVO_API_KEY
      },
      { status: 500 }
    );
  }
}

