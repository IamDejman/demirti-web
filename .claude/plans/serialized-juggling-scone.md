# Plan: Replace Sidebar with Top Navbar

## Context
The user wants to switch from a left sidebar navigation to a horizontal top navigation bar for both student and facilitator layouts. This gives more horizontal content space and a cleaner, modern feel.

---

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/components/lms/LmsLayoutShell.js` | Remove sidebar, replace with top navbar layout (no more margin-left) |
| 2 | `src/app/components/lms/LmsSidebar.js` | **Rewrite** → `LmsTopNav.js` — horizontal navbar with logo left, nav links center, user/logout right. Mobile: hamburger → slide-down menu |
| 3 | `src/app/components/lms/index.js` | Update export from LmsSidebar → LmsTopNav |
| 4 | `src/app/(student)/layout.js` | Move notification icon into topBarContent (already there, stays) |
| 5 | `src/app/(facilitator)/layout.js` | No change needed (passes props through LmsLayoutShell) |
| 6 | `src/app/globals.css` | Replace `.lms-sidebar*` styles with `.lms-topnav*` styles; update `.lms-main` to remove margin-left transition |

---

## Design: Top Navbar

### Desktop (≥768px)
```
┌──────────────────────────────────────────────────────────┐
│ [Logo]    Home  Classroom  Announcements  Chat ...   [👤]│
└──────────────────────────────────────────────────────────┘
│                                                          │
│                    Page Content                           │
│                                                          │
```

- **Left**: Logo image (links to home)
- **Center/Left**: Nav links as horizontal text links (no icons, matching current removal)
- **Right**: User avatar/initial (links to profile) + Logout button + Notification icon (student only)
- Fixed to top, height ~60px
- Active link: bottom border highlight (primary color) instead of left border
- Badge for grading count on facilitator still supported

### Mobile (<768px)
```
┌─────────────────────────────┐
│ [Logo]              [☰] [🔔]│
├─────────────────────────────┤
│ Home                        │  ← slide-down menu
│ Classroom                   │
│ ...                         │
│ ─────────────────────────── │
│ [👤] Name · Logout          │
└─────────────────────────────┘
```

- Hamburger toggles a dropdown/slide-down panel
- Nav links stack vertically
- User section at bottom of dropdown

---

## Implementation Steps

### Step 1: Create `LmsTopNav.js` (replaces LmsSidebar.js)
- Keep same props: `{ variant, user, pendingCount, topBarContent }`
- Keep `STUDENT_NAV` and `FACILITATOR_NAV` arrays (text-only, no icons)
- Keep `isActive()` logic
- Keep `handleLogout()` logic
- Desktop: `<nav>` with `display: flex; align-items: center` — logo | links | right section
- Mobile: hamburger button toggles `mobileOpen` state → dropdown panel
- Active state: `border-bottom: 2px solid var(--primary-color)` instead of `border-left`

### Step 2: Rewrite `LmsLayoutShell.js`
- Remove sidebar collapsed state entirely (no more localStorage toggle)
- Structure becomes:
  ```jsx
  <div className="lms-app">
    <LmsTopNav variant={variant} user={user} pendingCount={pendingCount} topBarContent={topBarContent} />
    <main className="lms-main">
      <div className="lms-main-content">{children}</div>
    </main>
  </div>
  ```
- Remove the old `<header className="lms-topbar">` (navbar IS the topbar now)
- Remove all margin-left logic and collapse state

### Step 3: Update `src/app/components/lms/index.js`
- Change export from `LmsSidebar` to `LmsTopNav`

### Step 4: Update `src/app/globals.css`
- Remove/replace `.lms-sidebar*` styles
- Add `.lms-topnav` styles:
  - Fixed top, full width, height 60px, white background, bottom border
  - `.lms-topnav-link`: horizontal nav link, padding, hover/active states
  - `.lms-topnav-link.active`: bottom border primary color
  - `.lms-topnav-mobile-menu`: slide-down panel for mobile
- Update `.lms-main`: remove `margin-left` transition, add `padding-top: 60px`
- Remove the `@media (max-width: 1024px)` margin-left override (no longer needed)
- Remove `.glass-sidebar` styles

### Step 5: Update layout files
- `(student)/layout.js`: Pass `topBarContent` (notification icon) — this already works since LmsLayoutShell passes it through
- `(facilitator)/layout.js`: No changes needed, just passes variant/user/pendingCount
- Remove `onToggleCollapse` and `collapsed` props since they no longer exist

---

## Verification
- `npm run build` passes
- Desktop: Logo left, nav links horizontal, user avatar + logout right
- Mobile: Hamburger opens dropdown with stacked links
- Active nav link has bottom border highlight
- Facilitator grading badge still visible
- Student notification icon still visible in navbar
- No sidebar remnants (no left margin on content)
- Content uses full width
