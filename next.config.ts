import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // 세션 상태를 쓰는 서버 액션은 전부 같은 노드에서 돈다.
    serverActions: { bodySizeLimit: '8mb' },
  },
}

export default config
