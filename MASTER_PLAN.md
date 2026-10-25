# StorageLens: Master Implementation Plan

> **Browser Client Storage & Offline Database Workbench for IndexedDB, OPFS & ServiceWorker**
>
> *Deep-dive browser storage inspector and client-side database studio. Visualizes IndexedDB object stores and indexes with full-text search, explores the hidden Origin Private File System (OPFS) sandbox and embedded SQLite/DuckDB databases, inspects CacheStorage responses, and simulates quota exhaustion under disk pressure.*

---

## 1. Project Overview & Architecture

Modern web applications, Progressive Web Apps (PWAs), and local-first software increasingly store substantial data directly inside the browser (IndexedDB, Origin Private File System - OPFS, SQLite Wasm, PGlite, RxDB, Dexie.js). However, developers are severely limited by browser developer tools:
1. **Archaic Chrome "Application" Tab**: The built-in IndexedDB viewer is slow, lacks pagination, fails on stores with more than 10,000 items, and has no search or schema visualization.
2. **Invisible OPFS File System**: The Origin Private File System (OPFS) is a fast, hidden virtual filesystem where SQLite Wasm and DuckDB store `.db` files. Browsers provide zero native GUI to view, download, or edit files stored in OPFS.
3. **Opaque ServiceWorker CacheStorage**: Developers cannot inspect binary assets, response headers (`Content-Type`, `Cache-Control`), or evaluate cache invalidation policies across `window.caches`.
4. **Untested Disk Quota Failures**: Applications crash when users run out of storage on mobile devices because developers cannot easily simulate the dreaded `QuotaExceededError` in local development.

**StorageLens** delivers a modern, in-browser developer studio and diagnostics workbench:
- **IndexedDB Deep Data Grid**: Full schema reflection, virtualized table rendering, full-text search across all object stores, JSON record editor, and CSV/JSON export.
- **OPFS Virtual File Explorer**: Interactive tree view of the hidden OPFS directory structure, previewing text, binary hex dumps, and downloading SQLite/DuckDB databases with 1 click.
- **CacheStorage Inspector**: Analyzes cached `Request` / `Response` pairs, measures byte sizes, and audits caching headers.
- **Quota Pressure & Eviction Simulator**: Queries `navigator.storage.estimate()` and simulates quota exhaustion by allocating dummy chunks to test graceful offline degradation.
- **Drop-in Embed or Standalone App**: Available as a lightweight in-app floating drawer or a standalone desktop/web app connecting via Chrome DevTools Protocol (CDP).

```
+-----------------------------------------------------------------------------------+
|                                    STORAGELENS                                    |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-------------------------+                 +-----------------------v-------+
|    IndexedDB Reflection Engine  |                 |     OPFS Sandbox Explorer     |
|  * Multi-Database Schema Tree   |                 |  * Directory Hierarchy Reader |
|  * Object Stores & Key Paths    |                 |  * SQLite / DuckDB .db Inspect|
|  * Virtualized Data Grid        |                 |  * File Download & Upload     |
+-------+-------------------------+                 +-----------------------+-------+
        |                                                                   |
        +---------------------------------+---------------------------------+
                                          |
                        +-----------------v-----------------+
                        |    CacheStorage & PWA Auditor     |
                        |  * window.caches Ingestion        |
                        |  * Request / Response Payloads    |
                        |  * Cache Header Verification      |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Storage Quota Stress Tester     |
                        |  * navigator.storage.estimate()   |
                        |  * Simulated QuotaExceededError   |
                        |  * Eviction Resilience Validator  |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Interactive Web Studio & Drawer |
                        |  * Virtualized JSON Data Grid     |
                        |  * Binary Hex Dump Viewer         |
                        |  * 1-Click Export (SQLite / JSON) |
                        +-----------------------------------+
```

---

## 2. Directory Structure

```
storagelens/
├── src/
│   ├── indexeddb/
│   │   ├── reflector.go          # Reflects DB names, version, stores, indexes
│   │   ├── query.ts              # Key-range queries, cursor pagination, search
│   │   ├── mutator.ts            # Insert, update, and delete record handlers
│   │   └── exporter.ts           # JSON / CSV export and schema dump
│   ├── opfs/
│   │   ├── file_tree.ts          # Recursive DirectoryHandle traversal
│   │   ├── reader.ts             # FileSystemSyncAccessHandle / File API reader
│   │   ├── hex_viewer.ts         # Byte hex/ASCII formatter for binary files
│   │   └── sqlite_adapter.ts     # Detects and extracts SQLite Wasm database headers
│   ├── cache/
│   │   ├── cache_inspector.ts    # window.caches reader and response extractor
│   │   └── header_audit.ts       # Verifies TTL, Cache-Control, and ETag presence
│   ├── quota/
│   │   ├── estimate.ts           # Usage vs Quota percentage calculator
│   │   └── stress_tester.ts      # Allocates memory/storage to trigger QuotaExceededError
│   └── drawer/
│       ├── host.ts               # In-page drawer mount manager
│       └── host.css              # Isolated shadow-DOM styling
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IdbGridView.tsx       # Virtualized records table with search & filter
│   │   │   ├── OpfsTreeViewer.tsx    # Interactive file tree with binary preview
│   │   │   ├── CacheAuditorList.tsx  # ServiceWorker cache records & headers
│   │   │   ├── QuotaGauge.tsx        # Storage usage gauge with stress-test slider
│   │   │   └── RecordEditModal.tsx   # JSON schema-aware record editor
│   │   ├── hooks/
│   │   │   └── useStorageState.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   ├── indexeddb.test.ts
│   └── opfs.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Implementation Roadmap

### Phase 1: IndexedDB Schema Reflection & Virtualized Query Engine
- Implement `src/indexeddb/reflector.ts`:
  - Query `indexedDB.databases()` to discover all databases and version numbers.
  - Open each database to enumerate `objectStoreNames`, `keyPath`, `autoIncrement`, and defined `indexNames`.
- Implement `src/indexeddb/query.ts`:
  - High-performance cursor pagination using `IDBKeyRange` to fetch records in batches of 100.
  - Implement client-side in-memory filter matching substring queries against any field within stored JSON objects.

### Phase 2: Origin Private File System (OPFS) Sandbox Explorer
- Implement `src/opfs/file_tree.ts`:
  - Access `navigator.storage.getDirectory()` to obtain the OPFS root handle.
  - Recursively traverse subdirectories using `values()` iterator on `FileSystemDirectoryHandle`.
  - Extract metadata: file name, byte size, modification timestamp.
- Implement `src/opfs/reader.ts`:
  - Read binary files via `getFile()`.
  - Implement `src/opfs/sqlite_adapter.ts`: Detect the standard 16-byte SQLite header string (`"SQLite format 3\000"`), extract page size and database schema tables.
  - Provide instant file download to user's local disk.

### Phase 3: CacheStorage Inspector & Response Auditing
- Implement `src/cache/cache_inspector.ts`:
  - Ingest `window.caches.keys()`.
  - For each cache, fetch all `Request` keys using `cache.keys()`.
  - Clone matching `Response` objects to extract: status, statusText, headers (`Cache-Control`, `Content-Type`, `Content-Length`), and preview body text or image preview.

### Phase 4: Quota Stress Tester & Eviction Simulation
- Implement `src/quota/stress_tester.ts`:
  - Query `navigator.storage.estimate()` to calculate remaining bytes.
  - Provide an interactive slider to allocate synthetic large Blobs into a temporary IndexedDB store until the browser throws a `QuotaExceededError`.
  - Test and verify application behavior: Does the app notify the user, trigger cleanup, or crash?
  - Provide 1-click "Release Allocated Space" to instantly clean up synthetic test data.

### Phase 5: Web Studio, Embed Drawer & Verification Suite
- Build modern React 19 interface in `web/`:
  - **IndexedDB Tab**: Virtualized table with column sorting, live search, and inline JSON editing.
  - **OPFS File Tree Tab**: Folder navigation with binary Hex Viewer and SQLite schema preview.
  - **CacheStorage Tab**: Grouped HTTP requests with status pills and response header drawer.
- Support Shadow DOM embedding: Load `storagelens.js` in any app with `window.__STORAGELENS__.open()`.

---

## 4. Agent Kickoff Prompt

```markdown
You are implementing **StorageLens**, a browser client storage and offline database workbench for IndexedDB, OPFS, and ServiceWorker in TypeScript + React 19.

### Execution Plan:
1. Initialize the project in `B:\workgit\storagelens` with root `package.json`, TypeScript configuration, and dependencies (`vite`, `lucide-react`, `tailwindcss`).
2. Implement `src/indexeddb/` to reflect browser databases, cursor-paginate object stores, and support full-text search across records.
3. Implement `src/opfs/` to recursively explore the Origin Private File System sandbox, preview binary files (hex dump), and identify SQLite Wasm databases.
4. Implement `src/cache/` to inspect `window.caches` (ServiceWorker responses and headers).
5. Implement `src/quota/` to calculate storage percentages and simulate `QuotaExceededError` under artificial disk pressure.
6. Build the modern React 19 interface in `web/` featuring the IndexedDB Data Grid, OPFS Tree Viewer, and Quota Gauge.
7. Build distribution outputs: both an embeddable shadow-DOM drawer (`storagelens.js`) and the standalone web application.

Maintain 100% production code without mocks, placeholders, or empty handlers.
```
