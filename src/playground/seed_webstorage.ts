/**
 * Seeds sample localStorage and sessionStorage key-value pairs.
 */
export function seedWebStoragePlayground(): void {
  if (typeof window === 'undefined') return;

  // localStorage
  localStorage.setItem(
    'storagelens_user_session',
    JSON.stringify({
      userId: 'usr_89849204',
      name: 'Alexandr Motologa',
      email: 'alex@example.com',
      role: 'lead_architect',
      mfa_enabled: true,
      last_active: new Date().toISOString(),
    })
  );

  localStorage.setItem(
    'storagelens_editor_config',
    JSON.stringify({
      theme: 'dark-glass',
      fontSize: 13,
      hexBytesPerRow: 16,
      autoRefreshLocks: true,
      queryPageSize: 50,
      telemetry: false,
    })
  );

  localStorage.setItem(
    'storagelens_feature_flags',
    JSON.stringify({
      wasm_sqlite_runner: true,
      web_locks_audit: true,
      quota_stress_simulator: true,
      shadow_drawer_v2: true,
    })
  );

  localStorage.setItem('storagelens_installed_version', '1.2.0');

  // sessionStorage
  sessionStorage.setItem('oauth_auth_nonce', 'nonce_7f2b1894d0e91a27');
  sessionStorage.setItem(
    'tab_concurrency_state',
    JSON.stringify({
      tabId: 'tab_node_01',
      workerLocksHeld: 0,
      heartbeat: Date.now(),
    })
  );
}
