/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, ShoppingBag, TrendingUp, ArrowRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Add your ingredients",
    description: "Start by entering your raw materials and packaging items. This builds your database for accurate costing.",
    icon: <ShoppingBag className="w-16 h-16 text-brand-matcha" />,
    color: "bg-brand-matcha/10"
  },
  {
    title: "Build a recipe",
    description: "Combine ingredients, packaging, labor, and overhead into a product. Watch the costs calculate live.",
    icon: <ChefHat className="w-16 h-16 text-brand-matcha" />,
    color: "bg-orange-100"
  },
  {
    title: "See your prices",
    description: "Set your margins for HQ, Retail, Agents and Dropship. See exactly how much you profit per piece.",
    icon: <TrendingUp className="w-16 h-16 text-brand-matcha" />,
    color: "bg-blue-100"
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-cream flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-2xl shadow-brand-matcha/10 overflow-hidden relative">
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className={cn("p-8 rounded-3xl", slides[currentSlide].color)}>
                {slides[currentSlide].icon}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">{slides[currentSlide].title}</h2>
                <p className="text-gray-500">{slides[currentSlide].description}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex flex-col space-y-4">
            <div className="flex justify-center gap-2">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentSlide ? "w-8 bg-brand-matcha" : "w-2 bg-gray-200"
                  )} 
                />
              ))}
            </div>
            
            <button
              onClick={next}
              className="w-full bg-brand-matcha text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
            >
              {currentSlide === slides.length - 1 ? "Let's Go!" : "Next"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
