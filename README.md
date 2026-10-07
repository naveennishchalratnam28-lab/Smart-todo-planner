# Smart To-Do Planner (MERN Stack)

A production-grade, full-stack **MERN** (MongoDB, Express.js, React, Node.js) web application with an automated **Smart Prioritization Algorithm** and **Practical Daily Plan Generator**.

---

## Key Features

1. **JWT & Bcrypt Authentication**: Secure registration, login, token refresh, and strict per-user data isolation.
2. **Task Management (CRUD)**: Title, description, priority (Low/Medium/High), deadline date+time, estimated effort (hours), category tags, status (Pending/In Progress/Done), and hours completed.
3. **Smart Prioritization Algorithm**:
   - Priority weight (High=35, Medium=20, Low=10).
   - Dynamic deadline urgency (exponential urgency decay as deadline approaches, instant critical boost for overdue tasks).
   - Effort pressure boost (large tasks with high effort-to-runway ratios get boosted early to avoid last-minute panic).
   - Informative badge rationale explaining why every task ranks where it does.
   - Eisenhower Matrix classification (Q1: Do First, Q2: Schedule, Q3: Delegate/Quick, Q4: Backlog).
4. **Practical Plan Generator**:
   - Day-by-day workload scheduler respecting user daily hours and active working days.
   - **Autonomous task chunking**: Large tasks (e.g. 10h task due in 5 days) are cleanly split across working days.
   - **Emergency buffer protection**: Reserves 15–20% buffer capacity each day for emergencies.
   - Never schedules work past a task's deadline date.
   - Detects bottlenecks: Overloaded days, deadline slips, and capacity deficits, providing 1-click automatic remedies.
   - Checkbox progress logging: Direct progress logging from the schedule that syncs `hoursCompleted` to the database.
5. **Dashboard & Analytics**:
   - Today's Focus (Top 3 prioritized tasks).
   - Weekly workload capacity vs. scheduled hours.
   - Recharts workload-per-day visualization with daily capacity limit line.
   - Overdue count & completion rate.
6. **Natural Language Quick Add**:
   - Powered by `chrono-node` (e.g. *"Finish report by Friday 5pm, 3 hours, high priority #work"*).
7. **UI/UX**:
   - Tailwind CSS with responsive mobile-first layout.
   - Light and Dark modes.
   - Confetti celebration upon completing tasks.
   - Kanban board view, List view, and Eisenhower Matrix view.

---

## Folder Structure

```
├── .env.example                  # Environment configuration template
├── package.json                  # Root dependencies and scripts
├── server.ts                     # Full-stack Express server + Vite middleware
├── server/
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── db.ts                     # MongoDB Mongoose connection + persistent repository
│   ├── models/
│   │   ├── User.ts               # Mongoose User model with settings
│   │   └── Task.ts               # Mongoose Task model with userId and deadline indexes
│   ├── services/
│   │   ├── planner.service.ts    # Core prioritization & day-by-day scheduler
│   │   └── parser.service.ts     # Natural language task parser (chrono-node)
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT token authentication
│   │   └── error.middleware.ts   # Centralized error handler
│   ├── controllers/
│   │   ├── auth.controller.ts    # Auth endpoints & settings
│   │   ├── task.controller.ts    # Task CRUD & bulk actions
│   │   └── planner.controller.ts # Schedule generator & progress logging
│   ├── routes/
│   │   ├── auth.routes.ts        # /api/auth routes
│   │   ├── task.routes.ts        # /api/tasks routes
│   │   └── planner.routes.ts     # /api/planner routes
│   └── seed.ts                   # Standalone database seed script
├── test/
│   └── planner.test.ts           # Unit test suite for prioritization & scheduling
├── src/                          # React client application
│   ├── types.ts                  # Client types
│   ├── index.css                 # Global CSS and Tailwind directives
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main layout and application container
│   ├── services/
│   │   └── api.ts                # Axios client with JWT interceptors
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth & settings provider
│   │   └── PlannerContext.tsx    # Tasks & schedule state provider
│   ├── components/
│   │   ├── Navbar.tsx            # Header with search, quick add, and replan
│   │   ├── Sidebar.tsx           # Tab navigation and badges
│   │   ├── TaskCard.tsx          # Task card with progress bar and quick log
│   │   ├── TaskForm.tsx          # Natural language quick add & manual form modal
│   │   ├── PriorityBadge.tsx     # Color-coded badge with score reason tooltip
│   │   ├── WorkloadChart.tsx     # Recharts workload per day chart
│   │   ├── FilterBar.tsx         # Search, status, priority, category filters
│   │   ├── DayColumn.tsx         # Daily column in planner timeline
│   │   ├── PlanTimeline.tsx      # Today view, weekly timeline, and list view
│   │   ├── EisenhowerMatrix.tsx  # 4-quadrant Eisenhower view
│   │   └── Toast.tsx             # Notification toast alerts
│   └── pages/
│       ├── DashboardPage.tsx     # KPI metrics, Today's Focus, Workload chart
│       ├── TasksPage.tsx         # Task manager (List, Kanban, Eisenhower)
│       ├── PlannerPage.tsx       # Interactive practical daily plan
│       ├── SettingsPage.tsx      # Daily hours, working days, buffer percentage
│       ├── LoginPage.tsx         # Sign in with 1-click demo login
│       └── RegisterPage.tsx      # Account creation
```

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js >= 18.x
- (Optional) MongoDB instance or MongoDB Atlas connection string. If omitted, the app runs automatically with its built-in embedded persistent JSON repository!

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your variables:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/smart_todo_planner
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Demo Data
Populate demo user (`demo@smartplanner.io` / `password123`) and 8 realistic tasks:
```bash
npm run seed
```

### 5. Run Unit Tests
Execute unit tests for the prioritization scoring, deadline urgency decay, and effort chunking:
```bash
npm test
```

### 6. Start the Application
Run the full-stack development server:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## API Documentation

### Authentication (`/api/auth`)

#### `POST /api/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "password": "password123"
  }
  ```
- **Response (201)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "_id": "user_1727768...",
      "name": "Alex Rivera",
      "email": "alex@example.com",
      "settings": {
        "dailyHours": 6,
        "workingDays": [1, 2, 3, 4, 5],
        "startTime": "09:00",
        "bufferPercent": 15
      }
    }
  }
  ```

#### `POST /api/auth/login`
Authenticates a user.
- **Request Body**:
  ```json
  {
    "email": "demo@smartplanner.io",
    "password": "password123"
  }
  ```
- **Response (200)**: Returns `token` and `user` object.

#### `GET /api/auth/me`
Returns the authenticated profile. (Requires `Authorization: Bearer <token>`).

#### `PUT /api/auth/settings`
Updates planner algorithm settings (daily working hours, working days, buffer percentage).
- **Request Body**:
  ```json
  {
    "dailyHours": 7,
    "workingDays": [1, 2, 3, 4, 5],
    "bufferPercent": 20
  }
  ```

---

### Task Management (`/api/tasks`)
*(All endpoints require `Authorization: Bearer <token>`)*

#### `GET /api/tasks`
Returns user tasks with calculated dynamic `priorityScore`, `scoreReason`, and `quadrant`.
- **Query Parameters**:
  - `status`: `all` | `Pending` | `In Progress` | `Done`
  - `priority`: `all` | `High` | `Medium` | `Low`
  - `category`: string filter
  - `search`: title or description keyword
  - `sortBy`: `score` | `deadline` | `effort` | `title`

#### `POST /api/tasks`
Creates a new task.
- **Request Body**:
  ```json
  {
    "title": "Build Architecture Whitepaper",
    "description": "Multi-day design paper for distributed scheduling system.",
    "priority": "High",
    "deadline": "2026-10-06T17:00:00.000Z",
    "estimatedEffort": 10.0,
    "category": "Engineering",
    "status": "Pending",
    "hoursCompleted": 0
  }
  ```

#### `POST /api/tasks/parse`
Parses natural language task prompt via `chrono-node`.
- **Request Body**:
  ```json
  {
    "text": "Finish audit report by Friday 5pm, 3.5 hours, high priority #security"
  }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "parsed": {
      "title": "Audit report",
      "deadline": "2026-10-02T17:00:00.000Z",
      "estimatedEffort": 3.5,
      "priority": "High",
      "category": "Security"
    }
  }
  ```

#### `PUT /api/tasks/:id`
Updates task details, deadline, or logs progress hours.

#### `DELETE /api/tasks/:id`
Deletes a task.

#### `PUT /api/tasks/bulk`
Bulk updates tasks (e.g. mark multiple as Done).
- **Request Body**: `{ "taskIds": ["id1", "id2"], "updates": { "status": "Done" } }`

#### `DELETE /api/tasks/bulk`
Bulk deletes tasks.

---

### Planner & Scheduling (`/api/planner`)

#### `GET /api/planner/schedule`
Executes the practical scheduling algorithm and returns:
- `dailyPlans`: 14-day schedule with allocated chunks, daily capacity, buffer reservation, and overloaded flags.
- `warnings`: Actionable warnings (e.g. overloaded days, tasks that cannot fit before deadline).
- `summary`: Total planned tasks, remaining hours, capacity utilization rate.

#### `POST /api/planner/progress`
Logs progress directly on a task chunk from the schedule:
- **Request Body**:
  ```json
  {
    "taskId": "task_big",
    "hoursLogged": 2.0,
    "markDone": false
  }
  ```

#### `POST /api/planner/seed`
Resets and seeds demo tasks for the authenticated user.

---

## Deployment Guide

### Option 1: Render / Railway (Recommended for Full-Stack)
1. Push code to your GitHub repository.
2. Create a free **MongoDB Atlas** cluster and obtain your connection string:
   `mongodb+srv://<username>:<password>@cluster.mongodb.net/smartplanner?retryWrites=true&w=majority`
3. In **Render** or **Railway**:
   - Create a new **Web Service**.
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     - `PORT`: `3000`
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: `<generate-random-32-char-string>`
     - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
4. Deploy! The service will build the Vite assets and serve both the API and client from `server.ts`.

### Option 2: Vercel (Frontend) + Render (API)
- Deploy `/server` to Render as a Node Web Service.
- Set `VITE_API_URL` to your Render API domain.
- Deploy the root to Vercel with output directory `dist`.
