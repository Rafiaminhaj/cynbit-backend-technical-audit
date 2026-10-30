# Cynbit Technologies — Comprehensive Backend Technical Audit Report

**Author:** Rafia Minhaj  
**Assessment:** Backend Developer Intern Practical Challenge  
**Target:** `https://cynbit.in`  
**Date:** October 30, 2026  

---

## 1. Architecture & Edge Delivery Analysis

### 1.1 Observable Infrastructure Profile
Passive HTTP inspection reveals Cynbit's platform is engineered on a modern cloud-native stack:
* **Hosting Provider:** Vercel Global Edge Network
* **Edge Node:** `bom1::zb2vd` (Mumbai, India POP) — optimal latency for domestic traffic.
* **Rendering Architecture:** Next.js App Router utilizing React Server Components (RSC).
  * Evidence: `Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`
  * Pre-rendering state: `X-Nextjs-Prerender: 1`
  * Incremental Static Regeneration (ISR) window: `X-Nextjs-Stale-Time: 300` (5-minute stale-while-revalidate threshold).
* **Caching Efficiency:** Observed `X-Vercel-Cache: HIT` and `Age: 101104` indicating effective edge caching for static assets.

### 1.2 Architectural Strengths
1. **Low Time-to-First-Byte (TTFB):** Edge delivery at the Mumbai gateway delivers fast initial document delivery.
2. **Efficient Hybrid Rendering:** SSG/ISR offloads compute pressure from serverless runtimes.

---

## 2. Security & Header Hardening Audit

### 2.1 Critical Findings

#### Finding 2.1: Wildcard CORS on Root HTML Document
* **Observed Header:** `Access-Control-Allow-Origin: *`
* **Risk Level:** **Medium-High**
* **Technical Analysis:** The root document returns an unrestricted wildcard `*` for CORS. While appropriate for public static assets (images/fonts), returning `Access-Control-Allow-Origin: *` on application pages creates security risks when cross-origin scripts attempt credentialed requests or DOM data scraping.
* **Remediation:** Remove wildcard CORS from page routes and scope CORS strictly to API endpoints (`/api/*`) with whitelist validation.

#### Finding 2.2: Missing Essential Browser Security Headers
The following defense-in-depth headers were absent from the server response:
1. `Content-Security-Policy (CSP)`: Protects against Cross-Site Scripting (XSS) and unauthorized script injection.
2. `X-Frame-Options: DENY` (or `frame-ancestors 'none'`): Protects the domain from Clickjacking attacks where Cynbit pages could be embedded in malicious iframes.
3. `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks in older and modern browsers.
4. `Referrer-Policy: strict-origin-when-cross-origin`: Controls metadata leakage in outgoing HTTP requests.
5. `Permissions-Policy`: Restricts browser camera, microphone, and geolocation APIs.

*Note: `Strict-Transport-Security: max-age=63072000` (HSTS) is properly implemented.*

---

## 3. API & Payload Handling Architecture

### 3.1 Observable Endpoints & Robots Configuration
From `/robots.txt`:
```text
Disallow: /api/
Disallow: /admin/
Disallow: /portal/
```

### 3.2 Lead Capture & Contact Form Analysis
The contact surface (`/contact`) captures high-value B2B inquiries (`fullName`, `email`, `company`, `industry`).

#### Identified Vulnerabilities & Enhancement Opportunities:
1. **Payload Schema Validation:** 
   * Form inputs must be validated against a strict runtime schema (e.g., Zod) on the backend to enforce type constraints, regex email verification, string length boundaries, and sanitization before persistence.
2. **Rate Limiting & Anti-Spam:**
   * Absence of public rate-limiting headers (`RateLimit-Limit`, `RateLimit-Remaining`).
   * Contact endpoints without IP-based throttling are susceptible to automated spam bot exhaustion and CRM pollution.
3. **Error Reporting Standardization:**
   * Backend APIs should adhere to RFC 7807 (Problem Details for HTTP APIs) returning structured JSON error bodies:
   ```json
   {
     "type": "https://cynbit.in/errors/validation-failed",
     "title": "Invalid Payload",
     "status": 422,
     "detail": "Email address format is invalid.",
     "invalidParams": [{"name": "email", "reason": "Must be valid email domain"}]
   }
   ```

---

## 4. Performance & Database Scaling Strategy

### 4.1 Serverless Connection Exhaustion (Connection Pooling)
In serverless Next.js deployments, incoming traffic spikes spin up ephemeral Node.js/Edge instances. Each instance opens direct connections to the database, rapidly saturating PostgreSQL/MySQL `max_connections` limits.
* **Remediation:** Implement connection pooling via pgBouncer, Supabase Pooler, or Prisma Accelerate/Data Proxy with global singleton client instantiation.

---

## 5. Remediation Roadmap

1. **Immediate (Sprint 1):** Deploy `remediations/next.config.js` to patch security headers and scope CORS.
2. **Short-Term (Sprint 2):** Implement `remediations/middleware.ts` for Edge sliding-window rate limiting.
3. **Mid-Term (Sprint 3):** Standardize API validation using `remediations/api-schema.ts` and verify serverless connection pooling via `remediations/database-pool.ts`.
