import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow the sandbox preview host and common dev origins so the app is
  // reachable from the browser without host/origin rejections.
  allowedDevOrigins: ["localhost", "127.0.0.1", "*.e2b.app", "*.local"],
};

export default nextConfig;
