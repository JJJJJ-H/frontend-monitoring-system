FROM node:24-alpine
WORKDIR /app
COPY . .
RUN corepack enable && corepack pnpm install --frozen-lockfile=false
EXPOSE 3000
CMD ["corepack", "pnpm", "--filter", "@monitor/server", "dev"]
