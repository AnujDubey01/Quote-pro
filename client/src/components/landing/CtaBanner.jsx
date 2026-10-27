import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Sparkles, Mail } from 'lucide-react';

export default function CtaBanner({ onShowToast }) {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      if (onShowToast) onShowToast('Please enter a valid work email address');
      return;
    }
    if (onShowToast) {
      onShowToast(`Trial invitation dispatched to ${email}! Redirecting to workspace setup...`);
    }
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dark Forest Green Curved Container */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#04331e] via-[#05603a] to-[#022415] text-white p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xl shadow-emerald-950/20 text-center">
          
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

          {/* Kicker Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-200 text-xs font-bold tracking-widest uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ready to Remove Quoting Bottlenecks?</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-4xl mx-auto mb-6">
            Eliminate Quoting Bottlenecks & Protect Company Margin Today.
          </h2>

          {/* Subtitle */}
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Join 800+ high-growth sales teams. Accelerate pipeline, eliminate rogue discounts, and send pristine proposals in seconds.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <div className="flex items-center gap-2 px-4 py-2 w-full">
                <Mail className="w-4 h-4 text-emerald-200 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your business email..."
                  required
                  className="w-full bg-transparent text-white placeholder-emerald-200/70 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#05603a] font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* 3 Checkpoints */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-medium text-emerald-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Setup in 5 minutes</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
