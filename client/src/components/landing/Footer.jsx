import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function Footer({ onShowToast }) {
  const [newsEmail, setNewsEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsEmail && newsEmail.includes('@')) {
      if (onShowToast) onShowToast('Subscribed to QuotePro product releases & engineering digests!');
      setNewsEmail('');
    }
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          
          {/* Col 1: Brand Info & Newsletter (Takes 2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#05603a] to-[#044e30] flex items-center justify-center text-white shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Quote<span className="text-[#05603a]">Pro</span>
              </span>
            </Link>

            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Next-generation enterprise CPQ platform built to accelerate complex sales cycles, enforce margin governance, and generate pristine client-ready quotation proposals directly to cloud storage in seconds.
            </p>

            {/* Quick newsletter subscription */}
            <form onSubmit={handleSubscribe} className="pt-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Join our technical CPQ newsletter
              </label>
              <div className="flex items-center gap-1.5 max-w-sm">
                <input
                  type="email"
                  value={newsEmail}
                  onChange={(e) => setNewsEmail(e.target.value)}
                  placeholder="developer@company.com"
                  required
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#05603a] flex-1 shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#05603a] hover:bg-[#044e30] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Col 2: Product Core */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4">
              Product Core
            </h4>
            <ul className="space-y-2.5">
              {['Dynamic CPQ Engine', 'Smart Guardrails', 'S3 Fast Render', 'Audit & Governance', 'Multi-Tenancy Engine'].map((item, i) => (
                <li key={i}>
                  <a href="#engine" className="hover:text-[#05603a] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Solutions */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4">
              Solutions
            </h4>
            <ul className="space-y-2.5">
              {['Enterprise Hardware', 'Medical & Automation', 'Financial & Heavy Eng', 'Distributed Franchises', 'Global Organizations'].map((item, i) => (
                <li key={i}>
                  <a href="#features" className="hover:text-[#05603a] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trust & Security */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4">
              Trust & Security
            </h4>
            <ul className="space-y-2.5 text-slate-500">
              <li className="flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#05603a]" />
                <span>SOC-2 Type II Certified</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#05603a]" />
                <span>GDPR & HIPAA Compliant</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>99.99% Cloud Uptime SLA</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-700">
                <Lock className="w-3.5 h-3.5 text-[#05603a]" />
                <span>256-bit AES Encryption</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright and Legal */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 QuotePro Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Security Portal</a>
            <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-800 transition-colors">System Status</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
