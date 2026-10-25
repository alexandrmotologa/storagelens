import { useState, useEffect, useCallback } from 'react';
import { OpfsNode, HexDumpPage, SqliteHeader, SqliteSchemaItem } from '../opfs/types';
import {
  isOpfsSupported,
  scanOpfsTree,
  createOpfsDirectory,
  deleteOpfsEntry,
  writeOpfsFile,
} from '../opfs/file_tree';
import { readOpfsBuffer, readOpfsText, downloadOpfsFile, getOpfsFileSize } from '../opfs/reader';
import { generateHexDumpPage } from '../opfs/hex_viewer';
import { isSqliteDatabase, parseSqliteHeader, parseSqliteSchema } from '../opfs/sqlite_parser';

export function useOPFS() {
  const [isSupported] = useState<boolean>(isOpfsSupported());
  const [tree, setTree] = useState<OpfsNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OpfsNode | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // File preview states
  const [fileText, setFileText] = useState<string | null>(null);
  const [hexPage, setHexPage] = useState<HexDumpPage | null>(null);
  const [hexOffset, setHexOffset] = useState<number>(0);
  const hexPageSize = 256; // 16 rows of 16 bytes = 256 bytes per page

  const [sqliteHeader, setSqliteHeader] = useState<SqliteHeader | null>(null);
  const [sqliteSchemas, setSqliteSchemas] = useState<SqliteSchemaItem[]>([]);
  const [rawBuffer, setRawBuffer] = useState<Uint8Array | null>(null);

  // 1. Refresh tree
  const refreshTree = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);
    setError(null);
    try {
      const nodes = await scanOpfsTree();
      setTree(nodes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to scan OPFS tree');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  useEffect(() => {
    refreshTree();
  }, [refreshTree]);

  // 2. Load file preview
  const loadFilePreview = useCallback(async (filePath: string, offset = 0) => {
    setIsLoading(true);
    setError(null);
    setHexOffset(offset);

    try {
      const totalSize = await getOpfsFileSize(filePath);

      // Read slice for Hex Viewer
      const sliceLength = Math.min(hexPageSize, Math.max(0, totalSize - offset));
      const buffer = await readOpfsBuffer(filePath, offset, sliceLength);
      const hexData = generateHexDumpPage(buffer, totalSize, offset, hexPageSize);
      setHexPage(hexData);

      // Check for SQLite database (first 8KB is enough for header and schema)
      const headBuffer = await readOpfsBuffer(filePath, 0, Math.min(8192, totalSize));
      if (isSqliteDatabase(headBuffer)) {
        const header = parseSqliteHeader(headBuffer);
        const schemas = parseSqliteSchema(headBuffer);
        setSqliteHeader(header);
        setSqliteSchemas(schemas);
        setFileText(null);

        // Read full DB buffer for SQL query execution if reasonable size (< 50MB)
        if (totalSize < 50 * 1024 * 1024) {
          const fullBuf = await readOpfsBuffer(filePath, 0, totalSize);
          setRawBuffer(fullBuf);
        } else {
          setRawBuffer(headBuffer);
        }
      } else {
        setSqliteHeader(null);
        setSqliteSchemas([]);
        setRawBuffer(null);

        // Try reading as text if smaller than 500KB
        if (totalSize < 512 * 1024) {
          try {
            const txt = await readOpfsText(filePath);
            setFileText(txt);
          } catch {
            setFileText(null);
          }
        } else {
          setFileText(null);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load file preview');
    } finally {
      setIsLoading(false);
    }
  }, [hexPageSize]);

  // Select node
  const selectNode = useCallback(async (node: OpfsNode) => {
    setSelectedNode(node);
    if (node.kind === 'file') {
      await loadFilePreview(node.path, 0);
    } else {
      setFileText(null);
      setHexPage(null);
      setSqliteHeader(null);
      setSqliteSchemas([]);
    }
  }, [loadFilePreview]);

  // Hex pagination
  const nextHexPage = async () => {
    if (!selectedNode || !hexPage || !hexPage.hasMore) return;
    const nextOffset = hexOffset + hexPageSize;
    await loadFilePreview(selectedNode.path, nextOffset);
  };

  const prevHexPage = async () => {
    if (!selectedNode || hexOffset <= 0) return;
    const prevOffset = Math.max(0, hexOffset - hexPageSize);
    await loadFilePreview(selectedNode.path, prevOffset);
  };

  // Download
  const downloadSelectedFile = async () => {
    if (!selectedNode || selectedNode.kind !== 'file') return;
    await downloadOpfsFile(selectedNode.path);
  };

  // Delete
  const removeEntry = async (path: string, isDirectory: boolean) => {
    await deleteOpfsEntry(path, isDirectory);
    if (selectedNode?.path === path) {
      setSelectedNode(null);
      setFileText(null);
      setHexPage(null);
    }
    await refreshTree();
  };

  // Create Dir
  const makeDirectory = async (parentPath: string, name: string) => {
    await createOpfsDirectory(parentPath, name);
    await refreshTree();
  };

  // Upload File
  const uploadNewFile = async (parentPath: string, file: File) => {
    const targetPath = parentPath ? `${parentPath}/${file.name}` : `/${file.name}`;
    await writeOpfsFile(targetPath, file);
    await refreshTree();
  };

  return {
    isSupported,
    tree,
    selectedNode,
    isLoading,
    error,
    fileText,
    hexPage,
    hexOffset,
    sqliteHeader,
    sqliteSchemas,
    rawBuffer,
    refreshTree,
    selectNode,
    loadFilePreview,
    nextHexPage,
    prevHexPage,
    jumpToOffset: (offset: number) => {
      if (selectedNode) loadFilePreview(selectedNode.path, offset);
    },
    downloadSelectedFile,
    removeEntry,
    makeDirectory,
    uploadNewFile,
  };
}
