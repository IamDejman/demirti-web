'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target;
    const formData = {
      name: form.name.value,
      email: form.email.value,
      message: form.message.value,
    };

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          message: "Thank you! Your message has been sent successfully. We'll get back to you soon.",
        });
        form.reset();
      } else {
        showToast({
          type: 'error',
          message: data.error || 'There was a problem sending your message. Please try again.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        message: 'There was a problem sending your message. Please try again or email admin@demirti.com directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            required 
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea 
            id="message" 
            name="message" 
            rows="5" 
            required
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="cta-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

