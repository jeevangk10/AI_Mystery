# AI Mystery Room — Product & Engineering Specification

**Document:** `SPEC.md`  
**Version:** 1.0.0  
**Status:** Implementation-ready specification  
**Project type:** AI-powered interactive mystery investigation web application  
**Architecture:** MERN stack  
**AI provider:** Google Gemini  
**Primary purpose:** Turn a user-provided story or scenario into a fictional, evidence-based mystery that the user investigates and solves.

---

# 1. Project Overview

## 1.1 Product Vision

AI Mystery Room is an interactive mystery-solving platform where users submit a short story, scenario, or premise. The application transforms that input into a fictional investigation containing suspects, a crime or mystery, a timeline, and a collection of AI-generated or AI-authored evidence.

Users explore the evidence, inspect suspects, reconstruct events, and ultimately accuse one suspect of being responsible.

The application reveals the canonical solution after submission, explaining the culprit, motive, method, and how the evidence proves the conclusion.

The experience should feel like investigating a real case file, not reading a conventional AI-generated story.

## 1.2 Problem Statement

Traditional mystery games often have fixed storylines, predictable solutions, and limited replayability.

AI Mystery Room solves this by generating new investigations from user-defined scenarios, enabling users to explore unique cases and practice observation, deduction, and critical thinking.

## 1.3 Product Goals

1. Allow users to generate a mystery from a short text prompt.
2. Produce a coherent fictional case with one canonical culprit.
3. Generate multiple suspects with believable motives and alibis.
4. Provide diverse evidence, such as chat conversations, photographs, witness statements, and CCTV-style records.
5. Make evidence exploration interactive.
6. Allow the user to submit a final accusation.
7. Evaluate the accusation deterministically against the canonical culprit.
8. Reveal a detailed solution and evidence-based explanation.
9. Save investigation progress and results.
10. Provide a polished, responsive, immersive user experience.

## 1.4 Non-Goals for Version 1

The following are outside the initial release:

- Multiplayer or real-time collaborative investigations.
- Public user-generated case publishing.
- User-uploaded real crime evidence.
- Real-world criminal identification or investigation.
- Live surveillance camera integrations.
- Real WhatsApp account integrations.
- Real CCTV footage ingestion.
- Voice-based interrogation.
- Payments, subscriptions, or advertisements.
- Training or fine-tuning a custom AI model.
- Guaranteed photorealistic AI-generated video.

These may be considered in later versions.

---

# 2. Core User Journey

The primary user journey is:

1. The user opens the landing page.
2. The user selects **Create a Mystery**.
3. The user enters a scenario or story.
4. The user configures the mystery difficulty and optional preferences.
5. The backend asks Gemini to create a structured investigation.
6. The backend validates the generated case and its solution.
7. The application creates a persistent investigation.
8. The user enters the investigation room.
9. The user examines the case summary and suspects.
10. The user opens evidence files, chats, photographs, witness reports, and camera records.
11. The user compares timestamps, statements, alibis, and contradictions.
12. The user selects a suspect and submits a final accusation.
13. The backend checks the accusation against the canonical culprit.
14. The application displays the result, explanation, and evidence supporting the solution.
15. The user can start another investigation or replay an eligible completed case.

**Important:** The solution must remain hidden until the user submits an accusation or explicitly chooses to reveal the answer.

---

# 3. Target Users and User Stories

## 3.1 Target Users

- Mystery and detective-story enthusiasts.
- Students interested in reasoning and deduction.
- Casual gamers.
- Users who enjoy AI-generated interactive stories.

## 3.2 User Stories

### Mystery creation

- As a user, I want to enter my own scenario so that the AI can create a mystery around it.
- As a user, I want to choose the difficulty so that the challenge matches my skill level.
- As a user, I want meaningful suspects and evidence instead of a generic story.

### Investigation

- As a user, I want to browse suspects and inspect their profiles.
- As a user, I want to open evidence items and understand their contents.
- As a user, I want to compare timestamps and find contradictions.
- As a user, I want evidence to remain available while I investigate.
- As a user, I want to track which evidence I have already examined.

### Resolution

- As a user, I want to submit my accusation.
- As a user, I want to know whether my accusation is correct.
- As a user, I want the application to explain why the culprit is responsible.
- As a user, I want to review the evidence that supports or disproves my theory.

### History

- As a user, I want to see my previous investigations.
- As a user, I want to resume an unfinished investigation.
- As a user, I want to view the results of a completed investigation.

---

# 4. Technology Stack

Use the following stack throughout the project.

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend language | JavaScript with JSX |
| Frontend build tool | Vite |
| Styling | CSS3 with CSS variables |
| Routing | React Router |
| Server state and API requests | TanStack Query or a consistent lightweight alternative |
| Backend | Node.js |
| Backend framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| AI integration | Google Gemini API using the official supported SDK |
| Validation | Zod or an equivalent schema-validation library |
| Authentication | Guest sessions for MVP; optional registered accounts later |
| Image generation | Provider adapter for a supported image-generation model |
| Unit testing | Vitest and/or Jest |
| API testing | Supertest |
| Frontend component testing | React Testing Library |
| Deployment | Any compatible frontend, Node.js backend, and MongoDB hosting provider |

## 4.1 Technology Rules

- Use the MERN stack.
- Do not introduce Next.js, Django, Flask, or another backend framework.
- Do not introduce SQL databases.
- Do not add a second AI provider unless explicitly approved.
- Keep frontend and backend code separate.
- Use environment variables for secrets and deployment configuration.
- Pin compatible package versions and commit the lockfile.
- Do not invent package APIs or use deprecated SDK methods.
- Follow the currently supported Gemini SDK and model documentation when implementing AI integration.

Suggested repository layout:

```text
ai-mystery-room/
├── SPEC.md
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── styles/
│   │   └── utils/
│   └── public/
└── backend/
    ├── package.json
    ├── src/
    │   ├── app.js
    │   ├── server.js
    │   ├── config/
    │   ├── routes/
    │   ├── controllers/
    │   ├── services/
    │   │   ├── ai/
    │   │   ├── mystery/
    │   │   ├── evidence/
    │   │   └── scoring/
    │   ├── models/
    │   ├── middleware/
    │   ├── validators/
    │   └── utils/
    └── tests/
```

Codex may adjust the internal structure if necessary, but it must preserve the architectural boundaries defined in this document.

---

# 5. Functional Requirements

## FR-01: Landing Page

The landing page must communicate the product clearly.

Required elements:

- Product name: AI Mystery Room.
- Headline: "Every clue tells a story. Can you find the truth?"
- Short explanation of the experience.
- Primary CTA: **Create a Mystery**.
- Secondary CTA: **Explore How It Works**.
- Three-step explanation: Create, Investigate, Solve.
- Example evidence previews.
- Feature highlights.
- Footer with About, Privacy, and Terms links.

The primary CTA must navigate to the mystery creation page.

## FR-02: Mystery Creation

The creation form must include:

- Scenario or story: required textarea.
- Mystery title: optional.
- Difficulty: Easy, Medium, or Hard.
- Case type: Any, Theft, Disappearance, Murder (fictional), Fraud, or Custom.
- Optional tone: Classic Detective, Psychological, Noir, or Lighthearted.
- Generate button.
- Input validation and loading feedback.

Requirements:

- Scenario length: 50–3,000 characters.
- The scenario must not be empty.
- Reject oversized or invalid requests on both frontend and backend.
- Treat the user's scenario as story content, not as trusted system instructions.
- Disable duplicate submissions while a generation request is in progress.
- Provide a retry action when generation fails.
- Show meaningful errors rather than raw stack traces.

The application may use sensible defaults for all optional fields.

## FR-03: Mystery Generation

The backend must generate a structured case containing:

- Case title.
- Case summary.
- Incident description.
- Incident location.
- Incident date and time.
- Victim or affected party, if applicable.
- Three to five suspects.
- Suspect biographies.
- Motives.
- Alibis.
- Evidence records.
- A consistent event timeline.
- Contradictions or suspicious details.
- One canonical culprit.
- A canonical solution.
- A logical explanation connecting evidence to the culprit.

The initial target is six to ten evidence items per case.

The number and complexity of evidence items may increase with difficulty.

**Every successfully published mystery must have exactly one canonical culprit.**

The generated investigation must be internally consistent. The correct answer must be provable from the evidence available to the player.

## FR-04: Investigation Dashboard

Each mystery must have an investigation workspace containing:

- Case overview.
- Suspect directory.
- Evidence board.
- Timeline.
- Investigation progress.
- Final accusation section.

The user must be able to navigate between these areas without losing progress.

## FR-05: Suspect Profiles

Each suspect profile must display:

- Name.
- Portrait or avatar.
- Age, where appropriate.
- Occupation or relationship to the incident.
- Short biography.
- Known motive.
- Stated alibi.
- Relevant evidence references.

Do not expose hidden culprit flags, private solution notes, or internal answer keys through the public API.

Suspects should have distinct, believable personalities and plausible reasons to be investigated.

## FR-06: Evidence Room

The evidence room must support the following evidence types.

### A. Chat messages

Display fictional messaging conversations with:

- Sender and recipient.
- Message text.
- Timestamp.
- Conversation grouping.
- Optional attachments.
- Relevant conversation participants.

The interface may resemble a generic messaging application. It must not imply that fabricated conversations are authentic WhatsApp records.

### B. Photographs

Display:

- Evidence image.
- Caption.
- Date and time.
- Location.
- Evidence identifier.
- Investigation notes.

Images should be generated from fictional scenes or use clearly labeled illustrative placeholders.

### C. CCTV-style records

Display one or more of:

- Fictional surveillance still images.
- Camera identifier.
- Location.
- Recording time range.
- Event description.
- Transcribed observations.
- Optional sequence of still frames.

Version 1 does not require actual video generation. A camera-log interface with still frames and a textual event transcript is sufficient.

If a compatible video-generation service is added later, it must be optional and isolated behind a provider adapter.

### D. Witness statements

Display:

- Witness identity.
- Statement text.
- Statement timestamp.
- Relevant events.
- Potential inconsistencies.

### E. Documents and physical clues

Examples include:

- Receipts.
- Access logs.
- Notes.
- Letters.
- Inventory records.
- Entry and exit records.

### Evidence interaction

Users must be able to:

- Open evidence in a detail view or modal.
- Mark evidence as examined.
- Return to the evidence list.
- Filter by evidence category.
- See timestamps and source information.
- Add private investigation notes, if implemented.

Evidence examination state must persist for the current investigation.

## FR-07: Timeline

Provide a chronological timeline of events relevant to the investigation.

The timeline must:

- Use a consistent time zone within each fictional case.
- Display event timestamps.
- Show events from the incident, witness accounts, messages, and camera records.
- Allow users to compare conflicting statements.
- Clearly distinguish confirmed events from reported or uncertain events.

Do not automatically label every suspicious event as a contradiction. The user must be able to reason from the evidence.

## FR-08: Final Accusation

The accusation interface must:

- Display the available suspects.
- Allow exactly one suspect to be selected.
- Require explicit confirmation before final submission.
- Prevent duplicate final submissions.
- Submit only the selected suspect ID.
- Receive a result from the backend.
- Display the canonical solution only after submission.

The frontend must never determine whether the answer is correct.

## FR-09: Results Page

After a valid accusation, display:

- Correct or incorrect result.
- Selected suspect.
- Correct culprit.
- Explanation of the motive.
- Explanation of the method.
- Reconstructed timeline.
- Key evidence.
- Explanation of important contradictions.
- Optional performance score.
- Button to return to the dashboard.
- Button to create another mystery.

The explanation must be grounded in the stored case solution and evidence.

Do not generate a new solution at accusation time.

## FR-10: Investigation History

The application must save:

- Case title.
- Creation date.
- Difficulty.
- Investigation status.
- Evidence examined count.
- Selected suspect, after submission.
- Final result.
- Completion date.

Users must be able to resume unfinished investigations and revisit completed results.

For the MVP, use an anonymous guest session with a secure, persistent session identifier or an equivalent ownership mechanism.

---

# 6. Mystery Generation and Consistency Engine

## 6.1 Generation Pipeline

Implement the following pipeline:

1. Validate the input.
2. Create a generation job or case record.
3. Send a structured generation request to Gemini.
4. Parse the response.
5. Validate the JSON structure.
6. Validate the number and uniqueness of suspects.
7. Validate the evidence references and timestamps.
8. Validate that exactly one culprit exists.
9. Validate that the solution is supported by the evidence.
10. Run consistency checks.
11. Repair or regenerate invalid cases within a bounded retry limit.
12. Persist the validated case.
13. Generate evidence assets where supported.
14. Mark the case ready only when required assets and case data are available.
15. Return the case ID to the frontend.

The generation pipeline must have a configurable retry limit. Do not allow unlimited AI retries.

If the case cannot be validated, return a controlled failure and allow the user to retry.

## 6.2 Canonical Case Solution

The internal case object must include:

- `culpritId`
- `motive`
- `method`
- `solutionSummary`
- `solutionSteps`
- `keyEvidenceIds`
- `evidenceReasoning`
- `timeline`

The canonical culprit and solution must be generated once and persisted with the case.

After publication, they must remain immutable during normal gameplay.

The AI must not choose a new culprit when a user submits an accusation.

## 6.3 Evidence-Based Reasoning

Every case must contain:

- At least two clues that materially support the correct culprit.
- At least one clue that challenges or weakens an alternative suspect's alibi.
- Plausible red herrings that do not contradict the final explanation.
- A coherent timeline.
- An explanation of how the evidence relates to the solution.

For each important clue, store its relationship to the case, including whether it supports, contradicts, or contextualizes a particular claim.

The evidence must not depend on facts that were never disclosed to the user.

## 6.4 Difficulty Rules

### Easy

- Three suspects.
- Six evidence items.
- One or two major contradictions.
- Direct but meaningful clues.
- Minimal ambiguity.

### Medium

- Four suspects.
- Eight evidence items.
- Multiple overlapping motives.
- Several timeline comparisons.
- Plausible red herrings.

### Hard

- Five suspects.
- Ten evidence items.
- Interconnected clues.
- Subtle contradictions.
- More complicated timeline reconstruction.
- Stronger red herrings without making the solution arbitrary.

These are target defaults. A validated case must satisfy the actual requirements for its selected difficulty.

## 6.5 Generation Validation

Create a deterministic validation service that checks:

- Required fields exist.
- IDs are unique.
- All evidence references point to valid suspects or events.
- All timestamps are parseable.
- The culprit ID references an existing suspect.
- Only one canonical culprit is stored.
- Every key evidence ID exists.
- The solution explanation references actual evidence.
- The timeline is logically consistent.
- The correct culprit can be distinguished from alternatives using available clues.
- No unsupported claims are required to solve the case.

Use bounded regeneration or repair when validation fails.

For the MVP, validation may use schema checks and explicit rule-based consistency checks. A second AI-based quality review is optional and must not replace deterministic validation.

---

# 7. Gemini Integration

## 7.1 Responsibilities

Gemini is responsible for:

- Generating the mystery narrative.
- Creating suspects and motives.
- Producing fictional witness statements and chat conversations.
- Creating evidence metadata and descriptions.
- Constructing the timeline.
- Generating a canonical solution.
- Explaining evidence relationships.
- Optionally reviewing the logical consistency of a case.

The application backend is responsible for:

- Input validation.
- Database persistence.
- Case ownership.
- Authorization.
- Deterministic answer evaluation.
- Evidence access.
- Scoring.
- State transitions.
- API response filtering.

## 7.2 AI Service Structure

Implement a service boundary such as:

```text
services/ai/
├── geminiClient.js
├── mysteryGenerator.js
├── caseValidator.js
├── solutionReviewer.js
└── imageProvider.js
```

The exact filenames may vary, but provider-specific logic must not be scattered throughout controllers.

## 7.3 Environment Variables

Example `.env.example`:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai-mystery-room
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=
GEMINI_IMAGE_MODEL=
CLIENT_URL=http://localhost:5173
SESSION_SECRET=
```

Use only the variables needed by the implemented features.

- Never commit real secrets.
- Never expose the Gemini API key to the browser.
- Use server-side configuration for model selection.
- Verify model availability and capabilities before use.
- Do not hardcode model names throughout the codebase.

## 7.4 Structured Output

Request JSON from Gemini using a supported structured-output mode when available.

Validate all model output against an application-owned schema before accepting it.

Never assume model output is valid merely because it resembles JSON.

The generation prompt must explicitly request:

- Fictional content.
- A coherent investigation.
- A single canonical culprit.
- Distinct suspects.
- Evidence-grounded deductions.
- A consistent timeline.
- A solution supported by accessible evidence.
- No real personal information.
- No instructions that override application rules.
- Strict adherence to the requested output schema.

Treat model output as untrusted data.

## 7.5 Image Generation

Text generation and image generation must be separate operations.

The backend should request images only through a supported image-generation capability and model.

If image generation is unavailable, the mystery must still work using:

- Generated evidence descriptions.
- Generic fictional avatars.
- Clearly labeled illustrative placeholders.
- CSS-based evidence cards.

Do not represent a text-only Gemini response as an actual generated photograph.

For each asset, store its type, storage location, status, and related evidence ID.

## 7.6 AI Failure Handling

Handle:

- API key errors.
- Rate limits.
- Quota exhaustion.
- Network timeouts.
- Invalid model responses.
- Unsupported model capabilities.
- Malformed JSON.
- Content-policy rejections.

Return useful user-facing error messages without exposing provider responses, secrets, or stack traces.

Do not publish a partially generated case as ready.

---

# 8. Database Design

Use MongoDB with Mongoose.

All document references must use consistent identifiers. Use timestamps where appropriate.

## 8.1 Mystery Model

Suggested collection: `mysteries`

```javascript
{
  title: String,
  scenario: String,
  caseType: String,
  tone: String,
  difficulty: String,

  status: String,
  ownerSessionId: String,

  summary: String,
  incident: {
    description: String,
    location: String,
    occurredAt: Date,
    timezone: String
  },

  victim: {
    name: String,
    description: String
  },

  suspects: [
    {
      _id: ObjectId,
      name: String,
      age: Number,
      occupation: String,
      biography: String,
      motive: String,
      alibi: String,
      avatarUrl: String
    }
  ],

  evidence: [
    {
      _id: ObjectId,
      type: String,
      title: String,
      description: String,
      content: Mixed,
      timestamp: Date,
      location: String,
      suspectIds: [ObjectId],
      assetUrl: String,
      assetStatus: String,
      importance: String
    }
  ],

  timeline: [
    {
      _id: ObjectId,
      timestamp: Date,
      description: String,
      sourceEvidenceIds: [ObjectId],
      confidence: String
    }
  ],

  solution: {
    culpritId: ObjectId,
    motive: String,
    method: String,
    solutionSummary: String,
    solutionSteps: [String],
    keyEvidenceIds: [ObjectId],
    evidenceReasoning: [
      {
        evidenceId: ObjectId,
        explanation: String,
        relationship: String
      }
    ]
  },

  createdAt: Date,
  updatedAt: Date
}
```

### Mystery status values

- `generating`
- `validating`
- `ready`
- `failed`
- `archived`

Only `ready` mysteries can be investigated.

**Security requirement:** `solution` is private server-side data. Never return the entire stored Mystery document directly from a public controller.

## 8.2 Investigation Model

Suggested collection: `investigations`

```javascript
{
  mysteryId: ObjectId,
  ownerSessionId: String,

  status: String,
  examinedEvidenceIds: [ObjectId],
  notes: [
    {
      evidenceId: ObjectId,
      text: String,
      updatedAt: Date
    }
  ],

  accusation: {
    suspectId: ObjectId,
    isCorrect: Boolean,
    submittedAt: Date
  },

  score: Number,
  startedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Investigation status values

- `active`
- `completed`

Do not store a final accusation as completed until the backend has validated the submission.

## 8.3 Generation Job Model

A generation job may be embedded in the Mystery model for a small MVP. A separate collection is recommended if asynchronous generation is implemented.

Suggested fields:

```javascript
{
  mysteryId: ObjectId,
  status: String,
  stage: String,
  progress: Number,
  attempts: Number,
  errorCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

Do not store API keys or sensitive provider credentials in job records.

## 8.4 Indexes

Create indexes for:

- Mystery ownership and creation date.
- Investigation ownership and update date.
- Investigation status.
- Mystery status.
- Unique identifiers where appropriate.

Use MongoDB TTL indexes only for records whose expiration policy is explicitly defined.

---

# 9. API Specification

Base path: `/api/v1`

All API responses must use JSON.

## Standard success response

```json
{
  "success": true,
  "data": {}
}
```

## Standard error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a valid scenario."
  }
}
```

Use appropriate HTTP status codes.

## 9.1 Health Check

`GET /api/v1/health`

Purpose: Verify server availability.

Example response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## 9.2 Create Mystery

`POST /api/v1/mysteries`

Request:

```json
{
  "scenario": "A priceless painting disappears from a locked gallery.",
  "title": "The Vanishing Canvas",
  "difficulty": "medium",
  "caseType": "theft",
  "tone": "classic-detective"
}
```

Response for a synchronous implementation:

```json
{
  "success": true,
  "data": {
    "mysteryId": "example-id",
    "status": "ready"
  }
}
```

For asynchronous generation, return `202 Accepted` and a job or mystery ID. The frontend must poll the status endpoint until completion or failure.

## 9.3 Get Mystery Status

`GET /api/v1/mysteries/:id/status`

Returns the generation status and a user-safe progress message.

Do not include the canonical solution.

## 9.4 Get Mystery Details

`GET /api/v1/mysteries/:id`

Returns the public case overview, suspects, and non-solution metadata.

Do not expose:

- `culpritId`
- The canonical solution.
- Hidden suspect labels.
- Private evaluation fields.
- Internal AI prompts.
- Provider credentials.

## 9.5 List Evidence

`GET /api/v1/mysteries/:id/evidence`

Optional query parameters:

- `type`
- `page`
- `limit`

Return evidence metadata and user-visible contents only.

## 9.6 Get Evidence Details

`GET /api/v1/mysteries/:id/evidence/:evidenceId`

Return the selected evidence item after checking ownership and access permissions.

## 9.7 Create Investigation

`POST /api/v1/investigations`

Request:

```json
{
  "mysteryId": "example-mystery-id"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "investigationId": "example-investigation-id",
    "status": "active"
  }
}
```

Enforce the intended case ownership policy and avoid creating duplicate active investigations unnecessarily.

## 9.8 Get Investigation

`GET /api/v1/investigations/:id`

Return the user's investigation state and authorized mystery information, excluding the canonical solution.

## 9.9 Mark Evidence Examined

`PATCH /api/v1/investigations/:id/evidence/:evidenceId`

Request:

```json
{
  "examined": true
}
```

Validate that the evidence belongs to the investigation's mystery.

## 9.10 Save Investigation Notes

`PUT /api/v1/investigations/:id/notes/:evidenceId`

Request:

```json
{
  "text": "The timestamp conflicts with the suspect's alibi."
}
```

Validate note length and ownership.

## 9.11 Submit Accusation

`POST /api/v1/investigations/:id/accusation`

Request:

```json
{
  "suspectId": "example-suspect-id"
}
```

The request must not accept a client-supplied `isCorrect`, `culpritId`, or score.

The server must:

1. Load the investigation.
2. Verify ownership.
3. Verify that the investigation is active.
4. Validate the suspect ID.
5. Compare the suspect ID with the canonical culprit ID.
6. Save the accusation and result.
7. Mark the investigation completed.
8. Return the authorized result and explanation.

Response:

```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "selectedSuspect": {
      "id": "example-suspect-id",
      "name": "Alex Morgan"
    },
    "solution": {
      "culprit": {
        "id": "correct-suspect-id",
        "name": "Jordan Lee"
      },
      "motive": "A financial dispute motivated the theft.",
      "method": "The culprit exploited an access window.",
      "summary": "The timeline and access records establish responsibility.",
      "keyEvidence": []
    }
  }
}
```

The example IDs and narrative above are illustrative only.

## 9.12 Investigation History

`GET /api/v1/investigations`

Optional query parameters:

- `status`
- `page`
- `limit`

Return only investigations belonging to the current user session.

## 9.13 Error Codes

Use consistent codes, including:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `MYSTERY_NOT_READY`
- `GENERATION_FAILED`
- `AI_PROVIDER_ERROR`
- `INVALID_ACCUSATION`
- `INVESTIGATION_COMPLETED`
- `RATE_LIMIT_EXCEEDED`
- `INTERNAL_SERVER_ERROR`

Never return raw internal exceptions to the browser.

---

# 10. Frontend Pages and Components

## 10.1 Required Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/create` | Mystery creation form |
| `/mysteries/:id` | Case overview |
| `/investigations/:id` | Investigation workspace |
| `/investigations/:id/results` | Completed investigation results |
| `/history` | Previous investigations |
| `*` | Not-found page |

Protect investigation routes using the application's session and ownership model.

## 10.2 Suggested Components

- `Navbar`
- `Footer`
- `HeroSection`
- `FeatureSection`
- `MysteryForm`
- `GenerationProgress`
- `CaseHeader`
- `SuspectCard`
- `SuspectDetailModal`
- `EvidenceBoard`
- `EvidenceCard`
- `EvidenceViewer`
- `ChatEvidenceViewer`
- `PhotoEvidenceViewer`
- `CCTVEvidenceViewer`
- `WitnessStatementViewer`
- `TimelineView`
- `InvestigationProgress`
- `AccusationPanel`
- `SolutionReveal`
- `HistoryCard`
- `ErrorState`
- `LoadingSkeleton`
- `EmptyState`
- `ConfirmationDialog`

Components should be reusable and should not duplicate API or business logic.

## 10.3 Frontend State Rules

- Store persistent investigation data on the backend.
- Use a consistent API client.
- Keep temporary UI state local to components when appropriate.
- Avoid placing secret or canonical solution data in frontend state.
- Refreshing a page must not erase investigation progress.
- Show loading, success, empty, and error states for asynchronous operations.
- Prevent duplicate requests where possible.
- Do not use hardcoded mock cases as the production data source.

Seeded demonstration cases may be included for development and testing, but must be clearly separated from generated production cases.

---

# 11. UI/UX Design System

## 11.1 Visual Direction

Create a premium detective investigation experience.

The visual style should feel like a modern digital detective's office with subtle noir influences, rather than a generic chatbot interface.

Use:

- Dark charcoal backgrounds.
- Muted parchment or off-white surfaces for evidence.
- Restrained amber highlights.
- Deep burgundy for danger or important warnings.
- Monospaced typography for timestamps and case identifiers.
- Clean sans-serif typography for body text.
- Subtle grain, borders, shadows, and restrained transitions.
- Consistent spacing and rounded corners.
- Clear visual hierarchy.

Suggested initial color tokens:

```css
:root {
  --color-background: #111318;
  --color-surface: #1a1d24;
  --color-surface-elevated: #232733;
  --color-text-primary: #f2f0e9;
  --color-text-secondary: #a8adba;
  --color-accent: #d6a756;
  --color-danger: #c45c5c;
  --color-border: #343945;
  --radius-card: 14px;
  --radius-control: 10px;
}
```

These values are defaults, not restrictions. Maintain a consistent design system.

## 11.2 Landing Page Layout

1. Navigation bar.
2. Hero section with product headline and primary CTA.
3. Evidence preview panel.
4. How-it-works section.
5. Feature cards.
6. Sample investigation preview.
7. Final CTA.
8. Footer.

## 11.3 Investigation Workspace Layout

Desktop:

- Left sidebar: case navigation and investigation progress.
- Main content: selected evidence or active investigation panel.
- Right panel: suspect information, clues, or timeline.

Mobile:

- Single-column layout.
- Collapsible navigation.
- Responsive evidence cards.
- Bottom-sheet or full-screen evidence viewer where appropriate.
- Easy-to-reach accusation controls.

Do not force a three-column layout onto narrow screens.

## 11.4 Interaction Requirements

- Smooth but restrained animations.
- Hover and focus states.
- Clear selected-suspect states.
- Confirmation before final accusation.
- Toasts or inline messages for save operations.
- Loading skeletons during data retrieval.
- Accessible keyboard navigation.
- Visible focus indicators.
- Proper contrast and reduced-motion support.

Avoid excessive animations, decorative elements that obscure evidence, and unnecessary full-screen popups.

---

# 12. Security and Privacy

Implement the following requirements before deployment.

## 12.1 API Security

- Store Gemini credentials only on the backend.
- Validate all user input.
- Enforce request body size limits.
- Apply rate limits to generation endpoints.
- Use secure CORS configuration.
- Add appropriate security headers.
- Sanitize user-controlled text before rendering HTML.
- Avoid unsafe HTML rendering.
- Use centralized error handling.
- Avoid leaking internal prompts, stack traces, or secrets.

## 12.2 Session and Ownership Security

- Generate unpredictable session identifiers.
- Use secure, HTTP-only cookies where applicable.
- Set `Secure` in production.
- Apply an appropriate `SameSite` policy.
- Protect state-changing operations against CSRF where the authentication model requires it.
- Never trust an owner ID provided in the request body.
- Verify access to every mystery, investigation, and evidence item.
- Prevent one user from reading another user's investigation.
- Do not expose database documents indiscriminately.

If registered authentication is added, use an established password-hashing approach and robust session or token management.

## 12.3 Fictional Content Disclosure

The interface must clearly communicate that the cases and evidence are fictional.

Use a visible label such as:

**FICTIONAL CASE — AI-GENERATED EVIDENCE**

Apply this label to generated evidence, CCTV-style material, and fabricated message conversations.

Do not present fabricated content as authentic evidence from real people or real investigations.

## 12.4 Data Retention

Document the session and case-retention policy.

Provide a path to delete user investigations if deletion is supported.

Do not collect unnecessary personal information.

---

# 13. Scoring and Progress

For version 1, correctness is the primary scoring criterion.

Suggested scoring model:

- Correct accusation: 100 points.
- Incorrect accusation: 0 points.

Optional future enhancements may award investigation-quality points for examining key evidence, identifying contradictions, or solving a case with fewer hints.

Do not introduce hidden scoring penalties or time pressure unless explicitly added to the product requirements.

The user must be able to solve the mystery without a timer.

---

# 14. Performance and Reliability

- Display immediate loading feedback when generation starts.
- Use asynchronous generation if a complete case takes too long for a normal request.
- Set request and provider timeouts.
- Retry transient provider failures only within a bounded policy.
- Prevent duplicate case creation from repeated submissions.
- Avoid fetching all large evidence assets at once.
- Load images lazily.
- Paginate history where necessary.
- Add database indexes for common queries.
- Log generation failures and validation failures.
- Never log API keys, session secrets, or unnecessary private content.
- Provide useful health checks.

Initial targets:

- Normal page interactions should feel responsive.
- Typical API reads should aim for under 500 ms at the 95th percentile under light development-scale load.
- AI generation may take longer and must communicate progress.
- The application must remain usable when optional image generation fails.

These are initial engineering targets, not guaranteed performance claims.

---

# 15. Testing Requirements

## 15.1 Unit Tests

Test:

- Input validation.
- Difficulty configuration.
- Case schema validation.
- Suspect uniqueness.
- Evidence references.
- Timeline consistency rules.
- Canonical culprit validation.
- Accusation evaluation.
- Investigation state transitions.
- Public/private response serialization.

## 15.2 API Tests

Test:

- Successful mystery creation.
- Invalid scenario submission.
- Invalid difficulty.
- AI provider failure.
- Invalid AI JSON.
- Failed consistency validation.
- Unauthorized investigation access.
- Access to another user's evidence.
- Evidence examination persistence.
- Duplicate accusation submission.
- Accusation against an invalid suspect.
- Correct and incorrect accusations.
- Completed investigation retrieval.
- History filtering.

## 15.3 Frontend Tests

Test:

- Creation form validation.
- Loading and error states.
- Suspect selection.
- Evidence filtering.
- Evidence examination state.
- Timeline rendering.
- Accusation confirmation.
- Results rendering.
- Mobile navigation.

## 15.4 End-to-End Test

The primary end-to-end test must:

1. Open the landing page.
2. Create a mystery.
3. Wait for successful generation.
4. Open the investigation.
5. Inspect evidence.
6. Select a suspect.
7. Submit an accusation.
8. Verify the backend result.
9. Verify the solution reveal.
10. Refresh the page and confirm the completed result persists.

Use controlled fixtures and a mocked AI provider in automated tests. Tests must not depend on paid, live Gemini calls.

---

# 16. Acceptance Criteria

The MVP is considered complete only when all mandatory criteria below pass.

- [ ] The landing page is implemented and responsive.
- [ ] A user can submit a scenario.
- [ ] Difficulty and optional preferences are supported.
- [ ] Gemini is integrated on the backend.
- [ ] Generated cases are parsed and validated.
- [ ] Every ready case has exactly one canonical culprit.
- [ ] The generated evidence supports the canonical solution.
- [ ] Suspects and evidence are stored in MongoDB.
- [ ] Users can explore all required evidence types, with supported fallbacks.
- [ ] CCTV-style evidence works without requiring video generation.
- [ ] Investigation progress persists after refresh.
- [ ] Users can mark evidence as examined.
- [ ] Users can submit one final accusation.
- [ ] The backend evaluates accusations deterministically.
- [ ] The solution remains hidden before final submission.
- [ ] The result explains the culprit using stored evidence.
- [ ] Investigation history works.
- [ ] Ownership and authorization checks are enforced.
- [ ] API keys remain server-side.
- [ ] Loading, error, and empty states are implemented.
- [ ] Automated tests cover the critical workflow.
- [ ] `.env.example` is provided.
- [ ] `README.md` includes setup and run instructions.
- [ ] The application can be built and deployed.
- [ ] No critical route, button, or primary interaction is a dead end.

---

# 17. Implementation Phases

Codex must implement the application incrementally rather than attempting an unverified, all-at-once build.

## Phase 1: Project Foundation

- Create the frontend and backend structure.
- Configure Vite and Express.
- Configure MongoDB and Mongoose.
- Set up environment variables.
- Add centralized error handling.
- Add the health endpoint.
- Establish a consistent API response format.

**Exit condition:** Both applications start, MongoDB connects, and the health endpoint works.

## Phase 2: Core Data Models and API

- Implement Mystery and Investigation models.
- Add schema validation.
- Implement ownership and session handling.
- Add API routes and controllers.
- Add tests for access control.

**Exit condition:** The backend can store, retrieve, and authorize sample cases.

## Phase 3: Gemini Mystery Generation

- Integrate the supported Gemini SDK.
- Implement structured generation.
- Validate generated JSON.
- Implement consistency checks.
- Persist canonical solutions securely.
- Add bounded retries and failure handling.

**Exit condition:** A valid case can be generated and stored with one stable, evidence-supported culprit.

## Phase 4: Main Frontend

- Implement landing page.
- Implement mystery creation form.
- Implement generation status.
- Implement case overview.
- Implement suspect cards and profiles.
- Connect the UI to the backend.

**Exit condition:** A user can generate and open a mystery from the browser.

## Phase 5: Evidence Investigation

- Implement the evidence board.
- Implement chat evidence.
- Implement photographs and fallbacks.
- Implement CCTV-style logs and still frames.
- Implement witness statements.
- Implement the timeline.
- Implement examined-evidence persistence.

**Exit condition:** Users can inspect evidence and compare relevant events.

## Phase 6: Accusation and Results

- Implement suspect selection.
- Implement confirmation dialog.
- Implement server-side accusation evaluation.
- Implement solution reveal.
- Implement result explanations.
- Implement investigation history.

**Exit condition:** The complete create-investigate-solve workflow works end to end.

## Phase 7: Quality and Security

- Add tests.
- Fix responsive layout issues.
- Verify access control.
- Verify API-key protection.
- Add rate limiting and secure headers.
- Improve error messages and accessibility.
- Verify that secrets never appear in frontend bundles.

**Exit condition:** All mandatory acceptance criteria pass.

## Phase 8: Deployment

- Configure production environment variables.
- Deploy the frontend.
- Deploy the backend.
- Provision MongoDB.
- Configure CORS, cookies, and HTTPS.
- Test the production Gemini integration.
- Test one complete investigation in production.
- Document the deployed environment.

**Exit condition:** A user can create and solve a mystery on the deployed application.

---

# 18. Required Project Documentation

Codex must maintain:

### `README.md`

Include:

- Project description.
- Features.
- Technology stack.
- Prerequisites.
- Installation.
- Environment setup.
- Local development commands.
- Test commands.
- Build commands.
- Deployment instructions.
- Known limitations.

### `.env.example`

Include all required environment variable names without real credentials.

### `SPEC.md`

This document is the authoritative source for product behavior, architecture, security, and acceptance criteria.

### Optional `AGENTS.md`

Add repository-specific instructions for Codex, such as:

- Read `SPEC.md` before coding.
- Follow the existing architecture.
- Keep frontend and backend responsibilities separate.
- Add tests for new business logic.
- Never expose private solution fields.
- Update documentation when contracts change.

`AGENTS.md` may guide the coding workflow but must not silently override this specification.

---

# 19. Rules for Codex

These rules are mandatory.

1. Read this entire specification before implementation.
2. Treat `SPEC.md` as the Single Source of Truth.
3. Inspect the existing repository before creating or replacing files.
4. Preserve working code unless a change is necessary.
5. Implement the project in the defined phases.
6. Do not skip validation, authorization, error handling, or tests to make the UI appear finished.
7. Do not hardcode AI-generated cases as the main application implementation.
8. Do not fabricate successful API responses.
9. Do not expose the canonical culprit before the user submits an accusation.
10. Do not let the frontend decide whether an accusation is correct.
11. Do not store secrets in frontend code.
12. Do not invent unsupported Gemini SDK methods or model capabilities.
13. If image generation is unavailable, use the specified fallback behavior.
14. Keep all endpoints and database models consistent with the API and data specifications.
15. If implementation details need to change, preserve the product requirements and document the architectural decision.
16. After each phase, run the relevant build and tests before proceeding.
17. Fix errors introduced by the implementation before declaring a phase complete.
18. Never claim a feature is complete unless it has been implemented and verified.
19. Do not leave primary user flows as TODOs, fake buttons, or disconnected mock interactions.
20. Finish by reporting the implemented features, commands to run the application, test results, deployment steps, and any remaining limitations.

If a minor detail is unspecified, choose a sensible, secure default and document it. If a decision would materially change the product or conflict with this specification, explain the conflict before proceeding.

---

# 20. Definition of Done

The project is done when a user can:

1. Open the deployed website.
2. Enter an original mystery scenario.
3. Generate a coherent fictional case using Gemini.
4. Explore multiple suspects and evidence types.
5. Examine messages, images, CCTV-style records, witness statements, and timelines.
6. Form a theory based on the available evidence.
7. Accuse one suspect.
8. Receive a correct, server-validated result.
9. Read a coherent solution explaining the evidence.
10. Return later and access the saved investigation.

The result must be a functional full-stack application, not merely a UI prototype or a collection of disconnected pages.

**Final principle:** AI creates the fictional world; the backend preserves its truth; the user solves the mystery through evidence.

