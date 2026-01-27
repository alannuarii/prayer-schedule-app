FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
# We might need node_modules for dependencies if they are not bundled fully (SolidStart/Vinxi usually bundles mostly but let's be safe or just copy node_modules from builder if needed, but often production deps are needed)
# Actually, node_modules are usually needed for start unless standalone build.
# For simplicity in this stack, let's copy node_modules too or re-install only production.
# But copying from builder is faster if already installed.
COPY --from=builder /app/node_modules ./node_modules

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
