import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",

  typescript: {
    // Ignore TypeScript errors during build from seed files
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignore ESLint errors during build from seed files
    ignoreDuringBuilds: false,
  },
  // Optimize for smaller bundle sizes
  experimental: {
    // Optimize package imports for smaller bundle size
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

export default nextConfig;
