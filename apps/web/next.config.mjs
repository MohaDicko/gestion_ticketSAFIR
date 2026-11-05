import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiBackendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "argon2",
    "@prisma/client",
    "prisma",
    "nodemailer",
  ],
  experimental: {
    externalDir: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "firebase-admin",
        "firebase-admin/app",
        "firebase-admin/firestore",
        "firebase-admin/auth",
        "@google-cloud/firestore",
        "argon2",
        "@prisma/client",
      ];
    }
    return config;
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
