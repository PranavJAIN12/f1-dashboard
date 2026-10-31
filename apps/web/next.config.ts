import path from "node:path";
import type { NextConfig } from "next";
import "./env";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Pin the root so a stray lockfile in a parent directory cannot change it.
    turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
