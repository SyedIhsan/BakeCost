/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, PackagingItem, Product } from '../types';

export const SAMPLE_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Salted Butter Farm Fresh', packPrice: 11.00, packSize: 200, unit: 'g' },
  { id: 'ing-2', name: 'Gula Perang Lembut CSR', packPrice: 3.50, packSize: 1000, unit: 'g' },
  { id: 'ing-3', name: 'Gula Castor', packPrice: 5.20, packSize: 1000, unit: 'g' },
  { id: 'ing-4', name: 'Telur (Egg)', packPrice: 12.50, packSize: 30, unit: 'unit' },
  { id: 'ing-5', name: 'Esen Vanilla Star Brand', packPrice: 2.70, packSize: 25, unit: 'ml' },
  { id: 'ing-6', name: 'Tepung Gandum Bakers Choice', packPrice: 3.60, packSize: 1000, unit: 'g' },
  { id: 'ing-7', name: 'Baking Soda Meriah', packPrice: 2.30, packSize: 175, unit: 'g' },
  { id: 'ing-8', name: 'Garam Halus Adabi', packPrice: 2.00, packSize: 400, unit: 'g' },
  { id: 'ing-9', name: 'Coklat Coin Beryls', packPrice: 26.90, packSize: 1000, unit: 'g' },
  { id: 'ing-10', name: 'Coklat Chip', packPrice: 19.50, packSize: 1000, unit: 'g' },
  { id: 'ing-11', name: 'MATCHA B&F Uji Matcha', packPrice: 34.63, packSize: 100, unit: 'g' },
];

export const SAMPLE_PACKAGING: PackagingItem[] = [
  { id: 'pkg-1', name: 'plastic for cookies', packPrice: 8.30, packQuantity: 100 },
  { id: 'pkg-2', name: 'Plastic Beg', packPrice: 3.70, packQuantity: 60 },
  { id: 'pkg-3', name: 'kotak kek 6 inch', packPrice: 1.00, packQuantity: 1 },
];

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'matcha-cookies-sample',
    name: 'Matcha Soft Cookies',
    quantityProducedPerBatch: 11,
    recipe: [
      { ingredientId: 'Salted Butter Farm Fresh', amountUsed: 113 },   // Name-based reference
      { ingredientId: 'Gula Perang Lembut CSR', amountUsed: 100 },
      { ingredientId: 'Gula Castor', amountUsed: 25 },
      { ingredientId: 'Telur (Egg)', amountUsed: 1 },
      { ingredientId: 'Esen Vanilla Star Brand', amountUsed: 5 },
      { ingredientId: 'Tepung Gandum Bakers Choice', amountUsed: 175 },
      { ingredientId: 'Baking Soda Meriah', amountUsed: 2.5 },
      { ingredientId: 'Garam Halus Adabi', amountUsed: 1.25 },
      { ingredientId: 'Coklat Coin Beryls', amountUsed: 100 },
      { ingredientId: 'Coklat Chip', amountUsed: 100 },
      { ingredientId: 'MATCHA B&F Uji Matcha', amountUsed: 12.5 },
    ],
    packaging: [
      { packagingId: 'plastic for cookies', quantityUsed: 11 },   // Name-based reference
      { packagingId: 'Plastic Beg', quantityUsed: 2 },
    ],
    overhead: [
      { id: 'oh-1', name: 'Rent', monthlyCost: 0, workingDaysPerMonth: 1, productsPerDay: 1 },
      { id: 'oh-2', name: 'Electric Bill', monthlyCost: 10, workingDaysPerMonth: 7, productsPerDay: 1 },
      { id: 'oh-3', name: 'Water Bill', monthlyCost: 6, workingDaysPerMonth: 7, productsPerDay: 1 },
      { id: 'oh-4', name: 'Maintenance', monthlyCost: 0, workingDaysPerMonth: 1, productsPerDay: 1 },
      { id: 'oh-5', name: 'Administration', monthlyCost: 10, workingDaysPerMonth: 7, productsPerDay: 1 },
      { id: 'oh-6', name: 'Transportation', monthlyCost: 280, workingDaysPerMonth: 28, productsPerDay: 1 },
    ],
    labor: [],
    marketingPercentage: 0,
    margins: { hq: 0.4, retailer: 0.4, agent: 0.1, dropship: 0.1 },
    sstEnabled: true,
    decidedSalePrice: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];


