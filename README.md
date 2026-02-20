Project: PrimeReact DataTable — Art Institute of Chicago (Vite + TypeScript)
Deployed:https://primereact-project-1.onrender.com
This project is a Vite + TypeScript React app using PrimeReact DataTable with server‑side pagination. It displays title, place_of_origin, artist_display, inscriptions, date_start, and date_end. Row selection persists per page and no pages are prefetched.

Key implementation points (requirements checklist)

Vite + TypeScript: Project created with Vite and written in TypeScript.

Server‑side pagination: Data is fetched from the Art Institute API per page (fetchArtworks(page, pageSize)) whenever the paginator changes. Only the current page’s rows are stored in memory.

Displayed fields: title, place_of_origin, artist_display, inscriptions, date_start, date_end.

Row selection: Individual row checkboxes and a header checkbox for “select all on current page” are implemented. A custom OverlayPanel allows selecting the first N rows on the current page.

Persistent selection (important): Selections persist when navigating between pages by storing only the selected row IDs per page in a map (selectedIdsByPage: Record<number, number[]>). When returning to a page, the app refetches that page from the API and restores selection by matching IDs against the freshly fetched rows. No objects or rows from other pages are stored.

No prefetching: The app never fetches or stores rows from pages other than the current page. Bulk selection logic operates only on the current page’s data. This avoids prefetching and prevents memory issues.

Build & deploy: package.json includes "build": "vite build". The publish directory is dist. The app was deployed to [paste provider and URL].

How to run locally

git clone https://github.com/rashi125/PrimeReact-project.

npm install

npm run dev (development)

npm run build then npm run preview (to test production build locally)

How to verify required behaviors :

Open the app and confirm page 1 loads from the API.

Select a few rows on page 1 (individual checkboxes or header “select all”).

Navigate to page 2, then return to page 1 — previously selected rows should still be selected.

Open the overlay panel on any page, enter a number ≤ current page rows, click Apply — the first N rows on that page should become selected.

Confirm network tab shows only the current page API calls (no prefetching of other pages).

Known issues / notes

If any TypeScript warnings appear during development, run npm install to ensure dependencies match package.json.

The header checkbox visual uses an indeterminate state set via a ref and useEffect to reliably reflect partial selection.

Assurance about AI usage

Core application logic (selection persistence strategy, server‑side pagination, and no‑prefetch requirement) was implemented and tested manually.

Only small, non‑logic edits (comments, formatting) were used to improve readability. No automated mass‑generation of core logic was used.
