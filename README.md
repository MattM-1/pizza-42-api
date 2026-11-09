# Pizza 42 API

Express orders API for Pizza 42. It validates Auth0 access tokens and enforces permissions.

## Endpoints

| Method | Path | Needs | Notes |
|---|---|---|---|
| GET | `/health` | nothing | liveness check |
| POST | `/orders` | `create:orders` + verified email | body: `{ "items": [{ "pizzaId": "answer", "size": "L", "qty": 2 }] }`. Orders over $100 (after discount) also need `create:large-orders` |
| GET | `/orders` | `read:orders` | the caller's own orders only |

Valid `pizzaId`s: `margherita`, `pepperoni`, `funghi`, `quattro`, `veggie`, `answer`. Sizes: `S`, `M`, `L`.

Prices are calculated on the server, so the client can't set its own price.
An order over $100 without `create:large-orders` gets `403 { "error": "step_up_required" }`.
An order from a customer whose access token doesn't have `email_verified: true` gets `403 { "error": "email_not_verified" }`.

## Run

```bash
npm install
cp .env.example .env     # then check the values
npm run dev              # http://localhost:3001
npm test                 # pricing unit tests
```

Requires Node `^22.22.3 || ^24.15.0 || ^26.0.0` (uses `node --env-file`).

## Auth0 setup this expects

- API identifier `https://api.pizza42.example.com` (no trailing slash), RS256, RBAC on, "Add Permissions in the Access Token" on.
- Permissions defined on the API: `create:orders`, `read:orders`, `create:large-orders`.
- `create:large-orders` is NOT on the `customer` role. A post-login Action adds it only after a successful step-up.
- The Angular app requests this audience and the `create:orders read:orders` scopes.

## Optional claim for the discount

The API gives the 15% discount only if the access token has this claim (set by an Auth0 Action, never by the client):

```js
// post-login Action: add the marketing opt-in to the ACCESS token for this API
api.accessToken.setCustomClaim('https://pizza42.example.com/marketing_opt_in', optIn);
```

Without it, the API treats everyone as not opted in and charges full price.

## Quick test with curl

Get an access token for the API (for example from the Angular app's network tab), then:

```bash
curl -X POST http://localhost:3001/orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"items":[{"pizzaId":"answer","size":"M","qty":1}]}'
```

## Not included yet

- Real storage: orders live in memory and reset on restart.
- Rate limiting and request logging.
