'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader } from '@/app/components/admin';
import { getAuthHeaders } from '@/lib/authClient';

// Simple URL regex for linkifying (http(s) and common patterns)
const URL_REGEX = /(https?:\/\/[^\s<]+)/gi;

// Convert plain text to simple HTML with email-style design. Uses inline styles only
// so the sent email matches the preview (many clients strip <style> in head).
function plainToHtml(plain) {
  if (!plain || !plain.trim()) return '';
  const escaped = plain
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = escaped.trim().split(/\n\n+/);
  const bodyContent = paragraphs
    .map((p) => {
      const withBr = p.replace(/\n/g, '<br>');
      const withLinks = withBr.replace(URL_REGEX, (url) => `<a href="${url}" style="color:#0066cc;text-decoration:underline;">${url}</a>`);
      return '<p style="font-size:16px;color:#444;margin:0 0 16px;line-height:1.7;">' + withLinks + '</p>';
    })
    .join('\n');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background-color:#f4f4f4;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background-color:#fff;">
    <div style="background-color:#0066cc;color:#fff;padding:28px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;">CVERSE</h1>
    </div>
    <div style="padding:32px 24px;">
${bodyContent}
    </div>
    <div style="background-color:#f8f9fa;padding:24px;text-align:center;color:#666;font-size:14px;border-top:1px solid #e1e4e8;">
      <p style="margin:0;">CVERSE Academy</p>
    </div>
  </div>
</body>
</html>`;
}

// Detect if content is plain text (no HTML) so we can apply the design in preview/send
function looksLikePlainText(str) {
  if (!str || !str.trim()) return true;
  const trimmed = str.trim();
  // Has no opening tag, or only very short fragment – treat as plain text
  if (!trimmed.includes('<')) return true;
  if (!trimmed.includes('>') || !trimmed.includes('</')) return true;
  // Starts with a known HTML document prefix – treat as HTML
  if (/^\s*<!DOCTYPE\s+/i.test(trimmed) || /^\s*<html[\s>]/i.test(trimmed) || /^\s*<head[\s>]/i.test(trimmed) || /^\s*<body[\s>]/i.test(trimmed)) return false;
  // Has substantial HTML (e.g. <p>, <div>) – treat as HTML
  if (/<([a-z][a-z0-9]*)\b[\s>]/i.test(trimmed)) return false;
  return true;
}

// Strip HTML tags to get approximate plain text (for switching to plain mode)
function htmlToPlain(html) {
  if (!html || !html.trim()) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export default function BulkEmailPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [contentMode, setContentMode] = useState('html'); // 'plain' | 'html'
  const [plainTextContent, setPlainTextContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [pasteEmailsInput, setPasteEmailsInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const { showToast } = useToast();

  // Single source of truth for preview and send: apply design when content is plain text (computed each render to avoid hook-order issues)
  const effectiveHtml =
    contentMode === 'plain'
      ? plainToHtml(plainTextContent ?? '')
      : looksLikePlainText(htmlContent ?? '')
        ? plainToHtml(htmlContent ?? '')
        : (htmlContent ?? '');

  const effectiveSubject = (subject ?? '').trim();

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

  const downloadSampleCSV = () => {
    const header = 'First Name,Last Name,Email';
    const rows = [
      'Jane,Doe,jane.doe@example.com',
      'John,Smith,john.smith@example.com',
    ];
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bulk-email-recipients-sample.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast({ type: 'success', message: 'Sample CSV downloaded. Use {{First_Name}} and {{Last_Name}} in your email.' });
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

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ' '));
        const firstNameIndex = headers.findIndex(h => h === 'first name' || h === 'first_name' || h === 'firstname');
        const lastNameIndex = headers.findIndex(h => h === 'last name' || h === 'last_name' || h === 'lastname');
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
          const firstName = firstNameIndex !== -1 ? (values[firstNameIndex] || '') : '';
          const lastName = lastNameIndex !== -1 ? (values[lastNameIndex] || '') : '';
          const fullName = nameIndex !== -1 ? (values[nameIndex] || '') : '';
          const name = fullName || [firstName, lastName].filter(Boolean).join(' ').trim();

          if (email && email.includes('@')) {
            newRecipients.push({ email, name, firstName, lastName });
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

  const switchToPlain = () => {
    setPlainTextContent(htmlToPlain(htmlContent));
    setContentMode('plain');
  };

  const switchToHtml = () => {
    if (contentMode === 'plain') {
      setHtmlContent(plainToHtml(plainTextContent));
    }
    setContentMode('html');
  };

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

    if (!effectiveSubject) {
      showToast({ type: 'error', message: 'Please enter a subject.' });
      setIsSubmitting(false);
      return;
    }

    if (!effectiveHtml.trim()) {
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
          recipients: validRecipients.map(r => ({
            name: r.name || [r.firstName, r.lastName].filter(Boolean).join(' ').trim(),
            email: r.email,
            firstName: r.firstName || '',
            lastName: r.lastName || '',
          })),
          subject: effectiveSubject,
          htmlContent: effectiveHtml.trim(),
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
          setPlainTextContent('');
          setContentMode('html');
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Upload CSV (First Name, Last Name, Email)</label>
                <p style={{ fontSize: '0.8125rem', color: '#666', marginBottom: '0.5rem' }}>
                  Use <strong>First Name</strong>, <strong>Last Name</strong>, and <strong>Email</strong> columns. In your email use <code style={{ background: '#eee', padding: '0.1em 0.3em', borderRadius: '3px' }}>{'{{First_Name}}'}</code>, <code style={{ background: '#eee', padding: '0.1em 0.3em', borderRadius: '3px' }}>{'{{Last_Name}}'}</code>, or <code style={{ background: '#eee', padding: '0.1em 0.3em', borderRadius: '3px' }}>{'{{name}}'}</code> for personalization.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button type="button" onClick={downloadSampleCSV} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>Download sample CSV</button>
                  <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isSubmitting} style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }} />
                </div>
              </div>
              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '1rem', maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f9f9f9' }}>
                {recipients.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic' }}>No recipients yet.</p> : (
                  recipients.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'white', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <span>{(r.firstName || r.lastName) ? [r.firstName, r.lastName].filter(Boolean).join(' ') : (r.name || r.email)}</span>
                      <button type="button" onClick={() => removeRecipient(i)} disabled={isSubmitting} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>
                  ))
                )}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>Total: {recipients.length}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                disabled={isSubmitting}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
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
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: '500' }}>Content *</label>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={switchToPlain}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.35rem 0.75rem',
                      border: `1px solid ${contentMode === 'plain' ? '#0066cc' : '#ddd'}`,
                      borderRadius: '4px',
                      background: contentMode === 'plain' ? '#e8f2ff' : '#fff',
                      color: contentMode === 'plain' ? '#0066cc' : '#333',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: contentMode === 'plain' ? 600 : 400,
                    }}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    onClick={switchToHtml}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.35rem 0.75rem',
                      border: `1px solid ${contentMode === 'html' ? '#0066cc' : '#ddd'}`,
                      borderRadius: '4px',
                      background: contentMode === 'html' ? '#e8f2ff' : '#fff',
                      color: contentMode === 'html' ? '#0066cc' : '#333',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: contentMode === 'html' ? 600 : 400,
                    }}
                  >
                    HTML
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  disabled={isSubmitting}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.35rem 0.75rem',
                    border: '1px solid #0066cc',
                    borderRadius: '4px',
                    background: 'transparent',
                    color: '#0066cc',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Preview email
                </button>
              </div>
              {contentMode === 'plain' ? (
                <textarea
                  value={plainTextContent}
                  onChange={(e) => setPlainTextContent(e.target.value)}
                  placeholder="Type your message in plain text. Line breaks become &lt;br&gt;, blank lines start new paragraphs. Use {{name}} for personalization."
                  rows={12}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontFamily: 'inherit' }}
                />
              ) : (
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="HTML email content. Use {{name}} for personalization."
                  rows={12}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', fontFamily: 'monospace' }}
                />
              )}
            </div>

            <button type="submit" disabled={isSubmitting}
              style={{ width: '100%', padding: '1rem', backgroundColor: isSubmitting ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Sending...' : `Send to ${recipients.length} recipient(s)`}
            </button>
          </form>
        </div>
      </div>
      </div>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Email preview"
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: '#666' }}>
            <strong>Subject:</strong> {effectiveSubject || '(no subject)'}
          </p>
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
            <iframe
              title="Email preview"
              srcDoc={effectiveHtml || '<p style="padding:1rem;color:#999;">No content yet.</p>'}
              style={{ width: '100%', minHeight: '400px', height: '70vh', border: 'none', display: 'block' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
