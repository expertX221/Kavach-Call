# Verification record

## User story

An Indian family member reviews suspicious text, sees explained signals, independently checks the caller, explicitly dismisses only that transcript if verified, and downloads a reviewed practice report.

## Confirmed

- Production build: Vite success, 133 modules transformed, static client and offline worker generated.
- Rule tests: 27 passed, including family jokes, authority-only false positives, delivery codes, English/Hindi/Tamil examples, low-confidence/noise/mixed-speaker handling, redaction and contradictory advice.
- DOM interaction tests: 14 passed, including the verification gate, failure case, re-alerting, microphone consent, local history and contact-question privacy.
- Hosting tests: 4 passed.
- Vercel Git integration: Preview deployment Ready for the prototype branch. GitHub Vercel status succeeded.
- Live Chrome browser: default screen renders; verification and re-alert flows work; timed practice generates a high-risk alert; a JSON report was downloaded and parsed; mobile width is 390/390px; final console has no errors or warnings.
- Intelligence extension: 16 additional tests passed for URL/UPI heuristics, readiness scoring, IST weekly boundaries, report filtering and private-address registry rejection.
- Neon preview branch `preview/codex/kavach-prototype` received additive campaign/reputation tables. The deployed digest reads the database successfully and shows zero reviewed Chennai campaigns, with practice counts separate.
- Live misleading-URL test displays actual hostname `evil.test`, flags userinfo deception and reports no database match without claiming safety.
- Production QR image upload passed in the in-app browser: decoded demo@upi, displayed name Practice Only and INR 125 without opening a destination or initiating a payment.
- Camera lifecycle tests pass: permission denial retains upload fallback, unanswered permission requests time out, and late camera grants are stopped after timeout or navigation. Requests explicitly set audio=false. Live camera produced no frames while awaiting browser permission, so physical-camera QR scanning remains unconfirmed.
- Server-only environment variables are used; no credentials enter the client bundle.

## Limits of validation

Tests verify the specified examples and interactions, not real-world scam accuracy. Live microphone transcription and offline network-disconnection behavior were not hardware-tested. Deepfake inference, public reputation, automatic family messages and official complaint submission are not implemented. The preview requires Vercel authentication; a public judge demo requires a separately authorized publication step.


## Production release
PR #1 merged into main at 4ac2eeb4562f2d6fbae9321d55d0f98c6612ec8e. Vercel reported a successful production deployment. Public app: https://kavach-call.vercel.app/ . Additive migration applied to the production Neon branch. Production weekly digest connected successfully and displayed the empty reviewed-data state. No sample scam reports were inserted.


## Final physical camera verification
After the user explicitly allowed camera access and positioned the known demo QR, production Chrome received 640x480 live frames, decoded `upi://pay?pa=demo@upi&pn=Practice%20Only&am=125&cu=INR`, displayed demo@upi / Practice Only / INR 125, and automatically stopped the camera. No payment was initiated. This supersedes the earlier pending physical-camera limitation. Screenshot after automatic shutdown: docs/evidence/kavach-camera-verified.png. The supplied arbitrary first QR was not decoded; the known valid test image succeeded.
