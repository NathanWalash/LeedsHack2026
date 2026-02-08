# PredictPal - Copilot Instructions

## Snapshot

PredictPal is a monorepo with:
- `backend/`: FastAPI API (Python 3.10-3.12)
- `frontend/`: Next.js 16 App Router app (React 19 + TypeScript)

Frontend talks to backend through `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api`).

## Architecture

### Backend
- Entry point: `backend/app/main.py`
- Router: `backend/app/api/endpoints.py` mounted at `/api`
- CORS allows `http://localhost:3000`
- Runtime state is in-memory dictionaries and resets when backend restarts
- Core modules:
  - Data loading/detection: `backend/app/core/processing.py`
  - Preprocessing: `backend/app/core/preprocessing.py`
  - Training pipeline: `backend/app/core/training.py` + related modules
  - Chat provider integration: `backend/app/core/gemini.py`

### Frontend
- App Router pages under `frontend/src/app/`
- Main wizard route: `/create`
- Step components in `frontend/src/components/steps/`:
  - `Step1GetStarted.tsx`
  - `Step2ProcessData.tsx`
  - `Step3TrainForecast.tsx`
  - `Step4Analysis.tsx`
  - `Step5Showcase.tsx`
- Chat UI: `frontend/src/components/ChatSidebar.tsx`
- Global state (Zustand): `frontend/src/lib/store.ts`
- API client: `frontend/src/lib/api.ts`

## API Surface

Current routes used by frontend:
- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Projects/Stories
  - `POST /api/projects/create`
  - `GET /api/projects/{user_id}`
  - `GET /api/projects/detail/{project_id}`
  - `POST /api/projects/update`
  - `GET /api/stories`
  - `GET /api/stories/{story_id}`
- Data/Forecast
  - `POST /api/upload`
  - `POST /api/upload-drivers`
  - `POST /api/analyze`
  - `POST /api/process`
  - `POST /api/train`
  - `GET /api/analysis/sample`
- Chat
  - `POST /api/chat`

## Wizard Flow

1. Step 1 uploads target data (`/upload`) and optional driver data (`/upload-drivers`).
2. Step 2 processes/cleans data (`/process`).
3. Step 3 trains baseline + multivariate models (`/train`).
4. Step 4 displays analysis from sample bundle (`/analysis/sample`), not strictly per-project output.
5. Step 5 builds and publishes story cards via `/projects/update` (`config.published = true`).

## Chat System (Detailed)

### End-to-end flow
1. UI calls `sendChatMessage(...)` in `frontend/src/lib/api.ts`.
2. Request is posted to `POST /api/chat` in `backend/app/api/endpoints.py`.
3. Endpoint delegates to `generate_chat_response(...)` in `backend/app/core/gemini.py`.
4. Response is returned as `{ role: "assistant", content: string }`.

### Frontend message payload
Chat requests can include:
- `message`: user text
- `history`: recent chat turns (frontend sends store history; backend also trims)
- `page_context`: current UI state summary
- `report_data`: extra structured context (results/training/story context)
- `project_id`

### Context assembly in frontend
`ChatSidebar.tsx` builds context from Zustand in:
- `usePageContext()`
- `useReportData()`

`usePageContext()` is step-aware and should be kept aligned with current UI options.
It includes selected values for Step 1-5 and explicit option vocab for Step 2/3.

`useReportData()` currently packages:
- `forecast_results`
- `story_context`
- `training_context`

### Backend prompt construction
`backend/app/core/gemini.py`:
- Uses `SYSTEM_PROMPT`
- Appends `PAGE CONTEXT`
- Appends truncated `DATA CONTEXT` (`report_data` max ~8000 chars)
- Appends last 10 conversation turns
- Appends current user message

### Provider and fallback behavior
- If `GEMINI_API_KEY` is missing: keyword fallback bot
- If key exists: Gemini via `google-genai`
- Overload handling:
  - retries once on transient overload (`503/unavailable/overloaded`)
  - then returns friendly overload message
- Handles rate limit (`429`) and safety blocks with friendly replies

### In-step "Ask Predict Pal" helpers (Step 2/3)
Step 2 and Step 3 include helper buttons beside major option groups:
- They send a hidden internal prompt to chat asking for:
  - concise explanation
  - strict trailing line `RECOMMENDATION: <id>`
- UI only shows a clean user message (not internal prompt details)
- Assistant output shown to user strips trailing recommendation line
- If recommendation id is valid for that option group, UI auto-selects it

This behavior is implemented in:
- `frontend/src/components/steps/Step2ProcessData.tsx`
- `frontend/src/components/steps/Step3TrainForecast.tsx`

### Chat UI behavior
- Sidebar is in `/create` layout (`frontend/src/app/create/page.tsx`)
- Width is resizable with drag handle
- Width persistence key: `predict-pal-chat-width`
- Sidebar is sticky, viewport-constrained, and internally scrollable
- Message markdown supports lightweight formatting (bold/lists/newlines)

## Extending Chat Features

When adding new chat features, keep this order:
1. Update step UI options (if changed).
2. Update `usePageContext()` to match exact option labels/ids and selected values.
3. Update helper prompt option lists (if relevant).
4. Update backend `SYSTEM_PROMPT` constraints only if behavior policy changes.
5. Validate no user-visible leakage of internal recommendation protocol.

For new structured actions, prefer:
- strict machine-readable suffixes or lightweight JSON blocks
- local parsing and validation against known option IDs
- no silent auto-apply if parsed value is not in allowed options

## Story/Explore Notes

- Published stories are derived from backend in-memory projects.
- Explore may include debug/static data depending on frontend wiring.
- Because backend state is in-memory, published items disappear on backend restart unless persisted externally.

## UI Conventions

- Shared primitives: `frontend/src/components/ui/index.tsx`
- Use `BubbleSelect` for wizard option selection
- Icons: `lucide-react`
- Utility: `cn()` from `frontend/src/lib/utils.ts`
- Dark slate/teal theme is the default style language

## Important Gotchas

- Backend data is ephemeral (in-memory only).
- Step 4 analysis currently reads sample artifacts, not guaranteed project-specific outputs.
- `.env` may contain other model keys, but chat path is Gemini-based.
- Keep frontend context text aligned with current product naming (`PredictPal`).

## Dependency Constraints

Backend pins include:
- `pandas>=1.5,<2.2`
- `scikit-learn>=1.0,<1.4`
- `numpy>=1.24,<2.0`
- `skforecast==0.11.0`
- `google-genai>=1.0.0`

Frontend core:
- `next@16.1.6`
- `react@19.2.3`
- `tailwindcss@4`
- `zustand@5`

## Commands

| Task | Directory | Command |
|------|-----------|---------|
| Backend dev | `backend/` | `python -m uvicorn app.main:app --reload --port 8000` |
| Frontend dev | `frontend/` | `npm run dev` |
| Frontend build | `frontend/` | `npm run build` |
| Frontend lint | `frontend/` | `npm run lint` |
| Backend tests | `backend/` | `pytest` |
