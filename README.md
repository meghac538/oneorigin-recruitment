OneOrigin interview workspace for candidate sessions, AI-assisted collaboration, and recruiter reports.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file with:

```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-key"
OPENAI_MODEL="gpt-5"
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Product Overview

- Candidate dashboard with multi-round interview flow.
- Mode-specific prompts:
  - Build & ship: production-ready feature, tests, deployment notes.
  - Debug & refactor: regression diagnosis, fix, reliability safeguards.
  - Design & align: architecture, tradeoffs, stakeholder alignment.
- AI assistant that only helps when prompted and avoids full solutions.
- Proctoring: tab/window switches are recorded, warned to candidates, and included in reports.
- Reports dashboard with scores, highlights, and notes.

## Routes

- `"/"`: interview creator (role/level/mode + share link).
- `"/candidate?t=TOKEN"`: candidate workspace.
- `"/reports"`: recruiter scorecards.

## Environment Variables

- `DATABASE_URL`: Prisma SQLite DB (e.g. `file:./dev.db`).
- `OPENAI_API_KEY`: enables AI assistant + report evaluator.
- `OPENAI_MODEL`: model name (defaults to `gpt-5`).

## Notes

- If `OPENAI_API_KEY` is missing, report evaluation falls back to a local heuristic.
- Proctoring events are client-side signals; treat as advisory.
