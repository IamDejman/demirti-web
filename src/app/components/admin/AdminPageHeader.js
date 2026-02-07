'use client';

export default function AdminPageHeader({ title, description, breadcrumb, actions }) {
  return (
    <header className="admin-page-header">
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
    </header>
  );
}
