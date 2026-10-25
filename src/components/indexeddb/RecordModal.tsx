import React, { useState, useEffect } from 'react';
import { RecordItem, ObjectStoreInfo } from '../../indexeddb/types';
import { X, Code2, AlertCircle, Sparkles } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: ObjectStoreInfo | null;
  recordToEdit: RecordItem | null;
  onSave: (value: unknown, key?: IDBValidKey) => Promise<void>;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  store,
  recordToEdit,
  onSave,
}) => {
  const [keyValue, setKeyValue] = useState<string>('');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(recordToEdit);

  useEffect(() => {
    if (recordToEdit) {
      setKeyValue(String(recordToEdit.key));
      setJsonText(JSON.stringify(recordToEdit.value, null, 2));
    } else {
      setKeyValue('');
      // Default template
      const template = store?.keyPath
        ? { [String(store.keyPath)]: 'custom_id_1', name: 'Sample Item', active: true }
        : { name: 'Sample Item', active: true };
      setJsonText(JSON.stringify(template, null, 2));
    }
    setJsonError(null);
  }, [recordToEdit, store, isOpen]);

  if (!isOpen || !store) return null;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError(null);

    let parsedVal: unknown;
    try {
      parsedVal = JSON.parse(jsonText);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON syntax');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine key if store has no in-line keyPath
      let finalKey: IDBValidKey | undefined = undefined;
      if (!store.keyPath) {
        if (keyValue.trim() !== '') {
          // Check if number
          const num = Number(keyValue);
          finalKey = !isNaN(num) && keyValue.trim() !== '' ? num : keyValue;
        }
      }

      await onSave(parsedVal, isEditing ? recordToEdit?.key : finalKey);
      onClose();
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              {isEditing ? `Edit Record (${store.name})` : `Add Record to ${store.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Primary Key Input (only when store has out-of-line keys) */}
          {!store.keyPath && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Key {store.autoIncrement ? '(Optional - Auto-Generated)' : '(Required)'}
              </label>
              <input
                type="text"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                disabled={isEditing}
                placeholder={store.autoIncrement ? 'Leave blank for autoIncrement' : 'e.g. user_101'}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          )}

          {/* JSON Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                JSON Record Value
              </label>
              <button
                type="button"
                onClick={handleFormat}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
              >
                <Sparkles className="w-3 h-3" />
                <span>Format JSON</span>
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
              }}
              rows={12}
              className="w-full p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none"
              spellCheck={false}
            />
          </div>

          {/* Error Message */}
          {jsonError && (
            <div className="flex items-center gap-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          {/* Actions */}
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Insert Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
