import { createDatabaseWithStore, addRecord } from '../indexeddb/mutator';

export async function seedIndexedDbPlayground(): Promise<void> {
  // 1. Create ecommerce_db with customers, orders, and products
  const ECOM_DB = 'ecommerce_db';

  await createDatabaseWithStore(ECOM_DB, {
    name: 'customers',
    keyPath: 'id',
    indexes: [
      { name: 'by_email', keyPath: 'email', unique: true },
      { name: 'by_plan', keyPath: 'plan', unique: false },
      { name: 'by_city', keyPath: 'city', unique: false },
    ],
  });

  await createDatabaseWithStore(ECOM_DB, {
    name: 'orders',
    keyPath: 'id',
    indexes: [
      { name: 'by_customer', keyPath: 'customerId', unique: false },
      { name: 'by_status', keyPath: 'status', unique: false },
      { name: 'by_amount', keyPath: 'amount', unique: false },
    ],
  });

  await createDatabaseWithStore(ECOM_DB, {
    name: 'products',
    keyPath: 'id',
    indexes: [
      { name: 'by_category', keyPath: 'category', unique: false },
      { name: 'by_price', keyPath: 'price', unique: false },
      { name: 'by_tags', keyPath: 'tags', unique: false, multiEntry: true },
    ],
  });

  // Populate customers
  const customers = [
    { id: 'cust_01', name: 'Elena Vance', email: 'elena@blackmesa.internal', plan: 'enterprise', city: 'Geneva', spend: 4250.0, registeredAt: '2026-01-14T08:30:00Z' },
    { id: 'cust_02', name: 'Gordon Freeman', email: 'gordon@lambda.mit.edu', plan: 'pro', city: 'Seattle', spend: 1890.5, registeredAt: '2026-02-02T11:20:00Z' },
    { id: 'cust_03', name: 'Barney Calhoun', email: 'barney@aperture.dev', plan: 'starter', city: 'Berlin', spend: 320.0, registeredAt: '2026-03-10T14:45:00Z' },
    { id: 'cust_04', name: 'Alyx Vance', email: 'alyx@combine-resist.net', plan: 'pro', city: 'Sofia', spend: 2450.0, registeredAt: '2026-04-18T16:10:00Z' },
    { id: 'cust_05', name: 'Isaac Kleiner', email: 'kleiner@teleport.org', plan: 'enterprise', city: 'Zurich', spend: 8900.0, registeredAt: '2026-05-21T09:00:00Z' },
  ];
  for (const c of customers) {
    try {
      await addRecord(ECOM_DB, 'customers', c);
    } catch {
      // already exists
    }
  }

  // Populate orders
  const orders = [
    { id: 'ord_1001', customerId: 'cust_01', amount: 899.99, status: 'completed', itemsCount: 4, createdAt: '2026-10-01T12:00:00Z' },
    { id: 'ord_1002', customerId: 'cust_02', amount: 149.50, status: 'completed', itemsCount: 1, createdAt: '2026-10-04T15:30:00Z' },
    { id: 'ord_1003', customerId: 'cust_01', amount: 2490.00, status: 'processing', itemsCount: 6, createdAt: '2026-10-12T09:15:00Z' },
    { id: 'ord_1004', customerId: 'cust_03', amount: 45.00, status: 'pending', itemsCount: 2, createdAt: '2026-10-20T18:40:00Z' },
    { id: 'ord_1005', customerId: 'cust_04', amount: 1250.00, status: 'completed', itemsCount: 3, createdAt: '2026-10-22T10:05:00Z' },
  ];
  for (const o of orders) {
    try {
      await addRecord(ECOM_DB, 'orders', o);
    } catch {
      // already exists
    }
  }

  // Populate products
  const products = [
    { id: 'prod_901', title: 'Zero Point Energy Field Manipulator', category: 'Physics Hardware', price: 1499.00, inStock: 3, tags: ['hardware', 'graviton', 'utility'] },
    { id: 'prod_902', title: 'HEV Suit Mark V Diagnostic Console', category: 'Wearables', price: 3450.00, inStock: 12, tags: ['suit', 'armor', 'hardware'] },
    { id: 'prod_903', title: 'Quantum Entanglement Router', category: 'Networking', price: 620.00, inStock: 25, tags: ['network', 'p2p', 'offline'] },
    { id: 'prod_904', title: 'Sub-Atomic Sensor Node', category: 'Sensors', price: 85.50, inStock: 120, tags: ['sensor', 'iot', 'telemetry'] },
  ];
  for (const p of products) {
    try {
      await addRecord(ECOM_DB, 'products', p);
    } catch {
      // already exists
    }
  }

  // 2. Create tasks_db
  const TASKS_DB = 'tasks_db';
  await createDatabaseWithStore(TASKS_DB, {
    name: 'todos',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by_priority', keyPath: 'priority', unique: false },
      { name: 'by_completed', keyPath: 'completed', unique: false },
    ],
  });

  const todos = [
    { title: 'Inspect OPFS SQLite page allocation', priority: 'high', completed: true, tags: ['storage', 'sqlite'] },
    { title: 'Simulate mobile browser QuotaExceededError', priority: 'high', completed: false, tags: ['quota', 'testing'] },
    { title: 'Audit ServiceWorker cache expiration headers', priority: 'medium', completed: true, tags: ['cache', 'pwa'] },
    { title: 'Virtualize IndexedDB 50k records grid', priority: 'low', completed: false, tags: ['ui', 'performance'] },
  ];
  for (const t of todos) {
    try {
      await addRecord(TASKS_DB, 'todos', t);
    } catch {
      // already exists
    }
  }
}
