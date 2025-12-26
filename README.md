# Scoreboardtools - Splash Page

A minimal Next.js splash page for Scoreboardtools, showcasing live scoreboard overlays for esports streaming.

## Quick Start

1. Install dependencies: `pnpm install` (or `npm install`)
2. Run the development server: `pnpm dev` (or `npm run dev`)
3. Open http://localhost:3000 to view the splash page

## Environment Variables

Optional environment variables (create a `.env.local` file):

```bash
# Optional: Base URL for images (defaults to https://scoreboardtools.com/images)
NEXT_PUBLIC_IMAGE_BASE_URL=https://scoreboardtools.com/images

# Optional: Site URL (defaults to https://scoreboardtools.com)
# For local development: Leave unset or use http://localhost:3000
# For production: Set to your production URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Splash image padding (for fine-tuning the hero image position)
NEXT_PUBLIC_SPLASH_IMAGE_PADDING_TOP=0px
```

## What's Included

- **Splash Page** (`/`) - Landing page showcasing Scoreboardtools features
- Responsive design with Tailwind CSS
- SEO-optimized metadata
- Structured data for search engines

## Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
app/
  (site)/
    page.tsx      # Splash page
    layout.tsx    # Site layout
  layout.tsx      # Root layout
  globals.css     # Global styles
```
