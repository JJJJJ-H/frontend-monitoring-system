FROM node:24-alpine
WORKDIR /app
COPY . .
RUN corepack enable && corepack pnpm install --frozen-lockfile=false
EXPOSE 5173
CMD ["corepack", "pnpm", "--filter", "@monitor/dashboard", "dev", "--host", "0.0.0.0"]
