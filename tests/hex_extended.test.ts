import { describe, it, expect } from 'vitest';
import { inspectByteAt, searchBuffer } from '../src/opfs/hex_viewer';

describe('Advanced Hex Viewer & Binary Inspection', () => {
  it('inspects byte at given index and provides numeric interpretations', () => {
    // 4-byte buffer: [0x41, 0x01, 0x00, 0x80]
    // 0x41 = 65 ('A')
    const buffer = new Uint8Array([0x41, 0x01, 0x00, 0x80]);

    const details = inspectByteAt(buffer, 0, 100);
    expect(details).not.toBeNull();
    expect(details?.offset).toBe(100);
    expect(details?.offsetHex).toBe('00000064'); // 100 in hex
    expect(details?.byte).toBe(65);
    expect(details?.byteHex).toBe('41');
    expect(details?.byteBin).toBe('01000001');
    expect(details?.charAscii).toBe('A');
    expect(details?.int8).toBe(65);
    expect(details?.uint8).toBe(65);
    expect(details?.uint16LE).toBe(65 + 1 * 256); // 321
  });

  it('returns null for out of bounds inspect index', () => {
    const buffer = new Uint8Array([1, 2, 3]);
    expect(inspectByteAt(buffer, -1)).toBeNull();
    expect(inspectByteAt(buffer, 3)).toBeNull();
  });

  it('searches buffer for plain text occurrences', () => {
    const text = 'StorageLens is the ultimate client storage studio for IndexedDB and OPFS.';
    const buffer = new TextEncoder().encode(text);

    const matches = searchBuffer(buffer, 'IndexedDB');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toBe(text.indexOf('IndexedDB'));
  });

  it('searches buffer for hex sequences', () => {
    const buffer = new Uint8Array([0x00, 0x12, 0x34, 0x56, 0x78, 0x9a, 0x00]);

    // Search hex pair "34 56"
    const matchesHex = searchBuffer(buffer, '34 56');
    expect(matchesHex).toHaveLength(1);
    expect(matchesHex[0]).toBe(2);

    // Search hex contiguous "123456"
    const matchesContiguous = searchBuffer(buffer, '123456');
    expect(matchesContiguous).toHaveLength(1);
    expect(matchesContiguous[0]).toBe(1);
  });
});
