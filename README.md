<p align="center">
  <img src="docs/images/logo.svg" alt="StorageLens Logo" width="96" height="96" />
</p>

<h1 align="center">StorageLens</h1>

<p align="center">
  Browser client storage and offline database workbench for IndexedDB, OPFS, and ServiceWorker CacheStorage.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.0-61dafb.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.3-38bdf8.svg" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vitest-5.0-729b1b.svg" alt="Vitest" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License MIT" />
</p>

---

## Overview

StorageLens is an in-browser developer studio that replaces the Chrome DevTools Application tab. It provides schema introspection for IndexedDB, virtualized file browsing and 16-byte hex inspection for the Origin Private File System (OPFS), header auditing for ServiceWorker CacheStorage, and a disk quota stress simulator for verifying QuotaExceededError handling.

It runs as a standalone web application and as an embeddable shadow DOM drawer that injects into web applications without style collisions.

![StorageLens Live Demo](docs/images/storagelens_demo.gif)

---

## Core Capabilities

### 1. IndexedDB Studio and Query Engine
- Discovers all databases and object stores via `indexedDB.databases()`.
- Reflects versions, keyPath definitions, autoIncrement flags, and indexes.
- Implements cursor pagination with forward and backward navigation for large datasets.
- Filters records in memory across keys and nested JSON values.
- Supports inline record insertion, updates, deletions, and store clearing.
- Exports object stores to formatted JSON, CSV, and SQL INSERT statements.
- Imports JSON record arrays into any target store with validation.

![IndexedDB Studio](docs/images/storagelens_indexeddb.png)

### 2. Origin Private File System (OPFS) Sandbox Explorer
- Traverses the virtual directory hierarchy from `navigator.storage.getDirectory()`.
- Displays file names, folder structures, byte sizes, and modification timestamps.
- Decodes SQLite 3 100-byte database headers: page size, format versions, change counter, page count, and text encoding.
- Parses root B-tree pages to extract table names and DDL statements.
- Includes a 16-byte chunked hex dump viewer with offset calculation, hex pairs, and ASCII representation.
- Provides 1-click file downloads directly to the host operating system.

![OPFS Virtual Explorer & Hex Viewer](docs/images/storagelens_opfs_hex.png)

### 3. ServiceWorker CacheStorage Auditor
- Inspects cache buckets registered in `window.caches`.
- Analyzes cached request and response pairs with HTTP status codes and MIME types.
- Audits response headers for `Cache-Control`, `max-age`, `ETag`, and `Last-Modified` compliance.
- Flags missing cache policies, zero max-age settings, and wildcard Vary headers.
- Previews JSON payloads, formatted text, and live rendered image assets.
- Allows deleting individual entries or purging complete cache buckets.

![CacheStorage Auditor](docs/images/storagelens_cache.png)

### 4. Disk Quota and QuotaExceededError Stress Tester
- Reads `navigator.storage.estimate()` for total usage, quota, and percentage.
- Breaks down storage usage across IndexedDB, CacheStorage, and ServiceWorker registrations.
- Checks storage persistence and requests persistent storage via `navigator.storage.persist()`.
- Simulates quota exhaustion by writing controlled binary chunks to a temporary IndexedDB store.
- Supports Target MB, Target Percentage, and complete Disk Exhaustion modes.
- Captures real `DOMException: QuotaExceededError` events with stack traces and throughput telemetry.
- Reclaims allocated space instantly with a 1-click purge operation.

![Storage Quota Stress Tester](docs/images/storagelens_quota.png)

---

## Architecture

StorageLens is built in modular TypeScript libraries with a React 19 UI layer:

```
src/
├── indexeddb/       # Schema reflection, cursor pagination, CRUD, and exporters
├── opfs/            # Recursive directory walker, hex formatter, and SQLite parser
├── cache/           # window.caches reader, response cloner, and header auditor
├── quota/           # navigator.storage.estimate calculator and stress allocator
├── playground/      # Sample data generators for IndexedDB, OPFS SQLite, and cache
├── components/      # React 19 data grids, tree views, inspectors, and modals
├── drawer/          # Shadow DOM host and embeddable storagelens.js library
└── hooks/           # Reactive state hooks for each storage subsystem
```

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- Modern browser supporting IndexedDB and OPFS (Chrome, Edge, Safari 15.2+, Firefox 111+)

### Installation

```bash
git clone https://github.com/alexandrmotologa/storagelens.git
cd storagelens
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Click the **Seed Playground** button in the header to populate sample data across IndexedDB, OPFS SQLite, and CacheStorage.

### Production Build

Build the standalone application:

```bash
npm run build
```

Build the embeddable shadow DOM library:

```bash
npm run build:drawer
```

The output bundle is generated at `dist-drawer/storagelens.js`.

---

## Embeddable In-Page Drawer

You can embed StorageLens into any existing web app or Progressive Web App.

### Script Tag Integration

Add the bundle to your HTML:

```html
<script src="dist-drawer/storagelens.js"></script>
```

A floating badge will appear in the bottom-right corner. You can toggle the studio with `Ctrl + Shift + S` (or `Cmd + Shift + S` on macOS).

### Programmatic API

Control the drawer through the window object:

```javascript
// Open the studio
window.__STORAGELENS__.open();

// Close the studio
window.__STORAGELENS__.close();

// Toggle visibility
window.__STORAGELENS__.toggle();

// Check open state
console.log(window.__STORAGELENS__.isOpen());
```

---

## Testing

Run unit and integration tests using Vitest:

```bash
npm test
```

The test suite covers:
- IndexedDB schema reflection, cursor pagination, and record CRUD.
- OPFS hex formatting and SQLite 3 header decoding.
- CacheStorage header validation rules.
- Quota formatting and stress tester lifecycle.

---

## License

MIT License. Authored by Alexandr Motologa.
