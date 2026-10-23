# Kavach Call

**Armor for every call.** A hackathon prototype that helps families notice suspicious conversation patterns, pause, verify a caller and prepare a report draft.

## Run in VS Code

Requires Node.js 22.12+ (Node 24 recommended) and npm.

1. Open `kavach-call.code-workspace` or this project folder in VS Code.
2. Run `npm ci`.
3. Run `npm run dev` and open the URL printed by Vite.
4. `npm test` runs rule and interaction tests. `npm run build` creates the deployable app in `dist/client`.

VS Code tasks are included: **Kavach: start**, **Kavach: test**, **Kavach: build**. The optional Edge launch configuration targets Vite's default port 5173; start the server first.

## The demo

Start with the selected white/charcoal/blue verification screen. A simulated family-emergency conversation is preloaded and clearly labeled.

- **Verify caller:** choose a family question, call back on a saved number, or verify an organization independently. Explicit acknowledgment is required to dismiss a warning. The dismissal applies only to the current transcript, never permanently to a caller.
- **Call guard:** type or paste text and watch an explained heuristic score update immediately. A single category cannot create a high-risk verdict. Noisy, mixed-speaker or low-confidence text produces an analysis-limited state.
- **Microphone:** opt into on-device recognition where supported, or separately consent to browser-provider recognition. Provider recognition may transmit audio. There is no silent cloud fallback. Permission denial and unavailable language packs fall back to text entry.
- **Family circle:** save up to five contacts and private questions in your browser. Answers are never collected. Check-in messages are drafts you copy and send yourself.
- **Practice studio:** nine scripted scenarios cover family impersonation, authority threats, KYC/OTP theft, jokes, scam discussion, delivery codes, Hinglish, Tamil and investment offers.
- **Reports:** download a JSON draft. Transcript excerpts are opt-in, redacted and require manual review. Only metadata enters optional local history. Nothing is submitted to authorities or a public reputation database.
- **Accessibility:** keyboard operation, native dialog focus management, responsive layout, large-text mode, visual alerts and optional device speech warnings.
- **Offline:** the production build caches the static app shell after its first successful online load. Text rules and practice work without a network after cache installation. Browser-provider speech needs connectivity. Dev-server mode does not install the cache.

## Important scope boundaries

The detection engine is transparent, hand-written demonstration rules. Its score is **not a calibrated probability** or measured accuracy. Hindi and Tamil are illustrative pattern coverage, not complete multilingual support. Context and negation handling remain limited.

This web prototype does not intercept phone calls, end calls, detect cloned voices, measure noise, identify speakers, perform reputation lookups, send automatic family alerts, or file official reports. Those are production integrations and evaluation work. The interface labels these limitations.

Do not enter real passwords, PINs, OTPs, or banking details. Automatic redaction is incomplete: users must remove names, addresses and other identifiers before exporting. Local browser storage is not encrypted or synchronized and is accessible to people using that browser profile.

## Deployment

The existing Vercel project should import this repository with its root set to the repository root. `vercel.json` selects Vite, runs `npm run build`, and publishes `dist/client`. Git-connected branches produce preview deployments when enabled in the project's settings.

No API key, database or account login is needed for this demo. The connected Neon project is intentionally unused: conversations and contacts should not be uploaded merely to demonstrate a database. A production service could store consented, authenticated report metadata separately; see `docs/architecture.md`.

## Project map

- `src/App.jsx`: application state and feature screens.
- `src/components.jsx`: accessible controls and dialogs.
- `src/lib/risk.mjs`: explainable scoring, report preparation and redaction.
- `src/lib/scenarios.js`: clearly labeled practice scripts.
- `src/lib/useSpeech.js`: consent-driven browser recognition lifecycle.
- `src/lib/storage.js`: browser storage and JSON downloads.
- `src/styles.css`: responsive selected design.
- `tests/`: rule, interaction and hosting checks.
- `docs/`: exception coverage, architecture and a three-minute judge demo.

## Official resources

For financial cyber fraud in India: contact your bank and the official channels, [1930 and the National Cybercrime Reporting Portal](https://cybercrime.gov.in/). The government describes the helpline in [this MHA reference](https://www.mha.gov.in/MHA1/Par2017/pdfs/par2023-pdfs/LS-12122023/131.pdf). Kavach does not submit a complaint for you.

Browser speech limitations and on-device capability are documented in [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). Hosting setup follows [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite).

Prototype for RevHack 2026. Brand and domain availability have not been cleared. No real traction, detection accuracy, paid customers, or partnerships are claimed.
