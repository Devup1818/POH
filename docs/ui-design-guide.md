# POH System — UI & UX Design Guide

A living reference for building a clean, modern, and premium interface for the Railway POH Management System. The users are railway engineers and supervisors working in maintenance sheds — the UI must be fast to scan, easy to learn, and pleasant to use for hours at a stretch.

---

## 1. Design Principles

| Principle | What it means in practice |
|---|---|
| **Clarity over density** | Every screen should have a single clear purpose. Reduce cognitive load — if something can be removed without losing meaning, remove it. |
| **Breathing room** | Generous whitespace between sections. Cards, tables, and panels should never feel cramped. Padding is not wasted space — it's readability. |
| **Progressive disclosure** | Show summary first, detail on demand. Dashboard → Rake → Coach → Section. Don't dump everything on one screen. |
| **Quiet confidence** | The UI should feel calm and professional. No loud colors competing for attention. Let the data speak. Color is reserved for meaning (status, alerts). |
| **Motion with purpose** | Animations guide the eye and confirm actions. They should feel natural and fast — never decorative or slow. |

---

## 2. Color System

### Base Palette

```
Background        #FAFAFA   (warm off-white, not sterile)
Surface           #FFFFFF   (cards, panels, modals)
Border            #E5E7EB   (gray-200, subtle separation)
Border Hover      #D1D5DB   (gray-300)
Text Primary      #111827   (gray-900)
Text Secondary    #6B7280   (gray-500)
Text Tertiary     #9CA3AF   (gray-400, labels, captions)
```

### Accent — Blue (Primary Action)

```
Blue 600          #2563EB   (buttons, links, active states)
Blue 500          #3B82F6   (hover)
Blue 50           #EFF6FF   (selected backgrounds, highlights)
```

### Semantic Colors (Status Only)

Use color sparingly. It should always encode meaning.

```
Green 500         #22C55E   (on-time, complete, success)
Green 50          #F0FDF4   (success background)
Amber 500         #F59E0B   (minor delay, warning)
Amber 50          #FFFBEB   (warning background)
Red 500           #EF4444   (significant delay, error, danger)
Red 50            #FEF2F2   (error background)
```

### Stage Colors (Muted Pastels)

Keep the existing muted palette for stage distribution bars. These should be soft — not competing with semantic colors.

---

## 3. Typography

Use the existing **Geist Sans** (variable font) throughout. It's clean, modern, and highly legible.

| Role | Size | Weight | Color | Usage |
|---|---|---|---|---|
| Page title | 20px (text-xl) | 600 (semibold) | gray-900 | One per page, top-left |
| Section heading | 14px (text-sm) | 600 (semibold) | gray-800 | Card titles, section labels |
| Body | 14px (text-sm) | 400 (normal) | gray-700 | Default text |
| Caption / Label | 12px (text-xs) | 500 (medium) | gray-400 | Metadata, timestamps, filter labels |
| Metric value | 28px (text-2xl) | 600 (semibold) | gray-900 | Dashboard KPI numbers |
| Tiny label | 10px (text-[10px]) | 500 (medium) | gray-400 | Stage legends, micro-labels |

### Rules
- Never use more than 3 font sizes on a single card/component.
- Use `tracking-tight` on large numbers for a premium feel.
- Use `tabular-nums` on any numeric data (metrics, percentages, days).

---

## 4. Spacing & Layout

### Grid
- Dashboard: 6-column grid for metrics (collapses to 3 → 2 on smaller screens).
- Rake cards: 1-column on mobile, 2 on tablet, 3 on desktop.
- Max content width: none (full-width within the main area). The sidebar constrains the left.

### Spacing Scale
Use Tailwind's default scale consistently:

```
Between sections:     gap-6 (24px)
Between cards:        gap-4 (16px)
Card internal:        p-5 (20px)  — slightly more generous than current p-4
Metric card internal: p-4 (16px)  — compact is fine here
Between label+value:  mt-1 (4px)
```

### Sidebar
- Width: 256px (w-64) — current is fine.
- Background: white with right border.
- Active item: blue-50 bg with blue-700 text and a 2px left accent bar.

### Header
- Height: 64px (h-16) — current is fine.
- Sticky, white background, subtle bottom border.
- Right-aligned: shed selector → notifications → user menu.

---

## 5. Component Patterns

### Cards
```
Border:           border-gray-100 (lighter than current gray-200)
Border radius:    rounded-xl (12px)
Shadow:           shadow-sm
Hover:            shadow-md + border-gray-200 (subtle lift)
Transition:       transition-all duration-200 ease-out
Background:       white
```

Cards should feel like they're floating slightly above the background. The hover state adds a gentle lift — not a dramatic jump.

### Buttons
```
Primary:          bg-blue-600, hover:bg-blue-700, rounded-lg
Secondary:        bg-gray-100, hover:bg-gray-200, rounded-lg
Ghost:            transparent, hover:bg-gray-50, rounded-lg
Danger:           bg-red-600, hover:bg-red-700, rounded-lg
Border radius:    rounded-lg (8px) — softer than current rounded-md
Transition:       transition-colors duration-150
```

All buttons should have `focus-visible:ring-2 ring-offset-2` for accessibility.

### Badges / Pills
```
Border radius:    rounded-full (pill shape)
Padding:          px-2.5 py-0.5
Font:             text-xs font-medium
Background:       Semantic color at 50 opacity (e.g., green-50)
Text:             Semantic color at 700 (e.g., green-700)
```

### Inputs & Selects
```
Border:           border-gray-200
Border radius:    rounded-lg
Focus:            ring-2 ring-blue-500/20 border-blue-400
Background:       white (not the current white/60 with backdrop-blur)
Padding:          px-3 py-2.5
Font:             text-sm
Placeholder:      text-gray-400
```

Drop the `backdrop-blur` on filter inputs — it adds visual noise without benefit.

### Modals
```
Overlay:          bg-black/40 (slightly lighter than current /50)
Panel:            rounded-2xl shadow-2xl (more premium)
Entry animation:  fade-in overlay + scale-up panel (see §6)
Max width:        max-w-lg (slightly wider than current max-w-md)
```

### Tables
```
Header:           bg-gray-50, text-xs uppercase tracking-wider text-gray-500
Row hover:        hover:bg-gray-50/50
Border:           Horizontal only (border-b border-gray-100)
Cell padding:     px-4 py-3
```

No vertical borders. Keep it clean.

### Progress Bars
```
Track:            bg-gray-100 rounded-full
Fill:             rounded-full, transition-all duration-500 ease-out
Height:           h-2 (default), h-1.5 (compact)
```

---

## 6. Animation & Transitions

### General Rules
- Duration: 150ms for color/opacity, 200ms for transforms, 300ms for layout shifts.
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for continuous.
- Never animate more than 2 properties simultaneously on a single element.
- Respect `prefers-reduced-motion` — wrap animations in a media query or use Tailwind's `motion-safe:` prefix.

### Specific Animations

**Page transitions (between routes):**
- Fade in content: `opacity 0→1` over 200ms with a subtle `translateY(8px→0)`.
- Apply via a wrapper component on the main content area.

**Cards appearing (dashboard load):**
- Staggered fade-in: each card fades in 50ms after the previous.
- `opacity 0→1, translateY(12px→0)` over 300ms ease-out.

**Modal open:**
- Overlay: `opacity 0→1` over 200ms.
- Panel: `opacity 0→1, scale(0.95→1)` over 250ms ease-out.

**Modal close:**
- Reverse of open, 150ms (exits should be faster than entrances).

**Sidebar (mobile):**
- Slide in from left: `translateX(-100%→0)` over 200ms ease-out.
- Overlay fade: `opacity 0→1` over 200ms.

**Hover effects:**
- Cards: `shadow-sm → shadow-md`, `border-gray-100 → border-gray-200` over 200ms.
- Buttons: color change over 150ms.
- Links: color change over 100ms.

**Progress bar fill:**
- Width transition: 500ms ease-out (feels satisfying).

**Skeleton loading:**
- Use a subtle pulse animation (`animate-pulse`) on gray-100 blocks.
- Match the exact layout of the real content to prevent layout shift.

**Toast notifications:**
- Slide in from top-right: `translateX(100%→0)` over 300ms ease-out.
- Auto-dismiss with a fade-out over 200ms.

### CSS Implementation

Add these to `globals.css`:

```css
/* Page content entrance */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Modal panel entrance */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Modal panel exit */
@keyframes scale-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.95); }
}

/* Staggered card entrance */
@keyframes card-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Overlay fade */
@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.animate-fade-in-up {
  animation: fade-in-up 200ms ease-out both;
}

.animate-scale-in {
  animation: scale-in 250ms ease-out both;
}

.animate-scale-out {
  animation: scale-out 150ms ease-in both;
}

.animate-overlay-in {
  animation: overlay-in 200ms ease-out both;
}

.animate-card-in {
  animation: card-in 300ms ease-out both;
}
```

For staggered cards, use inline `animation-delay` via style prop:
```tsx
style={{ animationDelay: `${index * 50}ms` }}
```

---

## 7. Skeleton Loading States

Every data-driven section should have a skeleton state that matches its layout. No blank screens, no spinners floating in empty space.

### Pattern
```tsx
// Skeleton block
<div className="h-4 w-24 animate-pulse rounded bg-gray-100" />

// Skeleton card (matches MetricCard layout)
<div className="rounded-xl border border-gray-100 bg-white p-4">
  <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
  <div className="mt-3 h-7 w-20 animate-pulse rounded bg-gray-100" />
</div>
```

### Rules
- Skeleton shapes should match the real content dimensions.
- Use `rounded` on all skeleton blocks (not sharp rectangles).
- Color: `bg-gray-100` with `animate-pulse`.
- Show skeletons for 0–2 seconds max. If data takes longer, add a subtle "Still loading..." text.

---

## 8. Empty States

When a list or section has no data, show a helpful empty state — not just blank space.

### Pattern
```
[Illustration or icon — muted gray, 48px]
[Heading — text-sm font-medium text-gray-600]
[Description — text-xs text-gray-400, 1-2 lines max]
[Optional CTA button]
```

### Examples
- No active rakes: "No rakes in progress. Register a new rake to get started."
- No search results: "No rakes match your filters. Try adjusting your search."
- No notifications: "You're all caught up."

---

## 9. Responsive Behavior

| Breakpoint | Sidebar | Metrics grid | Rake cards | Filters |
|---|---|---|---|---|
| < 640px (mobile) | Hidden (hamburger) | 2 columns | 1 column | Stacked, full-width |
| 640–1024px (tablet) | Hidden (hamburger) | 3 columns | 2 columns | Wrapped row |
| > 1024px (desktop) | Visible, fixed | 6 columns | 3 columns | Single row |

### Mobile-Specific
- All interactive elements: minimum 44×44px touch target.
- Modals go full-screen on mobile (`max-sm:min-h-screen max-sm:rounded-none`).
- Filters collapse into a scrollable row or an expandable panel.

---

## 10. Accessibility Checklist

- All interactive elements have visible focus indicators (`focus-visible:ring-2`).
- Color is never the only way to convey information (always pair with text or icons).
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text.
- All images/icons have `aria-label` or are marked `aria-hidden="true"`.
- Modals trap focus and close on Escape.
- Use semantic HTML: `<nav>`, `<main>`, `<header>`, `<button>`, `<table>`.
- Respect `prefers-reduced-motion` for all animations.
- Form inputs have associated `<label>` elements.

---

## 11. Do's and Don'ts

| Do | Don't |
|---|---|
| Use whitespace generously | Cram information into every pixel |
| Let one element be the focal point per section | Make everything equally prominent |
| Use color only for meaning (status, actions) | Use color for decoration |
| Animate entrances, not idle states | Add bouncing/pulsing to draw attention |
| Show skeleton loaders during fetch | Show a blank screen or a centered spinner |
| Use consistent border-radius (xl for cards, lg for inputs/buttons, full for badges) | Mix rounded-md, rounded-lg, rounded-xl randomly |
| Keep filter bars compact and scannable | Stack 10 dropdowns vertically |
| Use subtle shadows for depth | Use heavy drop shadows or colored shadows |

---

## 12. Implementation Priority

When applying this guide to existing components, work in this order:

1. **globals.css** — Update CSS variables, add animation keyframes.
2. **UI primitives** — Card, Button, Badge, Modal, ProgressBar, Input, Select.
3. **Layout shell** — Sidebar, Header, Dashboard layout.
4. **Dashboard page** — Metrics cards, rake cards, filters, loading states.
5. **Detail pages** — Rake detail, coach detail, section detail.
6. **Forms & modals** — Registration, user management, settings.
7. **Reports** — Charts, tables, export views.

Each step should be a self-contained improvement that doesn't break anything.
