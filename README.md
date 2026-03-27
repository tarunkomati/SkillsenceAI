# SkillSense AI (MERN)

SkillSense AI is now dressed as a clean MERN application that preserves the React UX and delivers the backend API surface using Express and MongoDB instead of Django.

## Folder layout

- `frontend/` – Vite + React + TypeScript with the existing UI (pages, components, Tailwind config, and the `buildApiUrl` helper that points to `VITE_API_BASE_URL`).  
- `backend/` – Express + Node.js + Mongoose REST APIs, file upload storage, PDF generation, and MongoDB schemas for users, dashboards, recruiter workflows, university interventions, AI interviews, and code analysis reports.  
- `Procfile` – starts `npm run start --prefix backend` (used for Heroku-like deployments).  
- `.env.example` – documents both frontend and backend env vars that must be populated for a working stack.

## Frontend

- **Directory:** `frontend/`  
- **Stack:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Radix UI, Sonner notifications, TanStack Query, Recharts.  
- **API wiring:** `src/lib/api.ts` builds the base URL from `VITE_API_BASE_URL` (or the current origin) so every page/component issues requests like `fetch(buildApiUrl('/api/accounts/dashboard/'))` with the bearer token stored in `localStorage`.  
- **Env example:** `frontend/.env.example` (contains `VITE_API_BASE_URL=http://localhost:5000`).  
- **Commands:**  
  - `npm install` (once)  
  - `npm run dev` (start Vite dev server)  
  - `npm run build` (production build)  
  - `npm run preview` (serve the build locally)  

## Backend

- **Directory:** `backend/`  
- **Stack:** Node.js, Express 5, Mongoose, dotenv, CORS, Multer, PDFKit, express-async-handler, bcryptjs, jsonwebtoken.  
- **Entry point:** `backend/src/server.js` connects to MongoDB via `backend/src/config/db.js`, enables JSON parsing, mounts `/uploads`, and wires the following routers:  
  - `/api/accounts` – authentication, profile, dashboard, recalculation, PDF score reports.  
  - `/api/skills` – student dashboards, notifications, roadmap, resume downloads, AI interviews, recruiter/university workflows, progress tracking, code-analysis mocks, media uploads, skill passport, notifications, and recommendations.  
  - `/api/content` – landing page copy seeded from `backend/data/contentBlocks.json`.  
- **Env example:** `backend/.env.example` (documents `MONGODB_URI`, JWT secrets, frontend URL, and optional OpenAI/GitHub tokens).  
- **Commands:**  
  - `npm install` (from `backend/`)  
  - `npm run dev` (nodemon for local dev)  
  - `npm run start` (production-ready server)  

## MongoDB schemas

The Express controllers use the following Mongoose models:  
- `User` (accounts, profiles, scores, breakdown, resume path)  
- `Activity`, `Notification`, `InterviewSchedule`, `RoadmapItem`, `MediaItem`, `PerformancePoint` (student dashboards & progress)  
- `AiInterviewSession` (adaptive interview state + transcript)  
- `CodeAnalysisReport` (new simulated repository analysis reports + file reviews)  
- `RecruiterJob`, `CandidatePipeline`, `SavedSearch` (recruiter desks)  
- `UniversityIntervention`, `BatchUpload`, `PlacementDrive` (university analytics)  
- `ContentBlock` (landing copy)  

## API highlights

Key endpoints the React SPA relies on (all prefixed with `/api/`):  
- **Accounts:** `/accounts/signup/`, `/login/`, `/logout/`, `/profile/`, `/profile/update/`, `/dashboard/`, `/recalculate/`, `/score-report/`.  
- **Skills / Students:** `/skills/dashboard/`, `/skills/activities/`, `/skills/notifications/`, `/skills/verification-steps/`, `/skills/recommendations/`, `/skills/progress/`, `/skills/roadmap/`, `/skills/skill-passport/`, `/skills/resume-builder/`, `/skills/ai-interview/`, `/skills/ai-interview/action/`, `/skills/code-analysis/`, `/skills/code-analysis/:reportId/file/`, `/skills/media/`.  
- **Recruiter:** `/skills/recruiter-dashboard/`, `/skills/recruiter-dashboard/jobs/`, `/skills/recruiter-dashboard/pipeline/:candidateId/`, `/skills/recruiter-dashboard/saved-searches/`, `/skills/recruiter-dashboard/report/:studentId/`, `/skills/recruiter-dashboard/resume/:studentId/`.  
- **University:** `/skills/university-dashboard/`, `/skills/university-dashboard/batch-upload/`, `/skills/university-dashboard/interventions/:studentId/`, `/skills/university-dashboard/drives/`.  

## Environment variables

Populate `.env` (or platform-specific envs) as documented in `.env.example`. Important keys:  
- `MONGODB_URI`, `JWT_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `FRONTEND_URL`, `BACKEND_URL`, `OPENAI_API_KEY`, `GITHUB_TOKEN`.  
- Frontend-specific: `VITE_API_BASE_URL`.  
- You can also point `OPENAI_API_BASE`/`OPENAI_MODEL` at an OpenAI-compatible API to unlock richer AI coaching, but the app gracefully works with default heuristics.

## Running locally

1. **Start MongoDB** (make sure `MONGODB_URI` points at a running instance).  
2. **Backend:**  
   ```powershell
   cd backend
   npm install
   npm run dev
   ```  
3. **Frontend:**  
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```  
4. **Browser:**  
   - Frontend: `http://localhost:5173`  
   - Backend: `http://localhost:5000` (Express APIs)

## Deployment

- Build the frontend (`npm run build` inside `frontend/`) and serve the static assets however you like.  
- Start the backend with `npm run start` (default `PORT=5000`).  
- The provided `Procfile` runs `npm run start --prefix backend` so platform services (Heroku, Railway, Render) boot the Express API by default.

## Notes & assumptions

- The old Django modules, SQLite database, and templates were removed in favor of pure Node/Express controllers that now handle the same routes/features.  
- Code analysis reports are currently mocked inside `CodeAnalysisReport` and `codeAnalysisController` (no external repo scanning service yet).  
- Student progress relies on seeded `PerformancePoint` entries; if no data exists, the progress chart shows a synthetic 7-day series.  
- AI interview data is stored in Mongo and uses simple heuristics in `aiInterviewController`.  
- Uploads (resumes, media, batch CSVs) live in `backend/uploads/` and are served via the `/uploads` static mount.  
- The SQLite file (`db.sqlite3`) remains in the repo only for reference; the MERN stack no longer reads it.
