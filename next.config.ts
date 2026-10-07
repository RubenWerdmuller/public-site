import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';
const config: NextConfig = { serverExternalPackages: ['@electric-sql/pglite', 'pg', 'web-push'], devIndicators: false, allowedDevOrigins:Object.values(networkInterfaces()).flatMap(entries=>(entries??[]).filter(entry=>entry.family==='IPv4'&&!entry.internal).map(entry=>entry.address)) };
export default config;
