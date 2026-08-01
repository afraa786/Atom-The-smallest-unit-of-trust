# zero-trust-proxy — Frontend Handoff Brief

## 1. What this backend does

This is a Zero-Trust Access Control proxy for a small internal microservice mesh. There are three dummy backend services — `user-service`, `payment-service`, and `db-service` — that normally would talk to each other directly, but in this system they are not allowed to. Instead, every inter-service call must be routed through a central proxy, which acts as a checkpoint. Before the proxy will forward any request, it does two independent checks: first, it cryptographically verifies the caller's identity using a short-lived JWT (each service has its own unique signing secret, so a token can only be validated against the specific service it claims to be — it can't be forged or relabeled as a different service); second, even if the identity check passes, the proxy checks a static role-based policy map to confirm that specific caller is actually allowed to reach that specific target (for example, `user-service` is allowed to call `payment-service`, but is explicitly forbidden from calling `db-service` directly, even with a perfectly valid token). If either check fails, the request is rejected before it ever reaches the real service. This means every request that flows through the mesh has both a proven identity and an enforced permission — that's the "zero trust" part: nothing is trusted by default, everything is checked on every hop.

## 2. API endpoints

The proxy runs on **`http://localhost:4000`** (or `PROXY_URL` if configured otherwise). These are the only two real endpoints that exist today.

### `POST /auth/token`

Issues a short-lived (60 second) JWT for a given service identity. In practice this is called by services themselves before they make an outbound call, but you can call it directly too for testing/demo purposes.

**Request body:**
```json
{
  "service": "user-service"
}
```

`service` must be one of the three registered identities: `"user-service"`, `"payment-service"`, or `"db-service"`. Any other value is rejected.

**Success response — `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXJ2aWNlIjoidXNlci1zZXJ2aWNlIiwiaWF0IjoxNzg1NTc1MzA2LCJqdGkiOiI5YzhjM2UyMThmZjgwODA3NWYzMGZiYTkyYjNhY2RmNCIsImV4cCI6MTc4NTU3NTM2Nn0.twXgbl1THPgF_AwmcQIGmeBI1BnpL3cpkTiyyFHt2bY"
}
```

The token itself, once decoded, contains `{ service, iat, jti, exp }` — `service` is the identity it was issued for, `iat`/`exp` are issued-at and expiry as unix timestamps (always exactly 60 seconds apart), and `jti` is a random per-token nonce.

**Error response — `401`** (unknown/unregistered service name):
```json
{
  "error": "unknown or unregistered service 'fake-service'"
}
```

### `ALL /route/:targetService/*`

This is the actual proxy checkpoint. Any request aimed at a downstream service goes through this route instead of hitting that service directly. `:targetService` is one of the three service names, and the wildcard `*` is the path on that service you want to hit (right now, the only real path any of the dummy services expose is `/data`).

Example: to reach `payment-service`'s `/data` endpoint through the proxy, you'd call `GET /route/payment-service/data`.

**Required header:**
```
Authorization: Bearer <jwt from /auth/token>
```

**Success response** — whatever the target service itself returns, relayed verbatim, with the target's own status code. For `/data` on any of the three dummy services, that currently looks like:
```json
{
  "service": "payment-service",
  "records": [
    { "id": "txn_001", "userId": 1, "amount": 42.5, "currency": "USD", "status": "completed" }
  ]
}
```
(The exact shape of `records` differs per service — `user-service` returns fake user objects, `payment-service` returns fake transactions, `db-service` returns fake raw row records.)

**Error — `401`** (missing/malformed/invalid/expired/tampered token — the proxy does not forward the request at all in this case):
```json
{
  "error": "missing or malformed Authorization header"
}
```
or
```json
{
  "error": "invalid, expired, or tampered token"
}
```

**Error — `403`** (token is valid, but the caller is not policy-permitted to reach that target — this is the RBAC layer, independent of the identity check above):
```json
{
  "error": "user-service is not authorized to call db-service"
}
```

**Error — `400`** (target service name isn't a real registered service):
```json
{
  "error": "unknown target service 'fake-service'"
}
```

The current static policy (who's allowed to call whom) is: `user-service` → `payment-service` only; `payment-service` → `db-service` only; `db-service` → nobody. This is hardcoded in the backend right now, not exposed via any API — there is no endpoint to fetch or display the policy map itself yet.

## 3. What the current backend does NOT yet support

I want to be direct about this rather than let you build against something that isn't there: there is currently no request logging endpoint, no metrics/latency endpoint, no attack-simulation trigger, and no rate limiting or lateral-movement detection anywhere in the backend. The only observability that exists right now is plain `console.log` output in each service's own terminal — there is no HTTP endpoint that exposes that log data to a frontend. If you want to build the dashboard described (live request log table, latency/metrics display, an attack-simulation button, live allow/deny indicators), those all require new backend endpoints that don't exist yet — most likely something like a `GET /logs/recent` or a WebSocket/SSE stream that the proxy would need to emit events on for every request it processes (timestamp, source, target, decision, reason, latency). None of that has been built. I'd recommend holding off on frontend work for the dashboard specifically until that's in place, so you're not coding against a contract that doesn't exist — happy to build that layer next if you want to prioritize it.

## 4. Technical notes

- **Base URL / port:** the proxy listens on `http://localhost:4000` in local dev. There's no production deployment yet.
- **CORS:** not currently configured on the proxy at all. If you're calling these endpoints from a browser-based frontend (rather than another Node service), you'll hit CORS errors as-is — the proxy needs `cors` middleware added before browser-based calls will work. Flag this back to backend if/when you start integration.
- **Polling vs. push:** irrelevant right now since there's no logging/metrics endpoint to poll or subscribe to yet (see section 3). Once that's built, we'll decide between polling and SSE/WebSockets at that point — don't build assuming either yet.
- **Token lifetime:** tokens expire in 60 seconds by design (short-lived, zero-trust posture) — if you're building any UI that calls `/auth/token` and then uses that token for a subsequent call, don't cache/reuse it beyond a few seconds.
- **Auth model:** there is no user-facing login/session system here — this is service-to-service auth only. Nothing in this backend currently authenticates a human user or browser session.
