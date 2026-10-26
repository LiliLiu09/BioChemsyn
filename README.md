# BioChemSyn / KASONS

The BioChemSyn / KASONS B2B website for research chemicals and biochemical products. It includes a bilingual public website, product and article search, quotation workflows, a content management system, database-backed administrator authentication, and website analytics.

- Production website: `https://biochemsyn.com`
- Admin login: `https://biochemsyn.com/admin/login`
- GitHub: `https://github.com/LiliLiu09/BioChemsyn`

## Features

### Public website

- Chinese and English language switching, with English routes under `/en`
- Product catalog and category browsing
- Search by CAS number, catalog number, product name, or synonym
- Product, news, and information article detail pages
- Quotation cart and quotation request form
- Quotation notification emails through Resend
- Responsive layouts and SEO metadata

### Admin CMS

- Homepage, About Us, and Contact Us content management
- Product creation, Excel/CSV import, drafts, bulk publishing, soft deletion, restoration, filtering, and sorting
- Bilingual news and information article management
- Quotation status and sales-note management
- Database-backed administrator accounts with password hashing
- Daily, 7-day, and 30-day traffic summaries and popular-page reports

## Technology stack

- Next.js 15 App Router
- React 19 and TypeScript
- Supabase Postgres, Storage, and Row Level Security
- Resend email delivery
- AWS Lightsail, Nginx, systemd, and Let's Encrypt
- Vercel as an optional deployment environment

## Project structure

```text
app/                    Next.js pages and API routes
components/             Public and admin UI components
data/                   Local JSON fallback data
lib/                    CMS, database, authentication, email, and i18n logic
public/                 Static assets
scripts/                Database and data-migration scripts
supabase/               Database schema and migration SQL
middleware.ts           Chinese and English route handling
```

## Environment variables

Copy `.env.example` to `.env.local` and enter the real values. Never commit `.env.local`, database passwords, the Supabase service-role key, or the Resend API key.

```env
NEXT_PUBLIC_SITE_URL=https://biochemsyn.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
SALES_EMAIL=support@biochemsyn.com
RESEND_API_KEY=
MAIL_FROM="KASONS Biochemicals <support@biochemsyn.com>"
```

Notes:

- `NEXT_PUBLIC_*` values are exposed to the browser and must contain public configuration only.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `RESEND_API_KEY` are server-only secrets.
- `DATABASE_URL` is used for direct Postgres access, database scripts, and efficient server-side queries.
- `SUPABASE_SERVICE_ROLE_KEY` is used for CMS writes and Storage uploads.
- Verify `biochemsyn.com` in Resend before sending from `support@biochemsyn.com`.

## Local development

Requirements: Node.js 20 or later and npm.

```powershell
cd D:\chem-b2b-next
npm install
npm run dev
```

Open:

- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

Common commands:

```powershell
npm run dev              # Start the development server
npm run build            # Build for production and run type validation
npm run start            # Start the production build
npm run db:apply-schema  # Apply supabase/schema.sql through DATABASE_URL
npm run db:migrate-json  # Migrate local JSON data to Supabase
```

## Supabase database

Primary tables:

- `products`
- `news_articles`
- `info_articles`
- `site_content`
- `quotes`
- `admin_users`
- `admin_sessions`
- `page_views_daily`

For a new environment, configure `DATABASE_URL` and run:

```powershell
npm run db:apply-schema
```

For an existing environment, run the required migrations in the Supabase SQL Editor. Each migration normally needs to be applied only once:

```text
supabase/product-status-migration.sql
supabase/bilingual-content-migration.sql
supabase/admin-auth-migration.sql
supabase/page-views-migration.sql
```

`schema.sql` contains the complete database structure. The migration files upgrade an existing database. Do not rerun migrations during every deployment.

## Administrator accounts

There is no public administrator registration page. Administrator email addresses and hashed passwords are stored in the database; plaintext passwords are never stored in the source code.

Create or update an administrator in the Supabase SQL Editor:

```sql
insert into public.admin_users (email, password_hash)
values (
  'your-admin@example.com',
  extensions.crypt('replace-with-a-strong-password', extensions.gen_salt('bf', 12))
)
on conflict ((lower(email))) do update
set password_hash = excluded.password_hash,
    active = true,
    updated_at = now();
```

After changing a password, invalidate that administrator's existing sessions:

```sql
delete from public.admin_sessions
where user_id = (
  select id
  from public.admin_users
  where lower(email) = lower('your-admin@example.com')
);
```

Unauthenticated requests to `/admin` or any protected admin page are redirected to `/admin/login`.

## Page-view analytics and database egress optimization

- `PageViewTracker` counts approved public pages only; admin and API routes are excluded.
- Repeated visits to the same path from the same browser within a short interval are deduplicated.
- Data is aggregated by normalized path and Australia/Perth date in `page_views_daily`. Visitor IP addresses are not stored.
- The admin analytics page is available at `/admin/analytics`.
- Public products, news, information articles, and site content use server-side caching with tag-based invalidation after admin saves.
- List pages select only required fields, detail pages query by ID or slug, and search results are bounded to reduce Supabase Shared Pooler Egress.

Before deploying analytics, confirm that this migration has been applied:

```text
supabase/page-views-migration.sql
```

## Redeploying on AWS Lightsail

Server project directory:

```text
/var/www/biochemsyn/BioChemsyn
```

Connect to the server over SSH and run:

```bash
cd /var/www/biochemsyn/BioChemsyn

# Check for local server changes before pulling
git status --short

# Continue only when the previous command prints nothing
git pull --ff-only origin main
npm install
npm run build

# Restart the service only after a successful build
sudo systemctl restart biochemsyn
sudo systemctl status biochemsyn --no-pager

# Verify the Node service and the public HTTPS endpoint
curl -I http://127.0.0.1:3000
curl -I https://biochemsyn.com
```

Routine deployments do not require rebooting the Lightsail instance.

If `biochemsyn.service` does not exist, locate the actual service name:

```bash
sudo systemctl list-units --type=service --all | grep -Ei 'biochem|next|node'
```

Inspect application or Nginx logs:

```bash
sudo journalctl -u biochemsyn -n 100 --no-pager
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

## Domain and HTTPS

Recommended GoDaddy DNS records:

```text
A      @      <Lightsail static public IP>
CNAME  www    biochemsyn.com
```

Attach a static IP to the Lightsail instance so that the public IP does not change after a restart. Allow inbound TCP traffic on ports `80` and `443`.

The Nginx site configuration must include both hostnames:

```nginx
server_name biochemsyn.com www.biochemsyn.com;
```

Validate Nginx, then request or reinstall the certificate:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d biochemsyn.com -d www.biochemsyn.com
sudo certbot renew --dry-run
```

If Certbot reports `duplicate listen options`, inspect `/etc/nginx/sites-enabled/` for duplicate `listen 443` directives or duplicate enabled sites. Fix the configuration and rerun `sudo nginx -t` before requesting another certificate.

## Resend email delivery

To send quotation emails from `support@biochemsyn.com`:

1. Add and verify `biochemsyn.com` in Resend.
2. Add the Resend DKIM, SPF/MX, and optional DMARC records in GoDaddy.
3. After Resend reports that the domain is verified, set `RESEND_API_KEY`, `MAIL_FROM`, and `SALES_EMAIL`.
4. Restart the application service so the environment variables take effect.

`onboarding@resend.dev` is intended for testing and can normally send only to the Resend account owner's email address.

## Git workflow

```powershell
git status --short --branch
git switch -c codex/feature-name

# Make and validate changes
npm run build

git add <relevant-files>
git commit -m "Describe the change"
git push origin HEAD:main
```

Before committing, confirm that `.env.local`, secrets, temporary spreadsheets, exports, and unrelated changes are not staged. Do not use `git reset --hard` to clean a working directory that may contain important work.

## Deployment checklist

- `npm run build` succeeds.
- Homepage, product, news, information, and search pages load correctly.
- `/en` and English detail pages load correctly.
- Unauthenticated admin requests redirect to the login page.
- Administrators can sign in, save content, and upload images.
- Draft and deleted products are excluded from the public website.
- Quotation requests are stored and notification emails are sent.
- `/admin/analytics` displays page-view data.
- The certificate for `https://biochemsyn.com` is valid and HTTP redirects to HTTPS.

## Troubleshooting

### Admin saves fail

Check `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, required database migrations, and the Supabase project status.

### Old content remains visible after deployment

Confirm that the server pulled the latest `main`, completed a successful build, and restarted the correct systemd service. Admin saves invalidate the relevant application cache, but an external CDN or browser cache may still need to be refreshed.

### Images work locally but not in production

Do not reference files that exist only on a local computer. Product and article images must either be committed static assets under `public/` or uploaded to Supabase Storage with their public URLs saved in the CMS.

### Supabase Egress is too high

Check whether list pages fetch article bodies or other large fields, whether full tables are repeatedly loaded, whether requests bypass the cache, and whether pages issue repeated requests within a short interval. After deploying the current caching and targeted-query implementation, monitor Shared Pooler Egress during the next billing period.
