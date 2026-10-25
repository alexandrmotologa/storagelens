import { mountStorageLensDrawer, DrawerHost } from './host';

export { mountStorageLensDrawer, DrawerHost };

// Auto-initialize if executed in browser environment without manual flag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const currentScript = document.currentScript as HTMLScriptElement | null;
  const isManual = currentScript?.getAttribute('data-manual') === 'true';

  if (!isManual) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        mountStorageLensDrawer();
      });
    } else {
      mountStorageLensDrawer();
    }
  }
}
