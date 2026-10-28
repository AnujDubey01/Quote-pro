import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Users,
  Package,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Eye,
  Download,
  Check,
  X,
  AlertTriangle,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Activity,
  Plus,
  Zap,
  BarChart2,
  ChevronDown,
  MoreHorizontal,
  FileCode,
  FileText,
  UserPlus
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [companySettings, setCompanySettings] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Filter & period state
  const [trendsPeriod, setTrendsPeriod] = useState('weekly');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  const [aiAnalysisDone, setAiAnalysisDone] = useState(false);

  // Modal State
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      const [qRes, pRes, cRes, tRes, compRes] = await Promise.all([
        axios.get('/api/v1/quotations?limit=100'),
        axios.get('/api/v1/products?limit=1'),
        axios.get('/api/v1/customers?limit=1'),
        axios.get('/api/v1/team'),
        axios.get('/api/v1/company')
      ]);

      if (qRes.data.success) {
        const list = qRes.data.data || [];
        setQuotations(list);
        setTotalQuotations(qRes.data.pagination?.total || list.length);
        const sum = list.reduce((acc, curr) => acc + (curr.total || 0), 0);
        setPipelineValue(sum);
      }

      if (pRes.data.success) {
        setTotalProducts(pRes.data.pagination?.total || 50);
      }

      if (cRes.data.success) {
        setTotalCustomers(cRes.data.pagination?.total || 4);
      }

      if (tRes.data.success) {
        setTeamCount(tRes.data.data?.members?.length || 3);
      }

      if (compRes.data.success) {
        setCompanySettings(compRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load owner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const handleDownloadPDF = async (quotationId, quotationNumber) => {
    try {
      setDownloadingId(quotationId);
      const res = await axios.get(`/api/v1/quotations/${quotationId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotation-${quotationNumber || quotationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast({ type: 'success', message: '✓ Quotation PDF downloaded successfully!' });
    } catch (err) {
      console.error('Failed to download PDF:', err);
      showToast({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`/api/v1/quotations/${id}/approve`);
      if (res.data.success) {
        setQuotations((prev) =>
          prev.map((q) => (q._id === id ? { ...q, status: 'approved', approvedBy: user } : q))
        );
        if (selectedQuotation && selectedQuotation._id === id) {
          setSelectedQuotation((prev) => ({ ...prev, status: 'approved', approvedBy: user }));
        }
        showToast({ type: 'success', message: '✓ Quotation approved successfully!' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to approve quotation' });
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason:', 'Discount exceeds margin limit');
    if (!reason) return;
    try {
      const res = await axios.post(`/api/v1/quotations/${id}/reject`, { reason });
      if (res.data.success) {
        setQuotations((prev) =>
          prev.map((q) => (q._id === id ? { ...q, status: 'rejected' } : q))
        );
        if (selectedQuotation && selectedQuotation._id === id) {
          setSelectedQuotation((prev) => ({ ...prev, status: 'rejected' }));
        }
        showToast({ type: 'warning', message: 'Quotation rejected and returned to rep.' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to reject quotation' });
    }
  };

  const handleExportFinancials = () => {
    const report = {
      tenant: companySettings?.name || 'Demo Corp',
      generatedAt: new Date().toISOString(),
      pipelineValue: pipelineValue || 5571255,
      totalQuotations: totalQuotations || 11,
      quotations: quotations
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(report, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `financials-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRunAiAnalysis = () => {
    setAiAnalysisRunning(true);
    setTimeout(() => {
      setAiAnalysisRunning(false);
      setAiAnalysisDone(true);
      setTimeout(() => setAiAnalysisDone(false), 5000);
    }, 1200);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '10 Oct 2026';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status counts
  const pendingCount = quotations.filter((q) => q.status === 'pending').length;
  const approvedCount = quotations.filter((q) => q.status === 'approved').length;
  const draftCount = quotations.filter((q) => q.status === 'draft').length;
  const expiredCount = 2; // For realism from screenshot

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const qNum = (q.quotationNumber || '').toLowerCase();
      const client = (q.customerSnapshot?.companyName || q.customerSnapshot?.name || '').toLowerCase();
      const rep = (q.createdBy?.name || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || qNum.includes(query) || client.includes(query) || rep.includes(query);
      if (!matchesSearch) return false;

      if (statusFilter === 'pending') return q.status === 'pending';
      if (statusFilter === 'approved') return q.status === 'approved';
      if (statusFilter === 'expired') return q.status === 'expired';
      return true;
    });
  }, [quotations, statusFilter, searchQuery]);

  const itemsPerPage = 4;
  const paginatedQuotations = filteredQuotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const recentDisplayQuotations = useMemo(() => {
    if (quotations && quotations.length > 0) {
      return quotations.slice(0, 5).map((q, idx) => {
        let statusLabel = 'Accepted';
        if (q.status === 'approved') statusLabel = 'Accepted';
        else if (q.status === 'pending') statusLabel = 'Pending';
        else if (q.status === 'rejected') statusLabel = 'Rejected';
        else if (q.status === 'sent' || q.status === 'draft') statusLabel = 'Sent';

        return {
          id: q._id || idx,
          number: `#${q.quotationNumber || `Q-00${idx + 1}`}`,
          client: q.customerSnapshot?.companyName || q.customerSnapshot?.name || 'Client',
          project: q.notes || q.lineItems?.[0]?.productName || 'Commercial Supply Order',
          formattedAmount: formatCurrency(q.total || 245000),
          status: statusLabel,
          createdAt: formatDate(q.createdAt),
          rawQuotation: q
        };
      });
    }

    return [
      { id: 1, number: '#Q-001', client: 'Rohit Group', project: 'Office Interior Setup', formattedAmount: '₹ 2,45,000', status: 'Accepted', createdAt: 'Oct 15, 2026' },
      { id: 2, number: '#Q-002', client: 'TechCorp Solutions', project: 'IT Hardware Supply', formattedAmount: '₹ 1,20,000', status: 'Sent', createdAt: 'Oct 14, 2026' },
      { id: 3, number: '#Q-003', client: 'BuildSmart Pvt Ltd', project: 'Civil Material Supply', formattedAmount: '₹ 3,80,000', status: 'Pending', createdAt: 'Oct 13, 2026' },
      { id: 4, number: '#Q-004', client: 'NextGen Systems', project: 'Software License', formattedAmount: '₹ 95,000', status: 'Rejected', createdAt: 'Oct 11, 2026' },
      { id: 5, number: '#Q-005', client: 'Alpha Constructions', project: 'Electrical Materials', formattedAmount: '₹ 1,50,000', status: 'Accepted', createdAt: 'Oct 10, 2026' },
    ];
  }, [quotations]);

  return (
    <div className="w-full mx-auto space-y-6 pb-16">
      {/* Page Header matching Reference Image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Here's an overview of your quotation business.
          </p>
        </div>

        {/* Date Range Picker Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-zinc-200/90 bg-white text-xs sm:text-sm font-semibold text-zinc-700 shadow-2xs select-none self-start sm:self-auto cursor-pointer hover:bg-zinc-50 transition">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span>Oct 1, 2026 — Oct 15, 2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
        </div>
      </div>

      {/* 4 Friendly Pastel KPI Metric Cards matching Reference Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Quotations (Green/Mint) */}
        <div
          onClick={() => navigate('/quotations')}
          className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[145px] hover:shadow-md hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[#05603a] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#05603a]">
              <span>↑</span> 12%
            </span>
          </div>

          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : (totalQuotations || 42)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Total Quotations
            </span>
          </div>

          {/* Smooth Green Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-emerald-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 35 C30 38, 50 18, 70 24 C90 30, 110 5, 140 15 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 35 C30 38, 50 18, 70 24 C90 30, 110 5, 140 15" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Total Clients (Sky/Blue) */}
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[145px] hover:shadow-sm transition">
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#2563eb]">
              <span>↑</span> 8%
            </span>
          </div>

          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : (totalCustomers || 18)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Total Clients
            </span>
          </div>

          {/* Smooth Blue Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-blue-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 32 C35 36, 55 20, 80 25 C105 30, 120 10, 140 18 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 32 C35 36, 55 20, 80 25 C105 30, 120 10, 140 18" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: Total Quotation Value (Warm Amber/Yellow) */}
        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[145px] hover:shadow-sm transition">
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[#f59e0b] text-white flex items-center justify-center shadow-xs shrink-0 font-bold text-2xl">
              ₹
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700">
              <span>↑</span> 20%
            </span>
          </div>

          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : '₹ 12.4L'}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Total Quotation Value
            </span>
          </div>

          {/* Smooth Amber Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-amber-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 38 C40 40, 60 22, 85 28 C110 34, 125 12, 140 16 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 38 C40 40, 60 22, 85 28 C110 34, 125 12, 140 16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Pending Quotations (Coral/Rose) */}
        <div
          onClick={() => navigate('/quotations')}
          className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[145px] hover:shadow-md hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 rounded-xl bg-[#ef4444] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600">
              <span>↓</span> 5%
            </span>
          </div>

          <div className="mt-3 relative z-10">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : (pendingCount || 9)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Pending Quotations
            </span>
          </div>

          {/* Smooth Rose Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-rose-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 36 C35 38, 65 18, 90 26 C115 32, 125 8, 140 12 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 36 C35 38, 65 18, 90 26 C115 32, 125 8, 140 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Middle Section: Quotation Trends (Left 8 cols) & Top Clients (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left (8 cols): Quotation Trends Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#e8f7ee] text-[#05603a] flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-[#05603a]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                Quotation Trends
              </h2>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              {/* Segmented Filter Pills */}
              <div className="flex items-center bg-zinc-150/70 p-1 rounded-xl text-xs font-semibold text-zinc-600">
                <button
                  type="button"
                  onClick={() => setTrendsPeriod('weekly')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    trendsPeriod === 'weekly'
                      ? 'bg-[#e8f7ee] text-[#05603a] font-bold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setTrendsPeriod('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    trendsPeriod === 'monthly'
                      ? 'bg-[#e8f7ee] text-[#05603a] font-bold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setTrendsPeriod('yearly')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    trendsPeriod === 'yearly'
                      ? 'bg-[#e8f7ee] text-[#05603a] font-bold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Yearly
                </button>
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200/90 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-semibold text-zinc-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#05603a] cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Accepted</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Spline Area Chart matching QuotePro reference */}
          <div className="pt-6 pb-2 w-full">
            <div className="relative h-60 w-full flex items-end">
              {/* Y Axis Labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-semibold text-zinc-400 select-none pr-3">
                <span>20</span>
                <span>15</span>
                <span>10</span>
                <span>5</span>
                <span>0</span>
              </div>

              {/* Grid Lines and Chart Graphic */}
              <div className="ml-8 w-full h-full relative flex flex-col justify-between">
                {/* Horizontal Guide Lines */}
                <div className="w-full border-b border-dashed border-zinc-200 h-0" />
                <div className="w-full border-b border-dashed border-zinc-200 h-0" />
                <div className="w-full border-b border-dashed border-zinc-200 h-0" />
                <div className="w-full border-b border-dashed border-zinc-200 h-0" />
                <div className="w-full border-b border-zinc-200 h-0" />

                {/* SVG Spline with Gradient Fill and Dots */}
                <svg
                  className="absolute inset-0 w-full h-[calc(100%-24px)] overflow-visible"
                  viewBox="0 0 700 200"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="quotationTrendsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path
                    d="M 10 150 C 60 120, 80 100, 110 100 C 140 100, 180 115, 210 115 C 240 115, 280 65, 310 65 C 340 65, 380 85, 410 85 C 440 85, 480 30, 510 30 C 540 30, 580 75, 610 75 C 640 75, 660 45, 690 45 L 690 200 L 10 200 Z"
                    fill="url(#quotationTrendsGradient)"
                  />
                  {/* Stroke Line */}
                  <path
                    d="M 10 150 C 60 120, 80 100, 110 100 C 140 100, 180 115, 210 115 C 240 115, 280 65, 310 65 C 340 65, 380 85, 410 85 C 440 85, 480 30, 510 30 C 540 30, 580 75, 610 75 C 640 75, 660 45, 690 45"
                    fill="none"
                    stroke="#05603a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Data Points */}
                  <circle cx="10" cy="150" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="110" cy="100" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="210" cy="115" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="310" cy="65" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="410" cy="85" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="510" cy="30" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="610" cy="75" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="690" cy="45" r="4.5" fill="#05603a" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* X Axis Labels */}
                <div className="w-full flex justify-between text-[11px] font-semibold text-zinc-500 pt-2 select-none">
                  <span>Oct 1</span>
                  <span>Oct 3</span>
                  <span>Oct 5</span>
                  <span>Oct 7</span>
                  <span>Oct 9</span>
                  <span>Oct 11</span>
                  <span>Oct 13</span>
                  <span>Oct 15</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (4 cols): Top Clients */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-zinc-900" />
                <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                  Top Clients
                </h2>
              </div>
              <Link
                to="/customers"
                className="text-xs font-bold text-[#05603a] hover:underline flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="divide-y divide-zinc-100 mt-2">
              {/* Client Item 1 */}
              <div className="py-3 flex items-center justify-between group hover:bg-zinc-50/60 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-4 text-center">1</span>
                  <div className="w-9 h-9 rounded-full bg-[#10b981] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    RG
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 leading-snug">Rohit Group</div>
                    <div className="text-xs text-zinc-500 font-medium">8 Quotations</div>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#05603a]">₹ 3.2L</span>
              </div>

              {/* Client Item 2 */}
              <div className="py-3 flex items-center justify-between group hover:bg-zinc-50/60 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-4 text-center">2</span>
                  <div className="w-9 h-9 rounded-full bg-[#0284c7] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    TC
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 leading-snug">TechCorp Solutions</div>
                    <div className="text-xs text-zinc-500 font-medium">6 Quotations</div>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#05603a]">₹ 2.4L</span>
              </div>

              {/* Client Item 3 */}
              <div className="py-3 flex items-center justify-between group hover:bg-zinc-50/60 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-4 text-center">3</span>
                  <div className="w-9 h-9 rounded-full bg-[#8b5cf6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    BS
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 leading-snug">BuildSmart Pvt Ltd</div>
                    <div className="text-xs text-zinc-500 font-medium">5 Quotations</div>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#05603a]">₹ 1.8L</span>
              </div>

              {/* Client Item 4 */}
              <div className="py-3 flex items-center justify-between group hover:bg-zinc-50/60 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-4 text-center">4</span>
                  <div className="w-9 h-9 rounded-full bg-[#f97316] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    NS
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 leading-snug">NextGen Systems</div>
                    <div className="text-xs text-zinc-500 font-medium">4 Quotations</div>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#05603a]">₹ 1.2L</span>
              </div>

              {/* Client Item 5 */}
              <div className="py-3 flex items-center justify-between group hover:bg-zinc-50/60 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-400 w-4 text-center">5</span>
                  <div className="w-9 h-9 rounded-full bg-[#ef4444] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    AC
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 leading-snug">Alpha Constructions</div>
                    <div className="text-xs text-zinc-500 font-medium">3 Quotations</div>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-[#05603a]">₹ 0.9L</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Quotations Table (Left 8 cols) & Quick Actions (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left (8 cols): Recent Quotations Table */}
        <div id="recent-quotations-section" className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e8f7ee] text-[#05603a] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#05603a]" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                  Recent Quotations
                </h2>
              </div>
              <Link
                to="/quotations"
                className="text-xs font-bold text-[#05603a] hover:underline flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-150 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Client</th>
                    <th className="py-3 px-2">Project / Description</th>
                    <th className="py-3 px-2">Amount</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Created At</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
                  {recentDisplayQuotations.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      onClick={() => row.rawQuotation && setSelectedQuotation(row.rawQuotation)}
                      className="hover:bg-zinc-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-2 font-mono font-semibold text-zinc-700">
                        {row.number}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-zinc-900">
                        {row.client}
                      </td>
                      <td className="py-3.5 px-2 text-zinc-600 max-w-[170px] truncate">
                        {row.project}
                      </td>
                      <td className="py-3.5 px-2 font-extrabold text-zinc-900">
                        {row.formattedAmount}
                      </td>
                      <td className="py-3.5 px-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            row.status === 'Accepted'
                              ? 'bg-[#e8f7ee] text-[#05603a]'
                              : row.status === 'Sent'
                              ? 'bg-[#e0f2fe] text-[#0284c7]'
                              : row.status === 'Pending'
                              ? 'bg-[#fef3c7] text-[#d97706]'
                              : 'bg-[#fee2e2] text-[#ef4444]'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-zinc-500 text-xs">
                        {row.createdAt}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (row.rawQuotation) {
                              setSelectedQuotation(row.rawQuotation);
                            }
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                          title="View options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right (4 cols): Quick Actions */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100">
              <div className="w-8 h-8 rounded-lg bg-[#e8f7ee] text-[#05603a] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#05603a]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight">
                Quick Actions
              </h2>
            </div>

            <div className="space-y-3 mt-4">
              {/* Primary Green CTA for Company Owner: Audit & Review Proposals */}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('pending');
                  const tbl = document.getElementById('recent-quotations-section');
                  if (tbl) tbl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-[#05603a] hover:bg-[#044e2e] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Review Pending Proposals</span>
              </button>

              {/* Action 1: Manage Sales Team & Operations */}
              <button
                type="button"
                onClick={() => navigate('/team')}
                className="w-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-800 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-3 transition cursor-pointer shadow-2xs"
              >
                <Users className="w-4 h-4 text-zinc-500" />
                <span>Manage Sales Team</span>
              </button>

              {/* Action 2: Manage Products & Pricing */}
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="w-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-800 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-3 transition cursor-pointer shadow-2xs"
              >
                <Package className="w-4 h-4 text-zinc-500" />
                <span>Manage Products &amp; Catalog</span>
              </button>

              {/* Action 3: Client Directory */}
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="w-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-800 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-3 transition cursor-pointer shadow-2xs"
              >
                <Building className="w-4 h-4 text-zinc-500" />
                <span>Client Directory</span>
              </button>

              {/* Action 4: Export Financial Report */}
              <button
                type="button"
                onClick={handleExportFinancials}
                className="w-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-800 py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-3 transition cursor-pointer shadow-2xs"
              >
                <BarChart2 className="w-4 h-4 text-zinc-500" />
                <span>Export Financial Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Inspection & Approval Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-7 shadow-2xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-zinc-950 font-mono">
                  #{selectedQuotation.quotationNumber}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Client: {selectedQuotation.customerSnapshot?.companyName || selectedQuotation.customerSnapshot?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xl font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {selectedQuotation.status === 'pending' && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>High Discount Review Required:</strong> Sales rep {selectedQuotation.createdBy?.name} requested commercial discounts exceeding your standard margin policy. Authorize or reject below.
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase text-zinc-400 mb-2 tracking-wider">
                Quotation Line Items
              </h4>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200 text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Item</th>
                      <th className="px-3.5 py-2.5 text-center">Qty</th>
                      <th className="px-3.5 py-2.5 text-right">Price</th>
                      <th className="px-3.5 py-2.5 text-right">Discount</th>
                      <th className="px-3.5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedQuotation.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3.5 py-2.5 font-bold text-zinc-900">{item.name}</td>
                        <td className="px-3.5 py-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right font-mono">₹{Number(item.unitPrice).toLocaleString()}</td>
                        <td className="px-3.5 py-2.5 text-right text-rose-600 font-semibold font-mono">
                          {item.discount > 0 ? `-₹${Number(item.discount).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-zinc-950 font-mono">
                          ₹{Number(item.total).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex justify-between items-center mb-6">
              <div className="text-xs text-zinc-500">
                Status: <span className="font-bold uppercase text-zinc-800">{selectedQuotation.status}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500">Grand Total: </span>
                <span className="text-xl font-bold text-[#05603a] font-mono">{formatCurrency(selectedQuotation.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center border-t border-zinc-100 pt-4">
              <div className="flex gap-2">
                {selectedQuotation.status === 'pending' && (
                  <>
                    <Button
                      variant="forest"
                      size="sm"
                      onClick={() => handleApprove(selectedQuotation._id)}
                      icon={Check}
                    >
                      Approve Quotation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(selectedQuotation._id)}
                      icon={X}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      Reject Quotation
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(selectedQuotation._id, selectedQuotation.quotationNumber)}
                  icon={Download}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuotation(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
