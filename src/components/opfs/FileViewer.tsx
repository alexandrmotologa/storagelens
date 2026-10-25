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
} from 'lucide-react';
import { formatBytes } from '../../quota/estimate';

interface FileViewerProps {
  selectedNode: OpfsNode | null;
  fileText: string | null;
  hexPage: HexDumpPage | null;
  hexOffset: number;
  sqliteHeader: SqliteHeader | null;
  sqliteSchemas: SqliteSchemaItem[];
  onNextHexPage: () => void;
  onPrevHexPage: () => void;
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
  onNextHexPage,
  onPrevHexPage,
  onDownloadFile,
  onDeleteFile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'hex' | 'sqlite' | 'text'>('hex');

  if (!selectedNode || selectedNode.kind !== 'file') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
        <File className="w-10 h-10 mb-3 text-slate-700" />
        <p>Select a file from the OPFS file tree to inspect binary bytes or schema.</p>
      </div>
    );
  }

  const isSqlite = Boolean(sqliteHeader && sqliteHeader.magicValid);
  const hasText = fileText !== null;

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
                  SQLite 3
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
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
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
            <button
              onClick={() => setActiveSubTab('sqlite')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeSubTab === 'sqlite'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQLite Schema ({sqliteSchemas.length} tables)</span>
            </button>
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

        {/* Hex Paging Controls (visible when in Hex mode) */}
        {activeSubTab === 'hex' && hexPage && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Offset 0x{hexOffset.toString(16).padStart(8, '0').toUpperCase()} - 0x
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
      <div className="flex-1 overflow-auto p-4">
        {/* TAB 1: 16-BYTE HEX DUMP VIEWER */}
        {activeSubTab === 'hex' && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs overflow-x-auto">
            {hexPage && hexPage.rows.length > 0 ? (
              <table className="border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/80 text-[11px]">
                    <th className="pr-4 pb-2 text-left font-semibold">Offset</th>
                    <th className="pr-4 pb-2 text-left font-semibold" colSpan={16}>
                      Hex Bytes (00 - 0F)
                    </th>
                    <th className="pl-4 pb-2 text-left font-semibold">Decoded Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {hexPage.rows.map((row) => (
                    <tr key={row.offsetHex} className="hover:bg-slate-900/50">
                      {/* Offset */}
                      <td className="pr-4 py-1 text-blue-400 font-semibold select-none">
                        {row.offsetHex}
                      </td>

                      {/* 16 Hex Byte values */}
                      {row.bytesHex.map((b, idx) => (
                        <td
                          key={idx}
                          className={`py-1 px-1 text-center ${
                            b === ''
                              ? 'text-transparent'
                              : b === '00'
                              ? 'text-slate-600'
                              : 'text-slate-200'
                          } ${idx === 7 ? 'pr-3 border-r border-slate-800/60' : ''}`}
                        >
                          {b || '..'}
                        </td>
                      ))}

                      {/* ASCII column */}
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
        )}

        {/* TAB 2: SQLITE SCHEMA INSPECTOR */}
        {activeSubTab === 'sqlite' && sqliteHeader && (
          <div className="space-y-4">
            {/* 100-Byte SQLite Header Cards */}
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

            {/* Parsed Schema DDL Items */}
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

        {/* TAB 3: TEXT / CODE PREVIEW */}
        {activeSubTab === 'text' && hasText && (
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
            <pre>{fileText}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
