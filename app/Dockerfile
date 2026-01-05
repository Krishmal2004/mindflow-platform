FROM node:20-bookworm-slim

# Install minimal dependencies for running Expo CLI
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  git \
  python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Avoid installing optional native build tools in the container unless needed
ENV EXPO_DEBUG="false"
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Copy package manifests and install dependencies (including dev deps for local dev)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy the rest of the app
COPY . .

# Expose common Expo/dev ports
EXPOSE 19000 19001 8081 3000

# Start the Expo dev server and listen on all interfaces so the container is reachable.
# Use non-interactive mode which is more suitable for CI/containers.
CMD ["sh","-c","npx expo start --tunnel --host 0.0.0.0 --non-interactive"]
