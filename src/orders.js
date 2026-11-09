import { randomUUID } from 'node:crypto';

// In-memory store: fine for a proof of concept, lost on restart.
const orders = [];

export function saveOrder({ customerId, lines, totals }) {
  const order = { orderId: randomUUID(), customerId, status: 'received', createdAt: new Date().toISOString(), lines, ...totals };
  orders.push(order);
  return order;
}

export const ordersFor = (customerId) => orders.filter((o) => o.customerId === customerId);
