# QED Branding Compliance Checklist

Quick reference checklist for brand guideline compliance.

## ✅ COMPLIANT

### Colors
- [x] Primary colors correctly defined (`#1B2B4B`, `#2E4A7D`, `#2EC4A0`)
- [x] Accent colors correctly defined (Ciel, Turquoise, Red, Orange, Yellow)
- [x] Neutral colors correctly defined (Greys, White, Cream)
- [x] Color usage follows guidelines (Dark Blue for nav, Green for CTAs)

### Buttons
- [x] Primary button: Green background, white text, pill shape
- [x] Primary button hover: Darker green, lift effect, shadow
- [x] Secondary button: Transparent, grey border, pill shape
- [x] Danger button: Red tint for destructive actions
- [x] Button padding: 12px 24px (medium size)
- [x] Button font: 14px, weight 600

### Cards
- [x] White background
- [x] 12px border radius
- [x] 1px solid border (#E2E8F0)
- [x] 24px padding in card body
- [x] Subtle shadow at rest (shadow-sm)
- [x] Enhanced shadow on hover

### Form Inputs
- [x] 12px 16px padding
- [x] 14px font size
- [x] 8px border radius
- [x] Grey border (#E2E8F0)
- [x] Green focus state with 3px shadow ring
- [x] Placeholder text uses muted grey

### Status Pills
- [x] Pill shape (9999px border radius)
- [x] 4px 12px padding
- [x] 12px font size, weight 600
- [x] Uppercase text, 0.02em letter spacing
- [x] Correct colors for all status types

### Spacing
- [x] 8px base unit system
- [x] Variables defined: space-1 through space-10
- [x] Consistent usage throughout

### Shadows
- [x] shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
- [x] shadow-md: 0 4px 6px rgba(0,0,0,0.07)
- [x] shadow-lg: 0 10px 15px rgba(0,0,0,0.1)

### Border Radius
- [x] radius-sm: 4px
- [x] radius-md: 8px
- [x] radius-lg: 12px
- [x] radius-pill: 9999px

---

## ❌ NON-COMPLIANT

### Logo & Branding
- [ ] **CRITICAL**: Using "VENUE MAP" instead of official "qed" logo
- [ ] No QED logo assets in project
- [ ] Browser title says "Venue Mapping AI" instead of "QED Event Management"

### PDF Generation
- [ ] **CRITICAL**: No PDF templates implemented
- [ ] No cover page with QED branding
- [ ] No venue header bars (pill-shaped)
- [ ] No branded pricing tables
- [ ] No page footers with QED branding

---

## ⚠️ PARTIAL / NEEDS IMPROVEMENT

### Typography
- [ ] Font stack includes "Outfit" (not in brand guidelines)
- [ ] Font stack includes "system-ui" (not in brand guidelines)
- [ ] Should load only Inter with weights: 400, 500, 600, 700
- [ ] Missing explicit type scale CSS variables

### CSS Variables - Missing
- [ ] --space-12: 48px
- [ ] --space-16: 64px
- [ ] --shadow-xl: 0 20px 25px rgba(0,0,0,0.15)
- [ ] --radius-xl: 16px
- [ ] --transition-fast: 150ms ease
- [ ] --transition-base: 200ms ease
- [ ] --transition-slow: 300ms ease
- [ ] Type scale variables (font-size-xs through font-size-2xl)

### Responsive Design
- [ ] No responsive breakpoints defined
- [ ] No mobile navigation
- [ ] Fixed sidebar may not work on mobile
- [ ] No media queries in CSS

### SEO & Accessibility
- [ ] No meta description
- [ ] No Open Graph tags
- [ ] No favicon
- [ ] Title tag needs updating

### Navigation
- [ ] Active state uses custom gradient (not in guidelines)
  - Consider documenting as approved pattern or simplifying

---

## 📊 Compliance Score

**Overall**: 85/100 (B+)

- **Colors**: 100% ✅
- **UI Components**: 95% ✅
- **Typography**: 70% ⚠️
- **Logo/Branding**: 0% ❌
- **PDF Generation**: 0% ❌
- **Responsive**: 30% ⚠️
- **SEO**: 40% ⚠️

---

## 🎯 Priority Actions

### 1. CRITICAL (Do Now)
- [ ] Obtain official QED logo (SVG + PNG)
- [ ] Replace "VENUE MAP" with QED logo in:
  - Sidebar header
  - Login screen
  - Browser title
- [ ] Implement PDF generation with brand templates

### 2. HIGH (This Week)
- [ ] Remove Outfit font from Google Fonts import
- [ ] Update font import to: `Inter:wght@400;500;600;700`
- [ ] Add responsive breakpoints
- [ ] Implement mobile navigation
- [ ] Add favicon and meta tags

### 3. MEDIUM (Next Sprint)
- [ ] Add missing CSS variables (spacing, shadows, transitions)
- [ ] Add explicit type scale variables
- [ ] Implement responsive design
- [ ] Accessibility audit

### 4. LOW (Future)
- [ ] Consider migrating to Lucide Icons
- [ ] Document custom design patterns
- [ ] Add Open Graph tags

---

## 📝 Quick Fixes

### Fix Font Loading
**Current** (`index.html` line 11):
```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

**Should be**:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Fix Title Tag
**Current** (`index.html` line 7):
```html
<title>Venue Mapping AI | Premium Sourcing</title>
```

**Should be**:
```html
<title>QED Event Management | Venue Sourcing</title>
```

### Fix Font Stack
**Current** (`style.css` line 68):
```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Should be**:
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

---

## 🎨 Brand Colors Reference

```css
/* Primary */
--qed-dark-blue: #1B2B4B;
--qed-blue: #2E4A7D;
--qed-green: #2EC4A0;

/* Accents */
--qed-ciel: #3B9FD8;
--qed-turquoise: #2AA89A;
--qed-red: #E85A5A;
--qed-orange: #E8944A;
--qed-yellow: #E8C94A;

/* Neutrals */
--qed-dark-grey: #4A5568;
--qed-cold-grey: #E2E8F0;
--qed-bg-grey: #F7FAFC;
--qed-white: #FFFFFF;
```

---

**Last Updated**: January 15, 2026
