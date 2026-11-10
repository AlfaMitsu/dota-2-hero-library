import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites(){
    return [{source:"/assets/:filename",destination:"https://raw.githubusercontent.com/AlfaMitsu/dota-2-hero-library/main/public/assets/:filename"}];
  }
};
export default nextConfig;
