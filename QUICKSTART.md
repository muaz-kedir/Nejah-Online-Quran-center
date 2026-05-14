# Quick Start Guide

## 🚀 Get Started

### Frontend

```bash
cd frontend
npm install  # if needed
npm run dev
```

Open [http://localhost:8080](http://localhost:8080)

### Backend

```bash
cd backend
npm install

# Setup PostgreSQL database and update .env file
cp .env.example .env

npm run start:dev
```

API available at [http://localhost:3000/api](http://localhost:3000/api)

---

## 📦 Available Commands

### Root Directory
```bash
npm run dev              # Start frontend
npm run build            # Build frontend
```

### Frontend Directory
```bash
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview build
npm run lint             # Run linter
```

### Backend Directory
```bash
cd backend
npm install              # Install dependencies
npm run start:dev        # Start dev server
npm run build            # Build for production
npm run start:prod       # Start production server
npm run lint             # Run linter
npm run test             # Run tests
```

---

## 📁 Project Structure

```
nejah-online-quran-center/
├── frontend/              # All frontend code
│   ├── src/
│   │   ├── assets/       # Images
│   │   ├── components/   # React components
│   │   │   ├── site/    # Landing page components
│   │   │   └── ui/      # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities
│   │   ├── routes/       # TanStack Router routes
│   │   └── styles.css    # Global styles
│   ├── package.json
│   └── vite.config.ts
│
├── package.json           # Root package.json (convenience scripts)
└── README.md
```

---

## 🎨 Features

- ✅ Multi-language support (English, Arabic, Amharic)
- ✅ Dark/Light theme
- ✅ Fully responsive
- ✅ Modern UI with Tailwind CSS
- ✅ Fast routing with TanStack Router
- ✅ Smooth animations

---

## 🛠️ Tech Stack

- React 19
- TanStack Router
- Tailwind CSS 4
- TypeScript
- Vite

---

## 📝 Notes

- The frontend is a complete standalone application
- All dependencies are in `frontend/node_modules`
- Build output goes to `frontend/dist`
- The app is ready for deployment to Cloudflare Pages, Vercel, or Netlify
