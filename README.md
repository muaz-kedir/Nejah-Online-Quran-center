# Nejah Online Quran Center

A comprehensive online platform for Quran and Islamic education with personalized one-on-one classes.

## Project Structure

```
nejah-online-quran-center/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── assets/       # Images and static files
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   ├── routes/       # TanStack Router routes
│   │   └── styles.css    # Global styles
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm or yarn

### Installation & Development

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

In the `frontend` directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 🌐 Multi-language support (English, Arabic, Amharic)
- 🌙 Dark/Light theme toggle
- 📱 Mobile-first design
- ⚡ Fast client-side routing with TanStack Router
- 🎭 Smooth animations with Framer Motion
- 📚 Comprehensive course catalog
- 👨‍🏫 Teacher profiles
- 💬 Student testimonials
- 📞 Contact forms

## Tech Stack

- **Framework**: React 19
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Build Tool**: Vite
- **Language**: TypeScript

## Deployment

The frontend can be deployed to:
- Cloudflare Pages
- Vercel
- Netlify
- Any static hosting service

```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact us at hello@nejah.com
