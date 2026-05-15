/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, PackagingItem, Product, OverheadLine, LaborLine } from '../types';

export function ingredientCost(ingredient: Ingredient, amountUsed: number): number {
  if (ingredient.packSize === 0) return 0;
  return (ingredient.packPrice / ingredient.packSize) * amountUsed;
}

export function packagingCost(packaging: PackagingItem, quantityUsed: number): number {
  if (packaging.packQuantity === 0) return 0;
  return (packaging.packPrice / packaging.packQuantity) * quantityUsed;
}

export function overheadPerBatch(lines: OverheadLine[]): number {
  return lines.reduce((total, line) => {
    if (line.workingDaysPerMonth === 0 || line.productsPerDay === 0) return total;
    return total + (line.monthlyCost / line.workingDaysPerMonth) / line.productsPerDay;
  }, 0);
}

export function laborPerBatch(lines: LaborLine[]): number {
  return lines.reduce((total, line) => {
    if (line.workingDaysPerMonth === 0 || line.workingHoursPerDay === 0) return total;
    const hourlyRate = (line.basicWage / line.workingDaysPerMonth) / line.workingHoursPerDay;
    return total + (hourlyRate * line.productionHoursPerBatch * line.workers);
  }, 0);
}

export function totalCostBeforeMarketing(
  product: Product, 
  allIngredients: Ingredient[], 
  allPackaging: PackagingItem[]
): number {
  const ingCost = product.recipe.reduce((total, item) => {
    const ing = allIngredients.find(i => i.id === item.ingredientId);
    return total + (ing ? ingredientCost(ing, item.amountUsed) : 0);
  }, 0);

  const packCost = product.packaging.reduce((total, item) => {
    const pkg = allPackaging.find(p => p.id === item.packagingId);
    return total + (pkg ? packagingCost(pkg, item.quantityUsed) : 0);
  }, 0);

  const ohCost = overheadPerBatch(product.overhead);
  const lbCost = laborPerBatch(product.labor);

  return ingCost + packCost + ohCost + lbCost;
}

export function marketingCost(totalCost: number, percentage: number): number {
  return totalCost * percentage;
}

export function totalCost(
  product: Product,
  allIngredients: Ingredient[],
  allPackaging: PackagingItem[]
): number {
  const baseTotal = totalCostBeforeMarketing(product, allIngredients, allPackaging);
  return baseTotal + marketingCost(baseTotal, product.marketingPercentage);
}

export function costPerUnit(
  product: Product,
  allIngredients: Ingredient[],
  allPackaging: PackagingItem[]
): number {
  if (product.quantityProducedPerBatch === 0) return 0;
  return totalCost(product, allIngredients, allPackaging) / product.quantityProducedPerBatch;
}

/**
 * Rounds to 2 decimal places to match currency expectations and tier cascading.
 */
export function roundCurrency(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function tieredPrices(costPerUnit: number, margins: Product['margins']): {
  hq: number;
  retailer: number;
  agent: number;
  dropship: number;
} {
  // To match reference numbers (RM 4.08, 5.71, 6.28, 6.91) with 2.45 cost:
  // HQ: Cost / (1 - margin)
  // Retailer, Agent, Dropship: Previous * (1 + margin)
  const hq = roundCurrency(costPerUnit / (1 - (margins.hq || 0)));
  const retailer = roundCurrency(hq * (1 + (margins.retailer || 0)));
  const agent = roundCurrency(retailer * (1 + (margins.agent || 0)));
  const dropship = roundCurrency(agent * (1 + (margins.dropship || 0)));

  return { hq, retailer, agent, dropship };
}

export function applySST(price: number): number {
  return roundCurrency(price * 1.06);
}

export function sellingPrice(costPerUnit: number, margin: number, sstEnabled: boolean) {
  // Formula: Price = Cost / (1 - Margin)
  const base = costPerUnit / (1 - (margin || 0));
  return sstEnabled ? base * 1.06 : base;
}

export function hqProfit(costPerUnit: number, retailPrice: number, sstEnabled: boolean) {
  const netRevenue = sstEnabled ? retailPrice / 1.06 : retailPrice;
  return netRevenue - costPerUnit;
}
