import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import HeroCpqMockup from '../components/landing/HeroCpqMockup';
import WorkflowFeatures from '../components/landing/WorkflowFeatures';
import MarginEngineSection from '../components/landing/MarginEngineSection';
import EnterpriseSection from '../components/landing/EnterpriseSection';
import ResultsStats from '../components/landing/ResultsStats';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import PricingSection from '../components/landing/PricingSection';
import CtaBanner from '../components/landing/CtaBanner';
import Footer from '../components/landing/Footer';
import DemoModal from '../components/landing/DemoModal';

export default function LandingPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto dismiss toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans antialiased">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 max-w-md"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-100 flex-1">
              {toastMessage}
            </p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Navigation Header */}
      <Navbar onOpenDemo={() => setDemoModalOpen(true)} />

      {/* Main Page Flow */}
      <main>
        {/* 1. Hero Top */}
        <HeroSection onOpenDemo={() => setDemoModalOpen(true)} />

        {/* 2. Interactive Quotation Builder Showcase (Hero Product Mockup) */}
        <HeroCpqMockup onShowToast={showToast} />

        {/* 3. Workflow Features (3-Card Handshake Bottleneck Grid) */}
        <WorkflowFeatures />

        {/* 4. CPQ Deal Maker Engine + Interactive Margin Simulator */}
        <MarginEngineSection onShowToast={showToast} />

        {/* 5. Enterprise Scalability & Global Architectures */}
        <EnterpriseSection onShowToast={showToast} />

        {/* 6. Proven Business Results & KPI Stats */}
        <ResultsStats />

        {/* 7. Loved by Sales Engineers & CFOs Testimonials */}
        <TestimonialsSection />

        {/* 8. Predictable Pricing Grid */}
        <PricingSection onOpenDemo={() => setDemoModalOpen(true)} />

        {/* 9. Dark Forest Green Call to Action Banner */}
        <CtaBanner onShowToast={showToast} />
      </main>

      {/* Enterprise Footer */}
      <Footer onShowToast={showToast} />

      {/* Interactive Demo & Booking Modal */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onShowToast={showToast}
      />

    </div>
  );
}
