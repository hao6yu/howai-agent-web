/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase API route timeouts for image generation and AI responses
  experimental: {
    serverComponentsExternalPackages: ['openai'],
  },
  // API route timeout configuration
  async rewrites() {
    return []
  },
};

export default nextConfig;
