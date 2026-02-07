'use client';

export default function AdminPageHeader({ title, description, breadcrumb, actions }) {
  return (
    <div
      className="admin-page-header"
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        borderBottom: 'none',
      }}
    >
      <div className="admin-page-header-main">
        <div className="admin-page-header-text">
          {breadcrumb && (
            <nav className="admin-page-breadcrumb" aria-label="Breadcrumb">
              {breadcrumb}
            </nav>
          )}
          <h1 className="admin-page-title">{title}</h1>
          {description && (
            <p className="admin-page-description">{description}</p>
          )}
        </div>
        {actions && (
          <div className="admin-page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
