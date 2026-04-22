# Changelog

All notable changes to SDC Centralized Calendar are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-04-22

### 🎉 Initial Release

#### Core Calendar
- Month, Week, Day view modes
- Drag-and-drop event rescheduling
- Right-click context menu on calendar cells
- Undo / Redo for event edits
- Keyboard shortcuts overlay (`?`)
- Week numbers toggle
- Density presets: Compact, Default, Comfy

#### Event Management
- 7 categories: Holidays, Pay Days, Birthdays, Meetings, Company Events, Deadlines, Personal
- Reminder Bell — set reminders on any event
- Pin Events — pin to cell top
- Import / Export (JSON)
- Employee Directory modal

#### UI / UX
- Birthday Spotlight banner (this week's birthdays, expandable)
- Payday Countdown pill in sidebar
- Monthly Summary Bar with category count pills
- My Events filter toggle
- Jump-to-Date mini-calendar
- Search with live chip highlight / dim
- Dark mode support
- Mobile bottom navigation bar
- Swipe gestures (mobile)
- Collapsible sidebar sections
- Hover cards on event chips
- Pre-loader skeleton screen

#### Auth & Backend
- Microsoft Azure AD SSO (OAuth2 + JWT)
- LOCAL_MODE flag for local dev (no backend needed)
- Role-based access: Admin, HR, Manager, Employee
- Admin Panel — manage users & role permissions
- Node.js/Express server (port 3001 API, port 3000 static)
- NeDB embedded database
- Windows auto-start VBS script

#### Bug Fixes (pre-release)
- Fixed `</script>` inside Babel template literal causing blank page
- Fixed `$setOnInsert` NeDB incompatibility (find-then-upsert pattern)
- Fixed account dropdown disappearing on pointer move (click-based state)
- Fixed summary bar pills touching the dividing line (bottom padding)
- Fixed "+N more" birthday button not functional (extracted component with state)
- Fixed TODAY cell number overlapping "TODAY" label (moved label outside circle)
- Fixed AdminPanel crash (`users.map is not a function`) in LOCAL_MODE
- Fixed Sign Out being a no-op in LOCAL_MODE (now reloads page)
