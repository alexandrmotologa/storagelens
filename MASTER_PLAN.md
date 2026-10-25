# StorageLens: Master Implementation Plan

> Browser client storage and offline database workbench for IndexedDB, OPFS, and ServiceWorker.
> Inspects IndexedDB object stores with cursor pagination and full-text search, explores the Origin Private File System (OPFS) sandbox and embedded SQLite databases with a binary hex dump viewer, audits CacheStorage response headers, and simulates quota exhaustion under disk pressure.

---

## 1. System Architecture and Component Design

Modern web applications, Progressive Web Apps, and offline-first software store substantial data directly in client browsers using IndexedDB, the Origin Private File System (OPFS), SQLite Wasm, and ServiceWorker caches. Built-in browser developer tools have clear limitations:
1. Chrome DevTools Application tab lacks virtualized pagination, degrades on stores with more than 10,000 records, and provides no schema-wide search.
2. The Origin Private File System sandbox is invisible by default, with no native browser interface to inspect, read, or export SQLite and DuckDB binary files.
3. CacheStorage interfaces omit HTTP caching policy audits, validation token checks, and response header breakdowns.
4. Developers have no built-in mechanism to test application resilience against `QuotaExceededError` exceptions before deployment.

StorageLens provides an in-browser studio and diagnostics engine:
- **IndexedDB Studio**: Discovers all databases and object stores, runs cursor-paginated queries, applies multi-field text search, provides an inline JSON record editor, and exports to JSON, CSV, and SQL.
- **OPFS Virtual File Explorer**: Traverses the private file system tree, decodes SQLite 3 database headers and tables, provides a 16-byte binary hex dump viewer with chunked pagination, and supports file upload and download.
- **CacheStorage Inspector**: Inspects cached requests and responses, verifies `Cache-Control`, `ETag`, and `Last-Modified` headers, and previews JSON, text, and image payloads.
- **Storage Quota Simulator**: Tracks `navigator.storage.estimate()` metrics and allocates synthetic data blocks to test application error handling when storage limits are reached.
- **Dual Runtime**: Operates as a standalone web dashboard and as an embeddable shadow DOM drawer with a floating launcher.
- **Storage Playground**: Includes sample data generators for IndexedDB, OPFS SQLite, and CacheStorage for instant verification on clean browser profiles.

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
|  * Object Stores & Key Paths    |                 |  * SQLite 3 Header & Schema   |
|  * Cursor Paging & Full Search  |                 |  * 16-Byte Chunked Hex Viewer |
|  * JSON CRUD & CSV/SQL Export   |                 |  * Local File Download/Upload |
+-------+-------------------------+                 +-----------------------+-------+
        |                                                                   |
        +---------------------------------+---------------------------------+
                                          |
                        +-----------------v-----------------+
                        |    CacheStorage & PWA Auditor     |
                        |  * window.caches Ingestion        |
                        |  * Request / Response Payloads    |
                        |  * Header Policy Verification     |
                        |  * Visual Payload Previews        |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Storage Quota Stress Tester     |
                        |  * navigator.storage.estimate()   |
                        |  * Synthetic Pressure Allocator   |
                        |  * QuotaExceededError Trapper     |
                        |  * Instant Storage Cleanup        |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Studio UI & In-Page Drawer      |
                        |  * Full-Screen React 19 Studio    |
                        |  * Isolated Shadow DOM Mount      |
                        |  * Storage Seed Playground        |
                        +-----------------------------------+
```

---

## 2. Directory Structure

```
storagelens/
├── src/
│   ├── indexeddb/
│   │   ├── types.ts              # IndexedDB schema, record, and query types
│   │   ├── reflector.ts          # Database, store, and index discovery
│   │   ├── query.ts              # Cursor pagination, key ranges, and search
│   │   ├── mutator.ts            # Insert, update, delete records, and manage stores
│   │   └── exporter.ts           # JSON, CSV, and SQL export/import handlers
│   ├── opfs/
│   │   ├── types.ts              # File tree, binary node, and SQLite schema types
│   │   ├── file_tree.ts          # Recursive DirectoryHandle traversal and mutations
│   │   ├── reader.ts             # File API reader and download dispatcher
│   │   ├── hex_viewer.ts         # 16-byte offset hex and ASCII formatter with paging
│   │   └── sqlite_parser.ts      # SQLite 3 100-byte header decoder and schema reader
│   ├── cache/
│   │   ├── types.ts              # Cache entries, audit findings, and response types
│   │   ├── inspector.ts          # window.caches reader and response cloner
│   │   ├── header_audit.ts       # Cache-Control, ETag, and freshness validation
│   │   └── mutator.ts            # Cache entry removal and cache bucket deletion
│   ├── quota/
│   │   ├── types.ts              # Quota estimate, breakdown, and stress test state
│   │   ├── estimate.ts           # Usage vs quota calculator and persistence checks
│   │   └── stress_tester.ts      # Chunked pressure allocator and quota error trapper
│   ├── playground/
│   │   ├── seed_indexeddb.ts     # Sample e-commerce and task databases
│   │   ├── seed_opfs.ts          # Sample text files, JSON configs, and valid SQLite DB
│   │   └── seed_cache.ts         # Sample API responses and static assets
│   ├── components/
│   │   ├── common/               # Badges, modals, code viewers, and toolbars
│   │   ├── indexeddb/            # DB tree, virtualized grid, search bar, and record modal
│   │   ├── opfs/                 # Directory tree, hex viewer, SQLite view, and upload modal
│   │   ├── cache/                # Cache bucket list, request table, and header drawer
│   │   └── quota/                # Quota gauge, storage cards, and stress test console
│   ├── drawer/
│   │   ├── host.ts               # Shadow DOM creation and launcher badge
│   │   └── index.ts              # Entry point for storagelens.js embed library
│   ├── hooks/
│   │   ├── useIndexedDB.ts       # Hook for database reflection and query state
│   │   ├── useOPFS.ts            # Hook for OPFS tree traversal and file selection
│   │   ├── useCacheStorage.ts    # Hook for cache buckets and audits
│   │   └── useStorageQuota.ts    # Hook for quota estimation and stress testing
│   ├── types/                    # Shared application types and tab identifiers
│   ├── App.tsx                   # Main studio application shell
│   ├── main.tsx                  # Standalone entry point
│   └── index.css                 # Tailwind utility styles
├── tests/
│   ├── setup.ts                  # Test harness with fake-indexeddb
│   ├── indexeddb.test.ts         # Reflection, query, search, and mutation tests
│   ├── opfs.test.ts              # Hex formatting and SQLite header decoding tests
│   ├── cache.test.ts             # Header audit policy and cache inspection tests
│   └── quota.test.ts             # Quota calculations and stress allocation tests
├── docs/
│   └── images/                   # UI screenshots and animated demo GIF
├── index.html                    # Standalone HTML container
├── package.json
├── tsconfig.json
├── vite.config.ts                # Standalone studio bundler
├── vite.config.drawer.ts         # In-page drawer library bundler
└── README.md
```

---

## 3. Implementation Phases

### Phase 1: Core Engine Libraries
- Implement IndexedDB reflection, cursor pagination, filtering, record CRUD, and export routines.
- Implement OPFS file tree traversal, file creation, deletion, hex formatting, and SQLite 3 header decoding.
- Implement CacheStorage inspection, response cloning, and HTTP header auditing.
- Implement storage quota estimation and chunked pressure allocation.
- Write unit tests for all four modules in `tests/`.

### Phase 2: Playground & Sample Data Engine
- Build seed generators for IndexedDB (`ecommerce_db`, `notes_db`).
- Build seed generators for OPFS (text logs, configuration JSON, and a valid binary SQLite 3 database).
- Build seed generators for CacheStorage (`api-cache-v1`, `assets-cache-v1`).

### Phase 3: React 19 Studio Components
- Build the navigation header with origin details, quota preview, dark mode toggle, and seed launcher.
- Build the IndexedDB studio with database navigation, virtualized data grid, index query selector, search filter, and record edit modal.
- Build the OPFS file explorer with tree navigation, 16-byte hex dump viewer, SQLite schema table, and text viewer.
- Build the CacheStorage auditor with status badges, header audit cards, and body payload preview.
- Build the Quota & Pressure Simulator with quota gauges, breakdown cards, and real-time stress testing controls.

### Phase 4: In-Page Drawer Distribution
- Implement the shadow DOM host in `src/drawer/host.ts`.
- Bundle `storagelens.js` with zero stylesheet collision for third-party host pages.
- Expose global keyboard shortcut (`Ctrl+Shift+S`) and window API (`window.__STORAGELENS__`).

### Phase 5: Verification, Documentation & Visual Assets
- Run Vitest test suite and resolve all edge cases.
- Run typecheck and bundle both web app and drawer library.
- Author humanized technical documentation in `README.md`.
- Capture authentic UI screenshots and record animated demo GIF in `docs/images/`.
- Synchronize portfolio metadata across MTLG systems.
