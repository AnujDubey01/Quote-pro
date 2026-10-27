import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Briefcase,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Download,
  Eye,
  Package,
  Users,
  Building,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  Mail
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [myQuotes, setMyQuotes] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [emailToast, setEmailToast] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [qRes, pRes, cRes] = await Promise.all([
        axios.get('/api/v1/quotations?myQuotes=true&limit=50'),
        axios.get('/api/v1/products?limit=1'),
        axios.get('/api/v1/customers?limit=1')
      ]);

      if (qRes.data.success) {
        setMyQuotes(qRes.data.data || []);
      }

      if (pRes.data.success) {
        setTotalProducts(pRes.data.pagination?.total || 0);
      }

      if (cRes.data.success) {
        setTotalCustomers(cRes.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
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
    } catch (err) {
      alert('Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmailQuotation = async (quotation) => {
    if (!quotation) return;
    const defaultRecipient = quotation.customerSnapshot?.email || 'delivered@resend.dev';
    const recipient = window.prompt(
      `Send Quotation #${quotation.quotationNumber} with attached PDF to:\n(In Resend free tier, enter your registered email address or delivered@resend.dev to test delivery)`,
      defaultRecipient
    );
    if (!recipient || !recipient.trim()) return;

    try {
      setSendingEmailId(quotation._id);
      const res = await axios.post(`/api/v1/quotations/${quotation._id}/email`, {
        recipientEmail: recipient.trim()
      });
      if (res.data.success) {
        setEmailToast(`✓ Quotation #${quotation.quotationNumber} emailed to ${recipient.trim()}`);
        setTimeout(() => setEmailToast(''), 4500);
        fetchSalesData();
      }
    } catch (err) {
      console.error('Email error:', err);
      alert(err.response?.data?.message || 'Failed to email quotation to client');
    } finally {
      setSendingEmailId(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const approvedCount = myQuotes.filter(q => q.status === 'approved').length;
  const pendingCount = myQuotes.filter(q => q.status === 'pending').length;
  const totalValue = myQuotes.reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
            Sales Representative Desk
          </span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-500 font-medium">Enterprise Proposals</span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200/50 px-2.5 py-0.5 rounded-md">
          <Zap className="w-3.5 h-3.5 text-[#05603a]" />
          <span>CPQ Engine Connected</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Welcome back, {user?.name || 'Sales Representative'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Generate client proposals with automated SKU lookup, manage your active customer pipeline, track manager discount approvals, and export verified PDF quotes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={Package}
            onClick={() => navigate('/products')}
            className="text-xs font-bold"
          >
            Browse Catalog
          </Button>
          <Button
            variant="forest"
            size="md"
            icon={Plus}
            onClick={() => navigate('/quotations/new')}
            className="shadow-sm font-bold text-xs"
          >
            Create New Quotation
          </Button>
        </div>
      </div>

      {/* 4 Friendly Pastel KPI Metric Cards matching QuotePro Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Quotations (Mint) */}
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#05603a] text-white flex items-center justify-center shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#05603a] flex items-center gap-0.5">
              ↑ 12%
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : myQuotes.length}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Total Quotations
            </span>
          </div>

          {/* Smooth Mint Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-emerald-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14" stroke="#05603a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Approved Deals (Sky Blue) */}
        <div className="bg-[#eef6ff] border border-[#b9dbfe] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0070f3] text-white flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#0070f3] flex items-center gap-0.5">
              ↑ 8%
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : approvedCount}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Approved Deals
            </span>
          </div>

          {/* Smooth Blue Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-sky-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 35 C35 38, 70 20, 100 24 C120 28, 130 12, 140 16 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 35 C35 38, 70 20, 100 24 C120 28, 130 12, 140 16" stroke="#0070f3" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: Total Pipeline Value (Warm Amber) */}
        <div className="bg-[#fff7ec] border border-[#fde0b2] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#f57c00] text-white flex items-center justify-center shadow-2xs font-extrabold text-lg">
              ₹
            </div>
            <span className="text-xs font-bold text-[#f57c00] flex items-center gap-0.5">
              ↑ 20%
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
              {loading ? '...' : formatCurrency(totalValue)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Quoted Pipeline
            </span>
          </div>

          {/* Smooth Amber Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-amber-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18" stroke="#f57c00" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Pending Approvals (Coral/Rose) */}
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#e11d48] text-white flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#e11d48] flex items-center gap-0.5">
              ↓ 5%
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : pendingCount}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Pending Approval
            </span>
          </div>

          {/* Smooth Rose Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-rose-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 36 C35 38, 65 18, 90 26 C115 32, 125 8, 140 12 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 36 C35 38, 65 18, 90 26 C115 32, 125 8, 140 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Quick Launchers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/quotations/new"
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-[#05603a] hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-sm group-hover:text-[#05603a] transition">
                Create Quotation
              </h3>
              <p className="text-xs text-zinc-500">Instant SKU auto-fill & verified PDF</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#05603a] transition" />
        </Link>

        <Link
          to="/customers"
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-[#05603a] hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center font-bold">
              🏢
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-sm group-hover:text-[#05603a] transition">
                Client Directory
              </h3>
              <p className="text-xs text-zinc-500">{totalCustomers} active enterprise accounts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#05603a] transition" />
        </Link>

        <Link
          to="/products"
          className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-[#05603a] hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center font-bold">
              📦
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-sm group-hover:text-[#05603a] transition">
                Browse Catalog
              </h3>
              <p className="text-xs text-zinc-500">{totalProducts} specifier items with photos</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#05603a] transition" />
        </Link>
      </div>

      {/* My Quotations Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">
                My Commercial Proposals
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                {myQuotes.length} total
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live status of customer proposals created by your sales account
            </p>
          </div>
          <Button
            variant="forest"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/quotations/new')}
            className="text-xs font-bold"
          >
            New Quote
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">Loading your quotations...</div>
        ) : myQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#05603a] flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-sm">No quotations generated yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Start by creating your first client proposal with instant SKU catalog lookup.
            </p>
            <Button
              variant="forest"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/quotations/new')}
              className="mt-4 font-bold text-xs"
            >
              Create Quotation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50/75 text-[11px] font-bold uppercase text-zinc-500 tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-center">Items</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Total Amount</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {myQuotes.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-zinc-50/60 cursor-pointer transition-colors"
                    onClick={() => setSelectedQuotation(q)}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-zinc-950 text-xs">
                      {q.quotationNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900 text-xs">
                      {q.customerSnapshot?.companyName || q.customerSnapshot?.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{formatDate(q.createdAt)}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs text-zinc-700">
                      {q.items?.length || 0}
                    </td>
                    <td className="px-6 py-4">
                      {q.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Approved
                        </span>
                      )}
                      {q.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Under Review
                        </span>
                      )}
                      {q.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Rejected
                        </span>
                      )}
                      {!['approved', 'pending', 'rejected'].includes(q.status) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          {q.status || 'Draft'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-950 font-mono text-sm">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedQuotation(q)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Inspect details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(q._id, q.quotationNumber)}
                          disabled={downloadingId === q._id}
                          className="bg-emerald-50 hover:bg-emerald-100 text-[#05603a] border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                          title="Download authorized PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quotation Detail Modal */}
      <Modal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        title={`Quotation #${selectedQuotation?.quotationNumber || ''}`}
        description={`Client: ${selectedQuotation?.customerSnapshot?.companyName || selectedQuotation?.customerSnapshot?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedQuotation && (
          <div className="space-y-4">
            {selectedQuotation.status === 'pending' && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>This quotation contains discounts exceeding your baseline ceiling. A manager is currently reviewing it.</span>
              </div>
            )}

            <div className="border border-zinc-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Item</th>
                    <th className="px-3.5 py-2.5 text-center">Qty</th>
                    <th className="px-3.5 py-2.5 text-right">Price</th>
                    <th className="px-3.5 py-2.5 text-right">Disc</th>
                    <th className="px-3.5 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedQuotation.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="px-3.5 py-2.5 font-semibold text-zinc-900">{item.name}</td>
                      <td className="px-3.5 py-2.5 text-center font-mono">{item.quantity}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-2.5 text-right text-rose-600 font-semibold font-mono">
                        {item.discount > 0 ? `-₹${Number(item.discount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-zinc-950 font-mono">
                        ₹{Number(item.total || (item.unitPrice * item.quantity)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
              <div>
                <span className="text-xs text-zinc-500">Proposal Total: </span>
                <span className="text-lg font-bold font-mono text-[#05603a]">
                  {formatCurrency(selectedQuotation.total)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Mail}
                  loading={sendingEmailId === selectedQuotation._id}
                  disabled={selectedQuotation.status === 'pending'}
                  onClick={() => handleEmailQuotation(selectedQuotation)}
                  className="font-bold text-xs"
                  title={selectedQuotation.status === 'pending' ? 'Cannot email pending quotation' : 'Email quotation PDF to client'}
                >
                  Email to Client
                </Button>
                <Button
                  variant="forest"
                  size="sm"
                  icon={Download}
                  disabled={selectedQuotation.status === 'pending'}
                  onClick={() => handleDownloadPDF(selectedQuotation._id, selectedQuotation.quotationNumber)}
                  className="font-bold text-xs"
                >
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuotation(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Micro-Toast for Email Confirmation */}
      {emailToast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-xl shadow-xl border border-zinc-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{emailToast}</span>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
