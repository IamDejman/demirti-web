'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import CookiePreferencesLink from '../components/CookiePreferencesLink';
import Link from 'next/link';
import Image from 'next/image';

const FAQ_ITEMS = [
  {
    section: 'General Questions',
    items: [
      {
        q: 'What software do I need to install for this course?',
        a: <>
          You&apos;ll need to install the following:
          <ul className="faq-list">
            <li>Python (latest version)</li>
            <li>Anaconda (Python distribution)</li>
            <li>Jupyter Notebook (comes with Anaconda)</li>
            <li>VS Code (recommended code editor)</li>
          </ul>
        </>,
      },
      {
        q: 'In what order should I install these tools?',
        a: <>
          We recommend this installation order:
          <ol className="faq-list faq-ordered">
            <li>Anaconda (this includes Python and Jupyter Notebook)</li>
            <li>VS Code</li>
            <li>Verify your Python installation</li>
          </ol>
          <p className="faq-note"><strong>Note:</strong> You don&apos;t need to install Python separately if you install Anaconda, as it comes bundled together.</p>
        </>,
      },
    ],
  },
  {
    section: 'Python Installation',
    items: [
      {
        q: 'Do I need to install Python separately?',
        a: "No, if you're installing Anaconda, Python comes included. Anaconda provides Python along with many useful data science packages pre-installed.",
      },
      {
        q: 'Which version of Python should I install?',
        a: "Install the latest stable version of Python 3 (currently Python 3.11 or 3.12). Avoid Python 2.x as it's deprecated.",
      },
      {
        q: 'Where do I download Python from?',
        a: <>Download from the official website: <a href="https://python.org/downloads" target="_blank" rel="noopener noreferrer" className="faq-link">python.org/downloads</a></>,
      },
      {
        q: 'How do I verify Python is installed correctly?',
        a: <>Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux) and type:
          <pre className="faq-code">python --version</pre>
          or
          <pre className="faq-code">python3 --version</pre>
          You should see the Python version number displayed.
        </>,
      },
    ],
  },
  {
    section: 'Anaconda Installation',
    items: [
      {
        q: 'What is Anaconda and why do we use it?',
        a: "Anaconda is a Python distribution specifically designed for data science. It includes Python, Jupyter Notebook, and over 250 pre-installed data science packages (NumPy, Pandas, Matplotlib, etc.), saving you time on individual installations.",
      },
      {
        q: 'Where do I download Anaconda?',
        a: <>Download from: <a href="https://anaconda.com/download" target="_blank" rel="noopener noreferrer" className="faq-link">anaconda.com/download</a></>,
      },
      {
        q: 'Which version should I download - Individual Edition or something else?',
        a: "Download the free Anaconda Individual Edition (now called Anaconda Distribution). Choose the installer for your operating system (Windows, macOS, or Linux).",
      },
      {
        q: 'How much disk space does Anaconda require?',
        a: "Anaconda requires approximately 3-5 GB of disk space.",
      },
      {
        q: 'Should I add Anaconda to my PATH during installation?',
        a: <>
          <p><strong>Windows:</strong> The installer will ask this question. We recommend checking &quot;Add Anaconda to my PATH environment variable&quot; for easier access, though the installer warns against it.</p>
          <p><strong>Mac/Linux:</strong> This is typically handled automatically.</p>
        </>,
      },
      {
        q: 'How do I verify Anaconda is installed correctly?',
        a: <>Open Anaconda Navigator from your applications menu, or type in your terminal:
          <pre className="faq-code">conda --version</pre>
          You should see the conda version number.
        </>,
      },
    ],
  },
  {
    section: 'Jupyter Notebook',
    items: [
      {
        q: 'Do I need to install Jupyter Notebook separately?',
        a: "No, Jupyter Notebook comes pre-installed with Anaconda.",
      },
      {
        q: 'How do I launch Jupyter Notebook?',
        a: <>
          You have two options:
          <ul className="faq-list">
            <li>Open Anaconda Navigator and click the &quot;Launch&quot; button under Jupyter Notebook</li>
            <li>Open your terminal and type: <pre className="faq-code">jupyter notebook</pre> This will open Jupyter in your default web browser.</li>
          </ul>
        </>,
      },
      {
        q: 'Jupyter Notebook opens in my browser - is this normal?',
        a: "Yes! Jupyter Notebook runs as a web application. It launches a local server and opens in your browser, but everything runs on your computer.",
      },
      {
        q: "What if Jupyter Notebook doesn't open in my browser automatically?",
        a: "Look at the terminal output. You'll see a URL (usually http://localhost:8888/). Copy and paste this URL into your browser manually.",
      },
    ],
  },
  {
    section: 'VS Code Installation',
    items: [
      {
        q: 'What is VS Code and why do we recommend it?',
        a: "Visual Studio Code (VS Code) is a powerful, free code editor that provides excellent support for Python development, including debugging, extensions, and integrated terminal access.",
      },
      {
        q: 'Where do I download VS Code?',
        a: <>Download from: <a href="https://code.visualstudio.com" target="_blank" rel="noopener noreferrer" className="faq-link">code.visualstudio.com</a></>,
      },
      {
        q: 'Is VS Code mandatory or optional?',
        a: "VS Code is recommended but not mandatory. You can complete the course using Jupyter Notebook alone, but VS Code offers additional features that many data scientists find helpful.",
      },
      {
        q: 'What extensions should I install in VS Code for data science?',
        a: <>
          We recommend installing:
          <ul className="faq-list">
            <li><strong>Python</strong> (by Microsoft) - essential for Python support</li>
            <li><strong>Jupyter</strong> (by Microsoft) - to run Jupyter notebooks in VS Code</li>
            <li><strong>Pylance</strong> - enhanced Python language support (usually installs automatically with Python extension)</li>
          </ul>
        </>,
      },
      {
        q: 'How do I install extensions in VS Code?',
        a: <>
          <ol className="faq-list faq-ordered">
            <li>Open VS Code</li>
            <li>Click the Extensions icon in the left sidebar (or press Ctrl+Shift+X / Cmd+Shift+X)</li>
            <li>Search for the extension name</li>
            <li>Click &quot;Install&quot;</li>
          </ol>
        </>,
      },
    ],
  },
  {
    section: 'Troubleshooting',
    items: [
      {
        q: 'I get "Python is not recognized" or "command not found" errors. What should I do?',
        a: <>
          This means Python isn&apos;t in your system PATH. Solutions:
          <ul className="faq-list">
            <li><strong>If you installed Anaconda:</strong> Use Anaconda Prompt (Windows) or ensure you&apos;re using the correct terminal</li>
            <li><strong>Reinstall:</strong> During installation, make sure to check the option to add to PATH</li>
            <li><strong>Manual fix:</strong> Add Python to your PATH environment variable manually (search online for your specific OS)</li>
          </ul>
        </>,
      },
      {
        q: 'I have multiple Python versions installed. Which one will be used?',
        a: <>Your system will use whichever Python is first in your PATH. To check which Python is active, run:
          <pre className="faq-code">which python</pre>
          (Mac/Linux) or
          <pre className="faq-code">where python</pre>
          (Windows)
        </>,
      },
      {
        q: 'Can I use VS Code instead of Jupyter Notebook for all my work?',
        a: "Yes! VS Code has excellent Jupyter Notebook support. You can create and run .ipynb files directly in VS Code with the Jupyter extension installed.",
      },
      {
        q: "I'm getting permission errors during installation. What should I do?",
        a: <>
          <ul className="faq-list">
            <li><strong>Windows:</strong> Right-click the installer and select &quot;Run as administrator&quot;</li>
            <li><strong>Mac/Linux:</strong> You may need to use sudo for certain installations, though Anaconda typically doesn&apos;t require it</li>
          </ul>
        </>,
      },
      {
        q: 'My computer is running slow after installing Anaconda. Is this normal?',
        a: "Anaconda is a large package. If you're concerned about resources, consider installing Miniconda instead (a minimal version of Anaconda) and then installing only the packages you need.",
      },
    ],
  },
  {
    section: 'System Requirements',
    items: [
      {
        q: 'What are the minimum system requirements?',
        a: <>
          <ul className="faq-list">
            <li><strong>Operating System:</strong> Windows 8 or newer, macOS 10.13+, or modern Linux</li>
            <li><strong>RAM:</strong> Minimum 4GB (8GB or more recommended)</li>
            <li><strong>Disk Space:</strong> At least 5GB free space</li>
            <li><strong>Processor:</strong> Modern dual-core processor or better</li>
          </ul>
        </>,
      },
      {
        q: 'Can I install these tools on a tablet or Chromebook?',
        a: <>
          <ul className="faq-list">
            <li><strong>Tablets:</strong> Generally not recommended for the full development environment</li>
            <li><strong>Chromebooks:</strong> Possible through Linux (Beta) mode or cloud-based solutions like Google Colab</li>
          </ul>
        </>,
      },
    ],
  },
  {
    section: 'Getting Help',
    items: [
      {
        q: "I'm still having installation issues. Where can I get help?",
        a: <>
          <ul className="faq-list">
            <li>Check our installation video tutorials in the course materials</li>
            <li>Join our Telegram Community for quick support from instructors and fellow students</li>
            <li>Email our technical support team at <a href="mailto:admin@demirti.com" className="faq-link">admin@demirti.com</a> with:
              <ul style={{ marginTop: '0.5rem' }}>
                <li>Your operating system and version</li>
                <li>Error messages (screenshots are helpful)</li>
                <li>What you&apos;ve already tried</li>
              </ul>
            </li>
          </ul>
        </>,
      },
      {
        q: "What's the best way to get quick help?",
        a: "Our Telegram Community is the fastest way to get support. Many students and instructors are active there and can help troubleshoot issues in real-time.",
      },
      {
        q: 'How do I join the Telegram Community?',
        a: "You'll receive the Telegram Community invite link in your welcome email. If you haven't received it, please email admin@demirti.com to request access.",
      },
      {
        q: "Are there alternative cloud-based options if I can't install locally?",
        a: <>
          Yes! Consider using:
          <ul className="faq-list">
            <li><strong>Google Colab</strong> — Free Jupyter notebooks in the cloud</li>
            <li><strong>Kaggle Notebooks</strong> — Free cloud-based data science environment</li>
            <li><strong>Anaconda Cloud</strong> — Cloud-based Anaconda environment</li>
          </ul>
          <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>These can be good temporary solutions while you resolve local installation issues. For guidance on using these platforms, reach out to us on Telegram or via email.</p>
        </>,
      },
    ],
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="faq-item" style={{ borderBottom: '1px solid #e1e4e8' }}>
      <button
        type="button"
        onClick={onToggle}
        className="faq-question"
        aria-expanded={isOpen}
      >
        <span>Q: {item.q}</span>
        <span
          style={{
            fontSize: '1.2rem',
            color: '#0066cc',
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <span className="faq-answer-label">A: </span>
          <div className="faq-answer-content">{item.a}</div>
        </div>
      )}
    </div>
  );
}

export default function DataScienceSIFaqPage() {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (sectionIdx, itemIdx) => {
    const key = `${sectionIdx}-${itemIdx}`;
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <main className="with-fixed-header">
      <Navbar />

      {/* Hero Section */}
      <section
        className="track-hero"
        style={{
          padding: '10rem 0 6rem',
          background: 'linear-gradient(135deg, #0066cc 0%, #004d99 100%)',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem' }}>
            Data Science Software Installation FAQs
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', opacity: 0.95 }}>
            Data Science Academy — answers to common questions about installing Python, Anaconda, Jupyter Notebook, and VS Code.
          </p>
          <Link
            href="/datascience"
            className="cta-button"
            style={{
              display: 'inline-block',
              backgroundColor: 'white',
              color: '#0066cc',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              fontSize: '1.05rem',
              marginTop: '2rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            Back to Data Science Track
          </Link>
        </div>
      </section>

      {/* FAQ Content */}
      <section style={{ padding: '5rem 0', backgroundColor: '#ffffff' }}>
        <div className="container">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {FAQ_ITEMS.map((group, sectionIdx) => (
              <div key={group.section} className="faq-section" style={{ marginBottom: '3rem' }}>
                <h2
                  className="faq-section-title"
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: '#0066cc',
                    marginBottom: '1.5rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid #0066cc',
                  }}
                >
                  {group.section}
                </h2>
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    border: '1px solid #e1e4e8',
                  }}
                >
                  {group.items.map((item, itemIdx) => (
                    <FaqItem
                      key={itemIdx}
                      item={item}
                      isOpen={openItems.has(`${sectionIdx}-${itemIdx}`)}
                      onToggle={() => toggleItem(sectionIdx, itemIdx)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: '4rem 0',
          backgroundColor: '#f8f9fa',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2 className="section-title">Ready to Get Started?</h2>
          <p style={{ fontSize: '1.1rem', color: '#666666', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            Apply for our Data Science bootcamp and start your learning journey.
          </p>
          <Link
            href="/datascience#apply-section"
            className="cta-button"
            style={{
              display: 'inline-block',
              backgroundColor: '#0066cc',
              color: 'white',
              padding: '1rem 2.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              fontSize: '1.05rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 102, 204, 0.3)',
              textDecoration: 'none',
            }}
          >
            Apply Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <Image src="/logo.svg" alt="CVERSE Logo" className="footer-logo" width={150} height={50} />
              <p>Empowering the next generation of digital professionals through world-class education and practical training.</p>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="https://www.linkedin.com/company/cverse-academy/" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://x.com/CVerse_Academy" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="https://www.instagram.com/cversedemirti/" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://www.tiktok.com/@cverse_academy" className="social-link" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Demirti Limited. All rights reserved.</p>
            <CookiePreferencesLink />
          </div>
        </div>
      </footer>

    </main>
  );
}
