import { randomUUID } from 'node:crypto';

// In-memory store: fine for a proof of concept, lost on restart.
const orders = [];

export function saveOrder({ userId, lines, totals }) {
  const order = { id: randomUUID(), userId, status: 'received', createdAt: new Date().toISOString(), lines, ...totals };
  orders.push(order);
  return order;
}

export const ordersFor = (userId) => orders.filter((o) => o.userId === userId);
