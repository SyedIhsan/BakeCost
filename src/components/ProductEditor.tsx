/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, X, Search, ChevronRight, ChevronDown, ChevronUp, Copy, Printer, BarChart3, TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import { Product, RecipeItem, PackagingUsage, Ingredient, PackagingItem, OverheadLine, LaborLine } from '../types';
import { ingredientCost, packagingCost, overheadPerBatch, laborPerBatch, totalCostBeforeMarketing, marketingCost, sellingPrice, hqProfit, tieredPrices, roundCurrency } from '../lib/calculations';
import { formatRM } from '../lib/format';
import { cn } from '../lib/utils';
import { Dialog } from './Dialog';
import { SearchInput } from './SearchInput';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useReactToPrint } from 'react-to-print';

interface ProductEditorProps {
  product?: Product;
  onClose: () => void;
}

export function ProductEditor({ product, onClose }: ProductEditorProps) {
  const { ingredients, packaging: allPackagingItems, addProduct, updateProduct } = useStore();
  const [name, setName] = useState(product?.name || '');
  const [yieldQty, setYieldQty] = useState(product?.quantityProducedPerBatch || 1);
  const [recipe, setRecipe] = useState<RecipeItem[]>(product?.recipe || []);
  const [packUsage, setPackUsage] = useState<PackagingUsage[]>(product?.packaging || []);
  const [overhead, setOverhead] = useState<OverheadLine[]>(product?.overhead || []);
  const [labor, setLabor] = useState<LaborLine[]>(product?.labor || []);
  const [marketingPercentage, setMarketingPercentage] = useState(product?.marketingPercentage || 0);
  const [margins, setMargins] = useState(product?.margins || { hq: 0.4, retailer: 0.4, agent: 0.1, dropship: 0.1 });
  const [sstEnabled, setSstEnabled] = useState(product?.sstEnabled ?? true);
  const [decidedSalePrice, setDecidedSalePrice] = useState(product?.decidedSalePrice || 0);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: name || 'BakeCost_Quote',
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        .print-text-matcha { color: #4E0A0B !important; }
        .print-bg-matcha { background-color: #4E0A0B !important; }
        .print-border-matcha { border-color: #4E0A0B !important; }
        .print-bg-cream { background-color: #ffe5f1 !important; }
      }
    `,
  });

  // Accordion state
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [showPricingSheet, setShowPricingSheet] = useState(false);

  // Picker State
  const [pickerType, setPickerType] = useState<'ingredient' | 'packaging' | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const filteredPickerItems = useMemo(() => {
    if (pickerType === 'ingredient') {
      return ingredients.filter(i => i.name.toLowerCase().includes(pickerSearch.toLowerCase()));
    } else if (pickerType === 'packaging') {
      return allPackagingItems.filter(p => p.name.toLowerCase().includes(pickerSearch.toLowerCase()));
    }
    return [];
  }, [pickerType, ingredients, allPackagingItems, pickerSearch]);

  const stats = useMemo(() => {
    const tempProduct: Product = {
      id: 'temp',
      name,
      quantityProducedPerBatch: yieldQty,
      recipe,
      packaging: packUsage,
      overhead,
      labor,
      marketingPercentage,
      margins,
      sstEnabled,
      decidedSalePrice,
      createdAt: 0,
      updatedAt: 0
    };

    const ingTotal = recipe.reduce((sum, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      return sum + (ing ? ingredientCost(ing, item.amountUsed) : 0);
    }, 0);

    const packTotal = packUsage.reduce((sum, item) => {
      const pkg = allPackagingItems.find(p => p.id === item.packagingId);
      return sum + (pkg ? packagingCost(pkg, item.quantityUsed) : 0);
    }, 0);

    const ohTotal = overheadPerBatch(overhead);
    const lbTotal = laborPerBatch(labor);
    const subtotal = totalCostBeforeMarketing(tempProduct, ingredients, allPackagingItems);
    const mktTotal = marketingCost(subtotal, marketingPercentage);
    const total = subtotal + mktTotal;
    const cpu = total / (yieldQty || 1);

    const chartData = [
      { name: 'Ingredients', value: ingTotal, color: '#4E0A0B' },
      { name: 'Packaging', value: packTotal, color: '#8B0000' },
      { name: 'Overhead', value: ohTotal, color: '#CD5C5C' },
      { name: 'Labor', value: lbTotal, color: '#F08080' },
      { name: 'Marketing', value: mktTotal, color: '#FFB6C1' },
    ].filter(d => d.value > 0);

    return { ingTotal, packTotal, ohTotal, lbTotal, mktTotal, total, cpu, chartData };
  }, [name, yieldQty, recipe, packUsage, overhead, labor, marketingPercentage, margins, sstEnabled, decidedSalePrice, ingredients, allPackagingItems]);

  const handleSave = async () => {
    const data: Partial<Product> = {
      name: name || 'Unnamed Product',
      quantityProducedPerBatch: yieldQty || 1,
      recipe,
      packaging: packUsage,
      overhead,
      labor,
      marketingPercentage,
      margins,
      sstEnabled,
      decidedSalePrice,
    };

    try {
      if (product) {
        await updateProduct(product.id, data);
      } else {
        await addProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const addOverhead = () => {
    setOverhead([...overhead, {
      id: crypto.randomUUID(),
      name: '',
      monthlyCost: 0,
      workingDaysPerMonth: 22,
      productsPerDay: 1
    }]);
    setExpanded('overhead');
  };

  const addLabor = () => {
    setLabor([...labor, {
      id: crypto.randomUUID(),
      basicWage: 1500,
      workingDaysPerMonth: 22,
      workingHoursPerDay: 8,
      productionHoursPerBatch: 1,
      workers: 1
    }]);
    setExpanded('labor');
  };

  const openPicker = (type: 'ingredient' | 'packaging', index: number) => {
    setPickerType(type);
    setPickerIndex(index);
    setPickerSearch('');
  };

  const selectItem = (itemId: string) => {
    if (pickerType === 'ingredient' && pickerIndex !== null) {
      const newRecipe = [...recipe];
      newRecipe[pickerIndex].ingredientId = itemId;
      setRecipe(newRecipe);
    } else if (pickerType === 'packaging' && pickerIndex !== null) {
      const newPack = [...packUsage];
      newPack[pickerIndex].packagingId = itemId;
      setPackUsage(newPack);
    }
    setPickerType(null);
    setPickerIndex(null);
  };

  const addRecipeItem = () => {
    if (ingredients.length === 0) return;
    setRecipe([...recipe, { ingredientId: ingredients[0].id, amountUsed: 0 }]);
    openPicker('ingredient', recipe.length);
  };

  const addPackItem = () => {
    if (allPackagingItems.length === 0) return;
    setPackUsage([...packUsage, { packagingId: allPackagingItems[0].id, quantityUsed: 0 }]);
    openPicker('packaging', packUsage.length);
  };

  const handleDuplicate = () => {
    const clone: Product = {
      id: crypto.randomUUID(),
      name: `${name} (Copy)`,
      quantityProducedPerBatch: yieldQty,
      recipe,
      packaging: packUsage,
      overhead,
      labor,
      marketingPercentage,
      margins,
      sstEnabled,
      decidedSalePrice,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addProduct(clone);
    onClose();
  };

  // The printable view rendered into a portal at document.body (outside the
  // fixed/overflow-hidden modal so react-to-print can render it correctly)
  const printableContent = (
    <div
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: '210mm',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <div
        ref={printRef}
        style={{
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#2D2D2D',
          backgroundColor: '#ffffff',
          width: '210mm',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #4E0A0B',
            paddingBottom: '24px',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#4E0A0B',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              BakeCost Quote
            </h1>
            <p style={{ color: '#6b7280', fontWeight: 700, marginTop: '4px', margin: '4px 0 0 0' }}>
              {name || 'Unnamed Product'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>
              Generated On
            </p>
            <p style={{ fontSize: '12px', fontWeight: 900, margin: '4px 0 0 0' }}>
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '32px' }}>
          {/* Cost breakdown */}
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#9ca3af',
                borderBottom: '1px solid #f3f4f6',
                paddingBottom: '8px',
                marginBottom: '16px',
              }}
            >
              Cost Breakdown
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Row label="Ingredients" value={formatRM(stats.ingTotal)} />
              <Row label="Packaging" value={formatRM(stats.packTotal)} />
              <Row label="Overhead" value={formatRM(stats.ohTotal)} />
              <Row label="Labor" value={formatRM(stats.lbTotal)} />
              <Row label="Marketing" value={formatRM(stats.mktTotal)} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f3f4f6',
                  paddingTop: '12px',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontWeight: 900, color: '#111827' }}>Total Batch Cost</span>
                <span style={{ fontWeight: 900, color: '#4E0A0B' }}>{formatRM(stats.total)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffe5f1',
                  padding: '10px',
                  borderRadius: '6px',
                  marginTop: '6px',
                }}
              >
                <span style={{ fontWeight: 900, color: '#111827' }}>Cost per Piece</span>
                <span style={{ fontWeight: 900, color: '#4E0A0B', fontSize: '20px' }}>
                  {formatRM(stats.cpu)}
                </span>
              </div>
            </div>
          </div>

          {/* Tiered pricing */}
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#9ca3af',
                borderBottom: '1px solid #f3f4f6',
                paddingBottom: '8px',
                marginBottom: '16px',
              }}
            >
              Tiered Pricing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {(() => {
                const tiers = tieredPrices(stats.cpu, margins);
                return (['hq', 'retailer', 'agent', 'dropship'] as const).map((key) => (
                  <div
                    key={key + '-print'}
                    style={{
                      border: '1px solid #f3f4f6',
                      padding: '14px',
                      borderRadius: '12px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        margin: 0,
                      }}
                    >
                      {key} ({Math.round(margins[key] * 100)}%)
                    </p>
                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '6px 0 4px' }}>
                      {formatRM(sstEnabled ? tiers[key] * 1.06 : tiers[key])}
                    </p>
                    <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, margin: 0 }}>
                      {sstEnabled ? 'INCL' : 'EXCL'} 6% SST
                    </p>
                  </div>
                ));
              })()}
            </div>

            {decidedSalePrice > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: '#ffe5f1',
                  border: '1px solid #4E0A0B',
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Decided Sale Price
                </p>
                <p style={{ fontSize: '22px', fontWeight: 900, color: '#4E0A0B', margin: '4px 0 0' }}>
                  {formatRM(decidedSalePrice)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recipe details */}
        {recipe.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#9ca3af',
                borderBottom: '1px solid #f3f4f6',
                paddingBottom: '8px',
                marginBottom: '12px',
              }}
            >
              Recipe ({yieldQty} pcs per batch)
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: 700, color: '#6b7280' }}>
                    Ingredient
                  </th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 700, color: '#6b7280' }}>
                    Amount
                  </th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 700, color: '#6b7280' }}>
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {recipe.map((item, idx) => {
                  const ing = ingredients.find(i => i.id === item.ingredientId);
                  const cost = ing ? ingredientCost(ing, item.amountUsed) : 0;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                      <td style={{ padding: '6px 4px' }}>{ing?.name || '—'}</td>
                      <td style={{ textAlign: 'right', padding: '6px 4px' }}>
                        {item.amountUsed} {ing?.unit || ''}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 700 }}>
                        {formatRM(cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ paddingTop: '32px', marginTop: '32px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, margin: 0 }}>
            BakeCost — Real-time baking cost calculator
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 bg-brand-cream flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 mr-2">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            autoFocus
            className="text-base font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-brand-matcha transition-all w-full truncate"
            placeholder="Product Name..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDuplicate}
            className="p-2 text-gray-400 hover:text-brand-matcha transition-colors"
            title="Duplicate"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={() => handlePrint()}
            className="p-2 text-gray-400 hover:text-brand-matcha transition-colors"
            title="Print PDF"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            className="bg-brand-matcha text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all ml-1"
          >
            Save
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {/* Dashboard Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-matcha" />
              <h3 className="font-bold text-gray-900">Cost Breakdown</h3>
            </div>
            {showChart ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showChart && stats.total > 0 && (
            <div className="p-4 pt-0">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatRM(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="mb-1">Primary Cost</p>
                  <p className="text-sm font-black text-gray-900">
                    {stats.ingTotal > stats.packTotal ? 'Ingredients' : 'Packaging'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="mb-1">Margin Target</p>
                  <p className="text-sm font-black text-brand-matcha">{Math.round(margins.hq * 100)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yield Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Yield</h3>
            <p className="text-xs text-gray-400 font-medium">Pieces per batch</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <input
              type="number"
              className="w-16 bg-transparent text-right font-bold outline-none text-brand-matcha"
              value={yieldQty || ''}
              onChange={e => setYieldQty(parseFloat(e.target.value) || 0)}
            />
            <span className="text-gray-400 font-medium text-sm">pcs</span>
          </div>
        </div>

        {/* Recipe Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="font-bold text-gray-900">Recipe Ingredients</h3>
            <span className="text-xs font-bold text-brand-matcha bg-brand-matcha/10 px-2 py-1 rounded-full">
              Total: {formatRM(stats.ingTotal)}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {recipe.map((item, index) => {
              const ing = ingredients.find(i => i.id === item.ingredientId);
              const cost = ing ? ingredientCost(ing, item.amountUsed) : 0;
              return (
                <div key={index} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPicker('ingredient', index)}
                      className="flex-1 text-left bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between group"
                    >
                      <span className={ing ? 'text-gray-900' : 'text-gray-400'}>
                        {ing?.name || 'Select Ingredient'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-matcha transition-colors" />
                    </button>
                    <button
                      onClick={() => setRecipe(recipe.filter((_, i) => i !== index))}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between ml-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 px-3 py-2">
                        <input
                          type="number"
                          className="w-16 bg-transparent text-right text-sm font-semibold outline-none"
                          value={item.amountUsed || ''}
                          onChange={e => {
                            const newRecipe = [...recipe];
                            newRecipe[index].amountUsed = parseFloat(e.target.value) || 0;
                            setRecipe(newRecipe);
                          }}
                        />
                        <span className="text-gray-400 text-xs ml-1 font-medium">{ing?.unit || 'g'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        @ {formatRM(ing?.packPrice || 0)}/{ing?.packSize}{ing?.unit}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{formatRM(cost)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={addRecipeItem}
            className="w-full py-4 text-brand-matcha text-sm font-bold border-t border-gray-50 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Ingredient
          </button>
        </div>

        {/* Packaging Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="font-bold text-gray-900">Packaging Items</h3>
            <span className="text-xs font-bold text-brand-matcha bg-brand-matcha/10 px-2 py-1 rounded-full">
              Total: {formatRM(stats.packTotal)}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {packUsage.map((item, index) => {
              const pkg = allPackagingItems.find(p => p.id === item.packagingId);
              const cost = pkg ? packagingCost(pkg, item.quantityUsed) : 0;
              return (
                <div key={index} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPicker('packaging', index)}
                      className="flex-1 text-left bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between group"
                    >
                      <span className={pkg ? 'text-gray-900' : 'text-gray-400'}>
                        {pkg?.name || 'Select Packaging'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-matcha" />
                    </button>
                    <button
                      onClick={() => setPackUsage(packUsage.filter((_, i) => i !== index))}
                      className="p-2 text-gray-300 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between ml-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 px-3 py-2">
                        <input
                          type="number"
                          className="w-16 bg-transparent text-right text-sm font-semibold outline-none"
                          value={item.quantityUsed || ''}
                          onChange={e => {
                            const newPack = [...packUsage];
                            newPack[index].quantityUsed = parseFloat(e.target.value) || 0;
                            setPackUsage(newPack);
                          }}
                        />
                        <span className="text-gray-400 text-xs ml-1 font-medium">qty</span>
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        @ {formatRM(pkg?.packPrice || 0)}/{pkg?.packQuantity}u
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{formatRM(cost)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={addPackItem}
            className="w-full py-4 text-brand-matcha text-sm font-bold border-t border-gray-50 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Packaging
          </button>
        </div>

        {/* Overhead Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === 'overhead' ? null : 'overhead')}
            className="w-full p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-gray-900">Overhead Cost</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-matcha bg-brand-matcha/10 px-2 py-1 rounded-full">
                Total: {formatRM(stats.ohTotal)}
              </span>
              {expanded === 'overhead' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>
          {expanded === 'overhead' && (
            <div className="divide-y divide-gray-50">
              {overhead.map((line, index) => {
                const perBatch = (line.monthlyCost / (line.workingDaysPerMonth || 1)) / (line.productsPerDay || 1);
                return (
                  <div key={line.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-brand-matcha"
                        placeholder="e.g. Electric Bill"
                        value={line.name}
                        onChange={e => {
                          const newOh = [...overhead];
                          newOh[index].name = e.target.value;
                          setOverhead(newOh);
                        }}
                      />
                      <button
                        onClick={() => setOverhead(overhead.filter(o => o.id !== line.id))}
                        className="p-2 text-gray-300 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Monthly (RM)</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.monthlyCost || ''}
                          onChange={e => {
                            const newOh = [...overhead];
                            newOh[index].monthlyCost = parseFloat(e.target.value) || 0;
                            setOverhead(newOh);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Working Days</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.workingDaysPerMonth || ''}
                          onChange={e => {
                            const newOh = [...overhead];
                            newOh[index].workingDaysPerMonth = parseFloat(e.target.value) || 0;
                            setOverhead(newOh);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">SKUs / Day</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.productsPerDay || ''}
                          onChange={e => {
                            const newOh = [...overhead];
                            newOh[index].productsPerDay = parseFloat(e.target.value) || 0;
                            setOverhead(newOh);
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">≈ {formatRM(perBatch)} per batch</p>
                  </div>
                );
              })}
              <button
                onClick={addOverhead}
                className="w-full py-4 text-brand-matcha text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Overhead
              </button>
            </div>
          )}
        </div>

        {/* Labor Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === 'labor' ? null : 'labor')}
            className="w-full p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-bold text-gray-900">Direct Labor</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-matcha bg-brand-matcha/10 px-2 py-1 rounded-full">
                Total: {formatRM(stats.lbTotal)}
              </span>
              {expanded === 'labor' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>
          {expanded === 'labor' && (
            <div className="divide-y divide-gray-50">
              {labor.map((line, index) => {
                const hourlyRate = (line.basicWage / (line.workingDaysPerMonth || 1)) / (line.workingHoursPerDay || 1);
                const perBatch = hourlyRate * line.productionHoursPerBatch * line.workers;
                return (
                  <div key={line.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400">Worker Setting #{index + 1}</span>
                      <button
                        onClick={() => setLabor(labor.filter(l => l.id !== line.id))}
                        className="p-1 text-gray-300 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Basic Wage (RM)</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.basicWage || ''}
                          onChange={e => {
                            const newLb = [...labor];
                            newLb[index].basicWage = parseFloat(e.target.value) || 0;
                            setLabor(newLb);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Workers count</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.workers || ''}
                          onChange={e => {
                            const newLb = [...labor];
                            newLb[index].workers = parseFloat(e.target.value) || 0;
                            setLabor(newLb);
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Days/mo</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.workingDaysPerMonth || ''}
                          onChange={e => {
                            const newLb = [...labor];
                            newLb[index].workingDaysPerMonth = parseFloat(e.target.value) || 0;
                            setLabor(newLb);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Hours/day</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.workingHoursPerDay || ''}
                          onChange={e => {
                            const newLb = [...labor];
                            newLb[index].workingHoursPerDay = parseFloat(e.target.value) || 0;
                            setLabor(newLb);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Batch hrs</label>
                        <input
                          type="number"
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none"
                          value={line.productionHoursPerBatch || ''}
                          onChange={e => {
                            const newLb = [...labor];
                            newLb[index].productionHoursPerBatch = parseFloat(e.target.value) || 0;
                            setLabor(newLb);
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">Rate: {formatRM(hourlyRate)}/hr → {formatRM(perBatch)} per batch</p>
                  </div>
                );
              })}
              <button
                onClick={addLabor}
                className="w-full py-4 text-brand-matcha text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Labor
              </button>
            </div>
          )}
        </div>

        {/* Marketing Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Marketing</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Percentage Cost</span>
              <span className="font-bold text-brand-matcha">{Math.round(marketingPercentage * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-matcha"
              value={marketingPercentage * 100}
              onChange={e => setMarketingPercentage(parseFloat(e.target.value) / 100)}
            />
            <p className="text-xs text-brand-matcha font-medium">Adds {formatRM(stats.mktTotal)} per batch ({Math.round(marketingPercentage * 100)}%)</p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Tiered Pricing</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Include 6% SST</span>
              <button
                onClick={() => setSstEnabled(!sstEnabled)}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative flex items-center px-1",
                  sstEnabled ? "bg-brand-matcha" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  sstEnabled ? "translate-x-4" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 bg-gray-50/50">
            {(() => {
              const tiers = tieredPrices(stats.cpu, margins);
              return (['hq', 'retailer', 'agent', 'dropship'] as const).map((key) => {
                const basePrice = tiers[key];
                const sstPrice = basePrice * 1.06;
                const displayPrice = sstEnabled ? sstPrice : basePrice;
                const secondaryPrice = sstEnabled ? basePrice : sstPrice;

                return (
                  <div key={key} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key}</span>
                      <span className="text-xs font-bold text-brand-matcha">{Math.round(margins[key] * 100)}%</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 leading-none">{formatRM(displayPrice)}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {sstEnabled ? 'excl. SST: ' : 'incl. SST: '}{formatRM(secondaryPrice)}
                      </p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-matcha"
                      value={margins[key] * 100}
                      onChange={e => {
                        setMargins({
                          ...margins,
                          [key]: parseFloat(e.target.value) / 100
                        });
                      }}
                    />
                  </div>
                );
              });
            })()}
          </div>

          <div className="p-4 border-t border-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">My Sale Price (Decided)</label>
              {decidedSalePrice > 0 && (
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  decidedSalePrice >= (tieredPrices(stats.cpu, margins).hq * (sstEnabled ? 1.06 : 1)) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {(() => {
                    const hqPrice = tieredPrices(stats.cpu, margins).hq * (sstEnabled ? 1.06 : 1);
                    const diff = ((decidedSalePrice - hqPrice) / hqPrice) * 100;
                    if (decidedSalePrice < stats.cpu * (sstEnabled ? 1.06 : 1)) return 'Below Cost!';
                    return `${diff >= 0 ? '+' : ''}${Math.round(diff)}% ${diff >= 0 ? 'above' : 'below'} HQ ${diff >= 0 ? '✓' : '✗'}`;
                  })()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-brand-cream/50 p-2 rounded-xl border border-brand-matcha/20">
              <span className="text-brand-matcha font-bold ml-2">RM</span>
              <input
                type="number"
                step="0.01"
                className="w-full bg-transparent text-xl font-black outline-none text-brand-matcha"
                placeholder="0.00"
                value={decidedSalePrice || ''}
                onChange={e => setDecidedSalePrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="bg-brand-matcha p-6 rounded-2xl text-white shadow-xl shadow-brand-matcha/20 space-y-4">
          <div className="flex flex-col items-center justify-center text-center py-2">
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Cost per Piece</p>
            <p className="text-4xl font-black">{formatRM(stats.cpu)}</p>
          </div>

          <div className="pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Total Batch Cost</p>
              <p className="text-xl font-bold">{formatRM(stats.total)}</p>
            </div>
            <div className="text-right">
              {(() => {
                const retail = decidedSalePrice || (tieredPrices(stats.cpu, margins).dropship * (sstEnabled ? 1.06 : 1));
                const profit = hqProfit(stats.cpu, retail, sstEnabled);
                const profitPercent = (profit / (sstEnabled ? retail / 1.06 : retail)) * 100;
                return (
                  <>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">HQ Profit</p>
                    <p className="text-xl font-bold">{formatRM(profit)}</p>
                    <p className="text-[10px] font-bold opacity-80">{isNaN(profitPercent) ? 0 : profitPercent.toFixed(1)}% margin</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Pricing Bottom Sheet */}
      <div className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-100 transition-transform duration-300 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]",
        showPricingSheet ? "translate-y-0" : "translate-y-[calc(100%-64px)]"
      )}>
        <button
          onClick={() => setShowPricingSheet(!showPricingSheet)}
          className="w-full h-16 flex items-center justify-between px-6 bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-matcha/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-brand-matcha" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost/Piece</p>
              <p className="text-lg font-black text-brand-matcha leading-none">{formatRM(stats.cpu)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
            {showPricingSheet ? 'Hide Pricing' : 'View Pricing'}
            {showPricingSheet ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="bg-brand-matcha p-6 rounded-2xl text-white space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Batch Cost</p>
                <p className="text-xl font-black">{formatRM(stats.total)}</p>
              </div>
              <div className="text-right">
                {(() => {
                  const retail = decidedSalePrice || (tieredPrices(stats.cpu, margins).dropship * (sstEnabled ? 1.06 : 1));
                  const profit = hqProfit(stats.cpu, retail, sstEnabled);
                  return (
                    <>
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">HQ Profit</p>
                      <p className="text-xl font-black">{formatRM(profit)}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-8">
            {(() => {
              const tiers = tieredPrices(stats.cpu, margins);
              return (['hq', 'retailer', 'agent', 'dropship'] as const).map((key) => {
                const basePrice = tiers[key];
                const displayPrice = sstEnabled ? basePrice * 1.06 : basePrice;
                return (
                  <div key={key + '-sheet'} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key}</span>
                    <p className="text-sm font-black text-gray-900 leading-none">{formatRM(displayPrice)}</p>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Picker Dialog */}
      <Dialog
        isOpen={pickerType !== null}
        onClose={() => setPickerType(null)}
        title={pickerType === 'ingredient' ? 'Select Ingredient' : 'Select Packaging'}
      >
        <div className="space-y-4">
          <SearchInput value={pickerSearch} onChange={setPickerSearch} placeholder="Search..." />
          <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50 -mx-6">
            {filteredPickerItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() => selectItem(item.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-brand-matcha transition-colors">{item.name}</h4>
                  <p className="text-xs text-gray-400">
                    {formatRM(item.packPrice)} / {item.packSize || item.packQuantity}{item.unit || 'u'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
            {filteredPickerItems.length === 0 && (
              <div className="p-12 text-center text-gray-400 text-sm">
                No items found.
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Printable content portaled to body */}
      {createPortal(printableContent, document.body)}
    </div>
  );
}

// Small helper for the print layout
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 700, color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}