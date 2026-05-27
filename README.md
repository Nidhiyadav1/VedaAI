# VedaAI — AI Assessment Creator

VedaAI is a full-stack web application that lets teachers generate structured question papers instantly using AI. The teacher fills in a form, optionally uploads a PDF syllabus, and the system generates a complete, formatted question paper with sections, difficulty tags, marks, and an answer key — all in the background using a job queue, with real-time status updates pushed to the browser.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Approach](#approach)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Deployment](#deployment)

---

## Features

- AI-powered question paper generation (Groq — Llama 3)
- Background job processing with BullMQ
- Real-time status updates via WebSocket (Socket.io)
- PDF syllabus upload with text extraction
- Redis caching for generated papers (1-hour TTL)
- Difficulty badges — Easy / Moderate / Hard
- Download generated paper as PDF
- Structured sections (A, B, C...) with instructions
- Answer key generation
- Mobile responsive UI
- Form validation

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Frontend (Next.js 14)           │
│  Assignment Form  │  Paper Output Page       │
│  Zustand State    │  Socket.io Listener      │
│  Axios (API)      │  html2pdf.js             │
└──────────────────────┬──────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────▼──────────────────────┐
│           Backend API (Express)              │
│  POST /assignments   │  GET /papers/:id      │
│  Multer + pdf-parse  │  Redis cache check    │
│  Socket.io server    │  BullMQ job enqueue   │
└──────┬──────────────────────────┬────────────┘
       │ Save record              │ Enqueue job
  ┌────▼────┐              ┌──────▼──────────┐
  │ MongoDB │              │  BullMQ Worker  │
  │ Atlas   │◄─ Save paper─│  Job processor  │
  └─────────┘              │  Status emitter │
  ┌─────────┐              └──────┬──────────┘
  │  Redis  │◄─ Cache result ─────┘
  │ Upstash │                     │ Llama 3 prompt
  └─────────┘              ┌──────▼──────────┐
                           │   Groq API      │
                           │   Llama 3 70B   │
                           │   JSON output   │
                           └─────────────────┘
```

**Request flow:**
1. Teacher submits the assignment form
2. Backend creates a record in MongoDB and enqueues a BullMQ job
3. Worker picks up the job, calls Groq with a structured prompt
4. Groq returns a JSON question paper — parsed and validated by the worker
5. Result is stored in MongoDB and cached in Redis
6. Worker emits a `done` status event via Socket.io
7. Frontend receives the event and loads the paper from the API

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Zustand | State management |
| Socket.io Client | Real-time WebSocket updates |
| Axios | API requests |
| html2pdf.js | Export paper as PDF |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | API server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database and schema modeling |
| Redis (ioredis) | Caching layer |
| BullMQ | Background job queue |
| Socket.io | Real-time WebSocket communication |
| Groq SDK (Llama 3) | AI question generation |
| Multer + pdf-parse | File upload and PDF text extraction |

---

## Approach

### 1. Assignment Creation
The teacher fills a form specifying subject, class, question types, marks distribution, difficulty split, and an optional PDF upload. The PDF is parsed server-side and the extracted text is injected into the AI prompt as syllabus context. Zustand manages all form state cleanly across components.

### 2. AI Question Generation
On submission, the backend creates an assignment record in MongoDB and immediately enqueues a BullMQ background job. The worker calls Groq's Llama 3 model with a carefully structured prompt that enforces JSON output — the raw AI response is never rendered directly. The response is parsed, validated against the expected schema, and stored in MongoDB.

The prompt structure ensures:
- Questions are grouped into sections (A, B, C...)
- Each question has a difficulty tag (Easy / Moderate / Hard) and marks value
- An answer key is included
- No markdown or freeform text bleeds into the output

### 3. Real-time Updates
The frontend joins a Socket.io room named after the assignment ID immediately after submission. As the job progresses (`pending → processing → done`), the worker emits status events to that room. The output page listens for these and loads the paper the moment it's ready — no polling needed.

### 4. Caching
Generated papers are cached in Redis with a 1-hour TTL. Subsequent requests for the same paper are served from cache, avoiding redundant MongoDB queries. Cache is invalidated automatically on expiry.

---

## Project Structure

```
vedaai/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Home
│   │   ├── assignments/
│   │   │   ├── new/page.tsx          # Assignment creation form
│   │   │   └── [id]/page.tsx         # Paper output page
│   ├── lib/
│   │   ├── api.ts                    # Axios API calls
│   │   └── socket.ts                 # Socket.io client
│   ├── store/                        # Zustand store
│   └── components/                   # Shared UI components
│
└── backend/
    ├── src/
    │   ├── index.ts                  # Express app entry point
    │   ├── routes/
    │   │   └── assignments.ts        # REST API routes
    │   ├── models/
    │   │   └── Assignment.ts         # Mongoose schema
    │   ├── workers/
    │   │   └── generationWorker.ts   # BullMQ worker
    │   ├── queues/
    │   │   └── generationQueue.ts    # BullMQ queue setup
    │   └── lib/
    │       ├── redis.ts              # Redis client
    │       └── socket.ts             # Socket.io server
    └── tsconfig.json
```

---

## Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Groq API key — free at [console.groq.com](https://console.groq.com)

---

## Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/Nidhiyadav1/VedaAI.git
cd VedaAI
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment variables

Create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_your_key_here
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Running the App

You need 4 terminals:

```bash
# Terminal 1 — MongoDB (if running locally)
brew services start mongodb-community

# Terminal 2 — Redis (if running locally)
redis-server

# Terminal 3 — Backend
cd backend && npm run dev

# Terminal 4 — Frontend
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deployment

| Service | Platform | Free Tier |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | ✅ Free |
| Backend | [Render](https://render.com) | ✅ Free |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) | ✅ 512MB free |
| Redis | [Upstash](https://upstash.com) | ✅ 10k req/day free |

### Frontend (Vercel)
1. Connect your GitHub repo on Vercel
2. Set root directory to `frontend`
3. Add env variable: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`

### Backend (Render)
1. Connect your GitHub repo on Render → New Web Service
2. Set root directory to `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add all env variables from `backend/.env`

---

## License

MIT
