# Frontend Integration Guide

> Guide for frontend developers integrating with the RevealV3 backend. For exact endpoint payload shapes and backend internals, see [`CLAUDE.md`](./CLAUDE.md).

## Project Overview

RevealV3's backend is a single FastAPI application running behind an AWS Lambda **Function URL** (a plain HTTPS endpoint — no API Gateway, no custom domain). Auth is Cognito JWT bearer tokens. Two datastores back the API: DynamoDB (mostly not yet exposed — see below) and PostgreSQL (Store/Product, fully live).

**Important for frontend work right now:** most of the historically-documented API surface (projects, requests, retailers, hierarchies, uploads — described in the backend's `doc.txt`) is **currently disabled** server-side. Only a small set of user-management endpoints plus the full Store/Product CRUD API are actually callable today. Don't build against endpoints from old documentation without first confirming they're live (ask backend, or check CLAUDE.md → "API").

## Backend Architecture Summary

What you actually need to know:
- One base URL for everything (the Lambda Function URL) — no versioning, no per-feature subdomains.
- CORS is wide open (`*` origins/methods/headers) — no proxy or special CORS handling needed from the frontend.
- Every endpoint except health-check-style routes requires a Cognito bearer token.
- Responses are plain JSON; there is **no single universal response envelope** — see "Response Format" below.
- All Store/Product endpoints are synchronous request/response (no polling, no job IDs). Some historical user/project endpoints use a "start → process → watch" polling pattern — irrelevant today since those are disabled.

## Authentication

1. Authenticate the user against the Cognito User Pool (e.g. via AWS Amplify Auth, `amazon-cognito-identity-js`, or a hosted-UI OAuth flow) to obtain tokens.
2. **Use the ID token, not the access token**, as the bearer token. The backend validates the JWT's `aud` (audience) claim against the Cognito App Client ID — access tokens don't carry an `aud` claim and will always fail verification.
3. Send it on every request:
   ```
   Authorization: Bearer <id_token>
   ```
4. The backend reads these claims out of the token: `custom:tenant` (tenant/client id), `cognito:username`, `email`. Your Cognito user must have `custom:tenant` set, or tenant-scoped endpoints will return `400`.
5. Token lifetimes (as configured server-side): ID/access tokens expire after **1 hour**; refresh tokens last **30 days**. Implement silent refresh accordingly.
6. Protected vs. open endpoints: everything requires auth except two paths that are reserved for health checks (`/root`, `/health`) — note these aren't currently implemented server-side either, so don't rely on them for uptime checks yet.

## API Base URL

Configure the Lambda Function URL as a single environment variable in your frontend build, e.g.:

```
VITE_API_BASE_URL=https://<id>.lambda-url.us-east-1.on.aws
# or REACT_APP_API_BASE_URL / NEXT_PUBLIC_API_BASE_URL, depending on your tooling
```

Get the actual value from the `RevealV3ProdLambdaStackUrl` CloudFormation output after a deploy (ask backend/devops for the current value per environment — there's no fixed custom domain).

## Request Format

- **Headers**: always `Authorization: Bearer <id_token>`; `Content-Type: application/json` on any request with a JSON body.
- **JSON body**: required on `POST` endpoints that create or update a resource (e.g. `StoreCreate`, `ProductUpdate` shaped payloads). GET endpoints never take a body.
- **Query parameters**: used for pagination (`skip`, `limit`), equality filters (e.g. `region`, `category`), and search (`q`). Path parameters are used for resource identifiers (e.g. `/getstore/{store_id}`, `/getproduct/{upc}`).
- Partial updates: update endpoints (`/updatestore/{id}`, `/updateproduct/{upc}`) only apply fields you actually include in the body — omitted fields are left unchanged, not reset to null.

## Response Format

There is no wrapper type applied consistently across the whole API. In practice you'll see:

- A **flat resource object** on create/get/update (e.g. calling `/getstore/{id}` returns the store's fields directly, not nested under `data`).
- A **list envelope** on list/search endpoints:
  ```json
  { "stores": [ { "store": 101, "region": "West", "...": "..." } ], "total": 42, "skip": 0, "limit": 20 }
  ```
  (Products use the same shape with a `products` key.)
- A **status object** on delete and a few user-management actions:
  ```json
  { "status": "success" }
  ```

Design your API client to handle "the response is the data" rather than assuming a `{ status, data }` envelope everywhere.

## Error Format

All errors use FastAPI's default shape:

```json
{ "detail": "<human-readable message>" }
```

| Status | Meaning | Typical cause |
|---|---|---|
| `401` | Missing/invalid/expired bearer token | Not logged in, wrong token type (access vs. ID), or token expired |
| `400` | Missing required field/claim | e.g. Cognito user has no `custom:tenant` |
| `404` | Resource not found | e.g. `/getstore/{id}` for a nonexistent store number |
| `422` | Request validation failed | Body doesn't match the expected schema (Pydantic validation) |
| `500` | Unhandled server error | Includes upstream failures (e.g. database unreachable) |

## API Modules

| Module | What it covers |
|---|---|
| **Dashboard** | Exchange the logged-in user's identity for a Superset guest token to embed a dashboard (`/getdashboardtoken/{did}`) |
| **Users** | List users for the current tenant, create a user, update a user's name, enable/disable a user |
| **Stores** | Full CRUD + keyword search over the `stores` reference table (PostgreSQL-backed) |
| **Products** | Full CRUD + keyword search over the `products` reference table (PostgreSQL-backed), keyed by UPC |

Stores and Products are the two fully-built-out, production-ready modules today. Do not document/build against the historical Users/Projects/Requests/Retailers endpoint list beyond what's above — those are currently disabled server-side. Full current endpoint table: CLAUDE.md → "API".

## Pagination

List endpoints (`/liststores`, `/listproducts`) use offset-based pagination via query params:

| Param | Default | Range |
|---|---|---|
| `skip` | `0` | ≥ 0 |
| `limit` | `20` | 1–100 |

The response includes `total` (matching-row count), so compute total pages as `Math.ceil(total / limit)`. There is no cursor-based pagination.

## Filtering

List endpoints also accept optional **exact-match** filters as query params, combined with pagination:

- Stores: `region`, `state`, `district`
- Products: `category`, `brand`, `manufacturer`, `segment`

Filters and pagination can be combined in the same request; omit a filter param to not filter on it.

## Search APIs

`/searchstores` and `/searchproducts` do a case-insensitive substring match (`ILIKE %q%`) across several text fields per resource (see CLAUDE.md → "Database" for the exact field list per resource). Required query param `q` (min 1 character), plus the same `skip`/`limit` pagination as list endpoints. Use search for free-text lookups; use list+filters for exact-match browsing (e.g. a filter dropdown).

## Suggested Frontend Folder Structure

```
src/
├── api/            # Low-level HTTP client(s): one file per resource (stores.ts, products.ts, users.ts, auth.ts)
├── services/       # Higher-level orchestration built on api/ (e.g. combining calls, business rules)
├── hooks/          # Data-fetching hooks (e.g. useStores, useProduct, useSearchProducts)
├── pages/          # Route-level views
├── components/     # Reusable UI components
└── utils/          # Formatting, validation, constants (e.g. shared pagination defaults)
```

## API Service Layer

- One thin HTTP client instance (fetch or axios) configured with `VITE_API_BASE_URL` and a request interceptor that injects `Authorization: Bearer <id_token>` from wherever your auth state lives.
- One module per backend resource under `api/` (`api/stores.ts`, `api/products.ts`, `api/users.ts`) exporting typed functions (`getStore(id)`, `listStores(params)`, `searchStores(q, params)`, `createStore(payload)`, `updateStore(id, payload)`, `deleteStore(id)`) — mirror this 1:1 for products.
- Keep response-shape quirks (flat object vs. list envelope vs. `{status}`) normalized inside these functions so the rest of the app doesn't need to know about them.
- Centralize error unwrapping (`error.detail`) in one place (e.g. an axios response interceptor or a shared `request()` helper) rather than repeating `try/catch` per call site.

## State Management

Not prescribing a specific library, but a workable split:

- **Server state** (store/product lists, search results, individual records): a data-fetching/caching layer (e.g. TanStack Query, SWR, or RTK Query) keyed by resource + query params (`["stores", { skip, limit, region }]`) — this naturally handles caching, refetch-on-filter-change, and loading/error states for the pagination/filtering/search patterns above.
- **Auth/session state** (current user, tokens, tenant): a small global store or context — this is app-wide and doesn't belong in the same cache as server data.
- **UI-local state** (form inputs, filter selections, current page): component-local state, not global.

## Error Handling

- Distinguish `401` (send the user to re-authenticate / refresh token) from `404` (show "not found" in the UI) from `422`/`400` (show field-level validation errors) from `500` (generic retry/error toast).
- Since responses aren't wrapped uniformly, always check the actual HTTP status code first, then parse `detail` for the message — don't assume every response has a `status` field to branch on.
- For search/list endpoints, an empty `stores: []`/`products: []` array is a normal, valid response (zero matches), not an error.

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` (or equivalent) | The backend's Lambda Function URL |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID for the auth SDK |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID (must match backend's `COGNITO_CLIENT_ID`) |
| `VITE_COGNITO_REGION` | Cognito region (e.g. `us-east-1`) |

Exact naming depends on your frontend framework's env var convention (Vite/CRA/Next.js all differ) — the values themselves must match the backend's Cognito stack for a given environment.

## Best Practices

- **Token management**: store tokens securely (avoid `localStorage` for anything beyond short-lived access; prefer in-memory + refresh-token rotation via your auth SDK). Refresh proactively before the 1-hour expiry, not just reactively on a `401`.
- **API reuse**: never call `fetch`/`axios` directly from components — always go through the `api/` layer so auth headers, error unwrapping, and base URL are handled in one place.
- **Error handling**: surface `detail` messages to users for `400`/`404`/`422`; log (don't necessarily display raw) `500` details.
- **Loading states**: pagination/search/filter changes should show a loading indicator without fully unmounting the previous result set (avoids UI flicker on every filter change).
- **Pagination**: keep `skip`/`limit` in the URL (query string) so pagination state survives refresh/back-navigation.
- **Search**: debounce `q` input (e.g. 300ms) before firing `/searchstores`/`/searchproducts` requests.

## Future Enhancements

- A consistent response envelope across all endpoints (today it varies by endpoint family).
- Tenant scoping for Store/Product data, if multi-tenant isolation is ever required for those tables (currently any authenticated user can read/write any store/product regardless of tenant).
- Re-enabling and documenting the historical Projects/Requests/Retailers API surface, if/when that work resumes server-side.
- An OpenAPI-generated typed client, since FastAPI already produces a schema at `/docs`/`/openapi.json` — would remove the need to hand-write the `api/` layer's types.

## References

For the authoritative, complete list of endpoints, exact request/response payload fields, DynamoDB/PostgreSQL schema details, and backend architecture internals, see [`CLAUDE.md`](./CLAUDE.md).
