/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, PackagingItem, Product } from '../types';

export const SAMPLE_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Salted Butter (Pure)', packPrice: 17.00, packSize: 250, unit: 'g' },
  { id: 'ing-2', name: 'Egg (Gred A)', packPrice: 15.00, packSize: 30, unit: 'unit' },
  { id: 'ing-3', name: 'All Purpose Flour', packPrice: 3.50, packSize: 800, unit: 'g' },
  { id: 'ing-4', name: 'Matcha Dust', packPrice: 11.50, packSize: 50, unit: 'g' },
];

export const SAMPLE_PACKAGING: PackagingItem[] = [
  { id: 'pkg-1', name: 'Cookies Box', packPrice: 8.50, packQuantity: 10 },
  { id: 'pkg-2', name: 'Product Label', packPrice: 18.50, packQuantity: 100 },
];

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'matcha-cookies-sample',
    name: 'Matcha Soft Cookies',
    quantityProducedPerBatch: 11,
    recipe: [
      { ingredientId: 'ing-1', amountUsed: 200 }, // Butter: 13.60
      { ingredientId: 'ing-2', amountUsed: 1 },   // Egg: 0.50
      { ingredientId: 'ing-3', amountUsed: 200 }, // Flour: 0.875 -> 0.88
      { ingredientId: 'ing-4', amountUsed: 10 },  // Dust: 2.30
    ],
    packaging: [
      { packagingId: 'pkg-1', quantityUsed: 1 }, // 0.85
      { packagingId: 'pkg-2', quantityUsed: 1 }, // 0.185 -> 0.19
    ],
    overhead: [
      { id: 'oh-1', name: 'Electricity', monthlyCost: 120, workingDaysPerMonth: 30, productsPerDay: 1 }, // 4.00
      { id: 'oh-2', name: 'Water', monthlyCost: 35, workingDaysPerMonth: 30, productsPerDay: 1 },       // 1.17
      { id: 'oh-3', name: 'Rent', monthlyCost: 250, workingDaysPerMonth: 30, productsPerDay: 1 },        // 8.33
      { id: 'oh-4', name: 'Unforeseen', monthlyCost: 6.30, workingDaysPerMonth: 30, productsPerDay: 1 }, // 0.21
    ],
    labor: [],
    marketingPercentage: 0,
    margins: { hq: 0.286, retailer: 0.4, agent: 0.1, dropship: 0.1 },
    sstEnabled: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];
