# NEXORA AI — Intelligent AI Workspace

> A production-grade, full-stack AI web application featuring a ChatGPT-inspired dark interface, deterministic agent tool-routing, document analysis, coding assistance, and task management. Powered by Google Gemini Flash-Lite.

---

## 🎨 Color Palette & Design Constitution

Inspired by ChatGPT's clean, distraction-free aesthetic with refined teal-green accents:
- **Main Background**: `#212121`
- **Sidebar Background**: `#171717`
- **Chat & Card Surfaces**: `#2F2F2F`
- **Input Background**: `#303030`
- **Primary Accent Green**: `#10A37F`
- **Accent Hover**: `#1A7F64`
- **Primary Text**: `#FFFFFF`
- **Secondary Text**: `#ACACAC`
- **Borders**: `#424242`

---

## 🚀 Key Features

### 1. Primary AI Agent with Deterministic Tool Calling
- Natural-language reasoning powered by Google's cost-efficient `gemini-3.1-flash-lite` model.
- **Deterministic Tool Pipeline**:
  - `createTask`: Intelligently captures action items and persists them to the Task Planner.
  - `listTasks`: Queries pending and completed todos to answer schedule questions.
  - `completeTask`: Identifies and marks tasks completed by ID or name match.
  - `analyzeDocumentSnippet`: Extracts targeted insights from uploaded files.
- Bounded execution loop (max 1 return iteration) with strict timeouts to prevent runaway LLM calls.
- Full Markdown support: tables, formatted bullet points, headers, and syntax-highlighted code blocks with 1-click copy.
- Request cancellation (`AbortController`) to stop generation mid-stream.

### 2. Document Assistant
- Supports **PDF** (via native Gemini multimodal base64 ingestion) and **TXT / MD / JSON / CSV** formats.
- File validation: verifies MIME types and caps upload size at 10MB.
- Analysis Modes:
  - **Executive Summary**: 2-3 paragraph synthesis with structural outline.
  - **Action Items**: Explicit extraction of next steps, deliverables, and owners.
  - **Critical Review**: Constructive assessment of logical clarity and weaknesses.
  - **Targeted Q&A**: Strict grounding against provided document text.
- One-click "Discuss in Chat" handoff.

### 3. Coding Assistant & Static Review
- Explain code section by section in beginner-friendly language.
- Debug flawed code snippets and provide verified corrections.
- Refactor legacy or inefficient code for modern idiomatic practices.
- Generate clean, type-safe functions from prompts.
- Code review covering security vulnerabilities (e.g. SQL injection), complexity ($O(n)$ analysis), and best practices.
- Preset snippets for fast demonstration (React useEffect leaks, Binary Search off-by-one, SQL injection).

### 4. Interactive Task Planner
- Deterministic CRUD with categories, priorities (`High`, `Medium`, `Low`), and due dates.
- Bi-directional sync: tasks created by the AI Agent in Chat appear automatically in the planner.
- AI Technical Breakdown: automatically expands any task into technical subtasks and acceptance criteria.
- Filters by completion status, priority level, and keyword search.

### 5. Conversation Archive
- Search previous chat transcripts by title or message content.
- Inline rename and deletion.
- Export transcripts as standalone Markdown (`.md`) or structured JSON files.

### 6. Cost & Quota Controls
- **Default Model**: `gemini-3.1-flash-lite` for near-instant sub-second responses and minimal cost.
- **Bounded Context**: Automatically limits chat history to the 10 most recent messages, preventing quadratic token escalation.
- **Session Quota Tracker**: Real-time counter of total requests and approximate token usage with a 100-request demo limit.
- Reset counter control directly in Settings.

### 7. Global Keyboard Shortcuts & Command Palette
- **`Ctrl + K` / `Cmd + K`**: Open the global Command Palette & Search modal.
- **`Ctrl + N` / `Cmd + N`**: Instantly start a new conversation and jump to chat.
- **`Ctrl + B` / `Cmd + B`**: Toggle sidebar collapse / expand.
- **`Ctrl + 1` through `Ctrl + 8`**: Rapid direct page switching (Dashboard, Chat, Documents, Code, Tasks, History, Settings, About).
- **`Ctrl + Shift + L`**: Toggle Dark / Light interface theme.
- **`Ctrl + /` or `?`**: Open the on-screen Keyboard Shortcuts cheat sheet modal.
- **`Esc`**: Dismiss active command palette or modal.

### 8. Security & Privacy Architecture
- **Stateless Server Proxy**: `server.ts` handles all `@google/genai` calls.
- **Zero API Key Leakage**: The client bundle contains zero references to `GEMINI_API_KEY`.
- **Local Persistence**: Transcripts and tasks are stored locally in the user's browser `localStorage`, ensuring user data remains private.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js, Express, `tsx`.
- **AI SDK**: `@google/genai` (v2.4.0+).

---

## 📦 Setup & Running Locally

1. **Clone repository & install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   GEMINI_API_KEY="your-google-gemini-api-key"
   GEMINI_MODEL="gemini-3.1-flash-lite"
   PORT=3000
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 📋 Completed Deliverables & Limitations

### Completed Deliverables
- [x] Responsive ChatGPT-inspired dark UI with `#212121`, `#171717`, `#2F2F2F`, and `#10A37F` teal-green palette.
- [x] Server-side Express proxy with `@google/genai` integration.
- [x] Primary AI Agent with deterministic tool calling (`createTask`, `listTasks`, `completeTask`, `analyzeDocument`).
- [x] Native PDF and text document analysis with executive summaries and targeted Q&A.
- [x] Interactive Coding Assistant with 5 modes and presets.
- [x] Bi-directional Task Planner with AI technical subtask breakdown.
- [x] Searchable Conversation Archive with JSON/Markdown export.
- [x] Settings dashboard with real-time API quota tracker and model configuration.
- [x] Comprehensive error handling for rate limits (429), oversized files, and missing credentials.

### Known Limitations & Roadmap
- **Cross-device synchronization**: Current persistence relies on browser `localStorage`. A PostgreSQL or Firestore backend can be linked for multi-device sync.
- **FastAPI Migration**: The backend endpoints (`/api/chat`, `/api/analyze-document`, `/api/code-assist`) are strictly REST-compliant, allowing drop-in Python FastAPI replacement without frontend modification.
