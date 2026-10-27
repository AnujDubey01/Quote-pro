import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'QuotePro transformed our quoting pipeline. Our teams issue complex bids in minutes that used to require 24 hours of knowledge assembly and manual spreadsheet audits.',
      author: 'Vikrant Sharma',
      role: 'VP Commercial Ops, SpectraSys Eng.',
      avatarBg: 'bg-emerald-600',
      initials: 'VS'
    },
    {
      quote:
        'We went from 30% calculation errors in pricing to zero overnight. The margin approval triggers save us hundreds of thousands of dollars in profit margin every month.',
      author: 'Elena Rostova',
      role: 'Chief Commercial Officer, Hylux Aero',
      avatarBg: 'bg-blue-600',
      initials: 'ER'
    },
    {
      quote:
        'The gorgeous client-facing proposals create immediate trust with our prospects. Our win rate jumped 18% in the first quarter of deployment. Essential software.',
      author: 'Marcus Lindberg',
      role: 'Enterprise Sales Director, Zenon Energy',
      avatarBg: 'bg-slate-800',
      initials: 'ML'
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#05603a] uppercase tracking-widest block mb-3">
            Customer Stories
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Loved by Sales Engineers, Specifiers, and CFOs
          </h2>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl bg-slate-50/60 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                {/* 5 Gold Stars */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic mb-8">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-200/60">
                <div
                  className={`w-11 h-11 rounded-full ${t.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md`}
                >
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {t.author}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
