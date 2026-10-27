import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileDown, 
  Plus, 
  Minus, 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Share2, 
  CheckCircle2, 
  ChevronDown,
  FileSpreadsheet,
  Download,
  Loader2
} from 'lucide-react';

export default function HeroCpqMockup({ onShowToast }) {
  // Line items state
  const [items, setItems] = useState([
    {
      id: 1,
      name: 'Hypersonic Turbine Array HP-Q Hybrid',
      sku: 'SKU: TUR-8921 | High-temp alloy',
      qty: 10,
      unitPrice: 4850,
      badge: '-5% Tier 1 Applied',
      badgeColor: 'emerald'
    },
    {
      id: 2,
      name: 'Calibrated Precision Hydraulic Bridge',
      sku: 'SKU: HYD-4100 | Dual-pressure valve',
      qty: 15,
      unitPrice: 870,
      badge: null,
      badgeColor: null
    },
    {
      id: 3,
      name: 'City Power Maintenance 3-yr',
      sku: 'SKU: SRV-3Y | 24/7 SLA Guarantee',
      qty: 1,
      unitPrice: 13976,
      badge: 'SLA Included',
      badgeColor: 'blue'
    }
  ]);

  const [appliedSuggestion, setAppliedSuggestion] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Currency factors
  const currencies = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 }
  };

  const curr = currencies[currency] || currencies.USD;

  // Quantity updates
  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
    const baseDiscountRate = 0.12; // 12% volume tier
    const extraDiscountRate = appliedSuggestion ? 0.02 : 0;
    const totalDiscountRate = baseDiscountRate + extraDiscountRate;
    const discountAmount = subtotal * totalDiscountRate;
    const logistics = 863.12;
    const netTotal = subtotal - discountAmount + logistics;

    // Gross margin calculation (cost estimated ~58% of subtotal)
    const estimatedCost = subtotal * 0.58;
    const profit = netTotal - estimatedCost;
    const grossMarginPct = ((profit / netTotal) * 100).toFixed(1);

    return {
      subtotal,
      discountAmount,
      totalDiscountRate: (totalDiscountRate * 100).toFixed(0),
      logistics,
      netTotal,
      grossMarginPct
    };
  }, [items, appliedSuggestion]);

  const formatMoney = (amount) => {
    return `${curr.symbol}${(amount * curr.rate).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      setIsGeneratingPdf(false);
      if (onShowToast) {
        onShowToast('✓ Interactive Proposal PDF generated & downloaded via S3 bucket!');
      }
    }, 1200);
  };

  return (
    <section className="relative pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto relative pt-16 sm:pt-20 lg:pt-24">
        
        {/* Glow ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent rounded-3xl blur-2xl -z-10" />

        {/* Floating Badge 1: Top Left - Win Rate */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden lg:flex items-center gap-3 absolute top-1 sm:top-2 left-0 lg:-left-4 xl:-left-8 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 max-w-xs select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900">+18.4% Win Rate</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-[#05603a]">
                VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Proposals closed 3x faster than manual legacy flows
            </p>
          </div>
        </motion.div>

        {/* Floating Badge 2: Top Right - Margin Compliance */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="hidden lg:flex items-center gap-3.5 absolute top-1 sm:top-2 right-0 lg:-right-4 xl:-right-8 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 max-w-sm select-none"
        >
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#05603a]"
                strokeDasharray={`${calculations.grossMarginPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <ShieldCheck className="w-5 h-5 text-[#05603a] absolute" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900">100% Margin Compliance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Guardrails prevent unapproved rogue discounts across reps.
            </p>
            <div className="text-[11px] font-bold text-[#05603a] mt-0.5">
              {calculations.grossMarginPct}% Gross Margin Target Met
            </div>
          </div>
        </motion.div>

        {/* Main Elevated Browser Window */}
        <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden">
          
          {/* Window Mac Header Bar */}
          <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Colored Mac Dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>
              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Quotation #Q-2024-81
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">—</span>
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                  Orion AGM Enterprise
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                <Clock className="w-3 h-3" />
                <span>Sent for Approval</span>
              </span>
            </div>

            {/* Window Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setItems(prev => [
                    ...prev,
                    {
                      id: Date.now(),
                      name: 'Industrial Sensor Hub (IoT)',
                      sku: 'SKU: SEN-901 | IP68 Weatherproof',
                      qty: 5,
                      unitPrice: 320,
                      badge: 'New Add-on',
                      badgeColor: 'emerald'
                    }
                  ]);
                  if (onShowToast) onShowToast('Added "Industrial Sensor Hub (IoT)" to interactive quote');
                }}
                className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add line item</span>
              </button>

              <button 
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="text-xs font-semibold text-white bg-[#05603a] hover:bg-[#044e30] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Builder Body: Table on Left + Financial Summary on Right */}
          <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Left: Line Items Interactive Table */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Product / Line Specification</span>
                  <div className="flex items-center gap-12 sm:gap-16 pr-2">
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span className="hidden sm:inline">Total</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group p-3.5 rounded-xl border border-slate-200/70 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Name & SKU */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              item.badgeColor === 'emerald'
                                ? 'bg-emerald-100 text-[#05603a]'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {item.sku}
                        </p>
                      </div>

                      {/* Controls: Qty, Unit, Total */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 shrink-0">
                        {/* Qty Selector */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono text-slate-800">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Unit Price */}
                        <div className="text-right w-20">
                          <span className="text-xs font-medium text-slate-500">
                            {formatMoney(item.unitPrice)}
                          </span>
                        </div>

                        {/* Row Total */}
                        <div className="text-right w-24">
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {formatMoney(item.qty * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Dynamic Recommendation Bar */}
              <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-teal-50/80 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Dynamic recommendation engine:</span>{' '}
                    Suggesting bundle discount +2% for prompt net-30 terms.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAppliedSuggestion(!appliedSuggestion);
                    if (onShowToast) {
                      onShowToast(!appliedSuggestion ? 'Applied 2% prompt net-30 discount recommendation!' : 'Removed bundle recommendation');
                    }
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    appliedSuggestion
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-[#05603a] border border-slate-200'
                  }`}
                >
                  {appliedSuggestion ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Suggestion Applied</span>
                    </>
                  ) : (
                    <span>Apply Suggestion</span>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Financial Breakdown Card */}
            <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Proposal Summary
                  </span>
                  
                  {/* Currency Switcher */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
                    {['USD', 'EUR', 'GBP'].map((code) => (
                      <button
                        key={code}
                        onClick={() => setCurrency(code)}
                        className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                          currency === code
                            ? 'bg-[#05603a] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Line Items */}
                <div className="space-y-2.5 text-xs pb-4 border-b border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (List Price):</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatMoney(calculations.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700">
                    <span>Volume Tier Discount ({calculations.totalDiscountRate}%):</span>
                    <span className="font-semibold font-mono">
                      -{formatMoney(calculations.discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery & Logistics:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      +{formatMoney(calculations.logistics)}
                    </span>
                  </div>
                </div>

                {/* Net Total */}
                <div className="py-4">
                  <span className="text-xs text-slate-500 block mb-1">Net Proposal Total</span>
                  <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {formatMoney(calculations.netTotal)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#05603a] font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 inline-flex">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Margin Floor Met ({calculations.grossMarginPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#05603a] hover:bg-[#044e30] shadow-md shadow-emerald-950/20 hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Cloud PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Generate Interactive PDF</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Instant render with digital signature & payment gateway links
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Bottom Floating Badge Under Mockup */}
        <div className="flex justify-center mt-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg shadow-slate-900/15 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Real-time CPQ & S3-backed PDF Generation Activated</span>
          </div>
        </div>

      </div>
    </section>
  );
}
