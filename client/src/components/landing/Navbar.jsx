import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  ArrowRight, 
  Menu, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  User
} from 'lucide-react';
import { getDefaultRouteForRole } from '../../utils/roleUtils';

export default function Navbar({ onOpenDemo }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#05603a] to-[#044e30] flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-[#05603a] transition-colors">
                Quote<span className="text-[#05603a]">Pro</span>
              </span>
              <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-slate-600 hover:text-[#05603a] transition-colors cursor-pointer"
            >
              Solutions
            </button>
            <button 
              onClick={() => scrollToSection('engine')}
              className="text-sm font-medium text-slate-600 hover:text-[#05603a] transition-colors cursor-pointer"
            >
              Product Features
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-sm font-medium text-slate-600 hover:text-[#05603a] transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('enterprise')}
              className="text-sm font-medium text-slate-600 hover:text-[#05603a] transition-colors cursor-pointer"
            >
              Enterprise
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDefaultRouteForRole(user))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-emerald-50 text-[#05603a] border border-emerald-200/80 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Dashboard ({user?.name || user?.role || 'App'})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-[#05603a] px-3 py-2 transition-colors"
                >
                  Log in
                </Link>
                
                <button
                  onClick={onOpenDemo}
                  className="text-sm font-semibold text-slate-700 hover:text-[#05603a] px-3 py-2 transition-colors cursor-pointer"
                >
                  Book a Demo
                </button>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#05603a] hover:bg-[#044e30] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => navigate(getDefaultRouteForRole(user))}
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-50 text-[#05603a] border border-emerald-200"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-left text-base font-medium text-slate-800 hover:text-[#05603a] py-1"
              >
                Solutions
              </button>
              <button 
                onClick={() => scrollToSection('engine')}
                className="text-left text-base font-medium text-slate-800 hover:text-[#05603a] py-1"
              >
                Product Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-left text-base font-medium text-slate-800 hover:text-[#05603a] py-1"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('enterprise')}
                className="text-left text-base font-medium text-slate-800 hover:text-[#05603a] py-1"
              >
                Enterprise
              </button>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDemo();
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Book a Demo
                </button>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-[#05603a] text-white text-sm font-semibold hover:bg-[#044e30] shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
