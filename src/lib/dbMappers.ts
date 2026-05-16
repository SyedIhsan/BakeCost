/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ingredient, PackagingItem, Product, Unit } from '../types';
import type { Database } from '../types/database';

// Type aliases for readability
type IngredientsRow = Database['public']['Tables']['ingredients']['Row'];
type IngredientsInsert = Database['public']['Tables']['ingredients']['Insert'];
type PackagingRow = Database['public']['Tables']['packaging']['Row'];
type PackagingInsert = Database['public']['Tables']['packaging']['Insert'];
type ProductsRow = Database['public']['Tables']['products']['Row'];
type ProductsInsert = Database['public']['Tables']['products']['Insert'];

/**
 * Convert DB ingredient (snake_case) to app Ingredient (camelCase)
 */
export function ingredientFromDb(row: IngredientsRow): Ingredient {
  // Validate and cast unit to known Unit type
  const validUnits: Unit[] = ['g', 'ml', 'unit'];
  const unit = validUnits.includes(row.unit as Unit) ? (row.unit as Unit) : 'g';

  return {
    id: row.id,
    name: row.name,
    packPrice: row.pack_price,
    packSize: row.pack_size,
    unit,
    supplierLink: row.supplier_link || undefined,
  };
}

/**
 * Convert app Ingredient to DB insert format (snake_case)
 */
export function ingredientToDb(ing: Ingredient, userId: string): IngredientsInsert {
  return {
    user_id: userId,
    name: ing.name,
    pack_price: ing.packPrice,
    pack_size: ing.packSize,
    unit: ing.unit,
    supplier_link: ing.supplierLink || null,
  };
}

/**
 * Convert DB packaging (snake_case) to app PackagingItem (camelCase)
 */
export function packagingFromDb(row: PackagingRow): PackagingItem {
  return {
    id: row.id,
    name: row.name,
    packPrice: row.pack_price,
    packQuantity: row.pack_quantity,
    supplierLink: row.supplier_link || undefined,
  };
}

/**
 * Convert app PackagingItem to DB insert format (snake_case)
 */
export function packagingToDb(pkg: PackagingItem, userId: string): PackagingInsert {
  return {
    user_id: userId,
    name: pkg.name,
    pack_price: pkg.packPrice,
    pack_quantity: pkg.packQuantity,
    supplier_link: pkg.supplierLink || null,
  };
}

/**
 * Convert DB product (snake_case, jsonb fields) to app Product (camelCase)
 */
export function productFromDb(row: ProductsRow): Product {
  return {
    id: row.id,
    name: row.name,
    quantityProducedPerBatch: row.quantity_produced_per_batch,
    recipe: (row.recipe as unknown) as Product['recipe'],
    packaging: (row.packaging as unknown) as Product['packaging'],
    overhead: (row.overhead as unknown) as Product['overhead'],
    labor: (row.labor as unknown) as Product['labor'],
    marketingPercentage: row.marketing_percentage,
    margins: (row.margins as unknown) as Product['margins'],
    sstEnabled: row.sst_enabled,
    decidedSalePrice: row.decided_sale_price || undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

/**
 * Convert app Product to DB insert format (snake_case)
 */
export function productToDb(product: Product, userId: string): ProductsInsert {
  return {
    user_id: userId,
    name: product.name,
    quantity_produced_per_batch: product.quantityProducedPerBatch,
    recipe: product.recipe,
    packaging: product.packaging,
    overhead: product.overhead,
    labor: product.labor,
    marketing_percentage: product.marketingPercentage,
    margins: product.margins,
    sst_enabled: product.sstEnabled,
    decided_sale_price: product.decidedSalePrice || null,
  };
}
