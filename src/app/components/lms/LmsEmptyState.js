'use client';

export default function LmsEmptyState({ icon, title, description, action }) {
  return (
    <div className="lms-empty-state flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="lms-empty-state-icon mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <p className="text-base font-medium text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
