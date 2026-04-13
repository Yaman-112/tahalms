FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build -- --config vite.config.ts

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx server/index.ts"]
