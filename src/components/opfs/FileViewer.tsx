import React, { useState } from 'react';
import { OpfsNode, HexDumpPage, SqliteHeader, SqliteSchemaItem } from '../../opfs/types';
import {
  File,
  Download,
  Trash2,
  Binary,
  Database,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Terminal,
  Crosshair,
} from 'lucide-react';
import { formatBytes } from '../../quota/estimate';
import { SqlConsole } from './SqlConsole';
import { inspectByteAt, ByteDetails } from '../../opfs/hex_viewer';

interface FileViewerProps {
  selectedNode: OpfsNode | null;
  fileText: string | null;
  hexPage: HexDumpPage | null;
  hexOffset: number;
  sqliteHeader: SqliteHeader | null;
  sqliteSchemas: SqliteSchemaItem[];
  rawBuffer: Uint8Array | null;
  onNextHexPage: () => void;
  onPrevHexPage: () => void;
  onJumpToOffset: (offset: number) => void;
  onDownloadFile: () => void;
  onDeleteFile: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  selectedNode,
  fileText,
  hexPage,
  hexOffset,
  sqliteHeader,
  sqliteSchemas,
  rawBuffer,
  onNextHexPage,
  onPrevHexPage,
  onJumpToOffset,
  onDownloadFile,
  onDeleteFile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'hex' | 'sql' | 'sqlite' | 'text'>('hex');
  const [jumpInput, setJumpInput] = useState('');
  const [hoveredByte, setHoveredByte] = useState<ByteDetails | null>(null);

  if (!selectedNode || selectedNode.kind !== 'file') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
        <File className="w-10 h-10 mb-3 text-slate-700" />
        <p>Select a file from the OPFS file tree to inspect binary bytes, SQLite schemas, or run SQL queries.</p>
      </div>
    );
  }

  const isSqlite = Boolean(sqliteHeader && sqliteHeader.magicValid);
  const hasText = fileText !== null;

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = jumpInput.trim();
    if (!clean) return;

    let targetOffset = 0;
    if (clean.toLowerCase().startsWith('0x')) {
      targetOffset = parseInt(clean, 16);
    } else {
      targetOffset = parseInt(clean, 10);
    }

    if (!isNaN(targetOffset) && targetOffset >= 0) {
      onJumpToOffset(targetOffset);
    }
  };

  const handleByteHover = (rowIndex: number, byteIndex: number) => {
    if (!rawBuffer) return;
    const absIndex = hexOffset + rowIndex * 16 + byteIndex;
    const details = inspectByteAt(rawBuffer, absIndex, 0);
    setHoveredByte(details);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* File Details Top Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {isSqlite ? <Database className="w-4 h-4" /> : <File className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 font-mono">
                {selectedNode.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {selectedNode.size !== undefined ? formatBytes(selectedNode.size) : '0 B'}
              </span>
              {isSqlite && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  SQLite 3 Database
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Path: {selectedNode.path}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Local File</span>
          </button>
          <button
            onClick={onDeleteFile}
            className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Delete this file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('hex')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeSubTab === 'hex'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>16-Byte Hex Dump</span>
          </button>

          {isSqlite && (
            <>
              <button
                onClick={() => setActiveSubTab('sql')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeSubTab === 'sql'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>SQL Query Runner</span>
              </button>

              <button
                onClick={() => setActiveSubTab('sqlite')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  activeSubTab === 'sqlite'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQLite Header & Schema ({sqliteSchemas.length})</span>
              </button>
            </>
          )}

          {hasText && (
            <button
              onClick={() => setActiveSubTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeSubTab === 'text'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Text / Code Preview</span>
            </button>
          )}
        </div>

        {/* Hex Jump & Paging Controls */}
        {activeSubTab === 'hex' && hexPage && (
          <div className="flex items-center gap-2 text-xs">
            {/* Jump to offset form */}
            <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Offset (e.g. 0x100)"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="w-28 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-mono focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Jump to offset"
              >
                <Crosshair className="w-3 h-3" />
              </button>
            </form>

            <span className="text-slate-400 font-mono text-[11px] border-l border-slate-800 pl-2">
              0x{hexOffset.toString(16).padStart(8, '0').toUpperCase()} - 0x
              {(hexOffset + hexPage.rows.length * 16).toString(16).padStart(8, '0').toUpperCase()} of {formatBytes(hexPage.totalBytes)}
            </span>
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                onClick={onPrevHexPage}
                disabled={hexOffset <= 0}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Previous 256 bytes"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNextHexPage}
                disabled={!hexPage.hasMore}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Next 256 bytes"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col">
        {/* TAB 1: 16-BYTE HEX DUMP VIEWER */}
        {activeSubTab === 'hex' && (
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs overflow-x-auto flex-1">
              {hexPage && hexPage.rows.length > 0 ? (
                <table className="border-collapse w-full">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80 text-[11px]">
                      <th className="pr-4 pb-2 text-left font-semibold">Offset</th>
                      <th className="pr-4 pb-2 text-left font-semibold" colSpan={16}>
                        Hex Bytes (00 - 0F)
                      </th>
                      <th className="pl-4 pb-2 text-left font-semibold">ASCII</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {hexPage.rows.map((row, rIdx) => (
                      <tr key={row.offsetHex} className="hover:bg-slate-900/50">
                        <td className="pr-4 py-1 text-blue-400 font-semibold select-none">
                          {row.offsetHex}
                        </td>

                        {row.bytesHex.map((b, bIdx) => (
                          <td
                            key={bIdx}
                            onMouseEnter={() => handleByteHover(rIdx, bIdx)}
                            className={`py-1 px-1 text-center cursor-crosshair hover:bg-blue-600/30 rounded ${
                              b === ''
                                ? 'text-transparent'
                                : b === '00'
                                ? 'text-slate-600'
                                : 'text-slate-200'
                            } ${bIdx === 7 ? 'pr-3 border-r border-slate-800/60' : ''}`}
                          >
                            {b || '..'}
                          </td>
                        ))}

                        <td className="pl-4 py-1 text-emerald-300 border-l border-slate-800 select-all whitespace-pre">
                          {row.asciiText}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-slate-500 text-center py-8">
                  Empty file (0 bytes).
                </div>
              )}
            </div>

            {/* Byte Inspector Tooltip Card */}
            {hoveredByte && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono grid grid-cols-2 sm:grid-cols-6 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Offset</span>
                  <span className="text-blue-400 font-bold">{hoveredByte.offsetHex}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Hex / ASCII</span>
                  <span>0x{hoveredByte.byteHex} &bull; &ldquo;{hoveredByte.charAscii}&rdquo;</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Binary (8-bit)</span>
                  <span className="text-emerald-400">{hoveredByte.byteBin}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Uint8 / Int8</span>
                  <span>{hoveredByte.uint8} / {hoveredByte.int8}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Uint16 (LE)</span>
                  <span>{hoveredByte.uint16LE ?? '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Uint32 (LE)</span>
                  <span>{hoveredByte.uint32LE ?? '-'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SQL QUERY RUNNER */}
        {activeSubTab === 'sql' && isSqlite && (
          <SqlConsole dbBuffer={rawBuffer} schemas={sqliteSchemas} />
        )}

        {/* TAB 3: SQLITE SCHEMA INSPECTOR */}
        {activeSubTab === 'sqlite' && sqliteHeader && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>SQLite 3 File Header Metrics</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Page Size</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.pageSize} bytes
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">File Format</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    Write: {sqliteHeader.fileFormatWrite} (WAL), Read: {sqliteHeader.fileFormatRead}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Text Encoding</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.textEncoding}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Total Pages</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.databaseSizeInPages}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Change Counter</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.fileChangeCounter}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">User Version</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.userVersion}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Application ID</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.applicationId}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Freelist Pages</div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {sqliteHeader.totalFreelistPages}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Parsed Tables & Views ({sqliteSchemas.length})</span>
              </div>

              {sqliteSchemas.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
                  No tables or views detected in page 1.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sqliteSchemas.map((schema, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-300">{schema.name}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {schema.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Root Page: {schema.rootPage}
                        </span>
                      </div>
                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto text-[11px]">
                        {schema.sql}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TEXT / CODE PREVIEW */}
        {activeSubTab === 'text' && hasText && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
            <pre>{fileText}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
