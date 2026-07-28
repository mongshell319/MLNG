# 말랑스쿨 — 컨테이너 하나로 도는 배포
#
# 한 학교 규모라면 이쪽이 제일 단순하다. 외부 서비스가 필요 없고,
# 세계 상태는 마운트된 디스크에 얹히며, 실시간은 SSE로 그대로 된다.
# 대신 인스턴스를 늘리면 안 된다 — 세계가 갈라진다.
#
#   docker build -t mallangschool .
#   docker run -p 3000:3000 \
#     -e SESSION_SECRET="$(openssl rand -base64 48)" \
#     -e MLNG_SINGLE_INSTANCE=1 \
#     -v mallang-data:/data \
#     mallangschool

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 빌드 시점에는 세계에 손대지 않는다. 페이지는 전부 클라이언트에서 상태를 받아 온다.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# 세계 상태와 제출 사진이 여기 쌓인다. 볼륨을 붙이지 않으면 컨테이너와 함께 사라진다.
ENV MLNG_DATA_DIR=/data

RUN addgroup -g 1001 -S nodejs && adduser -S mallang -u 1001
RUN mkdir -p /data && chown mallang:nodejs /data

COPY --from=builder --chown=mallang:nodejs /app/.next/standalone ./
COPY --from=builder --chown=mallang:nodejs /app/.next/static ./.next/static

USER mallang
EXPOSE 3000
VOLUME /data

CMD ["node", "server.js"]
