# zero-trust-proxy

A lightweight service mesh proxy that enforces cryptographic identity on every microservice-to-microservice request — a Zero-Trust Access Control layer for decentralized/internal APIs.

## Folder structure

```
zero-trust-proxy/
├── proxy/       # The proxy itself — intercepts and forwards requests, enforces identity checks
├── services/    # Dummy downstream microservices used for local testing (user, payment, db)
├── auth/        # Identity/credential verification logic (token/cert validation, issuing, etc.)
├── policy/      # Access control policy definitions and evaluation logic
├── logs/        # Request/audit log output
├── docker-compose.yml
├── Dockerfile   # Proxy's own container build
└── package.json
```

- **proxy/** — entrypoint (`index.js`) for the reverse-proxy service. Currently a placeholder health-check server; request interception and identity enforcement land here next.
- **services/** — three standalone dummy services (`user-service`, `payment-service`, `db-service`), each with its own `package.json`, `Dockerfile`, and placeholder `index.js`. These simulate the internal APIs the proxy will sit in front of.
- **auth/** — where identity verification (e.g. JWT validation, mTLS, service identity issuance) will live.
- **policy/** — where access control rules (which service identity can call which endpoint) will be defined and evaluated.
- **logs/** — audit/request log output directory.

## Ports

| Service         | Port |
|------------------|------|
| proxy            | 4000 |
| user-service      | 5001 |
| payment-service   | 5002 |
| db-service        | 5003 |

## Running locally

```bash
npm install
npm start
```

## Running with Docker Compose

```bash
docker-compose up --build
```

This builds and starts the proxy plus all three dummy services on the `mesh` bridge network, each reachable at `http://localhost:<port>/health`.

## Status

Project scaffold only. Proxy and service entrypoints are placeholder health-check servers — no identity enforcement, policy evaluation, or request forwarding logic has been implemented yet.
