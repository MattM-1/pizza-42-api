import test from 'node:test';
import assert from 'node:assert/strict';
import { priceItems, totals } from './pricing.js';

test('prices by size and quantity on the server', () => {
  const lines = priceItems([{ pizzaId: 'margherita', size: 'L', qty: 2 }]);
  assert.equal(lines[0].unitCents, 1500);
  assert.equal(totals(lines, { marketingOptIn: false }).subtotalCents, 3000);
});

test('15% discount only for opted-in customers', () => {
  const lines = priceItems([{ pizzaId: 'answer', size: 'M', qty: 1 }]);
  assert.equal(totals(lines, { marketingOptIn: false }).totalCents, 1800);
  assert.equal(totals(lines, { marketingOptIn: true }).totalCents, 1530);
});

test('large order means strictly over $100.00 after discount', () => {
  // 4 x Large Pepperoni (1750) + 2 x Large Margherita (1500) = exactly $100.00 -> not large
  const exact = priceItems([
    { pizzaId: 'pepperoni', size: 'L', qty: 4 },
    { pizzaId: 'margherita', size: 'L', qty: 2 },
  ]);
  assert.equal(totals(exact, { marketingOptIn: false }).totalCents, 10000);
  assert.equal(totals(exact, { marketingOptIn: false }).isLarge, false);

  // One more pizza tips it over
  const over = priceItems([
    { pizzaId: 'pepperoni', size: 'L', qty: 4 },
    { pizzaId: 'margherita', size: 'L', qty: 3 },
  ]);
  assert.equal(totals(over, { marketingOptIn: false }).isLarge, true);

  // The discount can bring an otherwise-large order back under: 7 x Large Margherita = 10500 -> 8925
  const discounted = priceItems([{ pizzaId: 'margherita', size: 'L', qty: 7 }]);
  assert.equal(totals(discounted, { marketingOptIn: false }).isLarge, true);
  assert.equal(totals(discounted, { marketingOptIn: true }).isLarge, false);
});

test('rejects bad input', () => {
  assert.throws(() => priceItems([]), { status: 400 });
  assert.throws(() => priceItems([{ pizzaId: 'nope', size: 'M', qty: 1 }]), { status: 400 });
  assert.throws(() => priceItems([{ pizzaId: 'margherita', size: 'XL', qty: 1 }]), { status: 400 });
  assert.throws(() => priceItems([{ pizzaId: 'margherita', size: 'M', qty: 0 }]), { status: 400 });
  assert.throws(() => priceItems([{ pizzaId: 'margherita', size: 'M', qty: 1.5 }]), { status: 400 });
});
