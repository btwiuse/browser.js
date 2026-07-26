# Stage 1: Build rewriter with Rust
FROM rust:latest AS rewriter-builder
WORKDIR /app
RUN cargo install wasm-bindgen-cli --version 0.2.105
RUN cargo install --git https://github.com/r58Playz/wasm-snip.git wasm-snip
COPY packages/scramjet/packages/core/rewriter/wasm/build.sh packages/scramjet/packages/core/rewriter/wasm/build.sh
COPY packages/scramjet/packages/core/rewriter/wasm/src packages/scramjet/packages/core/rewriter/wasm/src
COPY packages/scramjet/packages/core/rewriter/wasm/Cargo.toml packages/scramjet/packages/core/rewriter/wasm/Cargo.toml
COPY packages/scramjet/packages/core/Cargo.toml packages/scramjet/packages/core/Cargo.toml
COPY packages/scramjet/Cargo.toml packages/scramjet/Cargo.toml
RUN cd packages/scramjet/packages/core/rewriter/wasm && bash build.sh

# Stage 2: Build JS with Node
FROM node:22 AS builder
WORKDIR /app
COPY . .
COPY --from=rewriter-builder /app/packages/scramjet/packages/core/dist/scramjet.wasm packages/scramjet/packages/core/dist/scramjet.wasm
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN pnpm install
RUN pnpm build

# Stage 3: Runtime
FROM node:22-alpine
WORKDIR /app
RUN npm install @mercuryworkshop/wisp-js@0.4.1
COPY --from=builder /app/wisp-server.js ./wisp-server.js
COPY --from=builder /app/packages/scramjet/packages/core/dist/ ./public/scram/
COPY --from=builder /app/packages/scramjet/packages/controller/dist/ ./public/controller/
COPY --from=builder /app/packages/scramjet/packages/utils/dist/ ./public/scram-utils/
COPY --from=builder /app/packages/inject/dist/ ./public/
COPY --from=builder /app/packages/sandbox/ ./public/sandbox/
EXPOSE 3000
ENV PORT=3000
CMD ["node", "wisp-server.js"]