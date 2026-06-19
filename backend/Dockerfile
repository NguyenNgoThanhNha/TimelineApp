# NestJS + Prisma (MongoDB). Dùng node:20-slim (Debian) cho Prisma engine ổn định.
FROM node:20-slim

WORKDIR /app

# Prisma cần openssl trên Debian slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Cài dependencies (cache theo package.json)
COPY package*.json ./
RUN npm install

# Copy source + prisma schema, generate client rồi build
COPY . .
# `npm run build` chạy prebuild (prisma generate) trước, sau đó nest build
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
