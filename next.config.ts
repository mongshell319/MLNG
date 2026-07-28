import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // 컨테이너 배포용. 실행에 필요한 것만 추려서 .next/standalone 에 담는다.
  // Vercel 은 자체 빌드 출력을 쓰므로 켜지 않는다 — Dockerfile 에서만 MLNG_STANDALONE=1 을 준다.
  output: process.env.MLNG_STANDALONE === '1' ? 'standalone' : undefined,
  experimental: {
    // 세션 상태를 쓰는 서버 액션은 전부 같은 노드에서 돈다.
    serverActions: { bodySizeLimit: '8mb' },
  },
}

export default config
