import React, { useState } from 'react';
import { OpfsNode } from '../../opfs/types';
import {
  FolderTree,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  Database,
  Plus,
  Upload,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { formatBytes } from '../../quota/estimate';

interface OpfsTreeProps {
  tree: OpfsNode[];
  selectedNode: OpfsNode | null;
  onSelectNode: (node: OpfsNode) => void;
  onOpenNewFolderModal: (parentPath: string) => void;
  onUploadFile: (parentPath: string, file: File) => void;
  onDeleteNode: (path: string, isDirectory: boolean) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const OpfsTree: React.FC<OpfsTreeProps> = ({
  tree,
  selectedNode,
  onSelectNode,
  onOpenNewFolderModal,
  onUploadFile,
  onDeleteNode,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/databases', '/configs', '/logs']));

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.sqlite') || lower.endsWith('.db')) {
      return <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    if (lower.endsWith('.json') || lower.endsWith('.js') || lower.endsWith('.ts')) {
      return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (lower.endsWith('.log') || lower.endsWith('.txt') || lower.endsWith('.md')) {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const renderNode = (node: OpfsNode, depth = 0) => {
    const isSelected = selectedNode?.path === node.path;
    const isDir = node.kind === 'directory';
    const isExpanded = expandedPaths.has(node.path);

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => {
            onSelectNode(node);
            if (!isDir) onCloseMobile?.();
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-md text-xs cursor-pointer group transition-colors ${
            isSelected
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {isDir ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.path, e)}
                className="p-0.5 text-slate-500 hover:text-slate-300"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-3.5 inline-block" />
            )}

            {isDir ? (
              isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )
            ) : (
              getFileIcon(node.name)
            )}

            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isDir && node.size !== undefined && (
              <span className="text-[10px] font-mono text-slate-500">
                {formatBytes(node.size)}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.path, isDir);
              }}
              title={`Delete ${node.name}`}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Directory Children */}
        {isDir && isExpanded && node.children && node.children.length > 0 && (
          <div className="border-l border-slate-800/80 ml-3.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const parent = selectedNode?.kind === 'directory' ? selectedNode.path : '';
    onUploadFile(parent, file);
    e.target.value = '';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            OPFS Filesystem
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenNewFolderModal(selectedNode?.kind === 'directory' ? selectedNode.path : '')}
            title="Create Directory"
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <label
            title="Upload File to Current Directory"
            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Directory Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {tree.length === 0 ? (
          <div className="text-center py-12 px-3 text-xs text-slate-500">
            <FolderTree className="w-6 h-6 mx-auto mb-2 text-slate-700" />
            <p>OPFS sandbox is empty.</p>
            <p className="mt-1 text-slate-600">Click &ldquo;Seed Playground&rdquo; to populate SQLite and config files.</p>
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      {/* Tree Footer note */}
      <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>root: /</span>
        <span>navigator.storage.getDirectory()</span>
      </div>
    </aside>
    </>
  );
};
