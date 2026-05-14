# Project Structure

## Overview

All frontend files have been moved to the `frontend/` directory. The project is now organized with a clear separation of concerns.

## Directory Structure

```
nejah-online-quran-center/
│
├── frontend/                    # Frontend application (React + TanStack)
│   ├── src/
│   │   ├── assets/             # Static assets (images, fonts)
│   │   │   ├── course-*.jpg    # Course images
│   │   │   ├── teacher-*.jpg   # Teacher photos
│   │   │   └── hero-quran.jpg  # Hero section image
│   │   │
│   │   ├── components/
│   │   │   ├── site/          # Landing page components
│   │   │   │   ├── About.tsx
│   │   │   │   ├── CTA.tsx
│   │   │   │   ├── Courses.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── FloatingActions.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── Loader.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── SectionHeader.tsx
│   │   │   │   ├── Teachers.tsx
│   │   │   │   ├── Testimonials.tsx
│   │   │   │   ├── ThemeProvider.tsx
│   │   │   │   └── i18n.ts
│   │   │   │
│   │   │   └── ui/            # Reusable UI components (shadcn/ui)
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       └── ... (50+ components)
│   │   │
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── use-mobile.tsx
│   │   │
│   │   ├── lib/               # Utility functions
│   │   │   ├── error-capture.ts
│   │   │   ├── error-page.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── routes/            # TanStack Router routes
│   │   │   ├── __root.tsx    # Root layout
│   │   │   └── index.tsx     # Home page
│   │   │
│   │   ├── router.tsx         # Router configuration
│   │   ├── routeTree.gen.ts   # Generated route tree
│   │   ├── server.ts          # SSR server entry
│   │   ├── start.ts           # TanStack Start config
│   │   └── styles.css         # Global styles
│   │
│   ├── node_modules/          # Dependencies
│   ├── dist/                  # Build output
│   ├── .gitignore
│   ├── .prettierrc
│   ├── .prettierignore
│   ├── components.json        # shadcn/ui config
│   ├── eslint.config.js       # ESLint config
│   ├── package.json           # Frontend dependencies
│   ├── package-lock.json
│   ├── tsconfig.json          # TypeScript config
│   ├── vite.config.ts         # Vite config
│   ├── wrangler.jsonc         # Cloudflare Workers config
│   └── README.md              # Frontend documentation
│
├── .git/                      # Git repository
├── .gitignore                 # Root gitignore
├── package.json               # Root package.json (convenience scripts)
├── README.md                  # Main project documentation
├── QUICKSTART.md              # Quick start guide
└── STRUCTURE.md               # This file
```

## Key Files

### Frontend Configuration

- **vite.config.ts** - Vite build configuration
- **tsconfig.json** - TypeScript compiler options
- **components.json** - shadcn/ui component configuration
- **eslint.config.js** - Code linting rules
- **wrangler.jsonc** - Cloudflare Workers deployment config

### Source Files

- **src/router.tsx** - TanStack Router setup
- **src/start.ts** - TanStack Start configuration
- **src/server.ts** - SSR server entry point
- **src/styles.css** - Global Tailwind CSS styles

### Routes

- **src/routes/__root.tsx** - Root layout with error boundaries
- **src/routes/index.tsx** - Landing page route

## Component Organization

### Site Components (`src/components/site/`)
Landing page specific components:
- Navigation, Hero, About, Courses, Features
- Teachers, Testimonials, CTA, Footer
- Theme provider and i18n translations

### UI Components (`src/components/ui/`)
Reusable UI components from shadcn/ui:
- Buttons, Cards, Inputs, Dialogs
- Dropdowns, Tooltips, Tabs
- And 50+ more components

## Running the Project

### From Root Directory
```bash
npm run dev      # Start frontend dev server
npm run build    # Build frontend
npm run preview  # Preview production build
```

### From Frontend Directory
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
npm run format   # Format code
```

## Build Output

When you run `npm run build`, the output goes to `frontend/dist/`:
- `dist/client/` - Client-side assets
- `dist/server/` - Server-side rendering files

## Deployment

The frontend can be deployed to:
- **Cloudflare Pages** (recommended, uses wrangler.jsonc)
- **Vercel**
- **Netlify**
- Any static hosting service

Deploy the `frontend/dist/` folder after building.

## Tech Stack

- **React 19** - UI library
- **TanStack Router** - Client-side routing
- **TanStack Start** - Full-stack framework
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Cloudflare Workers** - Edge deployment
