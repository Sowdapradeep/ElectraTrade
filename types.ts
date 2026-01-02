
export const UserRole = {
  MANUFACTURER: 'MANUFACTURER',
  SHOP_OWNER: 'SHOP_OWNER',
  ADMIN: 'ADMIN'
};

export const OrderStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE'
};

export const PaymentMethod = {
  DIRECT: 'DIRECT',
  NET_30: 'NET_30' // Pay in 30 days
};

export const PLATFORM_COMMISSION_RATE = 0.05; 
export const GST_RATE = 0.18; // 18% total
