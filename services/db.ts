
import { UserRole } from '../types';

const DB_KEYS = {
  USERS: 'eb2b_users',
  PRODUCTS: 'eb2b_products',
  ORDERS: 'eb2b_orders',
  REVIEWS: 'eb2b_reviews',
  SETTINGS: 'eb2b_settings',
  NOTIFICATIONS: 'eb2b_notifications',
  CURRENT_USER: 'eb2b_session'
};

export const initializeDB = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const seedUsers = [
      {
        id: 'admin-1',
        name: 'Global Admin',
        email: 'admin@electratrade.com',
        role: UserRole.ADMIN,
        isApproved: true,
        companyName: 'ElectraTrade HQ',
        gstNumber: '27AAAAA0000A1Z5'
      },
      {
        id: 'm-1',
        name: 'Dr. Aris Chen',
        email: 'info@siliconmicro.com',
        role: UserRole.MANUFACTURER,
        isApproved: true,
        companyName: 'Silicon Microchips Inc.',
        gstNumber: '27MMMMM1111M1Z1',
        verificationDocs: 'VERIFIED_ISO_9001'
      },
      {
        id: 's-1',
        name: 'Mark Thompson',
        email: 'buyer@elitegear.com',
        role: UserRole.SHOP_OWNER,
        isApproved: true,
        companyName: 'Elite Gaming Gear',
        gstNumber: '27SSSSS2222S1Z2',
        creditLimit: 150000, // Large B2B limit
        creditUsed: 0
      }
    ];
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(seedUsers));
  }

  if (!localStorage.getItem(DB_KEYS.PRODUCTS) || JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS)).length === 0) {
    const seedProducts = [
      {
        id: 'prod-1',
        name: 'Intel Core i9-14900K',
        category: 'Processors',
        brand: 'Intel',
        hsnCode: '84733020',
        voltage: '1.35V',
        warranty: '3 Years',
        certifications: ['ISO', 'CE'],
        specs: { cores: 24, threads: 32, baseClock: '3.2GHz' },
        manufacturerId: 'm-1',
        price: 556,
        stock: 450,
        moq: 10,
        imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'prod-2',
        name: 'NVIDIA RTX 4090 Founders',
        category: 'Graphics Cards',
        brand: 'NVIDIA',
        hsnCode: '84733030',
        voltage: '12V',
        warranty: '3 Years',
        certifications: ['CE'],
        manufacturerId: 'm-1',
        price: 1599,
        stock: 25,
        moq: 2,
        imageUrl: 'https://images.unsplash.com/photo-1624701928517-44c8ac49d93c?auto=format&fit=crop&q=80&w=400'
      }
    ];
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(seedProducts));
  }

  if (!localStorage.getItem(DB_KEYS.NOTIFICATIONS)) localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.REVIEWS)) localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.ORDERS)) localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
  if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify({ baseMarkupRate: 5, maxMarkupCap: 1000, aiSupportEnabled: true }));
  }
};

export const db = {
  getUsers: () => JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'),
  setUsers: (users: any) => localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users)),
  getProducts: () => JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]'),
  setProducts: (products: any) => localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products)),
  getOrders: () => JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]'),
  setOrders: (orders: any) => localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders)),
  getReviews: () => JSON.parse(localStorage.getItem(DB_KEYS.REVIEWS) || '[]'),
  setReviews: (reviews: any) => localStorage.setItem(DB_KEYS.REVIEWS, JSON.stringify(reviews)),
  getSettings: () => JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS) || '{}'),
  setSettings: (settings: any) => localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings)),
  getSession: () => JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER) || 'null'),
  setSession: (session: any) => session ? localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(session)) : localStorage.removeItem(DB_KEYS.CURRENT_USER)
};
