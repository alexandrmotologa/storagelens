import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '../App';
import { Database, X, Maximize2, Minimize2 } from 'lucide-react';

interface DrawerHostProps {
  initialOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

export const DrawerHost: React.FC<DrawerHostProps> = ({
  initialOpen = false,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMaximized, setIsMaximized] = useState(false);

  // Global keyboard shortcut: Ctrl+Shift+S / Cmd+Shift+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Expose window.__STORAGELENS__ global API
  useEffect(() => {
    // @ts-expect-error global API attachment
    window.__STORAGELENS__ = {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
      isOpen: () => isOpen,
    };
  }, [isOpen]);

  const posClass =
    position === 'bottom-left' ? 'bottom-5 left-5' : 'bottom-5 right-5';

  return (
    <>
      {/* Floating Launcher Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${posClass} z-[999999] flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group font-sans`}
          title="Open StorageLens Studio (Ctrl+Shift+S)"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow">
            <Database className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-slate-100">StorageLens</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
            ⌘⇧S
          </span>
        </button>
      )}

      {/* Floating Studio Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div
            className={`bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
              isMaximized
                ? 'w-screen h-screen rounded-none'
                : 'w-[95vw] max-w-7xl h-[88vh]'
            }`}
          >
            {/* Window Management Bar */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-slate-200 text-xs font-sans">
                  StorageLens In-Page Studio
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Shadow DOM Mount</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? 'Restore Window' : 'Maximize Window'}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  {isMaximized ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Studio (Esc)"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Studio */}
            <div className="flex-1 flex overflow-hidden">
              <App />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function mountStorageLensDrawer(options: {
  position?: 'bottom-right' | 'bottom-left';
  defaultOpen?: boolean;
} = {}): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('storagelens-mount-root');
  if (existing) return;

  const hostEl = document.createElement('div');
  hostEl.id = 'storagelens-mount-root';
  document.body.appendChild(hostEl);

  const shadow = hostEl.attachShadow({ mode: 'open' });
  const mountPoint = document.createElement('div');
  mountPoint.style.width = '100%';
  mountPoint.style.height = '100%';
  shadow.appendChild(mountPoint);

  // Inject stylesheet into shadow root
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('/src/index.css', import.meta.url).href;
  shadow.appendChild(link);

  const root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <DrawerHost
        position={options.position || 'bottom-right'}
        initialOpen={Boolean(options.defaultOpen)}
      />
    </React.StrictMode>
  );
}
