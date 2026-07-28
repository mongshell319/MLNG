import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // 컨테이너 배포용. 실행에 필요한 것만 추려서 .next/standalone 에 담는다.
  output: 'standalone',
  experimental: {
    // 세션 상태를 쓰는 서버 액션은 전부 같은 노드에서 돈다.
    serverActions: { bodySizeLimit: '8mb' },
  },
}

export default config
