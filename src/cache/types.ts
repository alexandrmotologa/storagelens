export interface HeaderAuditFinding {
  severity: 'pass' | 'warn' | 'error';
  code: string;
  header: string;
  message: string;
  recommendation?: string;
}

export interface CacheEntry {
  id: string;
  cacheName: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  contentType: string;
  contentLength: number;
  headers: Record<string, string>;
  auditFindings: HeaderAuditFinding[];
  hasPassedAudit: boolean;
}

export interface CacheBucketInfo {
  name: string;
  entryCount: number;
  totalBytes: number;
}

export interface CachedResponseBody {
  type: 'json' | 'text' | 'image' | 'binary';
  content?: string;
  blobUrl?: string;
}
