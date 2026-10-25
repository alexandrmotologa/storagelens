import { HexDumpPage, HexDumpRow } from './types';

/**
 * Formats a single byte to two-digit uppercase hexadecimal.
 */
export function byteToHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Formats a 32-bit offset number to 8-digit uppercase hexadecimal.
 */
export function offsetToHex(offset: number): string {
  return offset.toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Formats a byte buffer into structured HexDumpRow objects (16 bytes per row).
 */
export function formatHexDumpRows(buffer: Uint8Array, startOffset = 0): HexDumpRow[] {
  const rows: HexDumpRow[] = [];
  const bytesPerRow = 16;

  for (let i = 0; i < buffer.length; i += bytesPerRow) {
    const rowOffset = startOffset + i;
    const rowBytesHex: string[] = [];
    let rowAscii = '';

    for (let j = 0; j < bytesPerRow; j++) {
      const byteIndex = i + j;
      if (byteIndex < buffer.length) {
        const byte = buffer[byteIndex];
        rowBytesHex.push(byteToHex(byte));
        // Printable ASCII range (32 to 126 inclusive)
        if (byte >= 32 && byte <= 126) {
          rowAscii += String.fromCharCode(byte);
        } else {
          rowAscii += '.';
        }
      } else {
        rowBytesHex.push('');
      }
    }

    rows.push({
      offsetHex: offsetToHex(rowOffset),
      bytesHex: rowBytesHex,
      asciiText: rowAscii,
    });
  }

  return rows;
}

/**
 * Generates a paginated HexDumpPage from a binary slice.
 */
export interface ByteDetails {
  offset: number;
  offsetHex: string;
  byte: number;
  byteHex: string;
  byteBin: string;
  charAscii: string;
  int8: number;
  uint8: number;
  int16LE?: number;
  uint16LE?: number;
  int32LE?: number;
  uint32LE?: number;
}

/**
 * Decodes extensive integer and binary representations of a byte at a specific offset.
 */
export function inspectByteAt(
  buffer: Uint8Array,
  index: number,
  baseOffset = 0
): ByteDetails | null {
  if (index < 0 || index >= buffer.length) return null;
  const byte = buffer[index];
  const absOffset = baseOffset + index;

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  let int16LE: number | undefined;
  let uint16LE: number | undefined;
  if (index + 2 <= buffer.length) {
    int16LE = view.getInt16(index, true);
    uint16LE = view.getUint16(index, true);
  }

  let int32LE: number | undefined;
  let uint32LE: number | undefined;
  if (index + 4 <= buffer.length) {
    int32LE = view.getInt32(index, true);
    uint32LE = view.getUint32(index, true);
  }

  const int8 = view.getInt8(index);

  return {
    offset: absOffset,
    offsetHex: offsetToHex(absOffset),
    byte,
    byteHex: byteToHex(byte),
    byteBin: byte.toString(2).padStart(8, '0'),
    charAscii: byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.',
    int8,
    uint8: byte,
    int16LE,
    uint16LE,
    int32LE,
    uint32LE,
  };
}

/**
 * Searches for a string or hex sequence within a buffer and returns matching offsets.
 */
export function searchBuffer(buffer: Uint8Array, query: string): number[] {
  if (!query.trim()) return [];
  const results: number[] = [];

  // 1. Try hex match if query contains pairs of hex digits (e.g. "53 51" or "5351")
  const cleanHex = query.replace(/\s+/g, '');
  let needle: Uint8Array;

  if (/^[0-9a-fA-F]{2,}$/i.test(cleanHex) && cleanHex.length % 2 === 0) {
    needle = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      needle[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
  } else {
    // UTF-8 text match
    needle = new TextEncoder().encode(query);
  }

  if (needle.length === 0 || needle.length > buffer.length) return results;

  for (let i = 0; i <= buffer.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (buffer[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      results.push(i);
      if (results.length >= 100) break; // cap search results
    }
  }

  return results;
}

/**
 * Generates a paginated HexDumpPage from a binary slice.
 */
export function generateHexDumpPage(
  buffer: Uint8Array,
  totalFileSize: number,
  offset: number,
  pageSize: number
): HexDumpPage {
  const rows = formatHexDumpRows(buffer, offset);
  const hasMore = offset + buffer.length < totalFileSize;

  return {
    rows,
    totalBytes: totalFileSize,
    offset,
    pageSize,
    hasMore,
  };
}
