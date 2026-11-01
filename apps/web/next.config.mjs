import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiBackendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    if (!apiBackendUrl) return [];
    return [{
      source: "/api/v1/:path*",
      destination: `${apiBackendUrl}/api/v1/:path*`,
    }];
  },
};

export default nextConfig;
