---
name: Vigilant Clarity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered to project unwavering authority, digital hygiene, and empathetic protection. It serves a broad demographic spectrum—ranging from tech-savvy operators to elderly users navigating malicious phishing attempts, SMS scams, and identity theft vectors.

### Visual Aesthetic & Philosophy
The aesthetic blends **Modern Corporate Security** with **Approachable Humanism**:
- **Clarity over cleverness:** Zero ambiguity in threat states, navigational cues, or system statuses.
- **Calm authority:** Minimizes panicky, alarmist visual noise while ensuring critical threats demand immediate, clear intervention.
- **Tactile reassurance:** Generous touch targets, high legibility, and structured layouts create a protected digital harbor.

## Colors

The palette leverages contrast-driven safety semantics against an authoritative deep navy and cool architectural canvas.

### Palette Architecture
- **Primary Navy (`#0F172A`, `#1E293B`):** Establishes structural anchor points, active navigation, key buttons, and high-priority typographical hierarchies.
- **Verified Emerald (`#10B981`, `#059669`):** Represents verified domains, active protections, and hardened security metrics.
- **Cautionary Amber (`#F59E0B`, `#D97706`):** Marks unverified entities, low-confidence certificates, and heuristic warnings requiring user confirmation.
- **Suspicious Crimson (`#EF4444`, `#DC2626`):** Deployed strictly for confirmed threat vectors, high-risk malware alerts, and destructive actions.
- **Surfaces & Grounds (`#FFFFFF`, `#F8FAFC`, `#F1F5F9`):** Creates layered airiness, supporting contrast ratios exceeding WCAG AAA compliance for elderly accessibility.

## Typography

The typography combines the structural authority of **Plus Jakarta Sans** for headers with the high-legibility x-height and open counters of **Inter** for sustained reading and micro-copy.

### Rules of Application
- Headings maintain geometric weight to anchor threat assessments without aggressive styling.
- Body text defaults to a base of 16px (`body-md`), with 18px (`body-lg`) preferred for scam explanation summaries to ensure effortless reading for older demographics.
- All functional labels and badge texts utilize medium-to-semibold weights with neutral optical tracking to avoid confusion between similar characters (e.g., `0` vs `O`, `l` vs `1`).

## Layout & Spacing

The layout adopts a **Fluid 12-Column Grid** on desktop, shifting down to **6 columns** on tablet and **4 columns** on mobile devices.

### Form-Factor Layout Principles
- **Desktop (1024px+):** Max width capped at `1280px` for optimal scanning speed during threat analysis. Left-aligned utility bars and prominent centered threat-meter dashboards.
- **Tablet (768px – 1023px):** Secondary metadata stacks into collapsible trays; card paddings step down to `space-lg`.
- **Mobile (<768px):** Primary security actions anchor persistently to the bottom viewport. Margins contract to `1rem` to maximize spatial real estate for readable advisory alerts.

## Elevation & Depth

This system avoids harsh drop-shadows and skeletal borders. Instead, depth is conveyed through **subtle chromatic ambient shadows** combined with **fine hair-line structural borders**.

### Layering Architecture
- **Level 0 (Canvas):** Cool off-white background (`#F8FAFC`).
- **Level 1 (Cards & Modules):** Pure white fill (`#FFFFFF`), paired with a 1px solid border (`#E2E8F0`) and a diffused ambient shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Popovers & Threat Modals):** Elevated surface with a 1px border (`#CBD5E1`) and a dual-tier shadow: `0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)`.
- **Level 3 (Urgent Interventions / Threat Takeovers):** Darkened background overlay (`#0F172A` at 60% opacity) coupled with high-contrast, bordered surface containers.

## Shapes

The design system uses generous, protective geometry. The core corner radius is balanced at 0.5rem (8px), scaling to `1rem` for medium elements and `1rem`–`1.5rem` (`rounded-2xl`) for prominent dashboard security cards and threat status blocks. This geometry softens clinical software conventions, creating a safe, human-centric posture.

## Components

### Buttons
- **Primary Action (Navy):** Solid `#0F172A`, text `#FFFFFF`, minimum height `48px` (desktop) / `52px` (mobile). Hover: `#1E293B`.
- **Safe State Action (Emerald):** Background `#10B981`, text `#FFFFFF`. Used for actions like "Confirm Safe" or "Resolve Protection".
- **Danger Action (Crimson):** Solid `#DC2626`, text `#FFFFFF`. Used for blocking malicious senders, purging data, or terminating compromised sessions.
- **Secondary / Ghost:** Transparent surface with 1.5px border `#E2E8F0`, text `#0F172A`, hover `#F1F5F9`.

### Chips & Badges
- **Safe:** `#ECFDF5` background, `#047857` label, 1px border `#A7F3D0`, leading shield icon.
- **Caution:** `#FFFBEB` background, `#B45309` label, 1px border `#FDE68A`, leading warning icon.
- **Threat Detected:** `#FEF2F2` background, `#B91C1C` label, 1px border `#FECACA`, leading alert icon.

### Cards & Status Containers
- **Main Container:** Pure white (`#FFFFFF`), border `1px solid #E2E8F0`, corner radius `1.5rem` (`rounded-2xl`), padding `space-xl`.
- **Threat Verdict Card:** Colored vertical left accent bar (4px thick in `#10B981`, `#F59E0B`, or `#EF4444`) to provide instant, peripheral status recognition.

### Input Fields & URL Scanners
- **Height & Spacing:** Minimum `48px` height with `space-md` internal padding.
- **State Borders:** Default `1.5px solid #CBD5E1`, focusing to `2px solid #0F172A`.
- **Malicious URL Detection State:** Instant transition to `2px solid #EF4444` accompanied by an inline, persistent warning label beneath the field.

### Selection Controls (Checkboxes & Radios)
- Minimum dimension `22px x 22px` with a distinct check/dot indicator to assist reduced fine-motor coordination and visual fatigue. Active selection tint: `#0F172A`.

### Contextual Security Components
- **Phishing URL Inspector:** Monospace breakdown of query strings, highlighting top-level deceptive domains using crimson inline chips.
- **Safety Gauge:** Radial progress track measuring device risk posture (1–100) using semantic state color transitions.