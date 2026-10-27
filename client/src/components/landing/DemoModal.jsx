import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Mail, 
  User, 
  Clock,
  Play,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function DemoModal({ isOpen, onClose, onShowToast }) {
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' | 'book'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '10-50 reps',
    date: 'Tomorrow, 2:00 PM EST'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (onShowToast) {
      onShowToast(`VIP Interactive Demo reserved for ${formData.email}! Check your calendar invitation.`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Dialog Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-[#05603a] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  QuotePro Interactive Walkthrough
                </h3>
                <p className="text-xs text-slate-500">
                  Experience next-gen CPQ speed and margin guardrails
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex gap-4">
            <button
              onClick={() => { setActiveTab('interactive'); setSubmitted(false); }}
              className={`pb-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'interactive'
                  ? 'border-[#05603a] text-[#05603a]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Interactive 2-Min Demo</span>
            </button>
            <button
              onClick={() => { setActiveTab('book'); setSubmitted(false); }}
              className={`pb-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'book'
                  ? 'border-[#05603a] text-[#05603a]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book 1-on-1 Session</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {activeTab === 'interactive' ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      SIMULATED PIPELINE FLOW
                    </span>
                    <span className="text-xs text-slate-400 font-mono">00:48 / 02:00</span>
                  </div>

                  <h4 className="text-lg font-bold mb-2">
                    Orion Aerospace: 50-Item Turbine Quote Generated
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-5">
                    Watch how QuotePro synthesizes pricing rules, tests gross margin against corporate minimum floors, routes VP discount approval, and generates high-res cloud PDF in 420 milliseconds.
                  </p>

                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs font-mono">
                    <div className="text-emerald-400">✓ Injected catalog: 120 SKUs cached in Redis</div>
                    <div className="text-emerald-400">✓ Evaluated rule set: Tier 2 volume discount (12%) applied</div>
                    <div className="text-emerald-400">✓ Margin sanity check passed: Gross Margin 41.5% &gt; Floor 30.0%</div>
                    <div className="text-blue-300">✓ S3 Presigned URL generated for client download in 420ms</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">
                    Want to see this running live on your team's catalog?
                  </p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="px-4 py-2 rounded-xl bg-[#05603a] hover:bg-[#044e30] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Schedule 1-on-1 Walkthrough</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : submitted ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#05603a] flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900">
                  VIP Demonstration Scheduled!
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  We've reserved <strong>{formData.date}</strong> for <strong>{formData.email}</strong>. Our enterprise sales engineer will arrive with custom templates configured for {formData.company || 'your team'}.
                </p>
                <div className="pt-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Done & Return to Site
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Your Name
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 focus-within:border-[#05603a]">
                      <User className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alex Morgan"
                        required
                        className="w-full text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Business Email
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 focus-within:border-[#05603a]">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        required
                        className="w-full text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Company Name
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 focus-within:border-[#05603a]">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Manufacturing Inc"
                        required
                        className="w-full text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Sales Team Size
                    </label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#05603a] bg-white cursor-pointer"
                    >
                      <option>1-10 reps</option>
                      <option>10-50 reps</option>
                      <option>50-250 reps</option>
                      <option>250+ enterprise reps</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#05603a] hover:bg-[#044e30] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Reserve VIP Demo Slot</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Instant confirmation. No high-pressure sales tactics.
                  </p>
                </div>
              </form>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
