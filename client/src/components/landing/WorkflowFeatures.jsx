import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Zap, 
  Users2, 
  ArrowRight, 
  ExternalLink 
} from 'lucide-react';

export default function WorkflowFeatures() {
  const cards = [
    {
      icon: ShieldAlert,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/60',
      badge: 'PREVENT MARGIN LEAKS',
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200/70',
      title: 'Stop Margin Erosion',
      description:
        'Automatic gross margin ceilings. Pull sanity checks before quotes exit to prospects so no junior salesperson exposes your company to financially disastrous contracts.',
      linkText: 'Learn about approval rules',
      pillText: 'Rule Engine v2',
      pillColor: 'bg-rose-100 text-rose-800'
    },
    {
      icon: Zap,
      iconBg: 'bg-emerald-50 text-[#05603a] border-emerald-200/60',
      badge: 'TURBO-CHARGE PDFS',
      badgeColor: 'text-[#05603a] bg-emerald-50 border-emerald-200/70',
      title: 'Instant Client-Crossing Staging',
      description:
        'Spawn 500-item PDFs with zero latency and automatic branded watermarking. Custom headers and footers generated through AWS S3 in seconds without browser crashes.',
      linkText: 'Flawless Export Speed',
      pillText: '< 650ms render',
      pillColor: 'bg-emerald-100 text-[#05603a]'
    },
    {
      icon: Users2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/60',
      badge: 'ROLE-BASED GOVERNANCE',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200/70',
      title: 'Silent Security & Cart Ease',
      description:
        'Custom-tailored permissions for Sales Reps vs Managers. Owner admin view has instant insight into pipeline leaks and active proposals without waiting for weekly status reports.',
      linkText: 'Explore Role Control',
      pillText: 'Granular Permissions',
      pillColor: 'bg-blue-100 text-blue-800'
    }
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Kicker + Title + Side Description */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end mb-14">
          <div className="lg:col-span-7">
            <span className="text-xs font-bold text-[#05603a] uppercase tracking-widest block mb-3">
              Online Workflow Engine
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Engineered to Eliminate Bottlenecks at Every Handshake.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-slate-600 text-base leading-relaxed">
              Legacy CPQ systems are sluggish, brittle and require endless engineering intervention. QuotePro lets commercial teams configure complex logic in real-time, lightweight architectures.
            </p>
          </div>
        </div>

        {/* 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                whileHover={{ y: -6 }}
                className="group relative bg-white rounded-3xl p-8 border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Icon Box */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-6 ${card.iconBg} group-hover:scale-105 transition-transform shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Tag Pill */}
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border mb-3 ${card.badgeColor}`}>
                    {card.badge}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#05603a] transition-colors">
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Link + Pill */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#05603a] flex items-center gap-1 transition-colors">
                    <span>{card.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${card.pillColor}`}>
                    {card.pillText}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
