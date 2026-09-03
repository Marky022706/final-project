# Library Management System — UI/UX Design System & Style Guide

A comprehensive specification and single source of truth for building consistent, modern, and accessible interfaces across both the **Member Portal** and the **Admin Backoffice**.

---

## Table of Contents
1. [Core Design Philosophy](#1-core-design-philosophy)
2. [Typography & Hierarchy](#2-typography--hierarchy)
3. [Color Palette & Tokens](#3-color-palette--tokens)
4. [Spatial Layout, Grid & Elevation](#4-spatial-layout-grid--elevation)
5. [Component Standards](#5-component-standards)
   - [5.1. Page Header Banners](#51-page-header-banners)
   - [5.2. Metric & KPI Stat Cards](#52-metric--kpi-stat-cards)
   - [5.3. Data Tables & Filters](#53-data-tables--filters)
   - [5.4. Batch Selection & Action Choices Bar](#54-batch-selection--action-choices-bar)
   - [5.5. Buttons & Action Triggers](#55-buttons--action-triggers)
   - [5.6. Form Controls & Inputs](#56-form-controls--inputs)
   - [5.7. Status Badges & Pills](#57-status-badges--pills)
   - [5.8. Dialogs & Modals](#58-dialogs--modals)
6. [Dark Mode & Theme Adaptation](#6-dark-mode--theme-adaptation)
7. [Accessibility & Interaction Heuristics](#7-accessibility--interaction-heuristics)
8. [Role-Based Access & Surface Matrix](#8-role-based-access--surface-matrix)

---

## 1. Core Design Philosophy

- **Modern Municipal Library Aesthetic**: Combines trustworthy, organic emerald & teal accents with crisp, high-contrast slate surfaces.
- **Glassmorphism & Depth**: Subtle backdrop blurs (`backdrop-blur-md`), ambient radial glows, and delicate border strokes (`border-slate-100 dark:border-slate-800`).
- **Defensive & Action-Oriented**: Clear confirmation modals, instant feedback (<100ms), and intelligent safeguard checks (e.g., circulation loan blockers on deletion/archival).
- **Adaptive Responsiveness**: Seamless scaling from mobile devices (320px) to ultra-wide desktop monitors (1600px containerized).

---

## 2. Typography & Hierarchy

The application utilizes two primary Google Fonts loaded in `src/index.css`:
- **Heading / Display**: `Outfit` (sans-serif, 600–900 weight)
- **Body / Interface**: `Inter` (system-ui, 400–700 weight)

### 2.1. Type Scale & Utility Tokens

| Element | Class / Token | Font Family | Size | Weight | Line Height | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title / H1** | `h1`, `text-2xl sm:text-3xl` | `Outfit` | 28px – 36px | 800–900 | 1.15 | Page hero headers, main views |
| **Section Header / H2** | `h2`, `text-xl sm:text-2xl` | `Outfit` | 22px – 28px | 700–800 | 1.25 | Major dashboard sections, modal headers |
| **Sub-Header / H3** | `h3`, `text-base sm:text-lg` | `Outfit` | 16px – 20px | 600–700 | 1.35 | Card titles, group headings |
| **Body Large** | `text-sm sm:text-base` | `Inter` | 14px – 16px | 400–500 | 1.6 | Introductions, lead descriptions |
| **Body Regular** | `text-xs sm:text-sm` | `Inter` | 13px – 14px | 400–500 | 1.5 | General UI copy, descriptions, form labels |
| **Caption / Meta** | `text-[11px] sm:text-xs` | `Inter` | 11px – 12px | 500–600 | 1.4 | Timestamps, subtitles, helper hints |
| **Badge / Micro** | `text-[10px] sm:text-[11px]` | `Inter` | 10px – 11px | 700–800 | 1.2 | Status pills, role tags, counter chips |
| **Monospace / Code** | `font-mono text-xs` | Monospace | 11px – 13px | 600 | 1.4 | ISBN, QR codes, Phone numbers, IPs |

### 2.2. Dynamic Text Scaling
The system respects patron accessibility scaling via `html[data-font-size="small|medium|large"]`:
- `small`: 14px base
- `medium`: 16px base (default)
- `large`: 18px base

---

## 3. Color Palette & Tokens

### 3.1. Primary & Brand (Emerald / Teal)
Primary actions, active tab pills, brand highlights, and success indicators:
- **`emerald-50`** (`#ecfdf5`) / **`dark:bg-emerald-950/50`**: Subdued pill & row highlights
- **`emerald-500`** (`#10b981`): Status lights, active dots, vibrant icons
- **`emerald-600`** (`#059669`): Primary button background, active nav borders
- **`emerald-700`** (`#047857`): Primary button hover state
- **`emerald-900`** (`#064e3b`): Dark gradient container foundations

### 3.2. Neutral Surfaces (Slate)
Backgrounds, borders, and typography:
- **`bg-slate-50`** / **`dark:bg-slate-950`**: Application root canvas
- **`bg-white`** / **`dark:bg-slate-900`**: Primary cards, dialogs, table containers
- **`border-slate-100 dark:border-slate-800`**: Subtle card and divider borders
- **`border-slate-200 dark:border-slate-700`**: Form inputs and interactive control outlines
- **`text-slate-800 dark:text-slate-100`**: High-contrast headings and body text
- **`text-slate-500 dark:text-slate-400`**: Secondary descriptions and metadata

### 3.3. Semantic Status Tokens

| Semantic State | Light Theme Token | Dark Theme Token | Standard Usage |
| :--- | :--- | :--- | :--- |
| **Active / Available** | `bg-emerald-50 text-emerald-700 border-emerald-200` | `dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800` | Available books, active members, approved cards |
| **Pending / Warning** | `bg-amber-50 text-amber-700 border-amber-200` | `dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800` | Pending card reviews, reservations, notices |
| **Critical / Overdue** | `bg-rose-50 text-rose-700 border-rose-200` | `dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800` | Overdue loans, unpaid fines, suspended users, delete |
| **Archived / Inactive** | `bg-slate-100 text-slate-600 border-slate-200` | `dark:bg-slate-800 text-slate-400 dark:border-slate-700` | Archived catalog books, inactive patron accounts |
| **Privilege (Super)** | `bg-amber-50 text-amber-800 border-amber-300` | `dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700` | Super Admin role indicator badge |
| **Privilege (Admin)** | `bg-emerald-50 text-emerald-800 border-emerald-300`| `dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700`| Librarian / Staff role indicator badge |

---

## 4. Spatial Layout, Grid & Elevation

- **8pt / 4pt Spatial Grid**: All margins, paddings, gaps, and heights must be multiples of 4px or 8px (`gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `p-6 sm:p-8` (24px/32px)).
- **Corner Radii Hierarchy**:
  - `rounded-3xl` (`24px`): Main page container cards, top hero banners, metric cards.
  - `rounded-2xl` (`16px`): Modal dialogs, action choice banners, sub-panels.
  - `rounded-xl` (`12px`): Buttons, form inputs, interactive row items.
  - `rounded-full`: Status pills, avatars, circular icon triggers.
- **Maximum Width Container**: Pages wrap in `max-w-[1600px] mx-auto` to ensure consistent alignment and prevent stretching on wide displays.

---

## 5. Component Standards

### 5.1. Page Header Banners
Standard top section on all backoffice views:

```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
  <div className="flex items-center gap-3.5">
    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/10 flex-shrink-0">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
        Page Title
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
        Concise, human-friendly summary of page capabilities
      </p>
    </div>
  </div>
  {/* Action shortcuts / buttons */}
</div>
```

---

### 5.2. Metric & KPI Stat Cards
Interactive cards serving as both KPI summaries and one-click table filters:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div 
    onClick={() => setFilter('active')}
    className={`p-5 rounded-3xl border transition-all cursor-pointer hover-lift ${
      isActive 
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20' 
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100'
    }`}
  >
    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">
      Active Items
    </span>
    <p className="text-2xl sm:text-3xl font-black">128</p>
  </div>
</div>
```

---

### 5.3. Data Tables & Filters
Implemented via the shared `<DataTable />` component:
- **Search Bar**: Centered or left-aligned input searching across all relevant metadata columns.
- **Master Header Checkbox**: Handles Select All, Deselect All, and Indeterminate states.
- **Row Checkboxes**: Placed in the first column with `stopPropagation` to allow row selection without triggering row clicks.
- **Selected Row Highlight**: Rows show `bg-emerald-50/70 dark:bg-emerald-950/30` when checked.
- **Sorting**: Clean sort indicators on table headers with `cursor-pointer` and hover feedback.

---

### 5.4. Batch Selection & Action Choices Bar
Whenever **1 or more items** are selected in a table, the table's inline row actions are replaced by a centralized, high-contrast dynamic action bar above the table:

```tsx
{selectedIds.length > 0 && (
  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl shadow-lg border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-black">
        <CheckSquare className="h-4 w-4 text-emerald-400" />
        {selectedIds.length} Selected
      </span>
      {selectedItems.length === 1 && (
        <span className="text-xs text-slate-300 font-semibold truncate max-w-sm hidden md:inline">
          "{selectedItems[0].title || selectedItems[0].first_name}"
        </span>
      )}
    </div>

    <div className="flex items-center gap-2 flex-wrap">
      {/* Dynamic contextual action buttons */}
      {/* Deselect escape hatch */}
      <button onClick={() => setSelectedIds([])} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10">
        <X className="h-4 w-4" />
      </button>
    </div>
  </div>
)}
```

---

### 5.5. Buttons & Action Triggers

| Variant | Styling Rules | Use Case |
| :--- | :--- | :--- |
| **Primary** | `bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/20` | Main CTA, Form Submit, Save Changes, New Record |
| **Secondary** | `bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100` | Sub-actions, Filter toggles, Quick actions |
| **Danger** | `bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-950/20` | Delete confirmation, Archive, Rejection |
| **Outline** | `border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200` | Cancel, Secondary choices, Export |
| **Ghost** | `text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800` | Close buttons, Navigation icon triggers |

---

### 5.6. Form Controls & Inputs
All text inputs, dropdowns, and textareas use `.input-field`:
- `bg-white dark:bg-slate-900`
- `border border-slate-200 dark:border-slate-700 rounded-xl`
- `focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600`
- `text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500`

---

### 5.7. Status Badges & Pills
Always combine a color border, background tint, text label, and icon/dot:

```tsx
<span className="px-3 py-1 border rounded-full text-[11px] font-bold capitalize inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
  Active
</span>
```

---

### 5.8. Dialogs & Modals
- **Backdrop**: Smooth dark backdrop with blur (`bg-slate-950/60 backdrop-blur-xs`).
- **Container**: `rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900`.
- **Close Button**: Standard top-right `X` button with `Esc` key capture and outside click dismiss.
- **Destructive Confirmations**: Prominent warning icon (`Trash2` / `ShieldAlert` with pulse) and bulleted preview of items affected.

---

## 6. Dark Mode & Theme Adaptation

- Standardized via Tailwind CSS `darkMode: 'class'`.
- Root class toggle `.dark` on `<html>`.
- Zero raw hardcoded white or black backgrounds — all surfaces must use `dark:bg-slate-900` or `dark:bg-slate-950`.
- Borders in dark mode must use `dark:border-slate-800` or `dark:border-slate-700`.

---

## 7. Accessibility & Interaction Heuristics

1. **Visibility of System Status**: Real-time feedback within 100ms on all clicks; inline spinners on asynchronous submission triggers.
2. **Defensive Error Prevention**: Confirmation dialogs required for destructive operations; deletion blocked when active loan dependencies exist.
3. **Safe Exploration & Escape Hatches**: Every modal, drawer, or selection toolbar must provide an unambiguous Cancel button and `Esc` key listener.
4. **Recognition over Recall**: Explicit search suggestions, placeholders, filter badges, and selected count indicators.
5. **Touch Target Sizing**: Minimum 44px height for interactive targets on mobile and tablet screens.

---

## 8. Role-Based Access & Surface Matrix

| Module / View | Path | Super Admin | Librarian / Admin | Member |
| :--- | :--- | :---: | :---: | :---: |
| **Admin Dashboard** | `/admin/dashboard` | ✅ | ✅ | ❌ |
| **Book Inventory** | `/admin/books` | ✅ | ✅ | ❌ |
| **Borrow Logs & Circulation** | `/admin/transactions` | ✅ | ✅ | ❌ |
| **Reservations Desk** | `/admin/reservations` | ✅ | ✅ | ❌ |
| **Attendance & QR Scan** | `/admin/attendance` | ✅ | ✅ | ❌ |
| **Request Center** | `/admin/requests` | ✅ | ✅ | ❌ |
| **Reports & Analytics** | `/admin/reports` | ✅ | ✅ | ❌ |
| **Member Directory** | `/admin/users` | ✅ | ❌ *(Redirected)* | ❌ |
| **Activity Audit Logs** | `/admin/activity-log` | ✅ | ❌ *(Redirected)* | ❌ |
| **Security & System Logs** | `/admin/system-logs` | ✅ | ❌ *(Redirected)* | ❌ |
| **System Settings** | `/admin/settings` | ✅ | ❌ *(Redirected)* | ❌ |
| **Recycle Bin** | `/admin/recycle-bin` | ✅ | ✅ | ❌ |
| **Backup & Restore** | `/admin/backup-restore` | ✅ | ❌ *(Redirected)* | ❌ |
| **Member Portal & Catalog**| `/dashboard`, `/catalog`, etc. | ❌ | ❌ | ✅ |
