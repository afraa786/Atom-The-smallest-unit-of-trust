# zero-trust-proxy

A lightweight service mesh proxy that enforces cryptographic identity on every microservice-to-microservice request — a Zero-Trust Access Control layer for decentralized/internal APIs.

## Folder structure

```
zero-trust-proxy/
├── proxy/       # The proxy itself — intercepts and forwards requests, enforces identity checks
├── services/    # Dummy downstream microservices used for local testing (user, payment, db, notification)
├── auth/        # Identity/credential verification logic (token issuing, JWT verification)
├── policy/      # Access control policy definitions and evaluation logic (RBAC, context, rate limit, lateral movement)
├── config/      # Loads and validates mesh.config.json — the mesh topology (see "Mesh configuration" below)
├── logs/        # Request/audit log output
├── mesh.config.json  # Service names, secret env var names, target URLs, RBAC policy, allowed regions
├── docker-compose.yml
├── Dockerfile   # Proxy's own container build
└── package.json
```

- **proxy/** — entrypoint (`index.js`) for the reverse-proxy service. Intercepts every `/route/:targetService/*` call and runs it through the identity → RBAC → lateral-movement → context → rate-limit checkpoint chain before forwarding.
- **services/** — four standalone dummy services (`user-service`, `payment-service`, `db-service`, `notification-service`), each with its own `package.json`, `Dockerfile`, and `index.js`. These simulate the internal APIs the proxy sits in front of.
- **auth/** — identity verification: JWT issuing (`issue-token.js`), verification (`verify-token.js`), and the service→secret registry (`identity-registry.js`).
- **policy/** — access control rules: RBAC allow-list, context checks (time/geo/payload), rate limiting, lateral-movement detection.
- **config/** — the mesh config loader (`load-mesh-config.js`) that reads and validates `mesh.config.json` at startup.
- **logs/** — audit/request log output directory.

## Ports

| Service              | Port |
|----------------------|------|
| proxy                | 4000 |
| user-service         | 5001 |
| payment-service      | 5002 |
| db-service           | 5003 |
| notification-service | 5004 |

## Mesh configuration

The mesh topology — which services exist, which env var holds each one's
secret, where each one is reachable, who's allowed to call whom, and which
regions are allowed — is defined in a single file, `mesh.config.json`, at
the project root. It's loaded once at startup by every module that needs
it (`auth/identity-registry.js`, `policy/rbac-map.js`,
`policy/context-policy.js`, `proxy/index.js`) instead of being hardcoded
in each one.

```json
{
  "services": {
    "user-service": {
      "secretEnv": "USER_SERVICE_SECRET",
      "url": "http://localhost:5001",
      "urlEnv": "USER_SERVICE_URL"
    }
  },
  "rbac": {
    "user-service": ["payment-service"]
  },
  "allowedRegions": ["US", "EU"]
}
```

- **`secretEnv`** — name of the environment variable holding this
  service's identity secret. The secret value itself is never written to
  this file — only the name of the env var that holds it, so the config
  file stays safe to commit.
- **`url`** — default/fallback target URL the proxy forwards to.
- **`urlEnv`** (optional) — name of an env var that, if set, overrides
  `url`. Used by `docker-compose.yml`/k8s to inject container DNS names
  instead of `localhost`.
- **`rbac`** — same shape as before: caller service → array of target
  services it's allowed to reach. Anything not listed is denied.
- **`allowedRegions`** — regions the context-policy geo check accepts
  (see the limitation noted below).

To point the proxy at a different config file, set `MESH_CONFIG_PATH` to
its path. The loader validates the file at startup and fails fast with a
clear error (not a silent fallback) if it's malformed — e.g. an RBAC entry
referencing a service that isn't declared, or a service missing
`secretEnv`/`url`.

Changing `mesh.config.json` (adding/renaming services, adjusting RBAC)
does not by itself make this proxy usable in front of an arbitrary
existing backend — see "Integrating your own services" below for what a
service actually needs to implement to talk through this proxy.

## Running locally

```bash
npm install
npm start
```

## Running with Docker Compose

```bash
docker-compose up --build
```

This builds and starts the proxy plus all four dummy services on the `mesh` bridge network, each reachable at `http://localhost:<port>/health`.

## Integrating your own services

The proxy doesn't just forward requests — it also *issues* the tokens
callers attach. Any service that wants to call another service through
this proxy needs to implement this exact flow (this is what
`services/*/index.js` already does — see `callThroughProxy` in any of
them for a working reference implementation):

1. **Request a token for your own identity.**
   ```
   POST {PROXY_URL}/auth/token
   Content-Type: application/json

   { "service": "<your-service-name>" }
   ```
   Returns `{ "token": "<jwt>" }` — a 60-second-lived JWT signed with your
   service's secret (looked up server-side via `secretEnv` in
   `mesh.config.json`; you never send the secret itself over the wire).

2. **Attach it as a Bearer token on the actual call**, routed through the
   proxy rather than called directly:
   ```
   GET {PROXY_URL}/route/<target-service>/<path>
   Authorization: Bearer <jwt>
   ```

3. **Handle `428 Precondition Required`** — a context check (time window,
   region, payload size) failed. Fetch a *fresh* token and retry **once**.
   The proxy has no memory of retries; this one-retry-then-give-up policy
   lives entirely in the calling service. If the retry also comes back
   428, treat it as a hard failure — don't loop.

4. **Handle `429 Too Many Requests`** — the rate limit was hit. Do not
   retry automatically; surface the failure (the response body includes
   `retryAfterMs` as a hint for the caller, not an instruction to
   auto-retry).

5. **Handle `403`** — RBAC denied this caller→target pair outright, or
   your own retry-then-give-up logic decided to hard-fail after a second
   428. Not retryable by definition.

A minimal client looks like:

```js
async function fetchOwnToken(proxyUrl, serviceName) {
  const res = await fetch(`${proxyUrl}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: serviceName }),
  });
  if (!res.ok) throw new Error(`token request failed (${res.status})`);
  return (await res.json()).token;
}

async function callThroughProxy(proxyUrl, serviceName, targetPath) {
  let token = await fetchOwnToken(proxyUrl, serviceName);
  let res = await fetch(`${proxyUrl}${targetPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 428) {
    token = await fetchOwnToken(proxyUrl, serviceName); // fresh token, retry once
    res = await fetch(`${proxyUrl}${targetPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 428) {
      return { status: 403, error: "context check failed after re-auth retry" };
    }
  }

  if (res.status === 429) {
    return { status: 429, error: "rate limited — not retrying automatically" };
  }

  return { status: res.status, data: await res.json() };
}
```

This is the actual contract — not a simplified version of it. A service
that only attaches a Bearer token but doesn't implement the 428-retry
step will work for the happy path and then hard-fail (instead of
gracefully re-authenticating) the moment it hits a context-policy
rejection.

## Known limitation: the geo check trusts the caller

`policy/context-policy.js`'s `checkGeo()` currently determines a request's
region from a client-supplied `X-Simulated-Region` header. This is
intentional for local demo/testing — it lets `attack-stimulator/simulate-attack.js`
and the frontend's Request Simulator deterministically trigger a region
violation without needing real geolocation infrastructure.

**This is not how a real deployment should determine region.** A caller
can set that header to whatever value it wants, so trusting it as-is
would make the geo check trivially bypassable by anyone malicious enough
to just... not send an accurate header. A production version of this
check would need to derive region from something the caller can't
control — e.g. IP-based geolocation performed by the proxy itself (via a
GeoIP database or an upstream load balancer/CDN header that's set outside
the caller's control, like Cloudflare's `CF-IPCountry`), not a header the
request itself supplies.
