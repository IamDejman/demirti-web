'use client';

export default function AdminButton({ children, variant = 'primary', type = 'button', disabled, className = '', ...props }) {
  const variantClass = {
    primary: 'admin-btn-primary',
    secondary: 'admin-btn-secondary',
    danger: 'admin-btn-danger',
    ghost: 'admin-btn-ghost',
  }[variant] || 'admin-btn-primary';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`admin-btn ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
