# Paladin Protocol - Dashboard

Next.js 14 dashboard for monitoring protocol health and risk timeline.

## Features

- Real-time protocol health monitoring
- Risk timeline with all detections
- Alert center for critical threats
- Wallet connection with RainbowKit
- Mobile responsive design
- Paladin-themed dark mode

## Setup

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_GUARDIAN_ADDRESS=0x...
NEXT_PUBLIC_RISK_REGISTRY_ADDRESS=0x...
```

## Structure

```
dashboard/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── ProtocolCard.tsx
│   ├── RiskTimeline.tsx
│   └── AlertCenter.tsx
└── lib/
    ├── wagmi.ts
    └── contracts.ts
```
