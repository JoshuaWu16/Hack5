/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/chat': ['./hvac_construction_dataset/**/*'],
  },
}

export default nextConfig
