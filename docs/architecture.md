# Architecture and production path

The shipped application is a React 19 + Vite web prototype with local rule scoring. It has no server-side data collection, analytics, user accounts or external model calls.

## Data flow

Typed transcript or consented browser speech -> transient React state -> local rules -> signals and heuristic score -> verification -> optional report draft.

Contacts/questions are written to browser storage only on explicit save. Report summaries are in memory by default; local persistence is an opt-in setting. Excerpts are excluded from history. A downloaded report can include an edited excerpt only after human review.

Speech recognition is a browser capability. On-device-only mode sets `processLocally` when exposed; unsupported configurations fail closed. Provider mode requires separate consent and may send audio to that provider. Kavach creates no audio file.

The production service worker caches only the built static shell, bundled icons and fonts. It excludes API paths and never caches user input. First load and installation need a network. A new build uses a new cache name.

## Why Neon is not required yet

The user has a Neon project named Kavach-Call. The demo does not benefit from uploading family questions or transcripts. No schema or cloud data is created by this prototype.

For a future authenticated reporting service, use the existing project, create an isolated development branch, and add versioned migrations. Start with minimal report metadata: authenticated reporter ID, campaign category, rule/model version, timestamp and an explicit consent record. Keep caller reputation private until independent corroboration and moderation. Introduce retention limits and an appeals path before publishing any number.

A server-side API must verify sessions, validate and bound input, rate-limit writes, use parameterized queries, and enforce per-user access. Keep DATABASE_URL server-only. Never prefix database credentials with VITE_. Do not expose a database connection directly to the browser. Pooled connections suit web requests; direct connections suit migrations.

Automatic trusted-contact messages require verified recipients, explicit opt-in, abuse protection, delivery status and a server-held provider credential. Practice mode must disable transmission at the server boundary too.

## Model work still required

A real clone detector needs trained weights, telephony-degraded evaluation data, calibrated output, consent and per-language/accent benchmarks. An arbitrary synthetic percentage would mislead users; this demo instead says voice authenticity was not analyzed.

Broader scam classification needs labeled normal and scam conversations, adversarial evaluation, acceptable false-positive thresholds, update/version management and low-confidence handling. Existing unit tests verify specified examples only and do not measure real-world accuracy.
