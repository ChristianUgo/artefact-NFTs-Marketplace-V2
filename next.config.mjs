import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  outputFileTracingRoot: path.resolve("."),
};

export default nextConfig;
