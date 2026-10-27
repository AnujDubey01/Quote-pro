import { motion } from 'motion/react';
import { 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

export default function ResultsStats() {
  const stats = [
    {
      value: '3.2×',
      label: 'Faster Time-to-Quote',
      description: 'Average quotation generation time dropped from 14h to 4.2m across commercial pipelines.',
      color: 'text-blue-600',
      badge: 'SPEED BOOST'
    },
    {
      value: '99.4%',
      label: 'Calculation Accuracy',
      description: 'Eliminated human pricing errors, incorrect discount tiers, and currency rounding bugs.',
      color: 'text-[#05603a]',
      badge: 'ZERO DEFECTS'
    },
    {
      value: '+24%',
      label: 'Margin Preservation',
      description: 'Enforced gross margin guardrails prevent junior sales reps from delivering rogue discounts.',
      color: 'text-emerald-600',
      badge: 'PROFIT GAIN'
    },
    {
      value: '< 4 hrs',
      label: 'Onboarding Speed',
      description: 'Sales reps and partner distributors become fully productive without weeks of complex training.',
      color: 'text-slate-800',
      badge: 'EASY ADOPTION'
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-slate-50/70 border-y border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#05603a] uppercase tracking-widest block mb-3">
            Proven Performance
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Proven Business Results from Over 100,000 Generated Proposals
          </h2>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-lg transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-4xl sm:text-5xl font-black tracking-tight ${stat.color} font-mono`}>
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                    {stat.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {stat.label}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
