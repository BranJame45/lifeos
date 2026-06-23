FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3002

CMD ["node", "dist/main"]
