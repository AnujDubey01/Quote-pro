import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  Layers, 
  Box, 
  Globe2, 
  Radio
} from 'lucide-react';

export default function HeroSection({ onOpenDemo }) {
  const logos = [
    { name: 'DEMOCORP', icon: Box, subtitle: 'GLOBAL MANUFACTURING' },
    { name: 'SPECLOGIX', icon: Cpu, subtitle: 'PRECISION SYSTEMS' },
    { name: 'ACMELEMENT', icon: Sparkles, subtitle: 'INDUSTRIAL AUTOMATION' },
    { name: 'ORBITAL-SYNC', icon: Radio, subtitle: 'AEROSPACE HARDWARE' },
    { name: 'ZENITH GROUP', icon: Globe2, subtitle: 'ENERGY SOLUTIONS' },
  ];

  return (
    <section className="relative pt-32 pb-6 md:pt-40 md:pb-10 overflow-hidden">
      {/* Background Soft Mesh Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-emerald-100/50 via-teal-50/40 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-12 left-10 w-72 h-72 bg-emerald-50/60 rounded-full blur-2xl pointer-events-none -z-10" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-teal-50/50 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Top Announcement Pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-xs font-semibold text-[#05603a] shadow-xs mb-8 hover:bg-emerald-100/70 transition-colors cursor-default"
        >
          <div className="w-4 h-4 rounded-full bg-[#05603a] text-white flex items-center justify-center">
            <ShieldCheck className="w-2.5 h-2.5" />
          </div>
          <span>Eliminate 80% Idle Days</span>
          <span className="text-emerald-400">•</span>
          <span className="font-normal text-emerald-900">AI-Powered Quoting Engine & Smart Discount Engine</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-5xl mx-auto mb-6"
        >
          Configure, Price & Quote in <br className="hidden sm:block" />
          Seconds —{' '}
          <span className="relative inline-block mt-2 sm:mt-0">
            <span className="relative z-10 px-3.5 py-1 text-[#05603a] bg-emerald-100/90 rounded-2xl border border-emerald-300/60 shadow-xs">
              Not Days.
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed mb-10"
        >
          Empower sales teams, automate company approvals, and deliver complex configurations with zero-error, client-ready proposals in 60 seconds.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#05603a] hover:bg-[#034d2e] shadow-lg shadow-emerald-950/15 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <span>Start a 14-Day Free Trial</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
            <span>Watch 2-Min Interactive Demo</span>
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-500 font-medium mb-16"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Enterprise tier available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>SOC2 Type II Certified</span>
          </div>
        </motion.div>

        {/* Social Proof Marquee / Logo Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-6 border-t border-slate-100"
        >
          <p className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-slate-400 mb-8">
            Trusted by fast-scaling manufacturing & enterprise leaders worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 md:gap-16 opacity-75 hover:opacity-100 transition-opacity">
            {logos.map((logo, index) => {
              const IconComp = logo.icon;
              return (
                <div key={index} className="flex items-center gap-2 group cursor-default">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-[#05603a] flex items-center justify-center transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-sm tracking-wider text-slate-700 group-hover:text-slate-900 transition-colors block">
                      {logo.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
