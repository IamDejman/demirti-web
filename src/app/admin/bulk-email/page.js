'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader } from '@/app/components/admin';
import { getAuthHeaders } from '@/lib/authClient';

export default function BulkEmailPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [pasteEmailsInput, setPasteEmailsInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const addFromPaste = () => {
    const raw = pasteEmailsInput.trim();
    if (!raw) {
      showToast({ type: 'error', message: 'Paste some emails first.' });
      return;
    }
    const parsed = raw
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes('@'));
    const unique = [...new Set(parsed)];
    const existing = new Set(recipients.map((r) => r.email.toLowerCase()));
    const newOnes = unique.filter((e) => !existing.has(e));
    if (newOnes.length === 0) {
      showToast({ type: 'error', message: 'No new valid emails to add (all duplicates or invalid).' });
      return;
    }
    setRecipients([...recipients, ...newOnes.map((email) => ({ email, name: '' }))]);
    setPasteEmailsInput('');
    showToast({ type: 'success', message: `Added ${newOnes.length} recipient(s) from paste.` });
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

  const baseUrl = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BASE_URL
    ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
    : 'https://demirti.com';

  const loadTemplate = (templateId) => {
    if (!templateId) return;
    setSelectedTemplateId(templateId);
    if (templateId === 'data-science-cohort') {
      loadDataScienceCohortTemplate();
    } else if (templateId === 'default') {
      loadDefaultTemplate();
    }
  };

  const loadDataScienceCohortTemplate = () => {
    setSubject('Join the next CVerse Data Science cohort — Spots are limited');
    setHtmlContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; }
    .header { background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .message { font-size: 16px; color: #666; margin-bottom: 20px; line-height: 1.8; }
    .section { background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #0066cc; }
    .section h2 { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; }
    .steps-list { margin: 0; padding-left: 20px; }
    .steps-list li { margin: 10px 0; color: #666; line-height: 1.8; }
    .cta { display: inline-block; background-color: #0066cc; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e1e4e8; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Join the next CVerse Data Science cohort</h1>
    </div>
    <div class="content">
      <p class="message">Hi there,</p>
      <p class="message">Ready to build real data science skills?</p>
      <p class="message">Our next Data Science cohort is beginning soon. You'll learn hands-on with industry projects, guided by practitioners who've shipped data products in the real world.</p>
      <div class="section">
        <h2>Start date</h2>
        <p class="message" style="margin-bottom: 0;">Saturday, February 28, 2026</p>
      </div>
      <div class="section">
        <h2>What you'll get</h2>
        <ul class="steps-list">
          <li>Practical skills you can use immediately</li>
          <li>Live sessions and mentor support</li>
          <li>A focused program that fits your schedule</li>
        </ul>
      </div>
      <p class="message">Places are limited. Secure your spot by registering today.</p>
      <p><a href="${baseUrl}/datascience" class="cta" style="color: white;">Register now →</a></p>
      <p class="message">Questions? Just reply to this email.</p>
      <div class="footer">
        <p>CVERSE Academy</p>
      </div>
    </div>
  </div>
</body>
</html>`);
    setStatus({ type: 'success', message: 'Data Science cohort template loaded' });
    showToast({ type: 'success', message: 'Data Science cohort template loaded. Add recipients and send.' });
  };

  const loadDefaultTemplate = () => {
    setSubject('Message from CVERSE');
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
      showToast({ type: 'error', message: 'Please load a template first (subject comes from the template).' });
      setIsSubmitting(false);
      return;
    }

    if (!htmlContent.trim()) {
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
          setSelectedTemplateId('');
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
    <div className="admin-dashboard admin-content-area">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <AdminPageHeader
          title="Bulk Email"
          description="Send emails to multiple recipients. Add manually or import from CSV."
        />
        <div className="bulk-email-page" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="bulk-email-card">
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
              <h2 style={{ fontSize: '1.2rem', color: '#555', margin: 0, marginBottom: '1rem' }}>Recipients</h2>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Paste emails (one per line or comma-separated)</label>
                <textarea value={pasteEmailsInput} onChange={(e) => setPasteEmailsInput(e.target.value)} placeholder="Paste emails here..."
                  rows={3} disabled={isSubmitting} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '0.5rem', fontFamily: 'monospace' }} />
                <button type="button" onClick={addFromPaste} disabled={isSubmitting || !pasteEmailsInput.trim()} style={{ padding: '0.5rem 1rem', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', opacity: (!pasteEmailsInput.trim() || isSubmitting) ? 0.5 : 1 }}>Add from paste</button>
              </div>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #ddd' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Upload CSV (Name, Email columns)</label>
                <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isSubmitting} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }} />
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Template</label>
              <select
                className="bulk-email-template-select"
                value={selectedTemplateId}
                onChange={(e) => loadTemplate(e.target.value)}
                disabled={isSubmitting}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', backgroundColor: 'white', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                <option value="">Select a template...</option>
                <option value="data-science-cohort">Data Science Cohort</option>
                <option value="default">Default Template</option>
              </select>
              <input type="file" accept=".html,.htm" onChange={handleHTMLFileUpload} disabled={isSubmitting} style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }} />
              <label style={{ display: 'block', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>HTML Content *</label>
              <textarea value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} required placeholder="HTML email content. Use {{name}} for personalization." rows={10}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontFamily: 'monospace' }} disabled={isSubmitting} />
            </div>

            <button type="submit" disabled={isSubmitting}
              style={{ width: '100%', padding: '1rem', backgroundColor: isSubmitting ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Sending...' : `Send to ${recipients.length} recipient(s)`}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
