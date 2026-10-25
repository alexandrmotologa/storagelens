import { describe, it, expect } from 'vitest';
import { formatHexDumpRows, generateHexDumpPage, byteToHex, offsetToHex } from '../src/opfs/hex_viewer';
import { isSqliteDatabase, parseSqliteHeader, parseSqliteSchema } from '../src/opfs/sqlite_parser';

describe('OPFS & SQLite Engine', () => {
  it('formats byte to 2-digit uppercase hex and offset to 8-digit hex', () => {
    expect(byteToHex(0)).toBe('00');
    expect(byteToHex(15)).toBe('0F');
    expect(byteToHex(255)).toBe('FF');

    expect(offsetToHex(0)).toBe('00000000');
    expect(offsetToHex(16)).toBe('00000010');
    expect(offsetToHex(4096)).toBe('00001000');
  });

  it('generates structured 16-byte hex dump rows with ASCII characters', () => {
    const text = 'Hello StorageLens World!';
    const buffer = new TextEncoder().encode(text);
    const rows = formatHexDumpRows(buffer, 0);

    expect(rows).toHaveLength(2);
    expect(rows[0].offsetHex).toBe('00000000');
    expect(rows[0].bytesHex).toHaveLength(16);
    expect(rows[0].bytesHex[0]).toBe('48'); // 'H'
    expect(rows[0].asciiText).toBe('Hello StorageLen');

    expect(rows[1].offsetHex).toBe('00000010');
    expect(rows[1].asciiText).toBe('s World!');
  });

  it('paginates hex dump correctly', () => {
    const buffer = new Uint8Array(32);
    const page = generateHexDumpPage(buffer, 100, 0, 32);

    expect(page.rows).toHaveLength(2);
    expect(page.totalBytes).toBe(100);
    expect(page.hasMore).toBe(true);
  });

  it('identifies and decodes SQLite 3 header fields', () => {
    const buffer = new Uint8Array(100);
    // Magic string: "SQLite format 3\000"
    const magic = new TextEncoder().encode('SQLite format 3\0');
    buffer.set(magic, 0);

    // Page size = 4096 (bytes 16-17: 0x10, 0x00)
    buffer[16] = 0x10;
    buffer[17] = 0x00;

    // File format write = 2 (WAL), read = 2
    buffer[18] = 2;
    buffer[19] = 2;

    // File change counter = 42 (bytes 24-27)
    buffer[27] = 42;

    // Database size in pages = 10 (bytes 28-31)
    buffer[31] = 10;

    // Text encoding = 1 (UTF-8) (bytes 56-59)
    buffer[59] = 1;

    // User version = 3 (bytes 60-63)
    buffer[63] = 3;

    expect(isSqliteDatabase(buffer)).toBe(true);

    const header = parseSqliteHeader(buffer);
    expect(header).not.toBeNull();
    expect(header?.magicValid).toBe(true);
    expect(header?.pageSize).toBe(4096);
    expect(header?.fileFormatWrite).toBe(2);
    expect(header?.fileFormatRead).toBe(2);
    expect(header?.fileChangeCounter).toBe(42);
    expect(header?.databaseSizeInPages).toBe(10);
    expect(header?.textEncoding).toBe('UTF-8');
    expect(header?.userVersion).toBe(3);
  });

  it('extracts table schema items using fallback text scanning', () => {
    const buffer = new Uint8Array(512);
    const magic = new TextEncoder().encode('SQLite format 3\0');
    buffer.set(magic, 0);

    const ddl = 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL);';
    const ddlBytes = new TextEncoder().encode(ddl);
    buffer.set(ddlBytes, 150);

    const schemas = parseSqliteSchema(buffer);
    expect(schemas).toHaveLength(1);
    expect(schemas[0].name).toBe('users');
    expect(schemas[0].type).toBe('table');
    expect(schemas[0].sql).toBe(ddl);
  });
});
