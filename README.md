# ChemHub B2B Next Lightweight CMS MVP

This is a Next.js App Router prototype for a chemical reagent B2B catalog with a lightweight file-based admin CMS.

## Features

- Product catalog with sample reagent/standard-product data
- Search by CAS, SKU, Chinese name, English name, formula, or tag
- Category filtering
- Quote/cart flow persisted in `localStorage`
- Admin login
- Admin editing for homepage/site content
- Admin product create/edit/delete
- JSON file storage in `data/site.json` and `data/products.json`
- Responsive B2B-style UI

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Admin Login

Open `http://localhost:3000/admin`.

Default local credentials:

```text
email: admin@example.com
password: admin123456
```

Set these environment variables in production:

```text
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=use-a-long-random-password
```

## Content Storage

This version does not require a database. Content is saved to JSON files:

```text
data/site.json
data/products.json
```

Deploy it on a VPS or lightweight cloud server where the app can write to the filesystem. If using Docker, mount `data/` and `public/uploads/` as persistent volumes.

## Next Backend Steps

- Add image upload to `public/uploads/products`
- Add quote request email sending
- Move JSON storage to Supabase/PostgreSQL when content grows
- Add real customer login and price authorization if needed
- Add product import/export when product volume grows
