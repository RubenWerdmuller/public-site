import type { NextConfig } from 'next';
const config: NextConfig = { serverExternalPackages: ['@electric-sql/pglite', 'pg', 'web-push'], devIndicators: false };
export default config;
