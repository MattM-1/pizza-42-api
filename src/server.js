import express from 'express';
import cors from 'cors';
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';
import { priceItems, totals } from './pricing.js';
import { saveOrder, ordersFor } from './orders.js';

const { AUTH0_DOMAIN, AUTH0_AUDIENCE, ALLOWED_ORIGIN = 'http://localhost:4200', PORT = 3001 } = process.env;
const NAMESPACE = process.env.CLAIMS_NAMESPACE ?? 'https://pizza42.example.com/';

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
  console.error('Missing AUTH0_DOMAIN or AUTH0_AUDIENCE. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

// Validates the Bearer token: signature (via Auth0's JWKS), issuer, audience and expiry.
const checkJwt = auth({ audience: AUTH0_AUDIENCE, issuerBaseURL: `https://${AUTH0_DOMAIN}/` });

const scopesOf = (req) => String(req.auth.payload.scope ?? '').split(' ');

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Place an order. Needs create:orders. Orders over $100 also need create:large-orders,
// which an Auth0 post-login Action only adds to the token after a successful MFA step-up.
app.post('/orders', checkJwt, requiredScopes('create:orders'), (req, res) => {
  const lines = priceItems(req.body?.items);

  // Opt-in comes from the token (set by an Auth0 Action), never from the request body.
  const marketingOptIn = req.auth.payload[`${NAMESPACE}marketing_opt_in`] === true;
  const t = totals(lines, { marketingOptIn });

  if (t.isLarge && !scopesOf(req).includes('create:large-orders')) {
    return res.status(403).json({
      error: 'step_up_required',
      message: 'Orders over $100 require step-up authentication (create:large-orders).',
    });
  }

  const order = saveOrder({ userId: req.auth.payload.sub, lines, totals: t });
  res.status(201).json(order);
});

// List the caller's own orders. Needs read:orders.
app.get('/orders', checkJwt, requiredScopes('read:orders'), (req, res) => {
  res.json(ordersFor(req.auth.payload.sub));
});

// Auth errors from the JWT middleware carry their own status (401/403); validation errors use 400.
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  if (err.headers) res.set(err.headers);
  res.status(status).json({ error: err.code ?? 'server_error', message: status >= 500 ? 'Internal server error' : err.message });
});

app.listen(PORT, () => console.log(`Pizza 42 API listening on http://localhost:${PORT}`));
