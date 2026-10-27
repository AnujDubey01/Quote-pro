import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export default function PricingSection({ onOpenDemo }) {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: 'Starter',
      subtitle: 'For emerging teams and growing deal sizes',
      price: isAnnual ? 39 : 49,
      period: '/ seat / mo',
      popular: false,
      features: [
        '50 Active Quotes/month',
        'Standard S3 & Client PDFs',
        'Automated PDF Generation',
        'Basic Currency Engine',
        'Email Support (24h response)'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'secondary',
      link: '/login'
    },
    {
      name: 'Professional',
      subtitle: 'Comprehensive rules and multi-margin compliance',
      price: isAnnual ? 63 : 79,
      period: '/ seat / mo',
      popular: true,
      features: [
        'Unlimited Active Quotes',
        'Automated Approval Workflows',
        'Custom Dynamic PDF Styling',
        'Multi-currency & Rule Guardrails',
        'Quick Automated Approvals',
        'Priority Slack & Phone Support'
      ],
      buttonText: 'Start 14-Day Free Trial',
      buttonVariant: 'primary',
      link: '/login'
    },
    {
      name: 'Enterprise Suite',
      subtitle: 'Full scale operations and ERP integrations',
      price: 'Custom',
      period: 'billed annual',
      popular: false,
      features: [
        'Unlimited Bids & White-label',
        'High-speed dedicated S3 archiving',
        'Custom ERP & CRM bidirectional Sync',
        'Dedicated solution engineer & 99.99% SLA',
        'Custom SSO (SAML/Okta) & Role Policies'
      ],
      buttonText: 'Contact Enterprise Sales',
      buttonVariant: 'secondary',
      action: onOpenDemo
    }
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-slate-50/70 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold text-[#05603a] uppercase tracking-widest block mb-3">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
            Predictable Pricing for High-Performance Teams
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
            Zero hidden implementation fees. Migrate in minutes with our automated CPQ onboarding pipeline and integrations.
          </p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isAnnual
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isAnnual
                  ? 'bg-[#05603a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-[#05603a]">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                tier.popular
                  ? 'bg-white border-2 border-[#05603a] shadow-xl shadow-emerald-950/10 scale-100 md:-translate-y-2'
                  : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-md'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#05603a] text-white shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>Most Popular</span>
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {tier.name}
                </h3>
                <p className="text-xs text-slate-500 mb-6 min-h-[32px]">
                  {tier.subtitle}
                </p>

                {/* Price */}
                <div className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                    {typeof tier.price === 'number' ? `$${tier.price}` : tier.price}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {tier.period}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-3.5 pt-6 border-t border-slate-100">
                  {tier.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#05603a] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                {tier.action ? (
                  <button
                    onClick={tier.action}
                    className="w-full py-3.5 px-4 rounded-full text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{tier.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to={tier.link}
                    className={`w-full py-3.5 px-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      tier.buttonVariant === 'primary'
                        ? 'bg-[#05603a] hover:bg-[#034d2e] text-white shadow-md shadow-emerald-950/20 hover:shadow-lg'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <span>{tier.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
