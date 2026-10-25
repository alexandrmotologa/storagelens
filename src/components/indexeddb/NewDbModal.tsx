import React, { useState } from 'react';
import { NewStoreSchema } from '../../indexeddb/types';
import { X, Plus, Trash2, Database, AlertCircle } from 'lucide-react';

interface NewDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dbName: string, schema: NewStoreSchema) => Promise<void>;
}

export const NewDbModal: React.FC<NewDbModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [dbName, setDbName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [keyPath, setKeyPath] = useState('id');
  const [autoIncrement, setAutoIncrement] = useState(false);
  const [indexes, setIndexes] = useState<{ name: string; keyPath: string; unique: boolean; multiEntry: boolean }[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddIndex = () => {
    setIndexes([
      ...indexes,
      { name: `by_field_${indexes.length + 1}`, keyPath: 'field', unique: false, multiEntry: false },
    ]);
  };

  const handleRemoveIndex = (idx: number) => {
    setIndexes(indexes.filter((_, i) => i !== idx));
  };

  const handleIndexChange = (
    index: number,
    field: 'name' | 'keyPath' | 'unique' | 'multiEntry',
    val: string | boolean
  ) => {
    setIndexes(
      indexes.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim()) {
      setError('Database name is required');
      return;
    }
    if (!storeName.trim()) {
      setError('Object store name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(dbName.trim(), {
        name: storeName.trim(),
        keyPath: keyPath.trim() || undefined,
        autoIncrement,
        indexes,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Create Database or Store</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Database Name
            </label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="e.g. app_database"
              className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Object Store Name
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. users"
              className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                keyPath (Optional)
              </label>
              <input
                type="text"
                value={keyPath}
                onChange={(e) => setKeyPath(e.target.value)}
                placeholder="e.g. id"
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="autoInc"
                checked={autoIncrement}
                onChange={(e) => setAutoIncrement(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <label htmlFor="autoInc" className="text-xs text-slate-300 cursor-pointer">
                autoIncrement
              </label>
            </div>
          </div>

          {/* Indexes List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                Indexes (Optional)
              </label>
              <button
                type="button"
                onClick={handleAddIndex}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
              >
                <Plus className="w-3 h-3" />
                <span>Add Index</span>
              </button>
            </div>

            {indexes.length === 0 ? (
              <div className="p-3 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-500 text-center">
                No indexes defined. Querying will use primary key range.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {indexes.map((idx, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Index Name"
                      value={idx.name}
                      onChange={(e) => handleIndexChange(i, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Key Path"
                      value={idx.keyPath}
                      onChange={(e) => handleIndexChange(i, 'keyPath', e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                    />
                    <label className="flex items-center gap-1 text-[11px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={idx.unique}
                        onChange={(e) => handleIndexChange(i, 'unique', e.target.checked)}
                      />
                      Unique
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveIndex(i)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
