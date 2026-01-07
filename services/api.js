
import { UserRole, OrderStatus, GST_RATE, PaymentStatus, PaymentMethod, PLATFORM_COMMISSION_RATE } from '../types';
import { db } from './db';
import { GoogleGenAI } from "@google/genai";

const BASE_URL = '/api';

/**
 * request helper:
 * Attempts to call the real backend. If the backend is unreachable or returns an error,
 * it executes a fallback function using local storage (db.ts).
 */
const request = async (path, options = {}, fallback) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10s to avoid premature fallback

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
    const deepMap = (obj) => {
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
  } catch (error) {
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
    login: async (email) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'password_is_demo' })
      }, () => {
        const users = db.getUsers();
        const user = users.find((u) => u.email === email);
        if (!user) throw new Error('User not found in local records.');
        if (!user.isApproved && user.role !== UserRole.ADMIN) throw new Error('Account pending approval.');
        const session = { user, token: 'mock-jwt-token' };
        db.setSession(session); // Save session in fallback
        return session;
      });
      // Save session from backend response
      if (data && data.token) {
        db.setSession(data);
      }
      return data;
    },
    logout: () => db.setSession(null),
    register: async (data) => {
      const response = await request('/auth/register', {
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
        return { user: newUser, token: 'mock-jwt-token' }; // Return consistent structure in fallback
      });

      // Save session from backend response (if auto-login after register)
      if (response && response.token) {
        db.setSession(response);
      } else if (response && response.user) {
        // If backend only returns user (no token), we might need to login separately or handle it.
        // Assuming backend returns { user, token } same as login based on authController
        // If it doesn't, we might need a separate login call, but let's assume it does for now 
        // or that the user is redirected to login. 
        // Looking at authController: registerUser returns { user, token }
        db.setSession(response);
      }
      return response;
    },
    updateProfile: async (userId, updates) => {
      const updatedUser = await request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      }, () => {
        const users = db.getUsers();
        const updatedUsers = users.map((u) => u.id === userId ? { ...u, ...updates } : u);
        db.setUsers(updatedUsers);
        const user = updatedUsers.find((u) => u.id === userId);
        const session = db.getSession();
        if (session?.user.id === userId) {
          db.setSession({ ...session, user });
        }
        return user;
      });

      // Update local session if the updated profile matches current user
      const session = db.getSession();
      if (session && session.user.id === userId) {
        // Merge updates into session user
        db.setSession({ ...session, user: { ...session.user, ...updatedUser } });
      }
      return updatedUser;
    }
  },

  orders: {
    create: async (shopOwnerId, cartItems, method = PaymentMethod.DIRECT) => {
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
          db.setUsers(users.map((u) => u.id === shopOwnerId ? { ...u, creditUsed: (u.creditUsed || 0) + total } : u));
        }

        return newOrder;
      });
    },
    settleInvoice: async (orderId) => {
      return request(`/orders/${orderId}/settle`, { method: 'PATCH' }, () => {
        const orders = db.getOrders();
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          order.paymentStatus = PaymentStatus.PAID;
          db.setOrders([...orders]);
          const users = db.getUsers();
          const user = users.find((u) => u.id === order.shopOwnerId);
          if (user) {
            user.creditUsed = Math.max(0, user.creditUsed - order.totalAmount);
            db.setUsers([...users]);
          }
        }
        return order;
      });
    },
    getByUser: async (userId, role) => {
      return request('/orders/myorders', {}, () => {
        const orders = db.getOrders();
        if (role === UserRole.ADMIN) return orders;
        if (role === UserRole.MANUFACTURER) return orders.filter((o) => o.manufacturerId === userId);
        return orders.filter((o) => o.shopOwnerId === userId);
      });
    },
    updateStatus: async (orderId, status, logistics) => {
      return request(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...logistics })
      }, () => {
        const orders = db.getOrders();
        const updated = orders.map((o) => o.id === orderId ? { ...o, status, ...logistics } : o);
        db.setOrders(updated);
        return updated.find((o) => o.id === orderId);
      });
    }
  },

  products: {
    getAll: async () => {
      return request('/products', {}, () => db.getProducts());
    },
    getById: async (id) => {
      return request(`/products/${id}`, {}, () => {
        const p = db.getProducts().find((p) => p.id === id);
        if (!p) throw new Error('Product not found');
        return p;
      });
    },
    getByManufacturer: async (id) => {
      return request(`/products/manufacturer/${id}`, {}, () => {
        return db.getProducts().filter((p) => p.manufacturerId === id);
      });
    },
    getReviews: async (pid) => {
      return request(`/products/${pid}/reviews`, {}, () => {
        return db.getReviews().filter((r) => r.productId === pid);
      });
    }
  },

  admin: {
    getAllUsers: async () => {
      return request('/admin/users', {}, () => db.getUsers());
    },
    getPendingUsers: async () => {
      return request('/admin/users/pending', {}, () => db.getUsers().filter((u) => !u.isApproved));
    },
    getSettings: async () => {
      return request('/admin/settings', {}, () => db.getSettings());
    },
    updateSettings: async (settings) => {
      return request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      }, () => db.setSettings(settings));
    },
    approveUser: async (userId) => {
      return request(`/admin/users/${userId}/approve`, { method: 'PATCH' }, () => {
        const users = db.getUsers();
        const updated = users.map((u) => u.id === userId ? { ...u, isApproved: true } : u);
        db.setUsers(updated);
      });
    },
    rejectUser: async (userId) => {
      return request(`/admin/users/${userId}/reject`, { method: 'PATCH' }, () => {
        const users = db.getUsers();
        const updated = users.map((u) => u.id === userId ? { ...u, isApproved: false, isRejected: true } : u);
        db.setUsers(updated);
      });
    }
  },

  payments: {
    process: async (amount, paymentMethod, cardDetails) => {
      return request('/payments/process', {
        method: 'POST',
        body: JSON.stringify({ amount, paymentMethod, cardDetails })
      }, () => {
        // Fallback success
        return {
          id: 'mock_txn_' + Date.now(),
          status: 'COMPLETED',
          amount,
          method: paymentMethod
        };
      });
    }
  },

  users: {
    getPartnerDetails: async (id) => {
      return request(`/admin/users/${id}`, {}, () => {
        return db.getUsers().find((u) => u.id === id);
      });
    }
  },

  ai: {
    predictDemand: async (manufacturerId) => {
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
    getRecommendations: async (userId) => {
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
