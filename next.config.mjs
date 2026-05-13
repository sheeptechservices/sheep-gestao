/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint:  { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['@libsql/client', 'pdf-parse', 'mammoth', 'docx', 'officeparser'],
};

export default nextConfig;
