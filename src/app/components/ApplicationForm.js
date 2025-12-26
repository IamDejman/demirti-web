'use client';

import { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';

export default function ApplicationForm({ trackName }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    paymentOption: 'paystack',
    discountCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scholarshipAvailable, setScholarshipAvailable] = useState(false);
  const [coursePrice, setCoursePrice] = useState(150000); // Default fallback
  const [discountPercentage, setDiscountPercentage] = useState(50); // Default fallback
  const [scholarshipLimit, setScholarshipLimit] = useState(10); // Default fallback
  const [appliedDiscount, setAppliedDiscount] = useState(null); // Store validated discount
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const { showToast } = useToast();

  // Load track configuration and scholarship status from database
  useEffect(() => {
    const loadTrackData = async () => {
      try {
        const response = await fetch(`/api/scholarship-status?track=${encodeURIComponent(trackName)}`);
        const data = await response.json();
        
        if (data.coursePrice) {
          setCoursePrice(data.coursePrice);
        }
        if (data.discountPercentage) {
          setDiscountPercentage(data.discountPercentage);
        }
        if (data.limit) {
          setScholarshipLimit(data.limit);
        }
        if (data.available) {
          setScholarshipAvailable(true);
        }
      } catch (error) {
        console.error('Error loading track data:', error);
      }
    };
    
    loadTrackData();
  }, [trackName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    } catch (error) {
      console.error('Error validating discount:', error);
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
    setIsSubmitting(true);

    try {
      // Re-check scholarship status at submission time to ensure accuracy (per track)
      let finalScholarshipAvailable = scholarshipAvailable;
      try {
        const statusResponse = await fetch(`/api/scholarship-status?track=${encodeURIComponent(trackName)}`);
        const statusData = await statusResponse.json();
        finalScholarshipAvailable = statusData.available || false;
      } catch (error) {
        console.error('Error checking scholarship status:', error);
        // Use cached value if check fails
      }

      // Calculate the actual price to charge
      // First apply scholarship discount if available
      let discountMultiplier = finalScholarshipAvailable ? (1 - discountPercentage / 100) : 1;
      
      // Then apply discount code if valid (discount codes take precedence or can stack)
      // For now, we'll apply the discount code if it provides a better discount
      if (appliedDiscount) {
        const discountCodeMultiplier = 1 - appliedDiscount.percentage / 100;
        // Use the better discount (lower multiplier = better discount)
        discountMultiplier = Math.min(discountMultiplier, discountCodeMultiplier);
      }
      
      const actualPrice = coursePrice * discountMultiplier;
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
          }),
        });
      } catch (saveError) {
        console.error('Error saving application:', saveError);
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
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_code) {
        // Open Paystack payment in modal popup
        setIsSubmitting(false);
        
        // Wait a bit to ensure Paystack script is loaded
        setTimeout(() => {
          // Check if PaystackPop is available (from the script tag)
          if (typeof window.PaystackPop !== 'undefined') {
            const handler = new window.PaystackPop();
            
            // Open Paystack payment popup
            handler.resumeTransaction(data.access_code);
            
            // Store reference for polling
            const paymentReference = data.reference;
            
            // Poll for payment status (callback URL will handle the actual verification)
            // This is a backup in case the callback URL redirect doesn't work
            const pollInterval = setInterval(async () => {
              try {
                const verifyResponse = await fetch(`/api/payment-callback?reference=${paymentReference}&check_only=true`);
                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json();
                  if (verifyData.status === 'success') {
                    clearInterval(pollInterval);
                    window.location.href = `/payment-success?reference=${paymentReference}`;
                  }
                }
              } catch {
                // Silent fail - continue polling
              }
            }, 2000); // Poll every 2 seconds
            
            // Clear polling after 10 minutes
            setTimeout(() => clearInterval(pollInterval), 600000);
            
          } else {
            // Fallback to redirect if PaystackPop is not loaded
            console.warn('PaystackPop not found, falling back to redirect');
            if (data.authorization_url) {
              window.location.href = data.authorization_url;
            } else {
              showToast({
                type: 'error',
                message: 'Payment initialization failed. Please try again.',
              });
            }
          }
        }, 100);
      } else {
        showToast({
          type: 'error',
          message: data.error || 'Failed to initialize payment. Please try again.',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'An unexpected error occurred while starting payment. Please try again.',
      });
      setIsSubmitting(false);
      console.error('Error:', error);
    }
  };

  return (
    <div className="contact-form" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name <span style={{ color: 'red' }}>*</span></label>
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
          <label htmlFor="lastName">Last Name <span style={{ color: 'red' }}>*</span></label>
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
          <label htmlFor="email">Email Address <span style={{ color: 'red' }}>*</span></label>
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
          <label htmlFor="phone">Phone Number <span style={{ color: 'red' }}>*</span></label>
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
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
              Validating discount code...
            </p>
          )}
          {appliedDiscount && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#00c896', fontWeight: '600' }}>
              ✓ {appliedDiscount.name} - {appliedDiscount.percentage}% discount applied
            </p>
          )}
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '1rem', display: 'block' }}>
            Payment Method <span style={{ color: 'red' }}>*</span>
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
              display: 'flex', 
              alignItems: 'center', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              margin: 0
            }}>
              <input
                type="radio"
                name="paymentOption"
                value="paystack"
                checked={formData.paymentOption === 'paystack'}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ 
                  marginRight: '0.75rem',
                  width: '20px',
                  height: '20px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  accentColor: '#0066cc'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '1rem',
                  color: '#1a1a1a'
                }}>
                  Paystack
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '1px solid #e1e4e8',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#1a1a1a', fontWeight: '600' }}>
              Course Fee
            </p>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0066cc' }}>
              ₦{coursePrice.toLocaleString()}
            </span>
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
          {appliedDiscount && (
            <div style={{ 
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              borderLeft: '4px solid #00c896'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.9rem', 
                color: '#2e7d32', 
                fontWeight: '600'
              }}>
                Discount Code Applied: {appliedDiscount.name} - {appliedDiscount.percentage}% off
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="cta-button"
          disabled={isSubmitting}
          style={{ width: '100%' }}
        >
          {isSubmitting ? 'Processing...' : (() => {
            let finalPrice = coursePrice;
            if (scholarshipAvailable) {
              finalPrice = coursePrice * (1 - discountPercentage / 100);
            }
            if (appliedDiscount) {
              const discountPrice = coursePrice * (1 - appliedDiscount.percentage / 100);
              finalPrice = Math.min(finalPrice, discountPrice);
            }
            return `Proceed to Payment (₦${finalPrice.toLocaleString()})`;
          })()}
        </button>
      </form>
    </div>
  );
}

