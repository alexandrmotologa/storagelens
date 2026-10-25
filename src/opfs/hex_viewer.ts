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
