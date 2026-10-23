# Verification record

## User story

An Indian family member reviews suspicious text, sees explained signals, independently checks the caller, explicitly dismisses only that transcript if verified, and downloads a reviewed practice report.

## Confirmed

- Production build: Vite success, 133 modules transformed, static client and offline worker generated.
- Rule tests: 27 passed, including family jokes, authority-only false positives, delivery codes, English/Hindi/Tamil examples, low-confidence/noise/mixed-speaker handling, redaction and contradictory advice.
- DOM interaction tests: 11 passed, including the verification gate, failure case, re-alerting, microphone consent, local history and contact-question privacy.
- Hosting tests: 4 passed.
- Vercel Git integration: Preview deployment Ready for the prototype branch. GitHub Vercel status succeeded.
- Live Chrome browser: default screen renders; verification and re-alert flows work; timed practice generates a high-risk alert; a JSON report was downloaded and parsed; mobile width is 390/390px; final console has no errors or warnings.
- Intelligence extension: 16 additional tests passed for URL/UPI heuristics, readiness scoring, IST weekly boundaries, report filtering and private-address registry rejection.
- Neon preview branch `preview/codex/kavach-prototype` received additive campaign/reputation tables. The deployed digest reads the database successfully and shows zero reviewed Chennai campaigns, with practice counts separate.
- Live misleading-URL test displays actual hostname `evil.test`, flags userinfo deception and reports no database match without claiming safety.
- Generated payment QR decoded correctly using the same jsQR dependency. Browser file upload automation was blocked by Chrome extension file access; camera and browser image upload are not hardware/end-to-end verified.
- Server-only environment variables are used; no credentials enter the client bundle.

## Limits of validation

Tests verify the specified examples and interactions, not real-world scam accuracy. Live microphone transcription and offline network-disconnection behavior were not hardware-tested. Deepfake inference, public reputation, automatic family messages and official complaint submission are not implemented. The preview requires Vercel authentication; a public judge demo requires a separately authorized publication step.
