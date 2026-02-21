'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from './ToastProvider';

const FORM_CONTAINER_STYLE = { maxWidth: '600px', margin: '0 auto' };
const REQUIRED_ASTERISK_STYLE = { color: 'red' };
const SELECT_BASE_STYLE = {
  width: '100%',
  padding: '0.75rem',
  fontSize: '1rem',
  border: '1px solid #e1e4e8',
  borderRadius: '8px',
};
const INPUT_OTHER_STYLE = {
  marginTop: '0.75rem',
  width: '100%',
  padding: '0.75rem',
  fontSize: '1rem',
  border: '1px solid #e1e4e8',
  borderRadius: '8px',
};
const VALIDATING_MSG_STYLE = { margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666', fontStyle: 'italic' };
const APPLIED_DISCOUNT_STYLE = { margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#00c896', fontWeight: '600' };
const PRICE_BOX_STYLE = {
  backgroundColor: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1.5rem',
  border: '1px solid #e1e4e8',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
};
const RADIO_INPUT_STYLE = {
  marginRight: '0.75rem',
  width: '20px',
  height: '20px',
  accentColor: '#0066cc',
};
const LABEL_FLEX_STYLE = { display: 'flex', alignItems: 'center', margin: 0 };
const TITLE_DIV_STYLE = { fontWeight: '600', fontSize: '1rem', color: '#1a1a1a' };
const REFERRAL_SOURCE_OPTIONS = [
  { value: 'Company website', label: 'Company website' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Twitter/X', label: 'Twitter/X' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Others', label: 'Others' },
];

export default function ApplicationForm({ 
  trackName, 
  coursePrice: initialCoursePrice = 150000,
  discountPercentage: initialDiscountPercentage = 50,
  scholarshipLimit: initialScholarshipLimit = 10,
  scholarshipAvailable: initialScholarshipAvailable = false
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentOption: 'paystack',
    discountCode: '',
    referralSource: '',
    referralSourceOther: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scholarshipAvailable, setScholarshipAvailable] = useState(initialScholarshipAvailable);
  const [coursePrice, setCoursePrice] = useState(initialCoursePrice);
  const [discountPercentage, setDiscountPercentage] = useState(initialDiscountPercentage);
  const [scholarshipLimit, setScholarshipLimit] = useState(initialScholarshipLimit);
  const [appliedDiscount, setAppliedDiscount] = useState(null); // Store validated discount
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [isPaystackLoading, setIsPaystackLoading] = useState(false);
  const { showToast } = useToast();

  // Update state when props change (in case parent refetches)
  useEffect(() => {
    setCoursePrice(initialCoursePrice);
    setDiscountPercentage(initialDiscountPercentage);
    setScholarshipLimit(initialScholarshipLimit);
    setScholarshipAvailable(initialScholarshipAvailable);
  }, [initialCoursePrice, initialDiscountPercentage, initialScholarshipLimit, initialScholarshipAvailable]);

  const finalPrice = useMemo(() => {
    let price = coursePrice;
    if (scholarshipAvailable) {
      price = price * (1 - discountPercentage / 100);
    }
    if (appliedDiscount) {
      const discountPercent = typeof appliedDiscount.percentage === 'string'
        ? parseFloat(appliedDiscount.percentage)
        : appliedDiscount.percentage;
      price = price * (1 - discountPercent / 100);
    }
    return Math.round(price);
  }, [coursePrice, scholarshipAvailable, discountPercentage, appliedDiscount]);

  // Load Paystack script on demand (only when needed for payment)
  const loadPaystackScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }

      // If already available, resolve immediately
      if (typeof window.PaystackPop !== 'undefined') {
        resolve(true);
        return;
      }

      // If script tag already exists but PaystackPop not ready, wait for load
      const existingScript = document.getElementById('paystack-js');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Paystack script')));
        return;
      }

      // Create script tag
      const script = document.createElement('script');
      script.id = 'paystack-js';
      script.src = 'https://js.paystack.co/v2/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Paystack script'));
      document.body.appendChild(script);
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear referralSourceOther if referralSource is changed away from "Others"
      ...(name === 'referralSource' && value !== 'Others' ? { referralSourceOther: '' } : {})
    }));
    
    // Clear applied discount if discount code is changed
    if (name === 'discountCode' && appliedDiscount) {
      setAppliedDiscount(null);
    }
  };

  // Validate discount code when user leaves the field
  const handleDiscountCodeBlur = async () => {
    const code = formData.discountCode.trim();
    
    if (!code) {
      setAppliedDiscount(null);
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await fetch(`/api/validate-discount?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      
      if (data.valid) {
        setAppliedDiscount(data.discount);
        showToast({
          type: 'success',
          message: `Discount "${data.discount.name}" applied! ${data.discount.percentage}% off`
        });
      } else {
        setAppliedDiscount(null);
        showToast({
          type: 'error',
          message: data.message || 'Invalid discount code'
        });
      }
    } catch {
      setAppliedDiscount(null);
      showToast({
        type: 'error',
        message: 'Failed to validate discount code'
      });
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate referral source
    if (!formData.referralSource) {
      showToast({
        type: 'error',
        message: 'Please select how you heard about Cverse',
      });
      return;
    }
    
    if (formData.referralSource === 'Others' && !formData.referralSourceOther.trim()) {
      showToast({
        type: 'error',
        message: 'Please specify how you heard about Cverse',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Re-check scholarship status at submission time to ensure accuracy (per track)
      let finalScholarshipAvailable = scholarshipAvailable;
      try {
        const statusResponse = await fetch(`/api/scholarship-status?track=${encodeURIComponent(trackName)}`);
        const statusData = await statusResponse.json();
        finalScholarshipAvailable = statusData.available || false;
      } catch {
        // Use cached value if check fails
      }

      // Calculate the actual price to charge - discounts stack together
      // Start with original price
      let actualPrice = coursePrice;
      
      // Step 1: Apply scholarship discount if available (10 spots still open)
      if (finalScholarshipAvailable) {
        actualPrice = actualPrice * (1 - discountPercentage / 100);
      }
      
      // Step 2: Apply discount code discount on top of current price
      if (appliedDiscount) {
        const discountPercent = typeof appliedDiscount.percentage === 'string' 
          ? parseFloat(appliedDiscount.percentage) 
          : appliedDiscount.percentage;
        actualPrice = actualPrice * (1 - discountPercent / 100);
      }
      const amountInKobo = Math.round(actualPrice * 100);

      // First, save the application (without payment reference - will be updated after payment)
      try {
        await fetch('/api/save-application', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            trackName,
            amount: amountInKobo,
            discountCode: appliedDiscount ? appliedDiscount.name : null,
            referralSource: formData.referralSource === 'Others' 
              ? `Others: ${formData.referralSourceOther}` 
              : formData.referralSource,
          }),
        });
      } catch {
        // Continue with payment even if save fails
        showToast({
          type: 'error',
          message: 'We could not save your application details, but we will still redirect you to payment.',
        });
      }

      // Initialize Paystack payment
      const response = await fetch('/api/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          trackName,
          amount: amountInKobo, // Convert to kobo (Paystack uses smallest currency unit)
          referralSource: formData.referralSource === 'Others' 
            ? `Others: ${formData.referralSourceOther}` 
            : formData.referralSource,
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_code) {
        // Ensure Paystack script is loaded before opening the modal
        try {
          setIsPaystackLoading(true);
          await loadPaystackScript();
        } catch {
          showToast({
            type: 'error',
            message: 'Unable to load payment widget. Please check your connection and try again.',
          });
          setIsSubmitting(false);
          setIsPaystackLoading(false);
          return;
        }

        setIsSubmitting(false);
        setIsPaystackLoading(false);

        if (typeof window.PaystackPop !== 'undefined') {
          const handler = new window.PaystackPop();

          // Open Paystack payment popup
          handler.resumeTransaction(data.access_code);

          // Store reference for polling
          const paymentReference = data.reference;

          let pollActive = true;
          const pollInterval = setInterval(async () => {
            if (document.hidden || !pollActive) return;
            try {
              const verifyResponse = await fetch(`/api/payment-callback?reference=${paymentReference}&check_only=true`);
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                if (verifyData.status === 'success') {
                  pollActive = false;
                  clearInterval(pollInterval);
                  window.location.href = `/payment-success?reference=${paymentReference}`;
                }
              }
            } catch {
              // Silent fail - continue polling
            }
          }, 2000);

          setTimeout(() => { pollActive = false; clearInterval(pollInterval); }, 600000);
        } else {
          // Fallback to redirect if PaystackPop is not loaded
          if (data.authorization_url) {
            window.location.href = data.authorization_url;
          } else {
            showToast({
              type: 'error',
              message: 'Payment initialization failed. Please try again.',
            });
          }
        }
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to initialize payment. Please try again.',
        });
        setIsSubmitting(false);
      }
    } catch {
      showToast({
        type: 'error',
        message: 'An unexpected error occurred while starting payment. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-form" style={FORM_CONTAINER_STYLE}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name <span style={REQUIRED_ASTERISK_STYLE}>*</span></label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            placeholder="Enter your first name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name <span style={REQUIRED_ASTERISK_STYLE}>*</span></label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            placeholder="Enter your last name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address <span style={REQUIRED_ASTERISK_STYLE}>*</span></label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number <span style={REQUIRED_ASTERISK_STYLE}>*</span></label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            placeholder="Enter your phone number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="referralSource">How did you hear about Cverse? <span style={REQUIRED_ASTERISK_STYLE}>*</span></label>
          <select
            id="referralSource"
            name="referralSource"
            value={formData.referralSource}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            style={{
              ...SELECT_BASE_STYLE,
              backgroundColor: isSubmitting ? '#f5f5f5' : 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <option value="">Select an option</option>
            {REFERRAL_SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {formData.referralSource === 'Others' && (
            <input
              type="text"
              id="referralSourceOther"
              name="referralSourceOther"
              value={formData.referralSourceOther}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="Please specify"
              style={INPUT_OTHER_STYLE}
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="discountCode">Discount Code</label>
          <input
            type="text"
            id="discountCode"
            name="discountCode"
            value={formData.discountCode}
            onChange={handleChange}
            onBlur={handleDiscountCodeBlur}
            disabled={isSubmitting || validatingDiscount}
            placeholder="Enter discount code"
          />
          {validatingDiscount && (
            <p style={VALIDATING_MSG_STYLE}>Validating discount code...</p>
          )}
          {appliedDiscount && (
            <p style={APPLIED_DISCOUNT_STYLE}>✓ {appliedDiscount.name} - {appliedDiscount.percentage}% discount applied</p>
          )}
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '1rem', display: 'block' }}>
            Payment Method <span style={REQUIRED_ASTERISK_STYLE}>*</span>
          </label>
          <div
          onClick={() => !isSubmitting && setFormData(prev => ({ ...prev, paymentOption: 'paystack' }))}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.borderColor = '#0066cc';
              e.currentTarget.style.backgroundColor = '#f0f7ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.borderColor = formData.paymentOption === 'paystack' ? '#0066cc' : '#e1e4e8';
              e.currentTarget.style.backgroundColor = formData.paymentOption === 'paystack' ? '#f0f7ff' : '#f8f9fa';
            }
          }}
          style={{
            border: formData.paymentOption === 'paystack' ? '2px solid #0066cc' : '2px solid #e1e4e8',
            borderRadius: '12px',
            padding: '1.25rem',
            backgroundColor: formData.paymentOption === 'paystack' ? '#f0f7ff' : '#f8f9fa',
            transition: 'all 0.3s ease',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
          >
          <label style={{
            ...LABEL_FLEX_STYLE,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}>
              <input
                type="radio"
                name="paymentOption"
                value="paystack"
                checked={formData.paymentOption === 'paystack'}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{
                  ...RADIO_INPUT_STYLE,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={TITLE_DIV_STYLE}>
                  Paystack
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={PRICE_BOX_STYLE}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#1a1a1a', fontWeight: '600' }}>Course Fee</p>
            {appliedDiscount || scholarshipAvailable ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: '#999', textDecoration: 'line-through' }}>
                  ₦{coursePrice.toLocaleString()}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#00c896' }}>
                  ₦{finalPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0066cc' }}>
                ₦{coursePrice.toLocaleString()}
              </span>
            )}
          </div>
          {scholarshipAvailable && (
            <div style={{ 
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#f0f7ff',
              borderRadius: '8px',
              borderLeft: '4px solid #0066cc'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem', 
                color: '#0066cc', 
                fontWeight: '600'
              }}>
                Limited Offer: First {scholarshipLimit} paid learners receive a {Math.round(discountPercentage)}% scholarship discount
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="cta-button"
          disabled={isSubmitting || isPaystackLoading}
          style={{ width: '100%' }}
        >
          {isSubmitting
            ? 'Processing...'
            : isPaystackLoading
            ? 'Loading payment widget...'
            : `Proceed to Payment (₦${finalPrice.toLocaleString()})`}
        </button>
      </form>
    </div>
  );
}

