import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  ArrowUpRight,
  ChevronRight,
  Plus,
  Check
} from 'lucide-react';

export default function MarginEngineSection({ onShowToast }) {
  const [activeTab, setActiveTab] = useState(0);
  
  // Interactive Simulator State
  const [listPrice, setListPrice] = useState(140000);
  const [discountPercent, setDiscountPercent] = useState(12);
  const [includeMaintenance, setIncludeMaintenance] = useState(false);

  const tabs = [
    {
      title: 'Non-Monolithic Pricing',
      description:
        'Customized tier pricing by volume, custom attributes (e.g., HP/Capacity in kW), dynamic markups, and auto-currency conversion layer with zero double-counting.',
      icon: Sliders
    },
    {
      title: 'Rule-Tier Discount Governance',
      description:
        'Strict discount ladders: Tier 1 at 5%, Tier 2 at 12%, Tier 3 at 20%. Exceeding 25% automatically routes the quotation to the Regional Sales VP.',
      icon: ShieldCheck
    },
    {
      title: 'ERP, CRM & Multi-Tenancy Sync',
      description:
        'Works out of the box with multi-tenant MongoDB/PostgreSQL backends. Tenant data is isolated with unique cryptographic keys.',
      icon: RefreshCw
    },
    {
      title: 'Real-Time Guardrail Margin Approvals',
      description:
        'Threshold-driven warning alerts trigger dynamically when quote margins drop below required company floors before delivery.',
      icon: Layers
    }
  ];

  // Dynamic calculations
  const sim = useMemo(() => {
    const maintenanceBonusPrice = includeMaintenance ? 18000 : 0;
    const maintenanceCost = includeMaintenance ? 5200 : 0;

    const effectiveList = listPrice + maintenanceBonusPrice;
    const discountAmount = effectiveList * (discountPercent / 100);
    const netRevenue = effectiveList - discountAmount;
    
    // Base cost is ~58% of base list + maintenance cost
    const totalCost = listPrice * 0.5891 + maintenanceCost;
    const grossProfit = netRevenue - totalCost;
    const grossMargin = ((grossProfit / netRevenue) * 100).toFixed(1);
    const isCompliant = grossMargin >= 35;

    return {
      effectiveList,
      discountAmount,
      netRevenue,
      totalCost,
      grossProfit,
      grossMargin: Number(grossMargin),
      isCompliant
    };
  }, [listPrice, discountPercent, includeMaintenance]);

  const formatUsd = (val) => {
    return `$${Math.round(val).toLocaleString('en-US')}`;
  };

  return (
    <section id="engine" className="py-20 md:py-28 bg-slate-50/60 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#05603a] uppercase tracking-widest block mb-3">
            Featuring Advanced Logic
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
            The CPQ Engine Built for Modern Deal Makers
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Engineered fast and built effective: Real-time formulas in reactive state, and high-frequency guardrails for teams who cannot afford quoting errors.
          </p>
        </div>

        {/* 2-Column Content: Tabs on Left + Interactive Simulator on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left: 4 Feature Tab Cards */}
          <div className="lg:col-span-5 space-y-3.5">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? 'bg-white border-[#05603a] shadow-md shadow-emerald-950/5'
                      : 'bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#05603a]" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-emerald-50 text-[#05603a] font-bold' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-base font-bold mb-1.5 transition-colors ${
                        isActive ? 'text-[#05603a]' : 'text-slate-800'
                      }`}>
                        {tab.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Live Interactive Profitability Engine Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-900/5">
            
            {/* Top Bar of Engine */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  REAL-TIME CALCULATION
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Discount & Profitability Margin Engine
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#05603a] border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Calculation Active</span>
              </div>
            </div>

            {/* Interactive Sliders */}
            <div className="py-6 space-y-6">
              
              {/* Slider 1: Deal Size */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-600">Base Deal Quotation Value:</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatUsd(listPrice)}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="250000"
                  step="5000"
                  value={listPrice}
                  onChange={(e) => setListPrice(Number(e.target.value))}
                  className="w-full accent-[#05603a] cursor-pointer"
                />
              </div>

              {/* Slider 2: Discount */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-slate-600">Sales Representative Discount Applied:</span>
                  <span className={`text-sm font-bold font-mono ${
                    discountPercent > 20 ? 'text-amber-600' : 'text-[#05603a]'
                  }`}>
                    {discountPercent}% {discountPercent > 20 ? '(VP Approval Required)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-[#05603a] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>0% (Tier 0)</span>
                  <span>12% (Tier 2 Standard)</span>
                  <span>25% (Approval Floor)</span>
                  <span>35% (Max)</span>
                </div>
              </div>

              {/* Margin Gauge Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-700">Projected Gross Margin:</span>
                  <span className={`font-mono text-base ${
                    sim.isCompliant ? 'text-[#05603a]' : 'text-amber-600'
                  }`}>
                    {sim.grossMargin}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sim.grossMargin >= 40
                        ? 'bg-[#05603a]'
                        : sim.grossMargin >= 30
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, sim.grossMargin * 1.5))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
                  <span>Minimum Floor: 30%</span>
                  <span>Company Target: 41.5%</span>
                  <span>Excellence: &gt;50%</span>
                </div>
              </div>

              {/* 3 Stat Boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total List
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
                    {formatUsd(sim.effectiveList)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Calculated Cost
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-700 font-mono mt-0.5 block">
                    {formatUsd(sim.totalCost)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                  <span className="text-[10px] font-bold text-[#05603a] uppercase tracking-wider block">
                    Expected Profit
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-[#05603a] font-mono mt-0.5 block">
                    +{formatUsd(sim.grossProfit)}
                  </span>
                </div>
              </div>

              {/* Status Compliance Pill */}
              <div className="flex items-center justify-between text-xs">
                {sim.isCompliant ? (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-100/70 px-3 py-1.5 rounded-lg border border-emerald-300/50">
                    <CheckCircle2 className="w-4 h-4 text-[#05603a]" />
                    <span>Gross Profit Target Met ({sim.grossMargin}%) — Auto-Approved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-300/50">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Margin Below Floor ({sim.grossMargin}%) — Requires Manager Escort</span>
                  </div>
                )}
                <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">
                  Tier 2 - 12% Volume Rate
                </span>
              </div>

              {/* AI Recommendation Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#05603a] shrink-0" />
                  <p className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">AI Note:</span> System suggests 3-yr maintenance package to increase margin by +4.8%
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIncludeMaintenance(!includeMaintenance);
                    if (onShowToast) {
                      onShowToast(!includeMaintenance ? 'Added 3-Year Maintenance Package to Quotation Model!' : 'Removed Maintenance Package');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                    includeMaintenance
                      ? 'bg-[#05603a] text-white'
                      : 'bg-white text-slate-800 hover:bg-emerald-100/60 border border-slate-200'
                  }`}
                >
                  {includeMaintenance ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Package Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Apply Package</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
