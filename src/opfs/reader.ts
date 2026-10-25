import { resolveFileHandle } from './file_tree';

/**
 * Reads an OPFS file as a UTF-8 text string.
 */
export async function readOpfsText(filePath: string): Promise<string> {
  const fileHandle = await resolveFileHandle(filePath, false);
  const file = await fileHandle.getFile();
  return file.text();
}

/**
 * Reads a slice of an OPFS file as a Uint8Array byte buffer.
 */
export async function readOpfsBuffer(
  filePath: string,
  start = 0,
  length?: number
): Promise<Uint8Array> {
  const fileHandle = await resolveFileHandle(filePath, false);
  const file = await fileHandle.getFile();

  const end = length !== undefined ? start + length : file.size;
  const slice = file.slice(start, end);
  const arrayBuffer = await slice.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Dispatches a native browser download for an OPFS file.
 */
export async function downloadOpfsFile(filePath: string): Promise<void> {
  const fileHandle = await resolveFileHandle(filePath, false);
  const file = await fileHandle.getFile();

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns total file size for an OPFS file.
 */
export async function getOpfsFileSize(filePath: string): Promise<number> {
  const fileHandle = await resolveFileHandle(filePath, false);
  const file = await fileHandle.getFile();
  return file.size;
}
