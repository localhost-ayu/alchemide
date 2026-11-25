FROM rust:1-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
      libwebkit2gtk-4.1-dev build-essential curl wget file \
      libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
    && curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g corepack \
    && corepack enable \
    && rustup component add clippy rustfmt \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
