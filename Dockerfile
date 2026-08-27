FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

# Add tzdata for timezone support
RUN apk add --no-cache tzdata

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/start.sh ./start.sh
RUN chmod +x ./start.sh

ENV PORT=3000
ENV NODE_ENV=production
ENV TZ=Asia/Makassar

EXPOSE 3000

CMD ["sh", "./start.sh"]
