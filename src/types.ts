/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Ingredient = {
  id: string;           // uuid, replaces the 3-digit code
  name: string;         // "Salted Butter Farm Fresh"
  packPrice: number;    // RM 11
  packSize: number;     // 200
  unit: 'g' | 'ml' | 'unit';
  supplierLink?: string;
};

export type PackagingItem = {
  id: string;
  name: string;          // "plastic for cookies"
  packPrice: number;     // RM 8.30
  packQuantity: number;  // 100
  supplierLink?: string;
};

export type RecipeItem = {
  ingredientId: string;
  amountUsed: number;    // in the ingredient's unit
};

export type PackagingUsage = {
  packagingId: string;
  quantityUsed: number;
};

export type OverheadLine = {
  id: string;
  name: string;          // "Electric Bill"
  monthlyCost: number;   // RM 10
  workingDaysPerMonth: number; // 7
  productsPerDay: number;      // SKUs
};

export type LaborLine = {
  id: string;
  basicWage: number;     // RM 1700
  workingDaysPerMonth: number; // 7
  workingHoursPerDay: number;  // 5
  productionHoursPerBatch: number; // 4
  workers: number;
};

export type Product = {
  id: string;
  name: string;          // "Matcha Soft Cookies"
  quantityProducedPerBatch: number; // 11
  recipe: RecipeItem[];
  packaging: PackagingUsage[];
  overhead: OverheadLine[];
  labor: LaborLine[];
  marketingPercentage: number; // 0.0 to 1.0
  margins: {
    hq: number;        // 0.4
    retailer: number;  // 0.4
    agent: number;     // 0.1
    dropship: number;  // 0.1
  };
  sstEnabled: boolean;
  decidedSalePrice?: number;
  createdAt: number;
  updatedAt: number;
};
