# NextLevel Stark B&W Design System

## Overview
NextLevel uses a minimalist, stark Black and White (B&W) Swiss design system. This system relies on typography, sharp 1px borders, and pure grayscale contrasts rather than colors, gradients, or shadows to create visual hierarchy.

## Color Palette

### Base Surfaces
*   `--background`: `#000000` (Pure Black)
*   `--foreground`: `#ffffff` (Pure White)
*   `--surface-primary`: `#000000` (Main card backgrounds)
*   `--surface-secondary`: `#111111` (Slightly elevated surfaces or hover states)

### Borders & Lines
*   `--border-subtle`: `#222222`
*   `--border-strong`: `#333333`
*   `--border-active`: `#ffffff` (For active focus states)

### Typography
*   `--text-primary`: `#ffffff`
*   `--text-secondary`: `#888888`
*   `--text-tertiary`: `#555555`
*   `--text-inverse`: `#000000`

## Spacing & Grid (8pt System)
*   `space-xs`: 4px
*   `space-sm`: 8px
*   `space-md`: 16px
*   `space-lg`: 24px
*   `space-xl`: 32px

## Typography System
NextLevel uses a clean sans-serif stack (`Inter`, `Helvetica Neue`, `Arial`, `sans-serif`).
*   **H1**: 32px, Bold (700), Tracking tight
*   **H2**: 24px, Semi-Bold (600)
*   **H3**: 18px, Medium (500)
*   **Body**: 14px, Regular (400), Line-height 1.5
*   **Small**: 12px, Regular (400)

## UI Components

### Buttons
*   **Primary Action**: Solid white background, black text. No border. Sharp or slightly rounded corners (e.g. 4px). Hover state: opacity drop to 80%.
*   **Secondary Action**: Pure black background, white text, 1px solid white border (`#333333` normally, `#ffffff` on hover).
*   **Ghost Action**: Transparent background, text color `#888888`. Hover state: text changes to `#ffffff` and background changes to `#111111`.

### Inputs & Forms
*   Background: `#000000`
*   Border: 1px solid `#333333`
*   Focus State: Border changes to `#ffffff`. No glowing outlines (`outline: none`).
*   Padding: 8px 12px.

### Cards & Layouts
*   Cards have a pure black (`#000000`) or slightly elevated (`#111111`) background.
*   Borders are strictly 1px solid `#333333`.
*   **No shadows.** Use borders to define boundaries.

## Responsive Behavior
*   **Mobile (< 768px)**: 16px padding on containers. Sidebar becomes a bottom navigation bar. Grids fall back to 1 column.
*   **Tablet (768px - 1024px)**: 24px padding on containers. Sidebar becomes icon-only.
*   **Desktop (> 1024px)**: 32px padding on containers. Sidebar is fully expanded.
