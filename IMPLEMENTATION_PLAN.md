# Implementation plan

`spec.md` is authoritative; this plan tracks its eight ordered implementation phases.

1. **Project foundation — complete.** Vite/React, Express, MongoDB, environment validation, standard API errors, and database health check.
2. **Core data models and API — complete.** Validated Mystery/Investigation models, signed guest sessions, owner-scoped routes, and Atlas integration checks.
3. **Gemini mystery generation — implemented; live provider gate pending.** Structured Gemini generation, deterministic case checks, bounded retries, and private solution persistence are implemented. Unit/build and Atlas checks pass; the live generation attempt currently receives HTTP 429.
4. **Main frontend — implemented; generated-case acceptance pending.** Connected case creation, generation progress, case overview, suspect cards, and profiles. Browser rendering is verified. A real generated case cannot yet be opened because the Phase 3 live Gemini check receives HTTP 429.
5. **Evidence investigation — implemented.** Evidence board, type filters and detail views, fictional photo/CCTV fallbacks, timeline, and owner-scoped examined-evidence persistence. Unit/API/build checks and Atlas persistence check pass.
6. **Accusation and results — implemented.** Server-evaluated accusation, confirmation, solution explanation/reveal after submission, and session-scoped investigation history. API tests pass; a live AI-backed end-to-end run still depends on Phase 3 quota.
7. **Quality and security — implemented locally.** API/generation rate limits, Helmet headers, ownership and private-solution checks, native confirmation dialog, tests, and frontend credential scanning. Production browser/accessibility review remains part of deployment verification.
8. **Deployment — not started.** Select hosting, configure production MongoDB and secrets, deploy over HTTPS, and verify a complete production investigation.

After each phase, run its relevant automated checks and build. Record external-service blockers separately from implementation failures, and re-run affected acceptance checks once the service is available.
