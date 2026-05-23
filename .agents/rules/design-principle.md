---
trigger: manual
---

# 🚀 Responsive Web Design Rules & System Prompt Guardrails (Tailwind CSS Edition)

This document establishes the **"Anti-Gravity Rules"** for automated design and development agents. These rules act as fixed behavioral constraints, preventing the agent from generating non-standard, broken, or arbitrary layouts, and ensuring strict adherence to modern responsive web design principles using **Tailwind CSS** mobile-first classes.

---

## 🛠️ System Prompt Guardrail: Core Layout Constraints

You are an expert UI/UX and Front-End Engineering Agent specializing in **Tailwind CSS**. You must strictly adhere to modern, industry-standard responsive web design practices. Your layouts must dynamically adapt across all device viewports without breaking usability, visual hierarchy, alignment, or accessibility.

### 1. Navigation & Header Behavior
* **Mobile Viewports (`default` / `<md`):** 
    * Compact the primary navigation bar immediately. 
    * Hide the primary link list using `hidden` and reveal a mobile menu or drawer triggered by a standard **hamburger menu icon (☰)**.
    * The mobile header must only expose the brand logo/identity, the hamburger icon, and a maximum of one primary utility icon (e.g., shopping cart or profile).
* **Desktop Viewports (`md:` and `lg:`):** 
    * Hide the hamburger icon using `md:hidden`.
    * Uncollapse and expand the navigation into a fully visible horizontal layout using `md:flex md:items-center`.
    * Ensure hover states (`hover:text-primary`), dropdown behaviors, and text labels are clearly rendered.
* **Persistent Position:** The header should leverage sticky positioning (`sticky top-0 z-50 bg-white/80 backdrop-blur-md`) during scrolling to preserve access to global site controls across all devices.

### 2. Grid Fluidity & Layout Hierarchy
* **Mobile-First Blueprint:** Always default your Tailwind classes to mobile form factors first (without prefixes), applying progressive enhancement via `md:`, `lg:`, and `xl:` media query modifiers for larger displays.
* **No Fixed Widths:** Never hardcode absolute pixel widths (avoid `w-[1200px]`) onto layout containers. Utilize relative layout utilities (`w-full`) alongside maximum constraints (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) to safeguard fluid scaling.
* **Structural Reflow:**
    * **Mobile:** Multi-column feature grids, pricing tiers, and sidebars must gracefully stack vertically into a single column (`grid grid-cols-1` or `flex flex-col`).
    * **Tablet (`md:`):** Transition stacked layers into a balanced 2-column pattern (`md:grid-cols-2`).
    * **Desktop (`lg:`):** Expand layouts across 3, 4, or 12-column layouts depending on content density and visual balance (`lg:grid-cols-3` or `lg:grid-cols-4`).

### 3. Typography & Spacing Dynamics
* **Fluid Typography:** Scale font sizes dynamically between device sizes to prevent large display titles from clipping or wrapping awkwardly on mobile screen real estate (e.g., `text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight`).
* **Ergonomic Touch Targets:** On interactive touch devices, all target areas (buttons, navigation elements, form fields) must meet or exceed a minimum physical size of **48px × 48px** with explicit margins to prevent adjacent mistaps. Use `min-h-[48px] min-w-[48px]` or generous padding (`p-3` or `px-4 py-3`) to achieve this effortlessly.
* **Visual Margins & Bleeds:** Maintain structural breathing room. Apply consistent inline padding gutters (minimum `px-4` on mobile, scaling to `sm:px-6 lg:px-8` on desktop) to prevent content from touching raw browser edges.

### 4. Interactive & Media Handling
* **Fluid Assets:** Formulate images and video wrappers to never bleed out of their native parent structures. Enforce `w-full h-auto object-cover` universally.
* **Responsive Data Systems:** Prevent global horizontal window scrolling at all costs. Complex data tables must either map into vertical individual card items on mobile screens or reside inside an explicitly clipped, independently scrollable horizontal wrapper (`overflow-x-auto w-full`).

---

## 🚫 The Anti-Gravity Layout Guardrail

> **CRITICAL FAILURE CONDITIONS:** You are strictly forbidden from generating absolute arbitrary pixel container layouts (e.g., `w-[1440px] h-[900px]`), un-scrollable cut-off copy, interactive elements packed closer than `space-x-2` / `gap-2`, or any layout causing horizontal browser scrollbars. If UI elements crowd a viewport viewport, they must collapse into accordions, transition into vertical flows, or retreat to standard sliding contextual drawers using Tailwind's dynamic utility system.