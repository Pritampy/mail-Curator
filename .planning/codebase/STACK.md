# Technology Stack

**Analysis Date:** 2026-03-28

## Languages

**Primary:**
- TypeScript ~5.8.2 - Used throughout frontend and backend
- JavaScript/JSX - React components

## Runtime

**Environment:**
- Node.js (via tsx for development)
- Browser (React SPA)

**Package Manager:**
- npm (package-lock.json present)

## Frameworks

**Frontend:**
- React 19.0.0 - UI framework
- React Router 7.13.2 - Client-side routing (imported but not actively used in this app)
- Vite 6.2.0 - Build tool and dev server

**Backend:**
- Express 4.21.2 - HTTP server and API layer
- Vite middleware mode - Serves frontend in development

**Styling:**
- TailwindCSS 4.1.14 - Utility-first CSS framework
- @tailwindcss/vite 4.1.14 - Vite plugin for Tailwind

## Key Dependencies

**React Ecosystem:**
- react 19.0.0 - Core UI library
- react-dom 19.0.0 - React DOM renderer
- react-router-dom 7.13.2 - Routing

**UI & Visualization:**
- recharts 3.8.1 - Charting library for stats dashboard
- motion 12.23.24 - Animation library (formerly Framer Motion)
- lucide-react 0.546.0 - Icon library

**Google APIs:**
- @google/genai 1.29.0 - Gemini AI SDK
- googleapis 171.4.0 - Google API client library (Gmail API)

**Backend Utilities:**
- express 4.21.2 - Web framework
- cors 2.8.6 - CORS middleware
- cookie-session 2.1.1 - Session management
- dotenv 17.2.3 - Environment variable loading

**Development Tools:**
- vite 6.2.0 - Build tool
- tsx 4.21.0 - TypeScript executor for Node
- tailwindcss 4.1.14 - Styling
- typescript ~5.8.2 - Language

## Configuration

**Environment:**
- `.env.example` - Template for required environment variables
- Environment variables loaded via `dotenv` in `server.ts`
- Runtime injection by AI Studio platform (GEMINI_API_KEY, APP_URL)

**Build:**
- `vite.config.ts` - Vite configuration with React and Tailwind plugins
- `tsconfig.json` - TypeScript configuration with path alias `@/*`
- Path alias: `@/*` maps to project root

**Key build configurations:**
- `@tailwindcss/vite` plugin for Tailwind v4
- `process.env.GEMINI_API_KEY` injected into bundle via Vite define
- HMR can be disabled via `DISABLE_HMR` env var

## Platform Requirements

**Development:**
- Node.js with npm
- Run via `npm run dev` (uses tsx to run server.ts)
- Vite middleware mode for HMR

**Production:**
- Build via `npm run build` (generates `dist/`)
- Serve static files from `dist/` directory
- Express serves `index.html` for all routes (SPA mode)

---

*Stack analysis: 2026-03-28*
