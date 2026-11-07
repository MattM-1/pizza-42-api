// Prices are computed on the server so the browser can never choose its own price.
// Amounts are integer cents. Keep MENU in sync with the Angular app's cart.service.ts.
export const MENU = {
  margherita: { name: 'Margherita', cents: 1200 },
  pepperoni: { name: 'Pepperoni Classico', cents: 1400 },
  funghi: { name: 'Funghi Bianca', cents: 1400 },
  quattro: { name: 'Quattro Formaggi', cents: 1500 },
  veggie: { name: 'Garden Party', cents: 1400 },
  answer: { name: 'The Answer (42)', cents: 1800 },
};

const SIZE_MULTIPLIER = { S: 0.8, M: 1, L: 1.25 };

export const MARKETING_DISCOUNT = 0.15; // for customers opted in to marketing emails
export const LARGE_ORDER_CENTS = 10000; // orders strictly over $100.00 are "large"
export const MAX_QTY = 20;

/** Validates the items and returns priced lines, or throws an Error with .status = 400. */
export function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw badRequest('items must be a non-empty array');
  if (items.length > 50) throw badRequest('too many items');

  return items.map((item, i) => {
    const pizza = MENU[item?.pizzaId];
    if (!pizza) throw badRequest(`items[${i}].pizzaId is not on the menu`);
    if (!(item.size in SIZE_MULTIPLIER)) throw badRequest(`items[${i}].size must be S, M or L`);
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > MAX_QTY) {
      throw badRequest(`items[${i}].qty must be a whole number from 1 to ${MAX_QTY}`);
    }
    const unitCents = Math.round(pizza.cents * SIZE_MULTIPLIER[item.size]);
    return { pizzaId: item.pizzaId, name: pizza.name, size: item.size, qty: item.qty, unitCents, lineCents: unitCents * item.qty };
  });
}

/** Totals for priced lines. */
export function totals(lines, { marketingOptIn }) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);
  const discountCents = marketingOptIn ? Math.round(subtotalCents * MARKETING_DISCOUNT) : 0;
  const totalCents = subtotalCents - discountCents;
  return { subtotalCents, discountCents, totalCents, isLarge: totalCents > LARGE_ORDER_CENTS };
}

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400, code: 'invalid_request' });
}
