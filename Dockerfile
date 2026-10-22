# BaguettePad: one container builds the site, then the API serves it.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
# VITE_ values are baked into the site at build time, so they arrive as build args.
ARG VITE_CLUSTER
ARG VITE_RPC_URL
ARG VITE_DBC_CONFIG
ARG VITE_FEE_CLAIMER
ARG VITE_MAX_DEV_BUY_SOL
RUN npm run build
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server/index.mjs"]
