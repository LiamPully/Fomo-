# Fomo Markets

A mobile-first web app for discovering local events, markets, and happenings in South Africa.

## Features

- Browse events by category (Market, Event, Fun, Other)
- Filter by time period (Today, This Week, This Month, All)
- Event detail pages with contact info
- Business Hub for event creators
- Subscription system for businesses

## Tech Stack

- React 18
- Vite
- Supabase (Database + Auth + Storage)
- Inline CSS (no framework)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase (see SUPABASE_SETUP.md):
   - Create project at supabase.com
   - Run database schema
   - Add environment variables

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
```

This creates a `dist` folder ready for deployment.

## Demo Accounts

- **Free user**: `free@demo.com` / `demo`
- **Paid user**: `paid@demo.com` / `demo`

## Deployment

### Option 1: Vercel (Recommended - Free)
1. Push to GitHub
2. Connect to Vercel
3. Auto-deploys on every push

### Option 2: Netlify (Free)
1. Run `npm run build`
2. Drag `dist` folder to Netlify

### Option 3: GoDaddy
1. Run `npm run build`
2. Upload `dist` folder contents to GoDaddy hosting

## Project Structure

```
happenings/
├── index.html          # Main HTML file
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── README.md           # This file
└── src/
    ├── main.jsx        # Entry point
    └── App.jsx         # Main app component
```

## Notes

- Mobile-first design (optimized for 430px width)
- Uses Google Fonts (Sora)
- Mock data for demo purposes
- Subscription integration ready for PayFast
