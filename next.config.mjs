/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint:  { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['@libsql/client', 'pdf-parse', 'mammoth', 'docx', 'officeparser'],
  experimental: {
    // Increase body size limit for route handlers (chat with images can exceed the 4 MB default)
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default nextConfig;
