import { HeaderAuditFinding } from './types';

/**
 * Audits HTTP response headers for best-practice caching, revalidation, and security.
 */
export function auditResponseHeaders(
  headers: Record<string, string>,
  status: number
): HeaderAuditFinding[] {
  const findings: HeaderAuditFinding[] = [];

  // Convert all header keys to lowercase for uniform lookup
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = v;
  }

  const cacheControl = normalized['cache-control'];
  const etag = normalized['etag'];
  const lastModified = normalized['last-modified'];
  const contentType = normalized['content-type'];
  const vary = normalized['vary'];
  const age = normalized['age'];

  // 1. Audit Cache-Control
  if (!cacheControl) {
    findings.push({
      severity: 'error',
      code: 'MISSING_CACHE_CONTROL',
      header: 'Cache-Control',
      message: 'No Cache-Control header found in response.',
      recommendation:
        'Specify explicit caching policy (e.g. "public, max-age=31536000, immutable" or "no-cache").',
    });
  } else {
    const cc = cacheControl.toLowerCase();
    if (cc.includes('no-store')) {
      findings.push({
        severity: 'warn',
        code: 'NO_STORE_IN_CACHE',
        header: 'Cache-Control',
        message: 'Response specifies "no-store" but is stored in CacheStorage.',
        recommendation: 'Verify if sensitive data should be retained in client cache.',
      });
    } else if (cc.includes('max-age')) {
      const match = cc.match(/max-age=(\d+)/);
      if (match) {
        const maxAgeSec = parseInt(match[1], 10);
        if (maxAgeSec === 0) {
          findings.push({
            severity: 'warn',
            code: 'ZERO_MAX_AGE',
            header: 'Cache-Control',
            message: 'max-age is set to 0. Requires validation on every hit.',
          });
        } else {
          findings.push({
            severity: 'pass',
            code: 'VALID_MAX_AGE',
            header: 'Cache-Control',
            message: `Response cached with max-age=${maxAgeSec}s.`,
          });
        }
      }
    }
  }

  // 2. Audit Revalidation Tokens (ETag / Last-Modified)
  if (!etag && !lastModified && status === 200) {
    findings.push({
      severity: 'warn',
      code: 'MISSING_VALIDATION_TOKEN',
      header: 'ETag / Last-Modified',
      message: 'Missing both ETag and Last-Modified headers for conditional requests.',
      recommendation: 'Add an ETag or Last-Modified header to enable 304 Not Modified revalidation.',
    });
  } else {
    if (etag) {
      findings.push({
        severity: 'pass',
        code: 'HAS_ETAG',
        header: 'ETag',
        message: `Validation token present: ${etag}`,
      });
    }
    if (lastModified) {
      findings.push({
        severity: 'pass',
        code: 'HAS_LAST_MODIFIED',
        header: 'Last-Modified',
        message: `Last modified timestamp present: ${lastModified}`,
      });
    }
  }

  // 3. Audit Content-Type
  if (!contentType) {
    findings.push({
      severity: 'error',
      code: 'MISSING_CONTENT_TYPE',
      header: 'Content-Type',
      message: 'No Content-Type header specified.',
      recommendation: 'Always serve explicit MIME types to prevent browser MIME-sniffing issues.',
    });
  }

  // 4. Audit Vary
  if (vary && vary.trim() === '*') {
    findings.push({
      severity: 'error',
      code: 'VARY_WILDCARD',
      header: 'Vary',
      message: 'Vary header is set to wildcard (*). This prevents effective cache hits.',
      recommendation: 'Limit Vary to specific headers like "Accept-Encoding" or "Accept".',
    });
  }

  // 5. Age check
  if (age) {
    findings.push({
      severity: 'pass',
      code: 'HAS_AGE',
      header: 'Age',
      message: `Resource age is ${age} seconds.`,
    });
  }

  return findings;
}
