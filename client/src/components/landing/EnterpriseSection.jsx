import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  RefreshCw, 
  Palette, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  ChevronDown, 
  FileText, 
  Download,
  Lock,
  Layers
} from 'lucide-react';

export default function EnterpriseSection({ onShowToast }) {
  const [selectedFilter, setSelectedFilter] = useState('Pipeline & Multi-tier Organization');

  return (
    <section id="enterprise" className="py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Selector Pill */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="text-xs font-bold text-[#05603a] uppercase tracking-widest block mb-3">
              Enterprise Scalability
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Built for Global Architectures & Distributed Franchises
            </h2>
          </div>

          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-[#05603a]" />
              <span>{selectedFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* 4 Architectural Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Multi-Tenant Sharding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center mb-6 shadow-2xs">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Isolated Multi-Tenant Sharding
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Deploy enterprise operations safely. Rigorous data isolation across tenants prevents cross-tenant data leaks. Dynamic multi-database or collection routing with tenant context injection.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/60">
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                Tenant Isolation Safeguarded
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                Zero Cross-Contamination
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                Regional Compliance Ready
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                SOC-2 Compliant
              </span>
            </div>
          </motion.div>

          {/* Card 2: ERP Bi-directional Sync */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#05603a] border border-emerald-200/60 flex items-center justify-center mb-6 shadow-2xs">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Native ERP Bi-directional Sync
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Sync stock, inventory levels, dynamic cost prices, and customer ledgers in real-time without latency or discrepancy.
              </p>
            </div>

            {/* Sync Integrations List */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200/60">
              {[
                { name: 'SAP S/4HANA', status: 'Connected', ping: '14ms' },
                { name: 'Oracle NetSuite', status: 'Connected', ping: '22ms' },
                { name: 'Salesforce CPQ Sync', status: 'Connected', ping: '18ms' }
              ].map((erp, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-800">{erp.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">{erp.ping}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {erp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Total White-label Customization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mb-6 shadow-2xs">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Total White-label Customization
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Provide customized branding, colors, logos, and custom quotation PDF templates tailored to each client or internal team franchise.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/60">
              <button
                onClick={() => {
                  if (onShowToast) onShowToast('White-label theme studio documentation opened');
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-[#05603a] transition-colors cursor-pointer"
              >
                <span>Explore customization matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Card 4: Immutable Governance & Change Ledger */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-slate-50/70 border border-slate-200/90 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center mb-6 shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Immutable Governance & Change Ledger
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Every quoted change, discount override, and revised line item is recorded in an audit trail. Version-locked proposals prevent unauthorized modifications post-signature.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Audit trail active: <strong className="text-slate-800">7,819</strong> events logged today</span>
              </div>
              <button
                onClick={() => {
                  if (onShowToast) onShowToast('Downloading sanitized enterprise audit log specimen...');
                }}
                className="font-bold text-[#05603a] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download audit log</span>
              </button>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
