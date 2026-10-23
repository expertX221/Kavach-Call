# Design QA — Kavach Call

final result: passed

## Evidence and comparison target

Selected visual truth: `docs/evidence/selected-reference.png` (the third displayed generated design, Clearline).

Rendered implementation: Vercel preview `https://kavach-call-git-codex-kavach-prototype-create-projects1.vercel.app/` using the existing authenticated Chrome profile. The preview is protected by Vercel login. The in-app browser was unauthenticated; protection was retained.

Desktop capture: `docs/evidence/kavach-call-preview.png`, 1487 × 1058 pixels, CSS viewport 1487 × 1058, capture density 1. Source is also 1487 × 1058; no scaling or browser/device chrome is included. Initial full-page capture was 1472 × 1184 due to overflow and was superseded after fixes.

State: default Demo session, family question selected, Verify stage, elevated risk from the preloaded simulated family conversation. Full-view side-by-side: `docs/evidence/design-comparison.png`. Focused radio-card/type/spacing comparison: `docs/evidence/design-focus.png`.

Mobile capture: `docs/evidence/kavach-call-mobile.png`, 390 × 844 pixels, CSS viewport 390 × 844, density 1. Desktop design was adapted to one column and bottom navigation because the source has no mobile reference. DOM document width equals viewport width: 390px. Content continues vertically with scroll. High-risk dialog at the same viewport: `docs/evidence/kavach-call-mobile-alert.png`.

## Findings and iteration history

1. **P2 — Excess vertical density on first render.** An extra urgency evidence row and a global footer stretched the screen past the selected design. Combined urgency and payment into the same summary, retained full signals in Call guard, tightened card padding and step spacing, and removed the extra footer from the verification screen. Recaptured at the source dimensions.
2. **P2 — Desktop card-control inset and context typography.** Increased radio target size and card column gaps, aligned the context panel's right edge, and increased context evidence type. Recaptured and compared full-view plus focused regions. No remaining actionable P0/P1/P2 findings.
3. **P3 — Small icon/style differences.** Library chat and bank icons differ slightly from the generated mock. Native radio rendering and Inter font rasterization also differ. The structure, blue/white/charcoal direction, hierarchy, selected state and content remain aligned. No imitation raster UI or handcrafted icons were used.

## Required fidelity surfaces

- **Fonts/typography:** bundled Inter Variable; strong title and section hierarchy, readable body text, appropriate wrapping and no clipped primary labels. A small difference in generated-mock font shape is accepted as P3.
- **Spacing/layout:** charcoal rail, header, left verification stack and right context surface follow the target. Primary action and privacy note fit the desktop viewport. Responsive layout has no horizontal overflow at 390px.
- **Colors/tokens:** white canvas, charcoal navigation, cobalt primary controls, pale-blue selection and muted amber warnings. Text contrast remains readable.
- **Images/assets:** the source contains standard UI iconography, not photography. Phosphor library icons and a shield icon provide crisp assets; no custom SVG/CSS artwork substitutes were used. Fonts are bundled for network-independent rendering.
- **Copy/content:** main task and method labels follow the selected design. A plausible-looking phone number was replaced with an explicitly unverified demo caller, and disclaimers accurately describe unconnected capabilities. All practice data is labeled.

## Interaction and console checks

Browser verified: method selection; confirmation disabled without an independent check and explicit permission; one-transcript dismissal; renewed high-risk alert after new speech; review-required excerpt export; nine-scenario navigation; timed digital-arrest scenario; high-risk modal; JSON download and report-history UI.

Downloaded file verified separately: `kavach-practice-5e5399bf.json`, valid JSON, practice=true, score=100, excerpt absent by default, not-submitted disclaimer present. A first download wait timed out in browser tooling; the click had succeeded, and the downloaded file was independently located and checked. No application failure was found.

Browser console: no error/warning entries during the final check. No microphone permission was granted during automated testing; actual audio recognition, language-pack availability and spoken warnings need a consenting hardware test. Offline shell installation is implemented but a browser network-disconnection test was not performed.

## Implementation checklist

- [x] Resolve and inspect selected visual
- [x] Capture desktop implementation at matching dimensions
- [x] Compare combined full and focused views
- [x] Fix substantive drift and recapture
- [x] Verify primary browser flows
- [x] Check mobile width and dialog
- [x] Check console errors
- [x] Keep prototype labeled and scope limits visible

Screenshots are included in the downloadable project package. The source repository contains this report; large evidence PNGs are distributed in the ZIP rather than deployed with the app.


## Protection tools upgrade — 23 October 2026
Preserved the selected Clearline direction: white canvas, charcoal navigation, cobalt action color and spacious panels. Default verification screen remains consistent with the selected reference. New links, family readiness and weekly digest screens reuse existing typography and components.

Browser evidence: deployed Chrome UI confirmed misleading URL actual-host display, reviewed Neon feed connection and honest zero-count Chennai digest, separate personal/practice counts, four explainers, and callback checklist changing the score from 0 to 25. The temporary test setting was restored. Desktop digest and family screenshots saved; 390px link-check screenshot confirms stacked cards and accessible two-row navigation with all eight destinations. DOM scroll width 375 <= viewport 390, no horizontal overflow. Report/registry data is excluded from offline cache.

QR decoder passes a generated-image check outside the browser. Chrome extension file-access configuration blocked automated image upload; no browser permission was changed. Camera hardware and image chooser completion need manual testing. No fabricated accuracy claim or campaign count was added.

Evidence: outputs/kavach-weekly-digest.png, outputs/kavach-protection-score.png and outputs/kavach-links-mobile.png (also packaged in docs/evidence in the ZIP).


## Production follow-up
PR #1 is merged into main. Production app https://kavach-call.vercel.app/ is public and renders the selected UI. Neon production schema is prepared; its empty reviewed digest connected successfully. In-app-browser image chooser completed the generated payment QR upload end to end, showing demo@upi and INR 125. Evidence: docs/evidence/kavach-qr-production.png. This supersedes the earlier browser-upload limitation. Live camera remains dependent on device/browser permission; lifecycle denial, stalled-start timeout and late-stream cleanup are covered by automated tests.


## Final physical camera verification
After the user explicitly allowed camera access and positioned the known demo QR, production Chrome received 640x480 live frames, decoded `upi://pay?pa=demo@upi&pn=Practice%20Only&am=125&cu=INR`, displayed demo@upi / Practice Only / INR 125, and automatically stopped the camera. No payment was initiated. This supersedes the earlier pending physical-camera limitation. Screenshot after automatic shutdown: docs/evidence/kavach-camera-verified.png. The supplied arbitrary first QR was not decoded; the known valid test image succeeded.
