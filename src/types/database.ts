/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Database = {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pack_price: number;
          pack_size: number;
          unit: 'g' | 'ml' | 'unit';
          supplier_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          pack_price?: number;
          pack_size?: number;
          unit: 'g' | 'ml' | 'unit';
          supplier_link?: string | null;
        };
        Update: {
          name?: string;
          pack_price?: number;
          pack_size?: number;
          unit?: 'g' | 'ml' | 'unit';
          supplier_link?: string | null;
        };
      };
      packaging: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          pack_price: number;
          pack_quantity: number;
          supplier_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          pack_price?: number;
          pack_quantity?: number;
          supplier_link?: string | null;
        };
        Update: {
          name?: string;
          pack_price?: number;
          pack_quantity?: number;
          supplier_link?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity_produced_per_batch: number;
          recipe: any[];
          packaging: any[];
          overhead: any[];
          labor: any[];
          marketing_percentage: number;
          margins: {
            hq: number;
            retailer: number;
            agent: number;
            dropship: number;
          };
          sst_enabled: boolean;
          decided_sale_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          quantity_produced_per_batch?: number;
          recipe?: any[];
          packaging?: any[];
          overhead?: any[];
          labor?: any[];
          marketing_percentage?: number;
          margins?: {
            hq: number;
            retailer: number;
            agent: number;
            dropship: number;
          };
          sst_enabled?: boolean;
          decided_sale_price?: number | null;
        };
        Update: {
          name?: string;
          quantity_produced_per_batch?: number;
          recipe?: any[];
          packaging?: any[];
          overhead?: any[];
          labor?: any[];
          marketing_percentage?: number;
          margins?: {
            hq: number;
            retailer: number;
            agent: number;
            dropship: number;
          };
          sst_enabled?: boolean;
          decided_sale_price?: number | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
