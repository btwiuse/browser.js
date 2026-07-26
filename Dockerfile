# Stage 1: Build rewriter with Rust
FROM rust:latest AS rewriter-builder
WORKDIR /app
RUN rustup component add rust-src --toolchain nightly
COPY . .
RUN cargo install wasm-bindgen-cli --version 0.2.105
RUN cargo install --git https://github.com/r58Playz/wasm-snip.git wasm-snip
RUN cd packages/scramjet/packages/core/rewriter/wasm && bash build.sh

# Stage 2: Build JS with Node
FROM node:22 AS builder
WORKDIR /app
COPY . .
COPY --from=rewriter-builder /app/packages/scramjet/packages/core/dist/scramjet.wasm packages/scramjet/packages/core/dist/scramjet.wasm
COPY --from=rewriter-builder /app/packages/scramjet/packages/core/rewriter/wasm/out packages/scramjet/packages/core/rewriter/wasm/out
RUN git clone https://github.com/MercuryWorkshop/dreamlandjs.git external/dreamlandjs
COPY dreamland.patch /tmp/dreamland.patch
RUN cd external/dreamlandjs && git apply /tmp/dreamland.patch
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
RUN pnpm install
RUN pnpm build

# Stage 3: Runtime
FROM node:22
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
ENV PORT=3000
CMD ["node", "wisp-server.js"]
