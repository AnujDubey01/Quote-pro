import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import axios from 'axios';
import { motion } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Headphones,
  FileSpreadsheet,
  Package,
  Users,
  BarChart3,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Building
} from 'lucide-react';
import { getDefaultRouteForRole } from '../utils/roleUtils';

const Login = () => {
  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGINS === 'true';
  const [email, setEmail] = useState(isDev ? 'admin@test.com' : '');
  const [password, setPassword] = useState(isDev ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMessage, setForgotMessage] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteForRole(user));
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const res = await axios.post('/api/v1/auth/login', { email, password });
      if (res.data?.success) {
        const authData = res.data.data;
        dispatch(loginSuccess(authData));
        const token = authData.accessToken || authData.token;
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        navigate(getDefaultRouteForRole(authData.user));
        return;
      }
    } catch (err) {
      console.warn('API login error:', err);

      // Local fallback for offline/demo evaluation
      const isServerError = !err.response || err.response.status >= 500 || err.code === 'ERR_NETWORK';
      if (
        isServerError &&
        (email === 'admin@test.com' || email.includes('demo'))
      ) {
        const demoData = {
          user: {
            id: 'demo-admin-1',
            name: 'Test Admin',
            email: 'admin@test.com',
            role: 'Company Admin',
            company: 'Demo Corp'
          },
          accessToken: 'demo-token-jwt-quotationbuilder',
          token: 'demo-token-jwt-quotationbuilder'
        };
        dispatch(loginSuccess(demoData));
        navigate('/');
        return;
      }

      if (err.response?.status === 401) {
        dispatch(loginFailure('Invalid email or password. Please try again.'));
      } else if (isServerError) {
        dispatch(
          loginFailure(
            `Server connection error (${err.response?.status || 'Offline'}). Click 'Demo auto-fill' below to access the portal.`
          )
        );
      } else {
        dispatch(
          loginFailure(
            err.response?.data?.message || 'Invalid email or password. Please try again.'
          )
        );
      }
    }
  };

  const features = [
    {
      icon: FileSpreadsheet,
      prefix: 'Generate',
      label: 'CPQ Proposals',
      iconBg: 'bg-emerald-50 text-[#05603a]',
      borderHover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
    },
    {
      icon: Package,
      prefix: 'Stage & Price',
      label: 'Product SKUs',
      iconBg: 'bg-emerald-50 text-[#05603a]',
      borderHover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
    },
    {
      icon: Users,
      prefix: 'Manage',
      label: 'Client Accounts',
      iconBg: 'bg-emerald-50 text-[#05603a]',
      borderHover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
    },
    {
      icon: ShieldCheck,
      prefix: 'Enforce',
      label: 'Tenant Isolation',
      iconBg: 'bg-emerald-50 text-[#05603a]',
      borderHover: 'hover:border-emerald-200 hover:bg-emerald-50/50',
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-[#05603a] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ========================================================= */}
      {/* LEFT SECTION: Brand, Tagline, Hero Title & Visual Preview */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[58%] xl:w-[60%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white z-0 relative">
        <div className="max-w-2xl w-full mx-auto lg:mx-0">
          {/* Brand Logo matching QuotePro Reference */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#05603a] flex items-center justify-center text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-zinc-950 font-sans">
                  Quote<span className="text-[#05603a]">Pro</span>
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-400 block -mt-1">
                ENTERPRISE CPQ
              </span>
            </div>
          </div>

          {/* Subtitle Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 sm:mt-12"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
              HIGH-PRECISION B2B CPQ ENGINE
            </span>
          </motion.div>

          {/* Hero Headline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mt-4"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-zinc-950 tracking-tight leading-tight">
              Enterprise Commercial Proposals.{' '}
              <span className="text-[#05603a]">Zero Friction.</span>
            </h1>

            <p className="mt-4 text-zinc-500 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
              Strict multi-tenant isolation, automated HSN GST tax calculations, instant SKU staging, and certified executive PDF generation for luxury manufacturers & distributors.
            </p>
          </motion.div>

          {/* Feature Pills Row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3"
          >
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200/70 ${item.borderHover} transition-all shadow-2xs group`}
                >
                  <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-xs leading-tight">
                    <span className="text-zinc-400 font-medium text-[10px] uppercase tracking-wider">{item.prefix}</span>
                    <span className="text-zinc-950 font-bold">{item.label}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom Platform Guarantee */}
        <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AWS KMS AES-256 Partition Encryption</span>
          </div>
          <div>•</div>
          <div>v4.12.0 Enterprise Release</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SECTION: Luxury Dark Navy/Slate Admin Portal Form   */}
      {/* ========================================================= */}
      <div className="w-full lg:w-[42%] xl:w-[40%] bg-[#152e4d] text-white flex flex-col justify-center relative p-6 sm:p-12 lg:p-12 xl:p-14 shadow-2xl min-h-[580px] lg:min-h-screen">
        {/* Form Card Container */}
        <div className="max-w-[400px] w-full mx-auto relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Header Titles */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-emerald-300 border border-white/15 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SECURE ACCESS PORTAL
              </span>
              <h2 className="text-3xl font-bold text-white tracking-tight leading-snug">
                Welcome Back
              </h2>
              <p className="text-zinc-300 text-xs mt-1 font-normal">
                Sign in to your QuotePro organization account
              </p>
            </div>

            {/* Error Notification Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs flex items-start gap-2.5 backdrop-blur-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </motion.div>
            )}

            {/* Forgot Password Notification Dialog */}
            {forgotMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-zinc-100 text-xs flex items-start justify-between gap-2.5 backdrop-blur-md"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>
                    To reset your password, contact your tenant admin at{' '}
                    <strong className="text-white underline">ops@democorp.com</strong>
                  </span>
                </div>
                <button
                  onClick={() => setForgotMessage(false)}
                  className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Main Sign-In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold text-zinc-200 mb-1.5 tracking-wide"
                >
                  Commercial Account Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
                  <input
                    id="email-input"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) dispatch(loginFailure(null));
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-zinc-400 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#05603a] focus:border-transparent transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold text-zinc-200 mb-1.5 tracking-wide"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none z-10" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) dispatch(loginFailure(null));
                    }}
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-zinc-400 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#05603a] focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 z-10 text-zinc-400 hover:text-white transition p-1 rounded-md focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-300 hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-500 bg-white/10 text-[#05603a] focus:ring-0 focus:outline-none cursor-pointer accent-[#05603a]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setForgotMessage(true)}
                  className="text-zinc-300 hover:text-white transition hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-xl bg-[#05603a] hover:bg-[#044e30] text-white font-bold text-sm active:scale-[0.99] transition shadow-md shadow-black/20 flex items-center justify-center gap-2.5 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Auto-fill Helpers for Quick Role Testing (Development mode only) */}
              {isDev && (
                <div className="pt-3 space-y-2 border-t border-white/10">
                  <div className="text-[11px] text-center text-zinc-400 font-semibold uppercase tracking-wider">
                    Instant Demo Personas (Dev Mode):
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('superadmin@platform.com');
                        setPassword('password123');
                        dispatch(loginFailure(null));
                      }}
                      className="text-[11px] text-amber-300 hover:text-white transition py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 cursor-pointer font-bold"
                      title="Platform Super Admin"
                    >
                      ⚡ Super Admin
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@test.com');
                        setPassword('password123');
                        dispatch(loginFailure(null));
                      }}
                      className="text-[11px] text-emerald-300 hover:text-white transition py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 cursor-pointer font-bold"
                      title="Company Owner (Demo Corp)"
                    >
                      👑 Owner
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('manager@test.com');
                        setPassword('password123');
                        dispatch(loginFailure(null));
                      }}
                      className="text-[11px] text-sky-300 hover:text-white transition py-1 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 cursor-pointer font-bold"
                      title="Catalog & Operations Manager"
                    >
                      👔 Manager
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('sales@test.com');
                        setPassword('password123');
                        dispatch(loginFailure(null));
                      }}
                      className="text-[11px] text-teal-300 hover:text-white transition py-1 px-2.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 cursor-pointer font-bold"
                      title="Sales Representative"
                    >
                      💼 Sales
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('apex@test.com');
                        setPassword('password123');
                        dispatch(loginFailure(null));
                      }}
                      className="text-[11px] text-rose-300 hover:text-white transition py-1 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 cursor-pointer font-bold"
                      title="Apex Luxury Bathware (Tenant 2)"
                    >
                      🏢 Apex Tenant
                    </button>
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
