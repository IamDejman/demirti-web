'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import { AdminPageHeader, AdminButton } from '@/app/components/admin';
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
  if (!trimmed.includes('<')) return true;
  if (!trimmed.includes('>') || !trimmed.includes('</')) return true;
  if (/^\s*<!DOCTYPE\s+/i.test(trimmed) || /^\s*<html[\s>]/i.test(trimmed) || /^\s*<head[\s>]/i.test(trimmed) || /^\s*<body[\s>]/i.test(trimmed)) return false;
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

/* ── Shared style constants ─────────────────────────────────────────── */
const CARD = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const LABEL = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
  marginBottom: '0.5rem',
};

const INPUT = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: '0.9375rem',
  color: '#1f2937',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const SECTION_TITLE = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#1f2937',
  margin: '0 0 1rem',
};

/* ── Preview overlay (wider than standard Modal for email preview) ── */
function PreviewOverlay({ isOpen, onClose, subject, html }) {
  const handleEscape = useCallback(
    (e) => { if (e.key === 'Escape') onClose?.(); },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        maxWidth: 720,
        width: '100%',
        maxHeight: 'calc(100vh - 3rem)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
            Email Preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              color: '#6b7280',
              fontSize: '1.5rem',
              cursor: 'pointer',
              borderRadius: 8,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ ...LABEL, marginBottom: 0, display: 'inline' }}>SUBJECT</span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.9375rem', color: '#1f2937' }}>
              {subject || '(no subject)'}
            </span>
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
            <iframe
              title="Email preview"
              srcDoc={html || '<p style="padding:1rem;color:#999;">No content yet.</p>'}
              style={{ width: '100%', minHeight: '400px', height: '60vh', border: 'none', display: 'block' }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default function BulkEmailPage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [contentMode, setContentMode] = useState('html');
  const [plainTextContent, setPlainTextContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteEmailsInput, setPasteEmailsInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const { showToast } = useToast();

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
    showToast({ type: 'success', message: 'Default template loaded.' });
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
      <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
        <AdminPageHeader
          title="Bulk Email"
          description="Send emails to multiple recipients. Add manually or import from CSV."
        />

        <form onSubmit={handleSubmit}>
          {/* ── Stats overview ───────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Recipients', value: recipients.length, color: '#0052a3' },
              { label: 'Attachments', value: attachments.length, color: '#7c3aed' },
              { label: 'Mode', value: contentMode === 'plain' ? 'Plain text' : 'HTML', color: '#059669' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '1.25rem',
                  border: '1px solid #e5e7eb',
                  borderTop: `3px solid ${stat.color}`,
                }}
              >
                <div style={{ marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 500 }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ── Recipients card ──────────────────────────────────── */}
          <div style={CARD}>
            <h3 style={SECTION_TITLE}>Recipients</h3>

            {/* Paste emails */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={LABEL}>Paste Emails</label>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 0.5rem' }}>
                One per line, or comma / semicolon separated.
              </p>
              <textarea
                value={pasteEmailsInput}
                onChange={(e) => setPasteEmailsInput(e.target.value)}
                placeholder="jane@example.com, john@example.com"
                rows={3}
                disabled={isSubmitting}
                style={{ ...INPUT, fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }}
              />
              <div style={{ marginTop: '0.5rem' }}>
                <AdminButton
                  variant="secondary"
                  onClick={addFromPaste}
                  disabled={isSubmitting || !pasteEmailsInput.trim()}
                >
                  Add from paste
                </AdminButton>
              </div>
            </div>

            {/* CSV upload */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <label style={LABEL}>Import from CSV</label>
              <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0 0 0.75rem' }}>
                Columns: <code style={{ background: '#e5e7eb', padding: '0.1em 0.35em', borderRadius: 4, fontSize: '0.75rem' }}>First Name</code>,{' '}
                <code style={{ background: '#e5e7eb', padding: '0.1em 0.35em', borderRadius: 4, fontSize: '0.75rem' }}>Last Name</code>,{' '}
                <code style={{ background: '#e5e7eb', padding: '0.1em 0.35em', borderRadius: 4, fontSize: '0.75rem' }}>Email</code>.{' '}
                Use <code style={{ background: '#e5e7eb', padding: '0.1em 0.35em', borderRadius: 4, fontSize: '0.75rem' }}>{'{{First_Name}}'}</code>,{' '}
                <code style={{ background: '#e5e7eb', padding: '0.1em 0.35em', borderRadius: 4, fontSize: '0.75rem' }}>{'{{Last_Name}}'}</code>, or{' '}
                <code style={{ background: '#e5e7eb', padding: '0.1em 0.35em', borderRadius: 4, fontSize: '0.75rem' }}>{'{{name}}'}</code>{' '}
                for personalization.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <AdminButton variant="ghost" onClick={downloadSampleCSV} disabled={isSubmitting}>
                  Download sample CSV
                </AdminButton>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={isSubmitting}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Recipient list */}
            <label style={LABEL}>Recipient List ({recipients.length})</label>
            <div style={{ maxHeight: 220, overflowY: 'auto', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', padding: recipients.length > 0 ? '0.5rem' : '1rem' }}>
              {recipients.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>No recipients added yet.</p>
              ) : (
                recipients.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      background: '#fff',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      marginBottom: i < recipients.length - 1 ? '0.375rem' : 0,
                    }}
                  >
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>
                        {(r.firstName || r.lastName)
                          ? [r.firstName, r.lastName].filter(Boolean).join(' ')
                          : (r.name || r.email)}
                      </span>
                      {(r.firstName || r.lastName || r.name) && (
                        <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.5rem' }}>{r.email}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipient(i)}
                      disabled={isSubmitting}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        lineHeight: 1,
                        padding: '0.25rem',
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Subject card ─────────────────────────────────────── */}
          <div style={CARD}>
            <label style={LABEL}>Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              disabled={isSubmitting}
              style={INPUT}
            />
          </div>

          {/* ── Template card ────────────────────────────────────── */}
          <div style={CARD}>
            <h3 style={SECTION_TITLE}>Template</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={LABEL}>Load Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => loadTemplate(e.target.value)}
                  disabled={isSubmitting}
                  style={{ ...INPUT, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  <option value="">Select a template...</option>
                  <option value="data-science-cohort">Data Science Cohort</option>
                  <option value="default">Default Template</option>
                </select>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <label style={LABEL}>Or Upload HTML File</label>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleHTMLFileUpload}
                  disabled={isSubmitting}
                  style={{ fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </div>

          {/* ── Content card ─────────────────────────────────────── */}
          <div style={CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ ...SECTION_TITLE, margin: 0 }}>Content *</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Mode toggle */}
                <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: '0.1875rem' }}>
                  <button
                    type="button"
                    onClick={switchToPlain}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 6,
                      border: 'none',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: contentMode === 'plain' ? 600 : 400,
                      background: contentMode === 'plain' ? '#fff' : 'transparent',
                      color: contentMode === 'plain' ? '#1f2937' : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                  >
                    Plain text
                  </button>
                  <button
                    type="button"
                    onClick={switchToHtml}
                    disabled={isSubmitting}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 6,
                      border: 'none',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: contentMode === 'html' ? 600 : 400,
                      background: contentMode === 'html' ? '#fff' : 'transparent',
                      color: contentMode === 'html' ? '#1f2937' : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                  >
                    HTML
                  </button>
                </div>

                <AdminButton
                  variant="ghost"
                  onClick={() => setShowPreview(true)}
                  disabled={isSubmitting}
                >
                  Preview
                </AdminButton>
              </div>
            </div>

            {contentMode === 'plain' ? (
              <textarea
                value={plainTextContent}
                onChange={(e) => setPlainTextContent(e.target.value)}
                placeholder="Type your message in plain text. Line breaks become <br>, blank lines start new paragraphs. Use {{name}} for personalization."
                rows={14}
                disabled={isSubmitting}
                style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }}
              />
            ) : (
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="HTML email content. Use {{name}} for personalization."
                rows={14}
                disabled={isSubmitting}
                style={{ ...INPUT, fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }}
              />
            )}
          </div>

          {/* ── Send button ──────────────────────────────────────── */}
          <AdminButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
          >
            {isSubmitting ? 'Sending...' : `Send to ${recipients.length} recipient(s)`}
          </AdminButton>
        </form>
      </div>

      <PreviewOverlay
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        subject={effectiveSubject}
        html={effectiveHtml}
      />
    </div>
  );
}
