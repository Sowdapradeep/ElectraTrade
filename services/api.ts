
import { UserRole, OrderStatus, GST_RATE, PaymentStatus, PaymentMethod, PLATFORM_COMMISSION_RATE } from '../types';
import { db } from './db';
import { GoogleGenAI } from "@google/genai";

const BASE_URL = '/api';

/**
 * request helper:
 * Attempts to call the real backend. If the backend is unreachable or returns an error,
 * it executes a fallback function using local storage (db.ts).
 */
const request = async (path: string, options: RequestInit = {}, fallback: () => any) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 2000); // Faster 2s timeout for snappier fallback

  try {
    const session = db.getSession();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': session?.token ? `Bearer ${session.token}` : '',
      ...(options.headers || {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) {
      // If server returns 404/5xx, it's either not implemented or crashing. Trigger fallback.
      if (response.status === 404 || response.status >= 500) {
        return fallback();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Deeply map MongoDB _id to standard 'id' for UI consistency
    const deepMap = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(deepMap);
      const newObj = { ...obj };
      if (newObj._id) newObj.id = newObj._id;
      for (const key in newObj) {
        if (Object.prototype.hasOwnProperty.call(newObj, key)) {
          newObj[key] = deepMap(newObj[key]);
        }
      }
      return newObj;
    };

    return deepMap(data);
  } catch (error: any) {
    clearTimeout(id);

    // Fallback for reachability issues or timeout
    const isNetworkError = error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
    const isTimeout = error.name === 'AbortError';

    if (isNetworkError || isTimeout) {
      return fallback();
    }
    throw error;
  }
};

export const api = {
  auth: {
    login: async (email: string) => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'password_is_demo' })
      }, () => {
        const users = db.getUsers();
        const user = users.find((u: any) => u.email === email);
        if (!user) throw new Error('User not found in local records.');
        if (!user.isApproved && user.role !== UserRole.ADMIN) throw new Error('Account pending approval.');
        const session = { user, token: 'mock-jwt-token' };
        db.setSession(session);
        return session;
      });
    },
    logout: () => db.setSession(null),
    register: async (data: any) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...data, password: 'password_is_demo' })
      }, () => {
        const users = db.getUsers();
        const newUser = {
          ...data,
          id: `u-${Date.now()}`,
          isApproved: false,
          creditLimit: data.role === UserRole.SHOP_OWNER ? 50000 : 0,
          creditUsed: 0
        };
        db.setUsers([...users, newUser]);
        return newUser;
      });
    },
    updateProfile: async (userId: string, updates: any) => {
      return request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      }, () => {
        const users = db.getUsers();
        const updatedUsers = users.map((u: any) => u.id === userId ? { ...u, ...updates } : u);
        db.setUsers(updatedUsers);
        const user = updatedUsers.find((u: any) => u.id === userId);
        const session = db.getSession();
        if (session?.user.id === userId) {
          db.setSession({ ...session, user });
        }
        return user;
      });
    }
  },

  orders: {
    create: async (shopOwnerId: string, cartItems: any[], method: string = PaymentMethod.DIRECT) => {
      return request('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cartItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.product.price,
            manufacturerId: i.product.manufacturerId
          })),
          paymentMethod: method
        })
      }, () => {
        const orders = db.getOrders();
        const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const gst = subtotal * GST_RATE;
        const total = subtotal + gst;

        const newOrder = {
          id: `ord-${Date.now()}`,
          invoiceNumber: `TAX-${Math.floor(Math.random() * 900000) + 100000}`,
          shopOwnerId,
          manufacturerId: cartItems[0].product.manufacturerId,
          items: cartItems,
          subtotal,
          gst,
          totalAmount: total,
          status: OrderStatus.PENDING,
          paymentStatus: method === PaymentMethod.NET_30 ? PaymentStatus.UNPAID : PaymentStatus.PAID,
          paymentMethod: method,
          createdAt: new Date().toISOString(),
          dueDate: method === PaymentMethod.NET_30 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        };

        db.setOrders([...orders, newOrder]);

        if (method === PaymentMethod.NET_30) {
          const users = db.getUsers();
          db.setUsers(users.map((u: any) => u.id === shopOwnerId ? { ...u, creditUsed: (u.creditUsed || 0) + total } : u));
        }

        return newOrder;
      });
    },
    settleInvoice: async (orderId: string) => {
      return request(`/orders/${orderId}/settle`, { method: 'PATCH' }, () => {
        const orders = db.getOrders();
        const order = orders.find((o: any) => o.id === orderId);
        if (order) {
          order.paymentStatus = PaymentStatus.PAID;
          db.setOrders([...orders]);
          const users = db.getUsers();
          const user = users.find((u: any) => u.id === order.shopOwnerId);
          if (user) {
            user.creditUsed = Math.max(0, user.creditUsed - order.totalAmount);
            db.setUsers([...users]);
          }
        }
        return order;
      });
    },
    getByUser: async (userId: string, role: string) => {
      return request('/orders/myorders', {}, () => {
        const orders = db.getOrders();
        if (role === UserRole.ADMIN) return orders;
        if (role === UserRole.MANUFACTURER) return orders.filter((o: any) => o.manufacturerId === userId);
        return orders.filter((o: any) => o.shopOwnerId === userId);
      });
    },
    updateStatus: async (orderId: string, status: string, logistics?: any) => {
      return request(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...logistics })
      }, () => {
        const orders = db.getOrders();
        const updated = orders.map((o: any) => o.id === orderId ? { ...o, status, ...logistics } : o);
        db.setOrders(updated);
        return updated.find((o: any) => o.id === orderId);
      });
    }
  },

  products: {
    getAll: async () => {
      return request('/products', {}, () => db.getProducts());
    },
    getByManufacturer: async (id: string) => {
      return request(`/products/manufacturer/${id}`, {}, () => {
        return db.getProducts().filter((p: any) => p.manufacturerId === id);
      });
    },
    getReviews: async (pid: string) => {
      return request(`/products/${pid}/reviews`, {}, () => {
        return db.getReviews().filter((r: any) => r.productId === pid);
      });
    }
  },

  admin: {
    getAllUsers: async () => {
      return request('/admin/users', {}, () => db.getUsers());
    },
    getPendingUsers: async () => {
      return request('/admin/users/pending', {}, () => db.getUsers().filter((u: any) => !u.isApproved));
    },
    getSettings: async () => {
      return request('/admin/settings', {}, () => db.getSettings());
    },
    updateSettings: async (settings: any) => {
      return request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      }, () => db.setSettings(settings));
    },
    approveUser: async (userId: string) => {
      return request(`/admin/users/${userId}/approve`, { method: 'PATCH' }, () => {
        const users = db.getUsers();
        const updated = users.map((u: any) => u.id === userId ? { ...u, isApproved: true } : u);
        db.setUsers(updated);
      });
    },
    rejectUser: async (userId: string) => {
      return request(`/admin/users/${userId}/reject`, { method: 'PATCH' }, () => {
        const users = db.getUsers();
        const updated = users.map((u: any) => u.id === userId ? { ...u, isApproved: false, isRejected: true } : u);
        db.setUsers(updated);
      });
    }
  },

  users: {
    getPartnerDetails: async (id: string) => {
      return request(`/admin/users/${id}`, {}, () => {
        return db.getUsers().find((u: any) => u.id === id);
      });
    }
  },

  ai: {
    predictDemand: async (manufacturerId: string) => {
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("Missing API Key");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze B2B electronics trends. Suggest one high-demand item for manufacturer ${manufacturerId}. Provide a concise 2-sentence market forecast.`,
        });
        return response.text || "Market data indicates high growth.";
      } catch (err) {
        return "AI forecast offline. Current logistics data suggests strong quarterly growth.";
      }
    },
    getRecommendations: async (userId: string) => {
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("Missing API Key");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Recommend 2 electronics components for a retail shop owner.`,
        });
        return response.text || "Recommended: DDR5 Memory and NVMe SSDs.";
      } catch (err) {
        return "Manual Recommendation: High-refresh rate displays are trending.";
      }
    }
  }
};
