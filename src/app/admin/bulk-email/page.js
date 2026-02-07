'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader } from '@/app/components/admin';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function BulkEmailPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState([]);
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

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

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

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname');
        const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail' || h === 'email address');

        if (emailIndex === -1) {
          showToast({ type: 'error', message: 'CSV must contain an "email" column.' });
          return;
        }

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
        showToast({ type: 'success', message: `Imported ${newRecipients.length} recipient(s) from CSV.` });
      } catch (error) {
        showToast({ type: 'error', message: 'Error parsing CSV file: ' + error.message });
      }
    };

    reader.onerror = () => {
      showToast({ type: 'error', message: 'Error reading CSV file.' });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const _handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result.split(',')[1];
          setAttachments(prev => [...prev, { name: file.name, content: base64, type: file.type }]);
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  const _removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleHTMLFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.type.includes('html')) {
      showToast({ type: 'error', message: 'Please upload an HTML file (.html).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setHtmlContent(event.target.result);
        showToast({ type: 'success', message: 'HTML content loaded successfully from file.' });
      } catch (error) {
        showToast({ type: 'error', message: 'Error reading HTML file: ' + error.message });
      }
    };
    reader.onerror = () => showToast({ type: 'error', message: 'Error reading HTML file.' });
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadTestData = () => {
    const testRecipients = [
      { name: 'Timi Ojo', email: 'timilehinojo76@yahoo.com' },
      { name: 'Ayo Elu', email: 'ayodejieluwande@gmail.com' }
    ];
    setRecipients(testRecipients);
    showToast({ type: 'success', message: `Loaded ${testRecipients.length} test recipient(s).` });
  };

  const testBrevoConfig = async () => {
    try {
      const response = await fetch('/api/test-brevo', { headers: getAuthHeaders() });
      const data = await response.json();

      if (data.success) {
        showToast({ type: 'success', message: `Brevo configuration OK. Sender: ${data.senderEmail || 'N/A'}.` });
      } else {
        showToast({ type: 'error', message: `Brevo configuration issue: ${data.error || 'Unknown error.'}` });
      }
    } catch (error) {
      showToast({ type: 'error', message: `Error testing Brevo: ${error.message}` });
    }
  };

  const loadDefaultTemplate = () => {
    const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { margin-bottom: 20px; }
    .content { margin-bottom: 20px; }
    .event-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .event-details h3 { margin-top: 0; color: #007bff; }
    .cta-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="header"><p>Hi {{name}},</p></div>
  <div class="content"><p>Your email content here.</p></div>
  <div class="footer"><p><strong>The CVERSE Team</strong></p></div>
</body>
</html>`;
    setHtmlContent(defaultTemplate);
    setStatus({ type: 'success', message: 'Default template loaded successfully' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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
          ...getAuthHeaders(),
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
          showToast({ type: 'error', message: `Sent ${data.sentCount} email(s), but ${data.failedCount} failed.` });
        } else {
          showToast({ type: 'success', message: `Successfully sent ${data.sentCount || validRecipients.length} email(s).` });
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
        showToast({ type: 'error', message: errorMsg + details });
      }
    } catch {
      showToast({ type: 'error', message: 'An error occurred while sending emails. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Bulk Email"
        description="Send emails to multiple recipients. Add manually or import from CSV."
      />
      <div style={{ minHeight: '50vh', padding: '1.5rem', backgroundColor: '#f5f5f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {status.message && (
            <div style={{
              padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px',
              backgroundColor: status.type === 'success' ? '#d4edda' : '#f8d7da',
              color: status.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${status.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#555' }}>Sender Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Sender Name (optional)</label>
                  <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="CVERSE by Demirti"
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }} disabled={isSubmitting} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Sender Email (optional)</label>
                  <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }} disabled={isSubmitting} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#555', margin: 0 }}>Recipients</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={testBrevoConfig} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', opacity: isSubmitting ? 0.5 : 1 }}>Test Brevo Config</button>
                  <button type="button" onClick={loadTestData} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', opacity: isSubmitting ? 0.5 : 1 }}>Load Test Data</button>
                </div>
              </div>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Upload CSV (Name, Email columns)</label>
                <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isSubmitting} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Add Recipient</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem' }}>
                  <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Name (optional)" style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} disabled={isSubmitting} />
                  <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient(); } }} placeholder="Email" style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} disabled={isSubmitting} />
                  <button type="button" onClick={addRecipient} disabled={isSubmitting || !emailInput.trim()} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!emailInput.trim() || isSubmitting) ? 0.5 : 1 }}>Add</button>
                </div>
              </div>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                {recipients.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic' }}>No recipients yet.</p> : (
                  recipients.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'white', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <span>{r.name || r.email}</span>
                      <button type="button" onClick={() => removeRecipient(i)} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))
                )}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>Total: {recipients.length}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject *</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Email subject"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }} disabled={isSubmitting} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: '500' }}>HTML Content *</label>
                <button type="button" onClick={loadDefaultTemplate} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', opacity: isSubmitting ? 0.5 : 1 }}>Load Template</button>
              </div>
              <input type="file" accept=".html,.htm" onChange={handleHTMLFileUpload} disabled={isSubmitting} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }} />
              <textarea value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} required placeholder="HTML email content. Use {{name}} for personalization." rows={10}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontFamily: 'monospace' }} disabled={isSubmitting} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Plain Text (optional)</label>
              <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Plain text fallback" rows={4}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontFamily: 'monospace' }} disabled={isSubmitting} />
            </div>

            <button type="submit" disabled={isSubmitting}
              style={{ width: '100%', padding: '1rem', backgroundColor: isSubmitting ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Sending...' : `Send to ${recipients.length} recipient(s)`}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
