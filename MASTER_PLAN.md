# StorageLens: Master Implementation Plan

> Browser client storage and offline database workbench for IndexedDB, OPFS, ServiceWorker CacheStorage, Web Storage, and Web Locks.
> Inspects IndexedDB object stores with cursor pagination and full-text search, runs live SQL queries on OPFS SQLite databases via Wasm, explores the Origin Private File System with an advanced binary hex dump inspector, audits CacheStorage response headers, monitors Web Locks concurrency, and simulates quota exhaustion under disk pressure.

---

## 1. System Architecture and Component Design

Modern web applications, Progressive Web Apps, and offline-first software store substantial data directly in client browsers using IndexedDB, the Origin Private File System (OPFS), SQLite Wasm, and ServiceWorker caches. Built-in browser developer tools have clear limitations:
1. Chrome DevTools Application tab lacks virtualized pagination, degrades on stores with large datasets, and provides no schema-wide search.
2. The Origin Private File System sandbox is invisible by default, with no native browser interface to inspect, read, or export SQLite binary files.
3. CacheStorage interfaces omit HTTP caching policy audits, validation token checks, and response header breakdowns.
4. Web Storage interfaces offer no live byte-size calculation, JSON tree introspection, or quota headroom tracking.
5. Concurrency across tabs, workers, and locks is opaque, making local-first database lock contention difficult to diagnose.
6. Developers have no built-in mechanism to test application resilience against `QuotaExceededError` exceptions before deployment.

StorageLens provides an in-browser studio and diagnostics engine:
- **IndexedDB Studio**: Discovers all databases and object stores, runs cursor-paginated queries, applies multi-field text search, provides an inline JSON record editor, and exports to JSON, CSV, and SQL.
- **OPFS Virtual File Explorer**: Traverses the private file system tree, decodes SQLite 3 database headers and tables, provides an interactive 16-byte binary hex dump viewer with byte decoding inspector and binary search, and supports file upload and download.
- **SQLite Wasm SQL Console**: Executes arbitrary SQL queries directly against OPFS SQLite databases in memory with execution timing, row count telemetry, and CSV/JSON export.
- **CacheStorage Inspector**: Inspects cached requests and responses, verifies `Cache-Control`, `ETag`, and `Last-Modified` headers, and previews JSON, text, and image payloads.
- **Web Storage Studio**: Inspects and edits `localStorage` and `sessionStorage` with live byte-size tracking, JSON format detection, quota capacity progress, and import/export.
- **Web Locks Diagnostics**: Inspects active held and pending cross-tab/worker locks via `navigator.locks.query()` and includes an interactive lock contention simulator.
- **Storage Quota Simulator**: Tracks `navigator.storage.estimate()` metrics, renders visual capacity distribution charts across subsystems, and allocates synthetic data blocks to test application error handling when storage limits are reached.
- **Command Palette (`⌘K`)**: Provides instant fuzzy navigation across all databases, stores, OPFS files, cache buckets, and studio actions.
- **Dual Runtime**: Operates as a standalone web dashboard and as an embeddable shadow DOM drawer with a floating launcher.
- **Storage Playground**: Includes sample data generators for IndexedDB, OPFS SQLite, CacheStorage, and Web Storage for instant verification on clean browser profiles.

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
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-------------------------+                 +-----------------------v-------+
|   SQLite Wasm SQL Query Runner  |                 |   Web Locks API Concurrency   |
|  * In-Memory sql.js Engine      |                 |  * navigator.locks Snapshot   |
|  * Execution Timing & Rows      |                 |  * Held vs Pending Queues     |
|  * CSV and JSON Data Exporters  |                 |  * Lock Contention Simulator  |
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
                        |   Unified Web Storage Studio      |
                        |  * localStorage & sessionStorage  |
                        |  * Live Byte Size & Quota Bar     |
                        |  * JSON Editor & Formatter        |
                        |  * Instant Import / Export JSON   |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Storage Quota Stress Tester     |
                        |  * navigator.storage.estimate()   |
                        |  * Storage Breakdown Treemap      |
                        |  * Synthetic Pressure Allocator   |
                        |  * QuotaExceededError Trapper     |
                        |  * Instant Storage Cleanup        |
                        +-----------------+-----------------+
                                          |
                        +-----------------v-----------------+
                        |   Studio UI & In-Page Drawer      |
                        |  * Full-Screen React 19 Studio    |
                        |  * Global ⌘K Command Palette      |
                        |  * Isolated Shadow DOM Mount      |
                        |  * Complete Seed Playground       |
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
│   │   ├── hex_viewer.ts         # 16-byte hex formatter, byte inspector, and search
│   │   ├── sqlite_parser.ts      # SQLite 3 100-byte header decoder and schema reader
│   │   └── sqlite_runner.ts      # In-memory sql.js query execution, timing, and export
│   ├── cache/
│   │   ├── types.ts              # Cache entries, audit findings, and response types
│   │   ├── inspector.ts          # window.caches reader and response cloner
│   │   ├── header_audit.ts       # Cache-Control, ETag, and freshness validation
│   │   └── mutator.ts            # Cache entry removal and cache bucket deletion
│   ├── webstorage/
│   │   ├── types.ts              # WebStorage item, stats, and target types
│   │   └── manager.ts            # Key-value reader, writer, quota meter, import/export
│   ├── locks/
│   │   ├── types.ts              # WebLock snapshot and item types
│   │   └── inspector.ts          # navigator.locks query inspector and simulator
│   ├── quota/
│   │   ├── types.ts              # Quota estimate, breakdown, and stress test state
│   │   ├── estimate.ts           # Usage vs quota calculator and persistence checks
│   │   └── stress_tester.ts      # Chunked pressure allocator and quota error trapper
│   ├── playground/
│   │   ├── seed_indexeddb.ts     # Sample e-commerce and task databases
│   │   ├── seed_opfs.ts          # Sample text logs, JSON configs, and SQLite DB
│   │   ├── seed_cache.ts         # Sample API responses and static assets
│   │   ├── seed_webstorage.ts    # Sample localStorage and sessionStorage items
│   │   └── index.ts              # Unified playground seeder
│   ├── components/
│   │   ├── common/               # Badges, modals, code viewers, and CommandPalette (⌘K)
│   │   ├── indexeddb/            # DB tree, virtualized grid, search bar, and record modal
│   │   ├── opfs/                 # Directory tree, hex viewer, SQLite view, and SqlConsole
│   │   ├── cache/                # Cache bucket list, request table, and header drawer
│   │   ├── webstorage/           # WebStorage studio, quota progress, and JSON modal
│   │   ├── locks/                # Web Locks snapshot tables and contention simulator
│   │   └── quota/                # Quota gauge, storage breakdown chart, and stress tester
│   ├── drawer/
│   │   ├── host.tsx              # Shadow DOM creation and launcher badge
│   │   └── index.ts              # Entry point for storagelens.js embed library
│   ├── hooks/
│   │   ├── useIndexedDB.ts       # Hook for database reflection and query state
│   │   ├── useOPFS.ts            # Hook for OPFS tree traversal and file selection
│   │   ├── useCacheStorage.ts    # Hook for cache buckets and audits
│   │   ├── useWebStorage.ts      # Hook for localStorage and sessionStorage state
│   │   ├── useWebLocks.ts        # Hook for navigator.locks snapshot and simulation
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
│   ├── quota.test.ts             # Quota calculations and stress allocation tests
│   ├── webstorage.test.ts        # Web Storage items, stats, export, and import tests
│   ├── locks.test.ts             # Web Locks support, query, and simulation tests
│   ├── hex_extended.test.ts      # Byte inspection and binary pattern search tests
│   └── sqlite_export.test.ts     # SQL query results to CSV and JSON export tests
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

### Phase 1: Core Engine Libraries (Completed)
- Implemented IndexedDB reflection, cursor pagination, filtering, record CRUD, and export routines.
- Implemented OPFS file tree traversal, file creation, deletion, hex formatting, and SQLite 3 header decoding.
- Implemented CacheStorage inspection, response cloning, and HTTP header auditing.
- Implemented storage quota estimation and chunked pressure allocation.
- Wrote unit tests in `tests/`.

### Phase 2: Playground & Sample Data Engine (Completed)
- Built seed generators for IndexedDB (`ecommerce_db`, `tasks_db`).
- Built seed generators for OPFS with valid binary SQLite 3 database (`metrics.db`) via sql.js.
- Built seed generators for CacheStorage (`api-cache-v1`, `static-assets-v1`).
- Built seed generators for Web Storage (`localStorage` and `sessionStorage`).

### Phase 3: React 19 Studio Components (Completed)
- Built the navigation header with origin details, quota preview, quick find, and seed launcher.
- Built the IndexedDB studio with database navigation, virtualized data grid, index selector, search filter, and record edit modal.
- Built the OPFS file explorer with tree navigation, 16-byte hex dump viewer, SQLite schema table, and text viewer.
- Built the CacheStorage auditor with status badges, header audit cards, and body payload preview.
- Built the Quota & Pressure Simulator with quota gauges, breakdown cards, and real-time stress testing controls.

### Phase 4: In-Page Drawer Distribution (Completed)
- Implemented shadow DOM host in `src/drawer/host.tsx`.
- Bundled `storagelens.js` with zero stylesheet collision for third-party host pages.
- Exposed global keyboard shortcut (`Ctrl+Shift+S`) and window API (`window.__STORAGELENS__`).

### Phase 5: Extended Storage Studio Capabilities (Completed)
- Built interactive SQLite Wasm SQL console (`sql.js`) with query timing, error capture, and CSV/JSON export.
- Built Web Locks API diagnostics (`navigator.locks.query()`) with active/pending queues and lock contention simulator.
- Built unified Web Storage Studio (`localStorage` & `sessionStorage`) with live byte sizing, JSON tree view, quota bar, and export/import.
- Built advanced Hex Viewer with byte decoding inspector (int8, uint8, int16LE, uint32LE, binary, ASCII) and binary sequence search.
- Built visual storage breakdown treemap and capacity allocation chart.
- Built global Command Palette (`⌘K`) for instant fuzzy navigation and actions across databases, tables, OPFS files, and caches.
- Expanded test suite to 29 tests across 8 test suites passing at 100%.

### Phase 6: Verification, Documentation & Visual Assets (Completed)
- Verified all 29 Vitest tests pass with 100% green status.
- Verified TypeScript compilation and production builds for standalone web app and drawer library.
- Authored humanized documentation in `README.md` following strict factual guidelines without AI clichés or em dashes.
- Captured high-resolution UI screenshots and rendered updated animated demo GIF in `docs/images/`.
- Synchronized portfolio metadata across MTLG systems (`mtlg-site` and `mtlglabs-space`).
