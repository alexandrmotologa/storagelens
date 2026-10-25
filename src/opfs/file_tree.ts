import { OpfsNode } from './types';

/**
 * Checks whether the Origin Private File System (OPFS) is supported.
 */
export function isOpfsSupported(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.storage !== 'undefined' &&
    typeof navigator.storage.getDirectory === 'function';
}

/**
 * Returns the root directory handle of the OPFS sandbox.
 */
export async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isOpfsSupported()) {
    throw new Error('Origin Private File System (OPFS) is not supported in this browser environment');
  }
  return navigator.storage.getDirectory();
}

/**
 * Recursively scans a directory handle and returns an OpfsNode hierarchy.
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  currentPath = ''
): Promise<OpfsNode[]> {
  const nodes: OpfsNode[] = [];

  // @ts-expect-error FileSystemDirectoryHandle async iterator
  for await (const entry of dirHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : `/${entry.name}`;

    if (entry.kind === 'directory') {
      const childDir = entry as FileSystemDirectoryHandle;
      const children = await scanDirectoryHandle(childDir, entryPath);
      nodes.push({
        name: entry.name,
        path: entryPath,
        kind: 'directory',
        children,
      });
    } else if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle;
      let size = 0;
      let lastModified = Date.now();
      try {
        const file = await fileHandle.getFile();
        size = file.size;
        lastModified = file.lastModified;
      } catch {
        // Fallback for locked file handles
      }

      nodes.push({
        name: entry.name,
        path: entryPath,
        kind: 'file',
        size,
        lastModified,
      });
    }
  }

  // Sort directories first, then alphabetical
  return nodes.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Recursively scans the entire OPFS root sandbox.
 */
export async function scanOpfsTree(): Promise<OpfsNode[]> {
  const root = await getOpfsRoot();
  return scanDirectoryHandle(root, '');
}

/**
 * Navigates path components to resolve a DirectoryHandle.
 */
export async function resolveDirectoryHandle(
  path: string,
  create = false
): Promise<FileSystemDirectoryHandle> {
  let current = await getOpfsRoot();
  const segments = path.split('/').filter(Boolean);

  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create });
  }

  return current;
}

/**
 * Resolves a FileHandle from a given absolute OPFS path.
 */
export async function resolveFileHandle(
  path: string,
  create = false
): Promise<FileSystemFileHandle> {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Invalid empty file path');
  }

  const fileName = segments.pop()!;
  const dirPath = segments.join('/');
  const dir = await resolveDirectoryHandle(dirPath, create);
  return dir.getFileHandle(fileName, { create });
}

/**
 * Creates a new directory at the specified path.
 */
export async function createOpfsDirectory(parentPath: string, dirName: string): Promise<void> {
  const dir = await resolveDirectoryHandle(parentPath, true);
  await dir.getDirectoryHandle(dirName, { create: true });
}

/**
 * Writes data to a file in OPFS.
 */
export async function writeOpfsFile(
  filePath: string,
  data: Blob | ArrayBuffer | Uint8Array | string
): Promise<void> {
  const fileHandle = await resolveFileHandle(filePath, true);
  const writable = await fileHandle.createWritable();
  await writable.write(data as FileSystemWriteChunkType);
  await writable.close();
}

/**
 * Deletes a file or directory at the given path.
 */
export async function deleteOpfsEntry(entryPath: string, isDirectory: boolean): Promise<void> {
  const segments = entryPath.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Cannot delete root directory');
  }

  const entryName = segments.pop()!;
  const parentDirPath = segments.join('/');
  const parentDir = await resolveDirectoryHandle(parentDirPath, false);

  await parentDir.removeEntry(entryName, { recursive: isDirectory });
}
