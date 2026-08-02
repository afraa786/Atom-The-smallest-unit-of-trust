# Single-container build running the proxy + all 4 dummy services
# together in one image, for hosts that only support one service per
# deploy (e.g. Render's free tier — no docker-compose support there).

FROM node:20-alpine AS deps
WORKDIR /build

COPY package*.json ./
RUN npm ci --omit=dev

COPY services/user-service/package*.json ./services/user-service/
RUN npm ci --omit=dev --prefix services/user-service

COPY services/payment-service/package*.json ./services/payment-service/
RUN npm ci --omit=dev --prefix services/payment-service

COPY services/db-service/package*.json ./services/db-service/
RUN npm ci --omit=dev --prefix services/db-service

COPY services/notification-service/package*.json ./services/notification-service/
RUN npm ci --omit=dev --prefix services/notification-service

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /build/node_modules ./node_modules
COPY --from=deps /build/services/user-service/node_modules ./services/user-service/node_modules
COPY --from=deps /build/services/payment-service/node_modules ./services/payment-service/node_modules
COPY --from=deps /build/services/db-service/node_modules ./services/db-service/node_modules
COPY --from=deps /build/services/notification-service/node_modules ./services/notification-service/node_modules

COPY package*.json ./
COPY auth ./auth
COPY config ./config
COPY logs ./logs
COPY policy ./policy
COPY proxy ./proxy
COPY mesh.config.json ./mesh.config.json
COPY services ./services
COPY docker-entrypoint-all.sh ./docker-entrypoint-all.sh

RUN chmod +x ./docker-entrypoint-all.sh \
  && addgroup -S proxy && adduser -S proxy -G proxy

# Every process resolves its peers over localhost inside this single
# container — no docker-compose DNS names needed. Render only needs to
# see one exposed port (the proxy's); the 4 dummy services stay
# unreachable from outside the container, matching the zero-trust
# design where only the proxy is meant to be publicly callable.
ENV PORT=4000
ENV USER_SERVICE_URL=http://localhost:5001
ENV PAYMENT_SERVICE_URL=http://localhost:5002
ENV DB_SERVICE_URL=http://localhost:5003
ENV NOTIFICATION_SERVICE_URL=http://localhost:5004
ENV PROXY_URL=http://localhost:4000

USER proxy

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "./docker-entrypoint-all.sh"]
