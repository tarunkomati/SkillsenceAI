# SkillSense AI

SkillSense AI is a full-stack placement-readiness and skill-verification platform built for students, recruiters, and universities.

It combines resume parsing, GitHub-based engineering analysis, adaptive AI interviews, skill verification, recruiter workflow tooling, and university placement analytics in one product.

---

## Features

### Student Features
- Resume-based onboarding and profile extraction
- JWT authentication and profile management
- Skill scoring across:
  - Coding Skill Index
  - Communication Score
  - Authenticity Score
  - Placement Readiness
- Skill Passport with downloadable PDF
- Resume Builder with downloadable PDF
- Deep GitHub repository analysis with:
  - Repo-level engineering score
  - File-level review summaries
  - Architecture detection
  - Commit and repository signal analysis
  - AI-generated review and coaching when an LLM key is configured
- Advanced AI Interview Lab with:
  - Configurable target role
  - Configurable seniority
  - Configurable interview mode
  - Adaptive follow-up questions
  - Rubric-based scoring for communication, depth, ownership, evidence, tradeoffs, and confidence
  - Session summary, recommendation, readiness score, and history
- Student progress dashboard
- Roadmap and recommendation surfaces
- Media and document upload support
- Notifications and verification workflow tracking

### Recruiter Features
- Recruiter login and approval-gated access flow
- Candidate discovery dashboard
- Candidate filtering and ranking
- Job brief creation
- JD-to-candidate matching
- Saved searches
- Candidate pipeline states
- Candidate report download
- Candidate resume download
- Interview scheduling

### University Features
- University login and approval-gated access flow
- University analytics dashboard
- Cohort filtering by branch, course, and year
- Readiness and score distribution views
- Intervention tracking
- CSV batch upload
- Placement drive creation and tracking
- Export-ready reporting surfaces

### Platform / Admin Features
- Admin dashboard for operational workflows
- Approval workflows for recruiter and university onboarding
- Role-based access control for student, recruiter, and university users
- Environment-driven deployment configuration
- OpenAI-compatible LLM support through configurable API base:
  - OpenAI
  - Groq
  - Other OpenAI-compatible providers

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- TanStack Query
- Recharts
- Radix UI

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt
- Multer
- PDF generation libraries
- Resume/document parsing utilities
- GitHub API integration
- OpenAI-compatible LLM integration

### Storage / Runtime
- MongoDB Atlas or local MongoDB for development
- Environment-based configuration for local and production deployment

---

## Project Structure

```text
client/                 React frontend
server/                 Node.js + Express backend
server/config/          Database and environment setup
server/models/          MongoDB schemas
server/routes/          API routes
server/controllers/     Business logic handlers
server/middleware/      Auth, upload, and role middleware
server/services/        AI, scoring, GitHub, and reporting logic
server/utils/           Helper utilities
uploads/                Uploaded resumes and media
