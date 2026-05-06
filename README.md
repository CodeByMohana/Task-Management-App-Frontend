# FlowBoard Frontend

A production-ready **Trello-inspired Kanban task management** frontend built with **Angular 19**, connecting to the FlowBoard microservices backend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 19+
- Backend API Gateway running on `http://localhost:8080`

### Installation

```bash
cd flowboard-frontend
npm install
npm start
```

App opens at **http://localhost:4200**

---

## 📁 Project Structure

```
src/app/
├── core/
│   ├── guards/          # AuthGuard
│   ├── interceptors/    # AuthInterceptor (JWT cookies + refresh)
│   ├── models/          # TypeScript interfaces (User, Board, Card, etc.)
│   └── services/        # API services (auth, workspace, board, card, comment)
├── features/
│   ├── auth/            # Login + Register (lazy-loaded)
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/       # Homepage with workspace grid
│   ├── workspace/       # Workspace detail + board list
│   ├── board/           # Kanban board + drag-and-drop
│   │   └── card-detail/ # Card modal (comments, labels, attachments)
│   ├── profile/         # User profile & password change
│   └── admin/           # Admin panel (placeholder analytics)
├── shared/
│   └── shell/           # App layout: sidebar + topbar
└── environments/        # Dev / prod API URLs
```

---

## 🔌 API Endpoints Used

| Service | Base Path |
|---------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout` |
| Profile | `GET/PUT /api/auth/profile`, `PUT /api/auth/change-password` |
| Workspaces | `GET/POST /api/workspaces`, `GET /api/workspaces/my` |
| Boards | `GET/POST /api/boards`, `GET /api/boards/workspace/:id` |
| Lists | `POST /api/boards/:id/lists`, `PATCH /api/boards/:id/lists/:id/reorder` |
| Cards | `GET/POST /api/cards`, `PUT /api/cards/:id/move` |
| Comments | `GET/POST /api/comments/cards/:id/comments` |

Authentication uses **HttpOnly JWT cookies** — no token handling in localStorage.

---

## ✨ Features

- **Auth**: Login / Register / Logout / OAuth buttons (Google/GitHub UI)
- **Dashboard**: Workspace grid with stats
- **Workspace**: Board list with create/delete/close/reopen
- **Kanban Board**: Drag-and-drop cards between lists (HTML5 DnD API)
- **Card Detail Modal**: Title, description, priority, status, due date, comments (threaded), attachments, cover color
- **Dark Mode**: Toggle in sidebar
- **Notifications**: UI placeholder (notification service not implemented in backend)
- **Admin Panel**: User management table + analytics placeholders

---

## ⚙️ Environment Config

**Dev** (`src/environments/environment.ts`):
```ts
apiUrl: 'http://localhost:8080'
```

**Production** (`src/environments/environment.prod.ts`):
```ts
apiUrl: 'http://54.206.167.226:8080'
```

---

## 🔧 Build

```bash
npm run build          # Development build
npm run build -- --configuration=production  # Production build
```

---

## 📝 Known Placeholders

| Feature | Status |
|---------|--------|
| Notification service | ⚠️ Mock data only — backend not implemented |
| Admin analytics | ⚠️ Placeholder numbers — no analytics API |
| OAuth (Google/GitHub) | ✅ UI links to `/oauth2/authorization/google|github` |
| Label service | ✅ `/api/labels/**` route exists — UI can be extended |

---

## 🏗️ Architecture Notes

- **Standalone components** with lazy loading for all routes
- **Angular Signals** for reactive state management
- **HTTP Interceptor** handles `withCredentials` + auto refresh on 401
- **Optimistic UI**: Card drag-and-drop updates UI instantly, rolls back on API error
- All field names match backend DTOs exactly (`cardId`, `boardId`, `workspaceId`, etc.)
