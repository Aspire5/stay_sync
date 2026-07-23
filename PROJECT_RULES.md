# PROJECT_RULES.md - StaySync AI Guard Rails & Assignment Specification

This document serves as the single source of truth for all engineering rules, guidelines, architectural principles, AI guard rails, assignment requirements, evaluation criteria, and scope boundaries for **StaySync**.

All future code generators, AI agents, and contributors MUST strictly follow these rules without exception.

---

## AI GUARD RAILS & CODING STANDARDS

### GENERAL
- Never overengineer.
- Keep implementations simple.
- Prefer readable code over clever code.
- Only implement what is required by the specification.
- Avoid unnecessary abstractions, factory patterns, or speculative helpers.
- Avoid speculative features or future-proofing.
- Do not add functionality that was not explicitly requested.
- Keep files reasonably small and single-purposed.
- Reuse existing code instead of duplicating.

### SECURITY & SENSITIVE DATA
- NEVER expose sensitive content, API keys, credentials, tokens, or private environment variables in code, configuration, or git commits.
- ALL environment files (`.env`, `.env.local`, `.env.*`, `*.pem`, `*.key`) MUST be strictly gitignored and kept hidden from version control.
- Environment template files (`.env.example`) MUST contain ONLY safe dummy placeholders (e.g., `DATABASE_URL="postgresql://user:password@localhost:5432/staysync_db"`).
- Never hardcode database connection strings or secret keys directly inside application source code.

### STYLE
- Do NOT leave AI-generated commentary or self-referential header comments.
- Do NOT write comments like:
  - `"This function..."`
  - `"The following..."`
  - `"AI generated..."`
  - `"Added by assistant..."`
- Only write comments when they genuinely explain complex business context.
- Avoid excessive or self-evident comments.
- Absolutely NO emojis in code, comments, or commit messages.
- Absolutely NO decorative ASCII separators or banner lines in code files.
- Absolutely NO `"TODO: improve later"` or `"FIXME"` comments.
- No unnecessary console logging (`console.log`) in production paths.
- No dead code, commented-out code, or unused imports/variables.
- No placeholder functions or stub implementations.

### CODE QUALITY
- Follow consistent naming conventions (camelCase for JS/TS variables/functions, PascalCase for classes/components, kebab-case for filenames/routes).
- Keep functions short and focused on a single responsibility.
- Keep components focused and modular.
- Avoid deeply nested conditional logic or callback hell.
- Validate all input data thoroughly at system boundaries.
- Handle runtime errors gracefully with consistent error responses.
- Prefer composition over inheritance or heavy class hierarchies.

### GIT CONVENTIONS
- Make small, logical, atomic commits.
- Never dump an entire feature or project phase into a single massive commit.
- Write clear, descriptive commit messages describing the "why" and "what".
- Commit after reaching every meaningful architectural milestone.

---

## ASSIGNMENT REQUIREMENTS

### Property Context
- **Property Name**: "Seaside Cottage"
- **Units**: 1 bookable unit.
- **Base Nightly Rate**: £120.

### Backend Requirements (Node.js / Express / JavaScript / Prisma / PostgreSQL)
- RESTful API design for calendar availability and pricing management.
- View date range calendar with nightly rate and status (`available` / `booked` / `blocked`).
- Set or override nightly rate for a specific date range.
- Block or unblock a specific date range.
- Create a booking for a date range, rejecting overlaps with existing bookings or blocks.
- Ingest and reconcile external channel feed data (JSON / iCal).

### Frontend Requirements (Angular - Latest Stable / Standalone Architecture)
- Month calendar view displaying daily rate and status.
- Interactive date range selection for setting rates or blocking/unblocking dates.
- Simple "new booking" user interface flow.
- Graceful UI handling for booking clashes (user-friendly messages, no raw API error dumps).

### Channel Feed Import & Reconciliation
- Endpoint/Action to ingest mock reservation feed (stand-in for Channex / OTA channel feed).
- **Convention 1 (Exclusive Check-out)**: `checkOut` date is exclusive. The guest departs that morning, enabling a new guest to check in on the same date (`nights booked = checkIn ... checkOut - 1`).
- **Convention 2 (Unclean Feed Processing)**:
  - Handle duplicate entries (idempotent import; re-running must not create duplicate bookings).
  - Handle cancellation status entries cleanly.
  - Handle conflicting date ranges sensibly without double-booking.
  - Document all deduplication, cancellation, and conflict handling decisions clearly in `README.md`.

### README Requirements
- Step-by-step guide to run the project locally from a clean git clone.
- Clear documentation of API endpoints and data schemas.
- Technical decisions and trade-off rationale.
- Deliberately omitted features and proposed next steps given additional time.

### Stretch Goals (Optional - Pick Maximum ONE if pursued)
1. **Dynamic Pricing Rules**: Weekend multipliers (+25%), seasonal rates, or minimum-stay rules.
2. **Mobile**: Single React Native screen for read-only calendar view.
3. **Live Deployment**: Public URL deployment (Render / Vercel / Fly) + monitoring note.
4. **Testing Suite**: Focused test suite targeting reconciliation and conflict logic.
5. **Auth + Multi-Property**: Authentication layer and multi-property support.

---

## EVALUATION CRITERIA CHECKLIST

### Availability Logic
- [ ] Correctly implements exclusive check-out logic (`checkOut` day is available for new `checkIn`).
- [ ] Strictly prevents double-booking and rejects date range overlaps against existing bookings and blocks.
- [ ] Deduplicates repeated channel feed entries idempotently.
- [ ] Sensibly processes reservation cancellations from channel feed.

### API Design
- [ ] Exposes clean, RESTful, and well-structured API endpoints.
- [ ] Returns consistent HTTP status codes and predictable response payloads.
- [ ] Validates request parameters and payload schema.

### Code Quality
- [ ] Clean separation of concerns (Routes -> Controllers -> Services -> Repositories).
- [ ] No footguns, unhandled promises, or silent error swallowing.
- [ ] High readability and clean project organization.

### UX & Judgement
- [ ] Intuitive calendar interface with clear date status visual indicators.
- [ ] Graceful error state handling in frontend UI for date clashes.

### Finishing & Communication
- [ ] Starts and runs seamlessly from a fresh git clone.
- [ ] Complete `README.md` explaining architecture decisions, trade-offs, and cut scope.

---

## THINGS WE WILL NOT BUILD (OUT OF SCOPE)

To prevent scope creep and maintain focus on core assignment requirements, the following features are **EXPLICITLY OUT OF SCOPE**:

- Payment gateway integrations (Stripe live keys, PayPal, etc.).
- Real OTA credentials or live channel API integrations (Airbnb, Booking.com, VRBO).
- Channex API live integration / accounts.
- PriceLabs API integration / accounts.
- Azure cloud deployment / access to PropertyFlow infrastructure.
- Authentication & Authorization system (unless chosen as the single optional stretch goal).
- Multi-property management (unless chosen as the single optional stretch goal).
- Native mobile applications (unless chosen as the single optional stretch goal).
- Complex analytics or revenue management reporting.
