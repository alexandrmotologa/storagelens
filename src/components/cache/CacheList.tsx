import React from 'react';
import { CacheBucketInfo } from '../../cache/types';
import { Layers, Plus, Trash2, Folder } from 'lucide-react';
import { formatBytes } from '../../quota/estimate';

interface CacheListProps {
  buckets: CacheBucketInfo[];
  selectedBucketName: string;
  onSelectBucket: (name: string) => void;
  onOpenAddModal: () => void;
  onDeleteBucket: (name: string) => void;
}

export const CacheList: React.FC<CacheListProps> = ({
  buckets,
  selectedBucketName,
  onSelectBucket,
  onOpenAddModal,
  onDeleteBucket,
}) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cache Buckets
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {buckets.length}
          </span>
        </div>
        <button
          onClick={onOpenAddModal}
          title="Add URL response to Cache"
          className="p-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
          aria-label="Add URL response to Cache"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {buckets.length === 0 ? (
          <div className="text-center py-12 px-3 text-xs text-slate-500">
            <Layers className="w-6 h-6 mx-auto mb-2 text-slate-700" />
            <p>No CacheStorage buckets found.</p>
            <p className="mt-1 text-slate-600">Click &ldquo;Seed Playground&rdquo; to populate cache records.</p>
          </div>
        ) : (
          buckets.map((b) => {
            const isSelected = b.name === selectedBucketName;
            return (
              <div
                key={b.name}
                onClick={() => onSelectBucket(b.name)}
                className={`flex items-center justify-between p-2.5 rounded-md text-xs cursor-pointer group transition-colors ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <div className="truncate font-mono">{b.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {b.entryCount} {b.entryCount === 1 ? 'entry' : 'entries'} &bull; {formatBytes(b.totalBytes)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBucket(b.name);
                  }}
                  title={`Delete bucket ${b.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
        window.caches
      </div>
    </aside>
  );
};
