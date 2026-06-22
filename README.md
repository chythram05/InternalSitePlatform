# Internal Sites

Deploy internal static sites behind Cloudflare Access using [Cloudflare Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/) and [D1](https://developers.cloudflare.com/d1/).

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/internal-sites-template)

<!-- dash-content-start -->

Internal Sites gives employees a simple deployment portal for company-only static sites. Upload a folder or ZIP file with an `index.html`, and the platform publishes it to a protected URL such as `https://team-handbook.internal-company.com`.

## Features

- **Deployment portal** - Upload a folder or ZIP file from `/deploy`.
- **Static site hosting** - Publishes HTML, CSS, JavaScript, images, and other static assets using Workers static assets.
- **Workers for Platforms** - Each internal site is deployed as a script in a dispatch namespace.
- **Company sign-in** - Requests require Cloudflare Access identity headers before users can deploy or view sites.
- **D1 metadata** - Stores site ownership and deployment history.
- **Admin view** - Inspect sites, deployments, and dispatch namespace scripts from `/admin`.

## How It Works

1. **Upload** - A signed-in user opens `/deploy`, enters a site name and slug, then uploads a folder or ZIP file.
2. **Validate** - The Worker validates the slug, file count, file sizes, and root `index.html`.
3. **Deploy** - Static assets are uploaded through the Cloudflare Workers assets API, then attached to a Worker in the dispatch namespace.
4. **Route** - Requests for `slug.SITE_DOMAIN` are dispatched to the matching site Worker.
5. **Protect** - Cloudflare Access protects both the deployment portal and deployed internal sites.

## Bindings Used

- **dispatcher** (Workers for Platforms) - Routes requests to deployed internal site Workers.
- **DB** (D1) - Stores site records and deployment metadata.

<!-- dash-content-end -->

## Getting Started

Outside of this repository, you can start a new project with this template using [C3](https://developers.cloudflare.com/pages/get-started/c3/):

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/internal-sites-template
```

You can also click the **Deploy to Cloudflare** button above after this template is published in `cloudflare/templates`.

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create the Dispatch Namespace

Deploy to Cloudflare provisions the D1 database and binds it to the Worker automatically. You do not need to create a D1 database before clicking the deploy button.

Create the Workers for Platforms dispatch namespace if you are deploying manually with Wrangler:

```bash
npx wrangler dispatch-namespace create internal-sites-template
```

### 3. Configure Variables and Secrets

Set these values in `wrangler.toml`:

| Variable | Description |
| --- | --- |
| `ACCOUNT_ID` | Cloudflare account ID that owns the dispatch namespace. |
| `DISPATCH_NAMESPACE_NAME` | Dispatch namespace name. Must match the namespace binding. |
| `SITE_DOMAIN` | Domain used for internal sites, for example `internal-company.com`. |
| `DISABLE_ACCESS_IDENTITY_CHECK` | Use `true` only for local testing without Cloudflare Access. |

Create the API token secret:

```bash
npx wrangler secret put DISPATCH_NAMESPACE_API_TOKEN
```

The token needs this permission on your account:

```txt
Account: Workers Scripts: Edit
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill in your values.

If you are not using Deploy to Cloudflare, create a D1 database manually and update the `database_id` in `wrangler.toml`:

```bash
npx wrangler d1 create internal-sites-template
```

### 4. Configure Cloudflare Access

Create a Cloudflare Access self-hosted application for the deployed Worker.

Protect both the deployment portal and internal site URLs:

```txt
https://internal-company.com/deploy*
https://*.internal-company.com/*
```

Allow your company users through your identity provider. Without Access, the Worker returns `401` unless `DISABLE_ACCESS_IDENTITY_CHECK=true`.

### 5. Configure Domain Routing

Add Worker routes for the deployment portal and wildcard internal site hostnames:

```toml
routes = [
  { pattern = "internal-company.com/deploy*", zone_name = "internal-company.com" },
  { pattern = "*.internal-company.com/*", zone_name = "internal-company.com" }
]
```

Create proxied DNS records for:

```txt
internal-company.com
*.internal-company.com
```

### 6. Deploy

```bash
npm run deploy
```

Open the deployment portal at:

```txt
https://internal-company.com/deploy
```

## Local Development

For local testing without Cloudflare Access, set this in `.dev.vars`:

```ini
DISABLE_ACCESS_IDENTITY_CHECK=true
```

Then run:

```bash
npm run dev
```

In local/demo mode, deployed site URLs use path routing:

```txt
/sites/site-name/
```

Production deployments should use wildcard subdomains:

```txt
https://site-name.internal-company.com
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Creates the dispatch namespace if needed, then starts `wrangler dev --remote`. |
| `npm run deploy` | Creates the dispatch namespace if needed, then deploys the Worker. |
| `npm run check` | Runs TypeScript and ESLint checks. |
| `npm run setup` | Creates the configured dispatch namespace if it does not already exist. |

## Troubleshooting

| Problem | Solution |
| --- | --- |
| `Company sign-in is required` | Configure Cloudflare Access or set `DISABLE_ACCESS_IDENTITY_CHECK=true` for local development only. |
| `Dispatch namespace not found` | Confirm the namespace exists and `DISPATCH_NAMESPACE_NAME` matches `wrangler.toml`. |
| `Could not create asset upload session` | Confirm `ACCOUNT_ID` is set and `DISPATCH_NAMESPACE_API_TOKEN` has `Account: Workers Scripts: Edit`. |
| `Static site must include a root index.html file` | Upload a folder or ZIP with `index.html` at the site root. |
| Site returns 404 | Confirm the D1 site row exists and a Worker with the same slug exists in the dispatch namespace. |

View logs with:

```bash
npx wrangler tail
```

## Prerequisites

- Cloudflare account with Workers for Platforms access.
- Domain managed by Cloudflare for production wildcard routing.
- Cloudflare Access configured for company sign-in.
- Node.js 18 or newer.

## Learn More

- [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/)
- [Workers static assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/)
- [D1](https://developers.cloudflare.com/d1/)
- [Hono](https://hono.dev/)

## License

Apache-2.0
