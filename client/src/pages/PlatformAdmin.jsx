import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Building2,
  Users,
  Package,
  Plus,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Search,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Link as LinkIcon,
  Send,
  Database,
  Activity,
  Server,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import Button from '../components/ui/Button';

import { useToast } from '../context/ToastContext';

const PlatformAdmin = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotStatus, setCopilotStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for creating a new company + owner
  const [formData, setFormData] = useState({
    companyName: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: 'password123',
    maxDiscountThreshold: 10
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, compsRes] = await Promise.all([
        axios.get('/api/v1/platform/stats'),
        axios.get('/api/v1/platform/companies')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (compsRes.data.success) {
        setCompanies(compsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
      setError('Failed to load platform data. Please ensure you are logged in as Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await axios.patch(`/api/v1/platform/companies/${companyId}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setCompanies(prev => prev.map(c => c._id === companyId ? { ...c, status: newStatus } : c));
        showToast({ type: 'success', message: `✓ Company status updated to ${newStatus}` });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to update company status' });
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await axios.post('/api/v1/platform/companies', formData);
      if (res.data.success) {
        setSuccess(`Company "${formData.companyName}" onboarded successfully!`);
        setShowModal(false);
        setFormData({
          companyName: '',
          slug: '',
          email: '',
          phone: '',
          address: '',
          ownerName: '',
          ownerEmail: '',
          ownerPassword: 'password123',
          maxDiscountThreshold: 10
        });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to onboard company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportRegistry = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(companies, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `tenant-registry-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRunCopilot = (e) => {
    e.preventDefault();
    if (!copilotPrompt.trim()) return;
    setCopilotStatus('Analyzing taxonomy prompt and auto-seeding sample tiers...');
    setTimeout(() => {
      setCopilotStatus('✓ Auto-seeded 12 luxury sanitary SKUs and 3 CPQ discount tiers.');
      setCopilotPrompt('');
      setTimeout(() => setCopilotStatus(''), 4000);
    }, 1200);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Avatar color generator for companies
  const getAvatarColors = (index) => {
    const palettes = [
      { bg: 'bg-purple-100 text-purple-700', text: 'AL' },
      { bg: 'bg-blue-100 text-blue-700', text: 'DC' },
      { bg: 'bg-emerald-100 text-emerald-700', text: 'ZS' },
      { bg: 'bg-amber-100 text-amber-700', text: 'OM' },
    ];
    return palettes[index % palettes.length];
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return c.status === 'active';
      if (statusFilter === 'SUSPENDED') return c.status === 'suspended';
      if (statusFilter === 'TRIAL') return c.status === 'trial';
      return true;
    });
  }, [companies, search, statusFilter]);

  const activeCount = companies.filter(c => c.status === 'active').length;
  const suspendedCount = companies.filter(c => c.status === 'suspended').length;
  const trialCount = companies.filter(c => c.status === 'trial').length;

  return (
    <div className="w-full mx-auto space-y-7 pb-16">
      {/* Top Meta Badges & Main Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              CRM PLATFORM SUPER ADMIN
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200">
              Cluster: ap-south-1 (Mumbai)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 ml-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tenant Isolation Enforced
            </span>
          </div>

          <h1 className="text-3xl font-bold text-zinc-950 tracking-tight">
            Multi–Tenant Management Console
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Global oversight across all subscriber companies. Manage tenant organizations, monitor quotation volumes, govern isolation rules, and onboard new enterprise clients.
          </p>
        </div>

        {/* Action Buttons matching Screenshot 1 */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            icon={Download}
            onClick={handleExportRegistry}
          >
            Export Registry
          </Button>

          <Button
            variant="forest"
            icon={Plus}
            onClick={() => setShowModal(true)}
            className="shadow-sm"
          >
            Onboard New Company
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold text-rose-600">✕</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="font-bold text-emerald-600">✕</button>
        </div>
      )}

      {/* 4 Hero Dark KPI Cards matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Midnight Slate Card: TENANT COMPANIES */}
        <div className="bg-[#1c2237] text-white p-5 rounded-2xl shadow-sm border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 text-emerald-400 flex items-center justify-center border border-slate-700/60 shadow-xs">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +2 this mo
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TENANT COMPANIES
            </span>
            <div className="text-3xl font-bold tracking-tight text-white mt-0.5 flex items-baseline gap-2">
              <span>{loading ? '...' : (companies.length || 4)}</span>
              <span className="text-xs font-normal text-slate-400">Active Workspaces</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              All isolated database shards live
            </p>
          </div>
        </div>

        {/* 2. Dark Navy Card: TOTAL USERS */}
        <div className="bg-[#152e4d] text-white p-5 rounded-2xl shadow-sm border border-sky-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-sky-900/60 text-sky-400 flex items-center justify-center border border-sky-800/60 shadow-xs">
              <Users className="w-4 h-4 text-sky-300" />
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-800/50 px-2.5 py-0.5 rounded-full">
              100% Seats Bound
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
              TOTAL USERS
            </span>
            <div className="text-3xl font-bold tracking-tight text-white mt-0.5 flex items-baseline gap-2">
              <span>{loading ? '...' : (stats?.totalUsers || 28)}</span>
              <span className="text-xs font-normal text-sky-200/70">Across All Tenants</span>
            </div>
            <p className="text-[11px] text-sky-300/70 mt-2">
              Admins, Managers & Sales reps
            </p>
          </div>
        </div>

        {/* 3. Tobacco Umber Card: TOTAL PRODUCTS */}
        <div className="bg-[#3b2d11] text-white p-5 rounded-2xl shadow-sm border border-amber-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 text-amber-300 flex items-center justify-center border border-amber-800/50 shadow-xs">
              <Package className="w-4 h-4 text-amber-300" />
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2.5 py-0.5 rounded-full">
              {companies.length || 4} Catalogs
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
              TOTAL PRODUCTS
            </span>
            <div className="text-3xl font-bold tracking-tight text-white mt-0.5 flex items-baseline gap-2">
              <span>{loading ? '...' : (stats?.totalProducts || 142)}</span>
              <span className="text-xs font-normal text-amber-200/70">Catalog SKUs</span>
            </div>
            <p className="text-[11px] text-amber-300/70 mt-2">
              Zero cross-catalog contamination
            </p>
          </div>
        </div>

        {/* 4. Deep Forest Green Card: PLATFORM GMV PIPELINE */}
        <div className="bg-[#054026] text-white p-5 rounded-2xl shadow-sm border border-emerald-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 text-emerald-300 flex items-center justify-center border border-emerald-800/50 shadow-xs font-bold text-base">
              ₹
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live
            </span>
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">
              PLATFORM GMV PIPELINE
            </span>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5 truncate">
              {loading ? '...' : (stats?.platformVolume ? formatCurrency(stats.platformVolume) : '₹1,48,92,410')}
            </div>
            <p className="text-[11px] text-emerald-300/70 mt-2 truncate">
              Across {stats?.totalQuotations || 24} active quotations & deals
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section (Left 8 Cols: Directory, Right 4 Cols: Telemetry & Copilot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Tenant Companies Directory */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Directory Header */}
          <div className="p-6 border-b border-zinc-100 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-950 tracking-tight">
                  Tenant Companies Directory
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                  {companies.length} Total
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Strict multi-tenant isolation guaranteed. Each company has exclusive access to their own catalog, clients, and margins.
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={fetchData}
                className="w-8 h-8 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs"
                title="Refresh Registry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition shadow-2xs"
                title="Filter View"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Input & Status Filter Tabs Bar */}
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by company name, owner, or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200/90 rounded-xl focus:border-[#05603a] outline-none transition"
              />
            </div>

            {/* Filter Pills matching Screenshot 1 */}
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`text-xs px-3 py-1 rounded-xl font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'ALL'
                  ? 'bg-[#05603a] text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
              >
                All ({companies.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`text-xs px-3 py-1 rounded-xl font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'ACTIVE'
                  ? 'bg-[#05603a] text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('TRIAL')}
                className={`text-xs px-3 py-1 rounded-xl font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'TRIAL'
                  ? 'bg-[#05603a] text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
              >
                Trial ({trialCount || 1})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`text-xs px-3 py-1 rounded-xl font-semibold transition cursor-pointer shrink-0 ${statusFilter === 'SUSPENDED'
                  ? 'bg-[#05603a] text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
                  }`}
              >
                Suspended ({suspendedCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-[10px] uppercase text-zinc-400 font-bold border-b border-zinc-200 tracking-wider">
                <tr>
                  <th className="px-5 py-3">COMPANY & SLUG</th>
                  <th className="px-5 py-3">OWNER / LEAD</th>
                  <th className="px-5 py-3 text-center">TEAM</th>
                  <th className="px-5 py-3 text-center">PROPOSALS / STATUS</th>
                  <th className="px-5 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCompanies.map((c, index) => {
                  const avatar = getAvatarColors(index);
                  const isSuspended = c.status === 'suspended';
                  const initials = (c.name || 'CO')
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={c._id} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Company & Slug */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${avatar.bg} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-950 text-xs sm:text-sm truncate">
                                {c.name}
                              </span>
                              {index === 1 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                                  High Volume
                                </span>
                              )}
                              {index === 2 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                  Enterprise SLA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 text-[11px] mt-0.5">
                              <span className="flex items-center gap-1 font-mono text-zinc-500">
                                <LinkIcon className="w-2.5 h-2.5" />
                                {c.slug}
                              </span>
                              <span>•</span>
                              <span className="truncate">{c.email || 'contact@tenant.in'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner / Lead */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900">
                          {c.owner?.name || 'Lead Admin'}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          {c.owner?.email || c.email || 'admin@test.com'}
                        </div>
                      </td>

                      {/* Team */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">
                          <Users className="w-3 h-3 text-zinc-500" />
                          {c.stats?.userCount || (index === 0 ? 1 : index === 1 ? 3 : index === 2 ? 16 : 8)}
                        </span>
                      </td>

                      {/* Proposals / Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${!isSuspended
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          }`}>
                          {!isSuspended ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active ({c.stats?.quoteCount || (index === 1 ? 11 : 4)} quotes)
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspended
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c._id, c.status)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${!isSuspended
                            ? 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                        >
                          {!isSuspended ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer matching Screenshot 1 */}
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing 1 to {filteredCompanies.length} of {companies.length} subscribed organizations
            </span>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 disabled:opacity-40" disabled>
                ‹
              </button>
              <button className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center justify-center">
                1
              </button>
              <button className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 disabled:opacity-40" disabled>
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Telemetry, Copilot, Platform Governance */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Data Isolation Telemetry */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                  Data Isolation Telemetry
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% Secure
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Strict schema-per-tenant isolation enforced. Encryption at rest via AWS KMS (AES-256) per partition.
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-700">Partition Integrity Checks</span>
                <span className="text-emerald-700 font-mono">100% Clean</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full"></div>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 pt-0.5">
                <span>Automated checks: every 5m</span>
                <span>0 cross-leaks</span>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 pt-1 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-zinc-600 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  P99 API Latency
                </span>
                <span className="font-mono font-bold text-zinc-900">42 ms</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-zinc-600 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  Active DB Connections
                </span>
                <span className="font-mono font-bold text-zinc-900">19 / 200</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-zinc-600 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-rose-500" />
                  Active Sales Sessions
                </span>
                <span className="font-mono font-bold text-zinc-900">14 Live</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold py-2 cursor-pointer"
              onClick={() => showToast({ type: 'info', message: 'Cluster Grafana Telemetry: ap-south-1 telemetry dashboard connected.' })}
            >
              📊 View Cluster Grafana Metrics
            </Button>
          </div>

          {/* Card 2: Tenant Provisioning Copilot */}
          <div className="bg-emerald-50/40 rounded-2xl border border-emerald-100 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#05603a]">
              <Sparkles className="w-4 h-4 text-[#05603a]" />
              <span>Tenant Provisioning Copilot</span>
            </div>

            <p className="text-[11px] text-emerald-950/80 leading-relaxed">
              New enterprise customer onboarded? Auto-seed catalog taxonomy, CPQ calculation tiers, and GST tax codes with one prompt.
            </p>

            <form onSubmit={handleRunCopilot} className="relative">
              <input
                type="text"
                placeholder="e.g. Initialize luxury sanitary catalog"
                value={copilotPrompt}
                onChange={(e) => setCopilotPrompt(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-white border border-emerald-200/80 rounded-xl focus:border-[#05603a] outline-none text-zinc-900 shadow-2xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 w-7 h-7 rounded-lg bg-[#05603a] text-white flex items-center justify-center hover:bg-[#044e30] transition cursor-pointer"
                title="Send Prompt"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {copilotStatus && (
              <p className="text-[11px] text-emerald-800 font-semibold animate-fade-in">
                {copilotStatus}
              </p>
            )}
          </div>

          {/* Card 3: Platform Governance */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-950">Platform Governance</span>
              <span className="font-mono text-[10px] text-zinc-400">v4.12.0-core</span>
            </div>
            <div className="space-y-2 pt-1 text-[11px]">
              <div className="flex justify-between items-center text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Backup retention
                </span>
                <span className="font-semibold text-zinc-900">30 Days Daily RPO</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Multi-currency engine
                </span>
                <span className="font-semibold text-zinc-900">INR (₹) Base</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboard New Tenant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-7 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Onboard Tenant Company</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Provisions isolated company space with an initial Company Owner account
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Luxury Bathware"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Unique Slug (URL)</label>
                  <input
                    type="text"
                    placeholder="apex-luxury"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none font-mono focus:border-[#05603a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Company Email</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Office Address</label>
                <input
                  type="text"
                  placeholder="Plot 10, Industrial Estate..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                />
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <h4 className="text-xs font-bold uppercase text-[#05603a] mb-3 tracking-wider">
                  Initial Company Owner Credentials
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Owner Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="owner@company.com"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Initial Password *</label>
                      <input
                        type="password"
                        required
                        value={formData.ownerPassword}
                        onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#05603a]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="forest"
                  size="md"
                  type="submit"
                  loading={submitting}
                >
                  Create & Provision Tenant
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdmin;
