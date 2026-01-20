# QED Venue Mapping AI — Brand Guidelines

> **Version**: 1.0  
> **Created**: January 2025  
> **Purpose**: Visual identity standards for the Venue Mapping AI web application and PDF outputs

---

## 1. Logo

### 1.1 Primary Logo

The QED logo is a clean, lowercase wordmark: **qed**

- **Usage**: Header navigation, PDF cover pages, login screen
- **Color variants**:
  - White logo on dark backgrounds (primary usage)
  - Dark Blue logo on light backgrounds

### 1.2 Logo Specifications

| Property | Value |
|----------|-------|
| Minimum width (web) | 60px |
| Minimum width (print) | 20mm |
| Clear space | Minimum 50% of logo width on all sides |
| File formats | SVG (preferred), PNG with transparency |

### 1.3 Logo Don'ts

- ⛔ Do not stretch or distort the logo
- ⛔ Do not add drop shadows or effects
- ⛔ Do not place on busy photo backgrounds without overlay
- ⛔ Do not change the logo colors outside approved palette
- ⛔ Do not rotate or tilt the logo
- ⛔ Do not add outlines or borders

---

## 2. Color Palette

### 2.1 Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dark Blue** | `#1B2B4B` | 27, 43, 75 | Headers, primary backgrounds, PDF header bars |
| **QED Blue** | `#2E4A7D` | 46, 74, 125 | Secondary backgrounds, hover states |
| **Green (Primary Accent)** | `#2EC4A0` | 46, 196, 160 | Primary buttons, links, highlights, success states |

### 2.2 Secondary/Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Ciel** | `#3B9FD8` | 59, 159, 216 | Info badges, links (alternative) |
| **Pastel Blue** | `#5BAED9` | 91, 174, 217 | Subtle highlights, chart accents |
| **Turquoise** | `#2AA89A` | 42, 168, 154 | Secondary accent, icons |
| **Red** | `#E85A5A` | 232, 90, 90 | Error states, destructive actions, "Declined" status |
| **Orange** | `#E8944A` | 232, 148, 74 | Warning states, "Awaiting" status |
| **Yellow** | `#E8C94A` | 232, 201, 74 | Caution, "Draft" status |

### 2.3 Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dark Grey** | `#4A5568` | 74, 85, 104 | Body text, secondary text |
| **White** | `#FFFFFF` | 255, 255, 255 | Page backgrounds, text on dark |
| **Cream** | `#F5F3E7` | 245, 243, 231 | Warm background alternative, PDF backgrounds |
| **Warm Light Grey** | `#E8E6E1` | 232, 230, 225 | Card backgrounds, borders |
| **Cold Light Grey** | `#E2E8F0` | 226, 232, 240 | Dividers, subtle backgrounds |
| **Background Grey** | `#F7FAFC` | 247, 250, 252 | Main app background |

### 2.4 Color Usage Guidelines

**When to use each:**

- **Dark Blue**: Navigation bar, PDF header bars, modal headers, primary dark backgrounds
- **Green**: All primary CTAs, success messages, active states, link hover states
- **Red**: Delete buttons, error messages, "Declined" status badge
- **Orange**: Warning notifications, "Awaiting Response" status
- **Yellow**: Draft status, caution messages
- **Ciel/Turquoise**: Informational elements, secondary accents, icons
- **Greys**: Text, borders, subtle backgrounds

---

## 3. Typography

### 3.1 Font Family

**Primary Font**: Inter

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

> **Note**: Inter is recommended based on the clean, modern aesthetic of the QED website. If a different font is preferred, suitable alternatives include: Poppins, Plus Jakarta Sans, or DM Sans.

**Fallback Stack**: System fonts for performance

### 3.2 Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| **H1** | 32px / 2rem | 700 (Bold) | 1.2 | -0.02em |
| **H2** | 24px / 1.5rem | 600 (Semibold) | 1.3 | -0.01em |
| **H3** | 20px / 1.25rem | 600 (Semibold) | 1.4 | 0 |
| **H4** | 16px / 1rem | 600 (Semibold) | 1.4 | 0 |
| **Body** | 16px / 1rem | 400 (Regular) | 1.6 | 0 |
| **Body Small** | 14px / 0.875rem | 400 (Regular) | 1.5 | 0 |
| **Caption** | 12px / 0.75rem | 400 (Regular) | 1.4 | 0.01em |
| **Label** | 14px / 0.875rem | 500 (Medium) | 1.4 | 0.02em |

### 3.3 Text Colors

| Context | Color | Hex |
|---------|-------|-----|
| Primary text (on light) | Dark Grey | `#1A202C` |
| Secondary text | Medium Grey | `#4A5568` |
| Muted text | Light Grey | `#718096` |
| Text on dark backgrounds | White | `#FFFFFF` |
| Links | Green | `#2EC4A0` |
| Link hover | Turquoise | `#2AA89A` |

### 3.4 CSS Variables

```css
:root {
  /* Font sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.25rem;    /* 20px */
  --font-size-xl: 1.5rem;     /* 24px */
  --font-size-2xl: 2rem;      /* 32px */
  
  /* Font weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

---

## 4. UI Components

### 4.1 Buttons

#### Primary Button
```css
.btn-primary {
  background-color: #2EC4A0;
  color: #FFFFFF;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 9999px; /* Fully rounded / pill shape */
  border: none;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #28B092;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(46, 196, 160, 0.3);
}

.btn-primary:active {
  background-color: #24A085;
  transform: translateY(0);
}

.btn-primary:disabled {
  background-color: #A0AEC0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: #1B2B4B;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 9999px;
  border: 2px solid #E2E8F0;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: #2EC4A0;
  color: #2EC4A0;
}

.btn-secondary:disabled {
  color: #A0AEC0;
  border-color: #E2E8F0;
  cursor: not-allowed;
}
```

#### Danger Button
```css
.btn-danger {
  background-color: #E85A5A;
  color: #FFFFFF;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 24px;
  border-radius: 9999px;
  border: none;
}

.btn-danger:hover {
  background-color: #D94848;
}
```

#### Button Sizes
| Size | Padding | Font Size | Min Width |
|------|---------|-----------|-----------|
| Small | 8px 16px | 12px | 80px |
| Medium (default) | 12px 24px | 14px | 100px |
| Large | 16px 32px | 16px | 140px |

### 4.2 Cards and Containers

#### Standard Card
```css
.card {
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #CBD5E0;
}
```

#### Venue Card (for grid display)
```css
.venue-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
  transition: all 0.2s ease;
}

.venue-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.venue-card-content {
  padding: 16px;
}
```

### 4.3 Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  background-color: #F7FAFC;
  color: #4A5568;
  font-weight: 600;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid #E2E8F0;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
  color: #1A202C;
}

.table tr:hover {
  background-color: #F7FAFC;
}

/* Alternating rows (optional) */
.table-striped tr:nth-child(even) {
  background-color: #FAFBFC;
}
```

### 4.4 Form Inputs

#### Text Input
```css
.input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background-color: #FFFFFF;
  color: #1A202C;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #2EC4A0;
  box-shadow: 0 0 0 3px rgba(46, 196, 160, 0.15);
}

.input::placeholder {
  color: #A0AEC0;
}

.input:disabled {
  background-color: #F7FAFC;
  color: #A0AEC0;
  cursor: not-allowed;
}

.input-error {
  border-color: #E85A5A;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(232, 90, 90, 0.15);
}
```

#### Label
```css
.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #4A5568;
  margin-bottom: 6px;
}

.label-required::after {
  content: " *";
  color: #E85A5A;
}
```

#### Select Dropdown
```css
.select {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background-color: #FFFFFF;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}
```

#### Textarea
```css
.textarea {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
}
```

### 4.5 Status Badges / Pills

Status badges use pill shapes consistent with button styling.

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
```

#### Outreach Status Colors

| Status | Background | Text | Hex Background |
|--------|------------|------|----------------|
| **Draft** | Light Yellow | Dark Yellow | `#FEF3C7` / `#B45309` |
| **Sent** | Light Blue | Dark Blue | `#DBEAFE` / `#1E40AF` |
| **Awaiting** | Light Orange | Dark Orange | `#FED7AA` / `#C2410C` |
| **Responded** | Light Green | Dark Green | `#D1FAE5` / `#047857` |
| **Declined** | Light Red | Dark Red | `#FEE2E2` / `#B91C1C` |
| **Included** | Solid Green | White | `#2EC4A0` / `#FFFFFF` |

```css
.badge-draft {
  background-color: #FEF3C7;
  color: #B45309;
}

.badge-sent {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.badge-awaiting {
  background-color: #FED7AA;
  color: #C2410C;
}

.badge-responded {
  background-color: #D1FAE5;
  color: #047857;
}

.badge-declined {
  background-color: #FEE2E2;
  color: #B91C1C;
}

.badge-included {
  background-color: #2EC4A0;
  color: #FFFFFF;
}
```

#### Project Status Badges

| Status | Style |
|--------|-------|
| **Active** | Green solid (`#2EC4A0`) |
| **Completed** | Dark Blue solid (`#1B2B4B`) |
| **Cancelled** | Grey solid (`#718096`) |

---

## 5. PDF-Specific Styling

### 5.1 Page Setup

| Property | Value |
|----------|-------|
| Page size | A4 (210mm × 297mm) |
| Orientation | Portrait |
| Margins | 20mm top, 20mm bottom, 25mm left, 25mm right |
| Background | White (`#FFFFFF`) |

### 5.2 Cover Page

```
┌────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                          [QED Logo]                         │
│                        (centered, white)                    │
│                                                             │
│                                                             │
│         ───────────────────────────────────────         │
│                                                             │
│              "Brief presentation of possible venues"        │
│                    (16pt, white, centered)                  │
│                                                             │
│         ───────────────────────────────────────         │
│                                                             │
│                        [Event Name]                         │
│                    (28pt, white, bold)                      │
│                                                             │
│                   [Event Date Range]                        │
│                    (18pt, white)                            │
│                                                             │
│                   [Attendee Count] attendees                │
│                    (14pt, white)                            │
│                                                             │
│                                                             │
│         ───────────────────────────────────────         │
│                                                             │
│              "All prices are excluding VAT"                 │
│                    (11pt, white, italic)                    │
│                                                             │
└────────────────────────────────────────────────┘
         Background: Dark Blue (#1B2B4B), full bleed
```

**Cover Page Specifications:**
- Background: Dark Blue (`#1B2B4B`), full page
- Logo: White, approximately 80px wide, centered
- All text: White (`#FFFFFF`)
- Decorative lines: White, 1px, 40% page width

### 5.3 Venue Header Bar

The distinctive oval/pill-shaped header appears at the top of each venue section.

```css
.pdf-venue-header {
  background-color: #1B2B4B;
  color: #FFFFFF;
  padding: 12px 32px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.pdf-venue-name {
  font-size: 18px;
  font-weight: 700;
}

.pdf-venue-dates {
  font-size: 14px;
  font-weight: 400;
  opacity: 0.9;
}
```

**Visual example:**
```
    ╭────────────────────────────────────────────╮
    │  VENUE NAME                    23/06 to 26/06        │
    ╰────────────────────────────────────────────╯
```

### 5.4 Photo Frame Styling

```css
.pdf-photo {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

**Photo Grid Layout:**
- 2-4 photos per venue
- Primary photo: Larger, spanning 2/3 width
- Secondary photos: Grid of 2-3 smaller images
- Gap between photos: 12px
- Border radius: 8px

```
┌────────────────────────┬────────────┐
│                          │   Photo 2  │
│      Primary Photo       ├────────────┤
│                          │   Photo 3  │
└────────────────────────┴────────────┘
```

### 5.5 Location Line

```css
.pdf-location {
  font-size: 13px;
  color: #4A5568;
  margin: 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pdf-location::before {
  content: "📍"; /* or use an icon font */
}
```

### 5.6 Pros/Cons Box

```css
.pdf-pros-cons {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding: 16px;
  background-color: #F7FAFC;
  border-radius: 8px;
  border-left: 4px solid #2EC4A0;
}

.pdf-pros-title,
.pdf-cons-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.pdf-pros-title {
  color: #047857;
}

.pdf-cons-title {
  color: #B91C1C;
}

.pdf-pros-content,
.pdf-cons-content {
  font-size: 13px;
  color: #4A5568;
  line-height: 1.5;
}
```

**Visual layout:**
```
┌────────────────────────────────────────────────────────┐
│ █                                                          │
│ █  PROS                         CONS                       │
│ █  • Central location           • Limited parking          │
│ █  • Modern AV equipment        • Catering must be         │
│ █  • Flexible room setup          external                 │
│ █                                                          │
└────────────────────────────────────────────────────────┘
    ↑ Green accent bar (#2EC4A0)
```

### 5.7 Pricing Table Styling

```css
.pdf-pricing-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 13px;
}

.pdf-pricing-table th {
  background-color: #1B2B4B;
  color: #FFFFFF;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
}

.pdf-pricing-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #E2E8F0;
}

.pdf-pricing-table tr:nth-child(even) {
  background-color: #F7FAFC;
}

.pdf-pricing-total {
  background-color: #2EC4A0;
  color: #FFFFFF;
  font-weight: 700;
}
```

### 5.8 PDF Typography

| Element | Font Size | Weight | Color |
|---------|-----------|--------|-------|
| Venue name (header) | 18pt | Bold | White |
| Section heading | 14pt | Semibold | Dark Blue |
| Body text | 11pt | Regular | Dark Grey |
| Caption/small | 9pt | Regular | Medium Grey |
| Price numbers | 12pt | Semibold | Dark Grey |
| Total price | 14pt | Bold | White (on green) |

### 5.9 Page Footer

```css
.pdf-footer {
  position: fixed;
  bottom: 15mm;
  left: 25mm;
  right: 25mm;
  font-size: 9px;
  color: #718096;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #E2E8F0;
  padding-top: 8px;
}
```

Content: `QED Event Management | [Event Name] | Page X of Y`

---

## 6. Spacing & Layout

### 6.1 Spacing Scale

Using an 8px base unit system:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icon gaps |
| `--space-2` | 8px | Small gaps, inline elements |
| `--space-3` | 12px | Default element spacing |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Medium gaps |
| `--space-6` | 24px | Card padding, section gaps |
| `--space-8` | 32px | Large section spacing |
| `--space-10` | 40px | Major section dividers |
| `--space-12` | 48px | Page section margins |
| `--space-16` | 64px | Hero/header spacing |

### 6.2 Grid System

**Container widths:**
| Breakpoint | Container Max-Width |
|------------|---------------------|
| Mobile (<640px) | 100% (16px padding) |
| Tablet (640px-1024px) | 640px |
| Desktop (1024px-1280px) | 1024px |
| Large (>1280px) | 1200px |

**Column grid:**
- 12-column grid
- Gutter: 24px
- Margin: 24px (desktop), 16px (mobile)

### 6.3 Card Padding

| Card Type | Padding |
|-----------|---------|
| Standard card | 24px |
| Compact card | 16px |
| Modal | 32px |
| Table cell | 12px 16px |

### 6.4 Section Margins

| Context | Top Margin | Bottom Margin |
|---------|------------|---------------|
| Page section | 48px | 48px |
| Card group | 24px | 24px |
| Form group | 24px | 0 |
| Between form fields | 16px | 0 |

---

## 7. Iconography

### 7.1 Icon Style

**Recommended**: Lucide Icons (consistent with React ecosystem)

- **Style**: Outline (stroke-based)
- **Stroke width**: 1.5px - 2px
- **Corner style**: Rounded

> Alternative libraries: Heroicons (outline), Phosphor Icons

### 7.2 Icon Sizes

| Size Name | Dimensions | Usage |
|-----------|------------|-------|
| xs | 12px × 12px | Inline with small text, badges |
| sm | 16px × 16px | Buttons, form inputs |
| md | 20px × 20px | Navigation, list items |
| lg | 24px × 24px | Headers, cards |
| xl | 32px × 32px | Empty states, hero sections |
| 2xl | 48px × 48px | Illustrations, onboarding |

### 7.3 Icon Colors

| Context | Color |
|---------|-------|
| Default | `#4A5568` (Dark Grey) |
| On dark background | `#FFFFFF` |
| Interactive (links) | `#2EC4A0` (Green) |
| Success | `#047857` |
| Warning | `#C2410C` |
| Error | `#B91C1C` |
| Muted | `#A0AEC0` |

### 7.4 Common Icons

| Action | Icon Name |
|--------|-----------|
| Add/Create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Search | `Search` |
| Filter | `Filter` |
| Download | `Download` |
| Upload | `Upload` |
| Email | `Mail` |
| Phone | `Phone` |
| Location | `MapPin` |
| Calendar | `Calendar` |
| Users/Attendees | `Users` |
| Building/Venue | `Building` |
| Check/Success | `Check` |
| Close | `X` |
| Menu | `Menu` |
| Settings | `Settings` |
| Arrow right | `ChevronRight` |
| External link | `ExternalLink` |

---

## 8. Shadows & Elevation

### 8.1 Shadow Scale

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

### 8.2 Elevation Usage

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 | None | Flat elements, backgrounds |
| 1 | `--shadow-sm` | Cards at rest, inputs |
| 2 | `--shadow-md` | Cards on hover, dropdowns |
| 3 | `--shadow-lg` | Modals, popovers |
| 4 | `--shadow-xl` | Full-screen overlays |

---

## 9. Border Radius

```css
:root {
  --radius-sm: 4px;    /* Small elements, badges */
  --radius-md: 8px;    /* Cards, inputs, photos */
  --radius-lg: 12px;   /* Large cards, modals */
  --radius-xl: 16px;   /* Hero sections */
  --radius-full: 9999px; /* Pills, buttons, avatars */
}
```

---

## 10. Transitions & Animation

### 10.1 Standard Transitions

```css
:root {
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### 10.2 Usage Guidelines

| Element | Transition | Duration |
|---------|------------|----------|
| Button hover | background-color, transform | 200ms |
| Card hover | box-shadow, border-color | 200ms |
| Input focus | border-color, box-shadow | 150ms |
| Modal appear | opacity, transform | 300ms |
| Dropdown open | opacity, transform | 200ms |

---

## 11. Responsive Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

---

## 12. Tailwind CSS Configuration

If using Tailwind CSS, extend the configuration with these brand values:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'qed': {
          'dark-blue': '#1B2B4B',
          'blue': '#2E4A7D',
          'green': '#2EC4A0',
          'green-hover': '#28B092',
          'ciel': '#3B9FD8',
          'turquoise': '#2AA89A',
        },
        'status': {
          'draft': { bg: '#FEF3C7', text: '#B45309' },
          'sent': { bg: '#DBEAFE', text: '#1E40AF' },
          'awaiting': { bg: '#FED7AA', text: '#C2410C' },
          'responded': { bg: '#D1FAE5', text: '#047857' },
          'declined': { bg: '#FEE2E2', text: '#B91C1C' },
        },
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
      },
    },
  },
}
```

---

## 13. Assumptions & Notes

The following assumptions were made based on the visual references provided:

1. **Font**: Inter is recommended as it matches the clean, modern aesthetic of the QED website. The actual font used on qed.eu may be different—verify with the brand team.

2. **Green accent color**: The primary green (`#2EC4A0`) was approximated from the screenshots. The exact hex should be confirmed from official brand assets.

3. **Dark blue**: The dark blue (`#1B2B4B`) was approximated from the color palette screenshot labeled "dark blue."

4. **PDF styling**: Based on standard professional proposal formats. Adjust based on existing QED proposal templates if available.

5. **Icon library**: Lucide Icons recommended for consistency with React/TypeScript stack. Substitute if QED has existing icon preferences.

6. **Accessibility**: All color combinations should be verified for WCAG 2.1 AA compliance (4.5:1 contrast ratio for text).

---

## 14. Quick Reference

### Color Palette at a Glance

```
PRIMARY
█████ Dark Blue    #1B2B4B
█████ QED Blue     #2E4A7D
█████ Green        #2EC4A0

ACCENTS
█████ Ciel         #3B9FD8
█████ Turquoise    #2AA89A
█████ Red          #E85A5A
█████ Orange       #E8944A
█████ Yellow       #E8C94A

NEUTRALS
█████ Dark Grey    #4A5568
█████ Light Grey   #E2E8F0
█████ Background   #F7FAFC
█████ White        #FFFFFF
```

### Status Colors Summary

| Status | Badge Style |
|--------|-------------|
| Draft | 🟡 Yellow outline |
| Sent | 🔵 Blue outline |
| Awaiting | 🟠 Orange outline |
| Responded | 🟢 Green outline |
| Declined | 🔴 Red outline |
| Included | ✅ Green solid |

---

*Last updated: January 2025*
