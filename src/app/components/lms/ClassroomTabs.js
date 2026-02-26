'use client';

/**
 * Reusable tab component with ARIA roles for the Classroom page.
 *
 * Props:
 *   tabs       – Array of { id: string, label: string, icon?: ReactNode }
 *   activeTab  – The currently active tab id
 *   onTabChange – (tabId: string) => void
 *   children   – The content for the active tab panel
 */
export default function ClassroomTabs({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className="lms-tabs">
      <div className="lms-tabs-list" role="tablist" aria-label="Classroom sections">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`lms-tabs-tab ${isActive ? 'lms-tabs-tab-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <span className="lms-tabs-tab-icon">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="lms-tabs-panel"
      >
        {children}
      </div>
    </div>
  );
}
