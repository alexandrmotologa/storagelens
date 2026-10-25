import { describe, it, expect } from 'vitest';
import { auditResponseHeaders } from '../src/cache/header_audit';

describe('CacheStorage Auditor Engine', () => {
  it('flags missing Cache-Control and missing validation tokens', () => {
    const headers = {
      'content-type': 'application/json',
    };

    const findings = auditResponseHeaders(headers, 200);

    const missingCC = findings.find((f) => f.code === 'MISSING_CACHE_CONTROL');
    expect(missingCC).toBeDefined();
    expect(missingCC?.severity).toBe('error');

    const missingVal = findings.find((f) => f.code === 'MISSING_VALIDATION_TOKEN');
    expect(missingVal).toBeDefined();
    expect(missingVal?.severity).toBe('warn');
  });

  it('passes valid max-age, ETag, and Content-Type', () => {
    const headers = {
      'Cache-Control': 'public, max-age=86400, immutable',
      ETag: '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
      'Content-Type': 'application/javascript',
      Vary: 'Accept-Encoding',
      Age: '120',
    };

    const findings = auditResponseHeaders(headers, 200);

    const hasError = findings.some((f) => f.severity === 'error');
    expect(hasError).toBe(false);

    const validMaxAge = findings.find((f) => f.code === 'VALID_MAX_AGE');
    expect(validMaxAge).toBeDefined();

    const hasEtag = findings.find((f) => f.code === 'HAS_ETAG');
    expect(hasEtag).toBeDefined();
  });

  it('flags wildcard Vary as error', () => {
    const headers = {
      'Cache-Control': 'max-age=3600',
      'Content-Type': 'text/html',
      Vary: '*',
    };

    const findings = auditResponseHeaders(headers, 200);
    const varyError = findings.find((f) => f.code === 'VARY_WILDCARD');
    expect(varyError).toBeDefined();
    expect(varyError?.severity).toBe('error');
  });
});
