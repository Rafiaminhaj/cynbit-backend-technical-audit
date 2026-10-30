// remediations/middleware.ts
// Next.js Edge Middleware for Rate Limiting & Security Injections

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory sliding window cache for Edge demonstration
// In production, integrate with Upstash Redis (@upstash/ratelimit)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;     // Max 30 requests per minute per IP

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting specifically on API and Form Submission routes
  if (pathname.startsWith('/api') || pathname.startsWith('/contact')) {
    const now = Date.now();
    const clientData = ipRequestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

    if (now > clientData.resetTime) {
      clientData.count = 0;
      clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    }

    clientData.count += 1;
    ipRequestCounts.set(ip, clientData);

    const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - clientData.count);

    if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please wait before retrying.',
          retryAfterSeconds: Math.ceil((clientData.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((clientData.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/contact']
};
