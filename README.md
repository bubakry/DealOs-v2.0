# DealOs v2.0

DealOs v2.0 is a React + TypeScript app for sourcing, qualifying, and managing real estate listings in one workflow.

It combines:

- Listing inventory management
- Pipeline stage tracking
- CSV import + field mapping
- Deal analysis calculators (Assignment, Seller Finance, Subject-To)
- AI-assisted motivation scoring and outreach scripts (Gemini)

## What You Can Do

1. Track inventory in `grid`, `list`, or `board` view.
2. Filter by search, DOM range, stage, and hot/pipeline/equity metrics.
3. Add or edit listings with built-in validation.
4. Import listings from CSV with column mapping.
5. Open each deal drawer to update stage/notes, run strategy analyzers, and generate AI motivation + outreach scripts.

## Add/Edit Listing Validation

`components/DealFormModal.tsx`

Validation currently enforces:

- Required: address, city, state, zip, price, beds, baths, sqft, DOM, list date
- ZIP format: `12345` or `12345-6789`
- Email format validation if provided
- URL validity if provided (auto-normalizes `https://`)
- Numeric checks (price/sqft > 0, beds/baths/DOM >= 0)
- Duplicate prevention by `address+zip` or `url`

## CSV Import

`components/UploadModal.tsx`

Required mappings:

- `address`
- `price`
- `status`

Optional mappings include city/state/zip, beds, baths, sqft, DOM, list date, URL, agent fields, and remarks.

Import behavior:

- Auto-guesses mappings from header names
- Calculates DOM from list date when DOM is missing
- Drops invalid rows missing address or price
- Merges with existing records by `url` (fallback: `address`)

## AI Features

`services/ai.ts`

Supported key sources:

- `GEMINI_API_KEY`
- `VITE_GEMINI_API_KEY`
- `API_KEY`
- `VITE_API_KEY`

Model fallback order:

- `gemini-3-flash-preview`
- `gemini-2.5-flash`
- `gemini-2.0-flash`

If AI fails, the app degrades gracefully and shows an error message in the drawer.

## Data Storage

`services/storage.ts`

Deals are persisted in browser `localStorage` under key:

- `dealos_deals`

## Tech Stack

- React 19
- TypeScript
- Vite
- Framer Motion
- PapaParse
- Lucide React
- Google GenAI SDK

## Local Development

Prerequisites:

- Node.js 18+
- npm

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

3. Start development server:

```bash
npm run dev
```

4. Open:

- `http://localhost:5173`

## Build and Preview

```bash
npm run build
npm run preview
```

## Project Structure

```text
.
├── App.tsx
├── components/
│   ├── DealFormModal.tsx
│   ├── DealDrawer.tsx
│   ├── UploadModal.tsx
│   ├── BoardView.tsx
│   ├── UniversalAnalyzer.tsx
│   └── Analyzers.tsx
├── services/
│   ├── ai.ts
│   └── storage.ts
├── types.ts
└── prisma/
```
