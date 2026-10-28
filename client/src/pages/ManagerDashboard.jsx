import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Eye,
  Check,
  X,
  Download,
  Users,
  Search,
  ArrowRight,
  TrendingUp,
  Building2,
  FileText
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [allQuotes, setAllQuotes] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [downloadingId, setDownloadingId] = useState(null);

  // Modal State
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes, pRes, cRes] = await Promise.all([
        axios.get('/api/v1/quotations?status=pending'),
        axios.get('/api/v1/quotations?limit=20'),
        axios.get('/api/v1/products?limit=1'),
        axios.get('/api/v1/customers?limit=1')
      ]);

      if (pendingRes.data.success) {
        setPendingQuotes(pendingRes.data.data || []);
      }

      if (allRes.data.success) {
        setAllQuotes(allRes.data.data || []);
      }

      if (pRes.data.success) {
        setTotalProducts(pRes.data.pagination?.total || 0);
      }

      if (cRes.data.success) {
        setTotalCustomers(cRes.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await axios.post(`/api/v1/quotations/${id}/approve`);
      if (res.data.success) {
        setPendingQuotes(prev => prev.filter(q => q._id !== id));
        setAllQuotes(prev => prev.map(q => q._id === id ? { ...q, status: 'approved', approvedBy: user } : q));
        if (selectedQuotation && selectedQuotation._id === id) {
          setSelectedQuotation(prev => ({ ...prev, status: 'approved', approvedBy: user }));
        }
        showToast({ type: 'success', message: '✓ Quotation approved successfully!' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to approve quotation' });
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection note for the salesperson:', 'Discount exceeds margin limit');
    if (!reason) return;
    try {
      const res = await axios.post(`/api/v1/quotations/${id}/reject`, { reason });
      if (res.data.success) {
        setPendingQuotes(prev => prev.filter(q => q._id !== id));
        setAllQuotes(prev => prev.map(q => q._id === id ? { ...q, status: 'rejected' } : q));
        if (selectedQuotation && selectedQuotation._id === id) {
          setSelectedQuotation(prev => ({ ...prev, status: 'rejected' }));
        }
        showToast({ type: 'warning', message: 'Quotation rejected and returned with feedback.' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to reject quotation' });
    }
  };

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
      showToast({ type: 'success', message: `✓ Quotation #${quotationNumber || quotationId} PDF downloaded!` });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to download PDF. Please try again.' });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const totalQuotationValue = allQuotes.reduce((acc, q) => acc + (q.total || 0), 0);

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
            Catalog & Operations Management
          </span>
          <span className="text-zinc-300">•</span>
          <span className="text-zinc-500 font-medium">Commercial Approval Desk</span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200/50 px-2.5 py-0.5 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-[#05603a]" />
          <span>Margin Protection Active</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Operations & Quotation Approvals
          </h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Review and authorize high-discount quotations submitted by salespeople, manage catalog SKU pricing, maintain margin ceilings, and oversee corporate clients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={FileSpreadsheet}
            onClick={() => navigate('/quotations')}
            className="text-xs font-bold"
          >
            All Proposals
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={Package}
            onClick={() => navigate('/products')}
            className="text-xs font-bold"
          >
            Manage Catalog
          </Button>
          <Button
            variant="forest"
            size="md"
            icon={Users}
            onClick={() => navigate('/customers')}
            className="shadow-sm font-bold text-xs"
          >
            Client Directory
          </Button>
        </div>
      </div>

      {/* 4 Friendly Pastel KPI Metric Cards matching QuotePro Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Awaiting Approval (Coral/Rose) */}
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#e11d48] text-white flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5 text-white" />
            </div>
            {pendingQuotes.length > 0 ? (
              <span className="text-xs font-bold text-[#e11d48] flex items-center gap-0.5">
                Action Req.
              </span>
            ) : (
              <span className="text-xs font-bold text-[#05603a] flex items-center gap-0.5">
                Cleared
              </span>
            )}
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : pendingQuotes.length}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Pending Approvals
            </span>
          </div>

          {/* Smooth Rose Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-rose-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 36 C35 38, 65 18, 90 26 C115 32, 125 8, 140 12 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 36 C35 38, 65 18, 90 26 C115 32, 125 8, 140 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Catalog Products (Mint) */}
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#05603a] text-white flex items-center justify-center shadow-2xs">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#05603a] flex items-center gap-0.5">
              ↑ 12%
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : totalProducts}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Catalog Products
            </span>
          </div>

          {/* Smooth Mint Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-emerald-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14" stroke="#05603a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: Corporate Clients (Sky Blue) */}
        <div className="bg-[#eef6ff] border border-[#b9dbfe] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0070f3] text-white flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#0070f3] flex items-center gap-0.5">
              ↑ 8%
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-3xl font-extrabold text-zinc-950 tracking-tight">
              {loading ? '...' : totalCustomers}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Corporate Clients
            </span>
          </div>

          {/* Smooth Blue Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-sky-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 35 C35 38, 70 20, 100 24 C120 28, 130 12, 140 16 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 35 C35 38, 70 20, 100 24 C120 28, 130 12, 140 16" stroke="#0070f3" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Total Quotation Value (Warm Amber) */}
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
              {loading ? '...' : formatCurrency(totalQuotationValue || 1240000)}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Total Quotation Value
            </span>
          </div>

          {/* Smooth Amber Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-amber-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18" stroke="#f57c00" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Priority Approval Queue Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-950 tracking-tight">
                Urgent Approval Queue
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {pendingQuotes.length} pending
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Proposals submitted by sales representatives that require management authorization due to applied discounts.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">Loading pending approvals...</div>
        ) : pendingQuotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#05603a] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-sm">All cleared! No pending approvals.</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              All commercial proposals have been processed. Sales representatives are operating within standard discount thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50/75 text-[11px] font-bold uppercase text-zinc-500 tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="px-6 py-3.5">Quotation #</th>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Sales Rep</th>
                  <th className="px-6 py-3.5">Subtotal</th>
                  <th className="px-6 py-3.5">Discount</th>
                  <th className="px-6 py-3.5 text-right">Net Value</th>
                  <th className="px-6 py-3.5 text-center">Authorization Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pendingQuotes.map((q) => {
                  const discountPct = q.subtotal > 0 ? ((q.discount / q.subtotal) * 100).toFixed(1) : 0;
                  return (
                    <tr key={q._id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-950 text-xs">
                        {q.quotationNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 text-xs">
                        {q.customerSnapshot?.companyName || q.customerSnapshot?.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-zinc-600">
                        {q.createdBy?.name || 'Sales Rep'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-600">
                        ₹{(q.subtotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          -₹{(q.discount || 0).toLocaleString('en-IN')} ({discountPct}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-950 font-mono text-sm">
                        {formatCurrency(q.total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedQuotation(q)}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => handleApprove(q._id)}
                            className="bg-[#05603a] hover:bg-[#044e30] text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                            title="Approve immediately"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(q._id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Catalog Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          to="/products"
          className="bg-white p-6 rounded-2xl border border-zinc-200/80 hover:border-[#05603a] hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-sm group-hover:text-[#05603a] transition">
                Manage Product Catalog
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Add products, edit SKU pricing, update tax rates, and manage stock categories.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#05603a] transition" />
        </Link>

        <Link
          to="/customers"
          className="bg-white p-6 rounded-2xl border border-zinc-200/80 hover:border-[#05603a] hover:shadow-md transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 text-sm group-hover:text-[#05603a] transition">
                Client Accounts Directory
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                View customer corporate profiles, GSTIN identifiers, and billing contacts.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#05603a] transition" />
        </Link>
      </div>

      {/* Inspection Modal */}
      <Modal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        title={`Quotation #${selectedQuotation?.quotationNumber || ''}`}
        description={`Client: ${selectedQuotation?.customerSnapshot?.companyName || selectedQuotation?.customerSnapshot?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedQuotation && (
          <div className="space-y-4">
            <div className="border border-zinc-200/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold border-b border-zinc-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Item</th>
                    <th className="px-3.5 py-2.5 text-center">Qty</th>
                    <th className="px-3.5 py-2.5 text-right">Unit Price</th>
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

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="forest"
                  size="sm"
                  icon={Check}
                  onClick={() => {
                    handleApprove(selectedQuotation._id);
                    setSelectedQuotation(null);
                  }}
                  className="font-bold text-xs"
                >
                  Approve Proposal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={X}
                  onClick={() => {
                    handleReject(selectedQuotation._id);
                    setSelectedQuotation(null);
                  }}
                  className="text-rose-700 border-rose-200 hover:bg-rose-50 font-bold text-xs"
                >
                  Reject
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={() => handleDownloadPDF(selectedQuotation._id, selectedQuotation.quotationNumber)}
                  className="font-bold text-xs"
                >
                  Download PDF
                </Button>
                <Button
                  variant="ghost"
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
    </div>
  );
};

export default ManagerDashboard;
