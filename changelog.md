# Changelog

## 2025-01-27

### Added
- **Vercel Deployment Configuration**
  - Created `vercel.json` configuration file with proper build settings
  - Configured SPA routing with rewrites to handle client-side routing
  - Updated README.md with comprehensive Vercel deployment instructions
  - Added instructions for both GitHub integration and CLI deployment methods
  - Documented environment variable configuration for Vercel

### Configuration Details
- Build command: `npm run build`
- Output directory: `dist` (Vite default)
- Framework: Vite (auto-detected by Vercel)
- SPA routing: All routes rewrite to `/index.html` for client-side routing

