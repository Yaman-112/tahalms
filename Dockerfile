FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --force

COPY . .

RUN npx prisma generate
RUN npm run build -- --config vite.config.ts
RUN mkdir -p /app/uploads/assignments /app/uploads/submissions

EXPOSE 4000

ENV UPLOAD_DIR=/app/uploads

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx server/index.ts"]
