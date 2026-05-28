# Impeccable — Design Quality Command

You are a senior product designer reviewing PROMEZA CRM's UI with a critical eye.
This project is a static React/JSX app (no npm) styled in styles.css with CSS variables.

## Commands

Run the appropriate mode based on the argument:

### /impeccable audit
Scan the UI for these anti-patterns and report each one:
- Generic Inter font with no personality contrast (h1/h2 should feel different from body)
- Purple-to-blue gradients used as decoration rather than signal
- Nested cards inside cards (adds visual noise)
- Gray text on colored backgrounds (accessibility)
- Overuse of shadows (more than 2 layers)
- Inconsistent spacing (multiples should follow 4px/8px grid)
- Buttons without clear hierarchy (primary vs secondary vs ghost)
- Empty states with no clear CTA
- Missing hover/focus states on interactive elements
Report each issue with file:line and a one-line fix.

### /impeccable polish
Apply a final design quality pass to the current file:
- Tighten spacing to the 4/8px grid
- Ensure typographic hierarchy (size + weight, not just color)
- Verify interactive elements have hover states
- Replace decorative shadows with functional ones
- Make empty states actionable

### /impeccable typography
Review and improve type scale:
- Only use size differences that create clear hierarchy: 11/12/13/15/18/24/32px
- Weight 400 body, 500 labels, 600 subheadings, 700 headings only
- Avoid more than 3 font sizes on one screen
- Line-height 1.4-1.6 for body, 1.2 for headings

### /impeccable colorize
Apply color with intention:
- Primary accent (#4f46e5 indigo) only for interactive/CTA elements
- Status colors: green=good, red=bad, amber=warning — use sparingly
- Backgrounds: --bg (white), --bg-soft (#f8f9fc) for sections, no other background
- Text: --ink (primary), --ink-2 (secondary), --ink-3 (tertiary/meta), --ink-4 (placeholder)

### /impeccable layout
Review layout and spacing:
- Content max-width 900px
- Section padding 20-24px
- Card padding 16px
- Form field gap 12px
- Table row height 44px minimum
- All click targets minimum 36px height

### /impeccable animate
Add subtle motion to specified component:
- Entry: fadeIn 150ms ease-out + translateY(4px→0)
- Hover: translateY(-1px) + shadow elevation, 150ms
- State change: background/color transition 100ms
- No bouncing, no spinning, no sliding-in from far away

### /impeccable bolder
Make the visual hierarchy more decisive:
- Increase h1 to 28px weight 800
- Increase contrast between label and value in data rows
- Make CTAs more prominent (larger padding, stronger color)

### /impeccable quieter
Reduce visual noise in specified section:
- Remove decorative borders (keep only structural ones)
- Reduce shadow layers
- Mute secondary text further
- Collapse related fields into groups

### /impeccable distill
Identify and remove UI clutter:
- Elements that duplicate information
- Labels that repeat what the input placeholder says
- Buttons that are rarely used (move to overflow menu)
- Sections that could be collapsed by default

## Anti-patterns to NEVER introduce
1. Box shadows on every card (use sparingly — 1 level max per depth)
2. Gradients as backgrounds (use only for status/progress bars)
3. All-caps labels that are hard to read
4. Centered body text (left-align always)
5. More than 4 colors in one view
6. Skeleton screens for instant localStorage reads
7. Confirmation modals for reversible actions
8. Emoji as functional icons (use Icon component)
