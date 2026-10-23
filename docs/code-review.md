# Implementation review

Reviewed the local rules, verification permission gate, data persistence, speech lifecycle and report export.

Fixed before publishing:

- Reset the alert deduplication key after an explicit dismissal so new suspicious speech can alert again.
- Split contradictory "but/instead/however" clauses so simple advice does not hide a following harmful request. Broader language understanding remains limited.
- Import only the Phosphor icons used by the app; importing the entire package slowed development/test transforms.
- Keep report excerpts out of local history, require opt-in review on download, and redact again at export.

Validation: rule tests, DOM interaction tests and production build. Browser and visual evidence are recorded separately in design-qa.md; no real-world accuracy claim follows from these tests.

The Code Review plugin exposes PR check diagnostics in this environment. It is used for deployment/CI diagnostics after the pull request exists; this document records the manual implementation review, not a claim that an external reviewer approved the code.
