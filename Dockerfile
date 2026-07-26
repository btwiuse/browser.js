FROM node:22 AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY . .

# Build scramjet rewriter (requires Rust + wasm-bindgen)
RUN apt-get update && apt-get install -y --no-install-recommends \
    rustup \
    build-essential \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN rustup-init -y --default-toolchain nightly --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup component add rust-src --toolchain nightly

RUN cargo install wasm-bindgen-cli --version 0.2.105
RUN cargo install --git https://github.com/r58Playz/wasm-snip.git wasm-snip

# Patch build.sh to only require wasm-opt for release builds
RUN sed -i '25,28s/which cargo wasm-bindgen wasm-opt wasm-snip/which cargo wasm-bindgen wasm-snip/' packages/scramjet/packages/core/rewriter/wasm/build.sh && \
    sed -i '25,28s/Please install cargo, wasm-bindgen, wasm-opt/Please install cargo, wasm-bindgen/' packages/scramjet/packages/core/rewriter/wasm/build.sh

ENV RELEASE=0

RUN pnpm rewriter:build
RUN pnpm build

# Production image
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
