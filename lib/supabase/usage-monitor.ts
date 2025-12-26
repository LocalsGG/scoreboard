/**
 * Supabase Cached Egress Usage Monitor
 * 
 * This utility helps monitor and track Supabase cached egress usage
 * to prevent exceeding free tier limits (5 GB/month).
 * 
 * Usage:
 * - Check usage via Supabase MCP: mcp_supabase_get_project
 * - Log usage patterns in your application
 * - Set up alerts when approaching limits
 */

import { createAdminSupabaseClient } from './server';

interface UsageMetrics {
  storageRequests: number;
  apiRequests: number;
  timestamp: Date;
}

/**
 * In-memory cache for tracking request patterns
 * In production, consider using Redis or a database for distributed tracking
 */
const usageCache = new Map<string, UsageMetrics[]>();

/**
 * Track a storage request to monitor egress
 */
export function trackStorageRequest(endpoint: string, sizeBytes?: number): void {
  const key = getCacheKey();
  const metrics = usageCache.get(key) || [];
  
  metrics.push({
    storageRequests: 1,
    apiRequests: 0,
    timestamp: new Date(),
  });
  
  // Keep only last 24 hours of metrics
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentMetrics = metrics.filter(m => m.timestamp > oneDayAgo);
  
  usageCache.set(key, recentMetrics);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Storage Request] ${endpoint}${sizeBytes ? ` (${formatBytes(sizeBytes)})` : ''}`);
  }
}

/**
 * Track an API request to monitor egress
 */
export function trackApiRequest(endpoint: string, responseSizeBytes?: number): void {
  const key = getCacheKey();
  const metrics = usageCache.get(key) || [];
  
  metrics.push({
    storageRequests: 0,
    apiRequests: 1,
    timestamp: new Date(),
  });
  
  // Keep only last 24 hours of metrics
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentMetrics = metrics.filter(m => m.timestamp > oneDayAgo);
  
  usageCache.set(key, recentMetrics);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Request] ${endpoint}${responseSizeBytes ? ` (${formatBytes(responseSizeBytes)})` : ''}`);
  }
}

/**
 * Get current usage statistics for the last 24 hours
 */
export function getUsageStats(): {
  totalStorageRequests: number;
  totalApiRequests: number;
  timeRange: { start: Date; end: Date };
} {
  const key = getCacheKey();
  const metrics = usageCache.get(key) || [];
  
  const totalStorageRequests = metrics.reduce((sum, m) => sum + m.storageRequests, 0);
  const totalApiRequests = metrics.reduce((sum, m) => sum + m.apiRequests, 0);
  
  const timestamps = metrics.map(m => m.timestamp);
  const start = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : new Date();
  const end = new Date();
  
  return {
    totalStorageRequests,
    totalApiRequests,
    timeRange: { start, end },
  };
}

/**
 * Get cache key for current hour (for hourly aggregation)
 */
function getCacheKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if we should throttle requests based on usage patterns
 * This is a simple heuristic - you may want to implement more sophisticated logic
 */
export function shouldThrottleRequest(): boolean {
  const stats = getUsageStats();
  // Simple heuristic: if we have more than 1000 requests in the last hour, throttle
  // Adjust based on your needs
  const requestCount = stats.totalStorageRequests + stats.totalApiRequests;
  return requestCount > 1000;
}

