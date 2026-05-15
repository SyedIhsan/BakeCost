/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  totalCostBeforeMarketing, 
  costPerUnit, 
  tieredPrices, 
  applySST,
  ingredientCost,
  packagingCost,
  overheadPerBatch
} from './calculations';
import { Product, Ingredient, PackagingItem } from '../types';

describe('BakeCost Calculation Engine', () => {
  const ingredients: Ingredient[] = [
    { id: '1', name: 'Butter', packPrice: 12.174, packSize: 250, unit: 'g' }, 
    { id: '2', name: 'Brown Sugar', packPrice: 4.50, packSize: 1000, unit: 'g' },
    { id: '3', name: 'Caster Sugar', packPrice: 4.50, packSize: 1000, unit: 'g' },
    { id: '4', name: 'Egg', packPrice: 6.00, packSize: 10, unit: 'unit' },
    { id: '5', name: 'Vanilla Extract', packPrice: 3.50, packSize: 25, unit: 'ml' },
    { id: '6', name: 'All Purpose Flour', packPrice: 3.50, packSize: 1000, unit: 'g' },
    { id: '7', name: 'Cornstarch', packPrice: 2.80, packSize: 400, unit: 'g' },
    { id: '8', name: 'Matcha Powder', packPrice: 29.00, packSize: 50, unit: 'g' },
    { id: '9', name: 'Baking Soda', packPrice: 1.50, packSize: 100, unit: 'g' },
    { id: '10', name: 'Salt', packPrice: 1.00, packSize: 500, unit: 'g' },
    { id: '11', name: 'White Choc', packPrice: 12.00, packSize: 250, unit: 'g' },
  ];

  const packaging: PackagingItem[] = [
    { id: 'p1', name: 'Bag', packPrice: 15.00, packQuantity: 50 },
    { id: 'p2', name: 'Sticker', packPrice: 10.00, packQuantity: 100 },
    { id: 'p3', name: 'Box', packPrice: 25.00, packQuantity: 10 },
  ];

  const sampleProduct: Product = {
    id: 'prod-1',
    name: 'Matcha Soft Cookies',
    quantityProducedPerBatch: 11,
    recipe: [
      { ingredientId: '1', amountUsed: 115 },
      { ingredientId: '2', amountUsed: 100 },
      { ingredientId: '3', amountUsed: 50 },
      { ingredientId: '4', amountUsed: 1 },
      { ingredientId: '5', amountUsed: 2 },
      { ingredientId: '6', amountUsed: 175 },
      { ingredientId: '7', amountUsed: 5 },
      { ingredientId: '8', amountUsed: 8 },
      { ingredientId: '9', amountUsed: 3 },
      { ingredientId: '10', amountUsed: 2 },
      { ingredientId: '11', amountUsed: 100 },
    ],
    packaging: [
      { packagingId: 'p1', quantityUsed: 1 },
      { packagingId: 'p2', quantityUsed: 1 },
      { packagingId: 'p3', quantityUsed: 0.256 },
    ],
    overhead: [
      { id: 'oh-1', name: 'Total Overhead', monthlyCost: 1508.1, workingDaysPerMonth: 22, productsPerDay: 5 },
    ],
    labor: [],
    marketingPercentage: 0,
    margins: {
      hq: 0.4,
      retailer: 0.4,
      agent: 0.1,
      dropship: 0.1,
    },
    sstEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('calculates total ingredient cost for the batch (Reference: RM 17.29)', () => {
    const totalInf = sampleProduct.recipe.reduce((sum, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId)!;
      return sum + ingredientCost(ing, item.amountUsed);
    }, 0);
    expect(totalInf).toBeCloseTo(17.29, 2);
  });

  it('calculates total packaging cost for the batch (Reference: RM 1.04)', () => {
    const totalPack = sampleProduct.packaging.reduce((sum, item) => {
      const pkg = packaging.find(p => p.id === item.packagingId)!;
      return sum + packagingCost(pkg, item.quantityUsed);
    }, 0);
    expect(totalPack).toBeCloseTo(1.04, 2);
  });

  it('calculates overhead cost for the batch (Reference: RM 13.71)', () => {
    expect(overheadPerBatch(sampleProduct.overhead)).toBeCloseTo(13.71, 2);
  });

  it('matches all reference numbers for the Matcha Cookies scenario', () => {
    const totalBatchCost = totalCostBeforeMarketing(sampleProduct, ingredients, packaging);
    expect(totalBatchCost).toBeCloseTo(32.04, 2);

    const costPerOne = costPerUnit(sampleProduct, ingredients, packaging);
    expect(costPerOne).toBeCloseTo(2.9127, 3); 

    const tiers = tieredPrices(costPerOne, sampleProduct.margins);
    expect(tiers.hq).toBe(4.08);
    expect(tiers.retailer).toBe(5.71);
    expect(tiers.agent).toBe(6.28);
    expect(tiers.dropship).toBe(6.91);

    expect(applySST(tiers.hq)).toBe(4.32);
    expect(applySST(tiers.retailer)).toBe(6.05);
    expect(applySST(tiers.agent)).toBe(6.66);
    expect(applySST(tiers.dropship)).toBe(7.32);
  });
});
