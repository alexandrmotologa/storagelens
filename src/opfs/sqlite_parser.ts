import { SqliteHeader, SqliteSchemaItem } from './types';

const SQLITE_MAGIC = 'SQLite format 3\x00';

/**
 * Checks if the first 16 bytes match the SQLite 3 magic string.
 */
export function isSqliteDatabase(buffer: Uint8Array): boolean {
  if (buffer.length < 16) return false;
  const magic = new TextDecoder('ascii').decode(buffer.slice(0, 16));
  return magic === SQLITE_MAGIC;
}

/**
 * Reads a 16-bit big-endian unsigned integer from a buffer.
 */
function readUint16BE(buffer: Uint8Array, offset: number): number {
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * Reads a 32-bit big-endian unsigned integer from a buffer.
 */
function readUint32BE(buffer: Uint8Array, offset: number): number {
  return (
    ((buffer[offset] << 24) >>> 0) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  );
}

/**
 * Decodes the standard 100-byte SQLite 3 database header.
 */
export function parseSqliteHeader(buffer: Uint8Array): SqliteHeader | null {
  if (buffer.length < 100) return null;

  const magicString = new TextDecoder('ascii').decode(buffer.slice(0, 16));
  const magicValid = magicString === SQLITE_MAGIC;
  if (!magicValid) return null;

  let rawPageSize = readUint16BE(buffer, 16);
  if (rawPageSize === 1) {
    rawPageSize = 65536;
  }

  const fileFormatWrite = buffer[18];
  const fileFormatRead = buffer[19];
  const reservedBytes = buffer[20];
  const maxEmbeddedPayloadFraction = buffer[21];
  const minEmbeddedPayloadFraction = buffer[22];
  const leafPayloadFraction = buffer[23];
  const fileChangeCounter = readUint32BE(buffer, 24);
  const databaseSizeInPages = readUint32BE(buffer, 28);
  const firstFreelistTrunkPage = readUint32BE(buffer, 32);
  const totalFreelistPages = readUint32BE(buffer, 36);
  const schemaCookie = readUint32BE(buffer, 40);
  const schemaFormatNumber = readUint32BE(buffer, 44);
  const defaultPageCacheSize = readUint32BE(buffer, 48);

  const rawEncoding = readUint32BE(buffer, 56);
  let textEncoding: SqliteHeader['textEncoding'] = 'Unknown';
  if (rawEncoding === 1) textEncoding = 'UTF-8';
  else if (rawEncoding === 2) textEncoding = 'UTF-8'; // fallback
  else if (rawEncoding === 3) textEncoding = 'UTF-16be';

  const userVersion = readUint32BE(buffer, 60);
  const incrementalVacuum = readUint32BE(buffer, 64) !== 0;
  const applicationId = readUint32BE(buffer, 68);
  const versionValidFor = readUint32BE(buffer, 92);
  const sqliteVersionNumber = readUint32BE(buffer, 96);

  return {
    magicValid,
    magicString,
    pageSize: rawPageSize,
    fileFormatWrite,
    fileFormatRead,
    reservedBytes,
    maxEmbeddedPayloadFraction,
    minEmbeddedPayloadFraction,
    leafPayloadFraction,
    fileChangeCounter,
    databaseSizeInPages,
    firstFreelistTrunkPage,
    totalFreelistPages,
    schemaCookie,
    schemaFormatNumber,
    defaultPageCacheSize,
    textEncoding,
    userVersion,
    incrementalVacuum,
    applicationId,
    versionValidFor,
    sqliteVersionNumber,
  };
}

/**
 * Decodes an SQLite variable-length integer (varint) starting at offset.
 */
function readVarint(buffer: Uint8Array, offset: number): { value: number; length: number } {
  let value = 0;
  let length = 0;

  for (let i = 0; i < 9; i++) {
    if (offset + i >= buffer.length) break;
    const byte = buffer[offset + i];
    length++;

    if (i === 8) {
      value = (value << 8) | byte;
      break;
    } else {
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) break;
    }
  }

  return { value, length };
}

/**
 * Parses the sqlite_schema / sqlite_master root B-tree page to extract table definitions.
 */
export function parseSqliteSchema(buffer: Uint8Array): SqliteSchemaItem[] {
  const schemaItems: SqliteSchemaItem[] = [];
  if (buffer.length < 108) return schemaItems;

  const header = parseSqliteHeader(buffer);
  if (!header || !header.magicValid) return schemaItems;

  // Page 1 B-tree header starts immediately after the 100-byte DB header
  const pageHeaderOffset = 100;
  const pageType = buffer[pageHeaderOffset];

  // 0x0d = Table B-Tree Leaf Page
  if (pageType === 0x0d) {
    const cellCount = readUint16BE(buffer, pageHeaderOffset + 3);
    const cellPointerArrayOffset = pageHeaderOffset + 8;

    for (let c = 0; c < cellCount; c++) {
      const ptrOffset = cellPointerArrayOffset + c * 2;
      if (ptrOffset + 2 > buffer.length) break;

      const cellOffset = readUint16BE(buffer, ptrOffset);
      if (cellOffset >= buffer.length) continue;

      try {
        let cursor = cellOffset;
        // 1. Payload size varint
        const payloadSize = readVarint(buffer, cursor);
        cursor += payloadSize.length;

        // 2. Row ID varint
        const rowId = readVarint(buffer, cursor);
        cursor += rowId.length;

        // 3. Record header size varint
        const recordStart = cursor;
        const recordHeaderSize = readVarint(buffer, cursor);
        cursor += recordHeaderSize.length;

        const headerBytesEnd = recordStart + recordHeaderSize.value;
        const serialTypes: number[] = [];

        while (cursor < headerBytesEnd && cursor < buffer.length) {
          const st = readVarint(buffer, cursor);
          serialTypes.push(st.value);
          cursor += st.length;
        }

        // 4. Extract columns: type, name, tbl_name, rootpage, sql
        cursor = headerBytesEnd;
        const columnValues: string[] = [];

        for (const st of serialTypes) {
          if (cursor >= buffer.length) break;

          if (st === 0) {
            columnValues.push('');
          } else if (st >= 1 && st <= 4) {
            // Integer types 1-4 bytes
            const numBytes = st;
            let intVal = 0;
            for (let b = 0; b < numBytes; b++) {
              intVal = (intVal << 8) | buffer[cursor + b];
            }
            cursor += numBytes;
            columnValues.push(String(intVal));
          } else if (st >= 12 && st % 2 === 0) {
            // BLOB
            const len = (st - 12) / 2;
            cursor += len;
            columnValues.push(`[BLOB ${len} bytes]`);
          } else if (st >= 13 && st % 2 === 1) {
            // TEXT
            const len = (st - 13) / 2;
            const textBytes = buffer.slice(cursor, cursor + len);
            const text = new TextDecoder('utf-8').decode(textBytes);
            cursor += len;
            columnValues.push(text);
          } else {
            // Other serial types
            cursor += 1;
            columnValues.push('');
          }
        }

        if (columnValues.length >= 5) {
          schemaItems.push({
            type: columnValues[0] as SqliteSchemaItem['type'],
            name: columnValues[1],
            tableName: columnValues[2],
            rootPage: parseInt(columnValues[3], 10) || 0,
            sql: columnValues[4] || '',
          });
        }
      } catch {
        // Continue parsing next cell on error
      }
    }
  }

  // Robust fallback: if binary cell parsing found nothing, extract CREATE TABLE SQL using string scanning
  if (schemaItems.length === 0) {
    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const regex = /CREATE\s+(TABLE|INDEX|VIEW|TRIGGER)\s+([a-zA-Z0-9_"]+)\s*([\s\S]*?;)/gi;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      const typeStr = match[1].toLowerCase() as SqliteSchemaItem['type'];
      const rawName = match[2].replace(/"/g, '');
      const fullSql = match[0].trim();

      schemaItems.push({
        type: typeStr,
        name: rawName,
        tableName: rawName,
        rootPage: 1,
        sql: fullSql,
      });
    }
  }

  return schemaItems;
}
