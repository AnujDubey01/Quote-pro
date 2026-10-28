import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
  AlertCircle,
  X,
  FileDown,
  Send,
  Loader2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getRoleType } from '../utils/roleUtils';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';

export default function Quotations() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  const roleType = getRoleType(user);
  const isOwner = roleType === 'owner';
  const isManager = roleType === 'manager';
  const isSales = roleType === 'sales';

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'draft' | 'rejected'

  // Modal states
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [emailModalQuote, setEmailModalQuote] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      // For sales, fetch their own; for manager/owner, fetch all organization quotes
      const url = isSales 
        ? '/api/v1/quotations?myQuotes=true&limit=100' 
        : '/api/v1/quotations?limit=100';

      const res = await axios.get(url);
      if (res.data?.success) {
        setQuotations(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
      showToast({ type: 'error', message: 'Failed to load quotations data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [user]);

  // PDF Download handler with Toast feedback
  const handleDownloadPDF = async (quote) => {
    try {
      setDownloadingId(quote._id);
      showToast({ type: 'info', message: `Synthesizing PDF for Quote #${quote.quotationNumber}...` });

      const res = await axios.get(`/api/v1/quotations/${quote._id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotation-${quote.quotationNumber || quote._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast({ type: 'success', message: `✓ Quote #${quote.quotationNumber} PDF downloaded successfully!` });
    } catch (err) {
      console.error('PDF Download error:', err);
      showToast({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setDownloadingId(null);
    }
  };

  // Email dispatch handler with Toast feedback
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailModalQuote || !recipientEmail.trim()) return;

    try {
      setSendingEmail(true);
      const res = await axios.post(`/api/v1/quotations/${emailModalQuote._id}/email`, {
        recipientEmail: recipientEmail.trim()
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          message: `✓ Proposal #${emailModalQuote.quotationNumber} dispatched to ${recipientEmail.trim()}!`
        });
        setEmailModalQuote(null);
        setRecipientEmail('');
        fetchQuotations();
      }
    } catch (err) {
      console.error('Email error:', err);
      showToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to email quotation to client.'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Manager/Owner approval actions with Toast feedback
  const handleApprovalAction = async (quoteId, action) => {
    try {
      setProcessingId(quoteId);
      const res = await axios.patch(`/api/v1/quotations/${quoteId}/status`, {
        status: action === 'approve' ? 'approved' : 'rejected'
      });

      if (res.data?.success) {
        showToast({
          type: action === 'approve' ? 'success' : 'warning',
          message: action === 'approve' 
            ? '✓ Proposal approved and margin guardrail verified!' 
            : 'Proposal rejected and returned to sales representative.'
        });
        window.dispatchEvent(new Event('quotation_updated'));
        fetchQuotations();
      }
    } catch (err) {
      console.error('Approval action error:', err);
      showToast({
        type: 'error',
        message: err.response?.data?.message || `Failed to ${action} quotation.`
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered list
  const filteredQuotations = quotations.filter((q) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? q.status === 'pending'
        : statusFilter === 'approved'
        ? q.status === 'approved'
        : statusFilter === 'draft'
        ? q.status === 'draft'
        : q.status === 'rejected';

    const clientName = q.customerSnapshot?.name || q.clientName || '';
    const quoteNo = q.quotationNumber || '';
    const matchesSearch =
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quoteNo.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Won</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Draft</span>
          </span>
        );
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const counts = {
    all: quotations.length,
    pending: quotations.filter((q) => q.status === 'pending').length,
    approved: quotations.filter((q) => q.status === 'approved').length,
    draft: quotations.filter((q) => q.status === 'draft').length,
    rejected: quotations.filter((q) => q.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#05603a]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isSales ? 'Commercial Proposals' : 'Proposal Governance Console'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isSales ? 'My Proposals & Quotes' : 'Commercial Quotations Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isSales
              ? 'Manage active sales proposals, track manager approval status, download high-res PDFs, and dispatch to prospects.'
              : 'Audit submitted line items, inspect gross margin guardrails, and enforce discount approval policies.'}
          </p>
        </div>

        {isSales && (
          <Link
            to="/quotations/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05603a] hover:bg-[#044e30] shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quote</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto text-xs font-bold select-none">
          {[
            { id: 'all', label: 'All Proposals', count: counts.all },
            { id: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-amber-700 bg-amber-100' },
            { id: 'approved', label: 'Approved & Won', count: counts.approved, color: 'text-emerald-700 bg-emerald-100' },
            { id: 'draft', label: 'Drafts', count: counts.draft },
            { id: 'rejected', label: 'Rejected', count: counts.rejected }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === tab.id
                  ? tab.color || 'bg-slate-200 text-slate-800'
                  : 'bg-slate-200/70 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by quote # or client..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05603a] shadow-2xs"
          />
        </div>
      </div>

      {/* Main Quotations Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#05603a] animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading proposal records...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Proposals Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'No quotes matching your current search filters. Try clearing filters.'
                : 'You have not created any proposals yet.'}
            </p>
            {isSales && (
              <Link
                to="/quotations/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#05603a] hover:bg-[#044e30] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Quote</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Quote Number</th>
                  <th className="py-3.5 px-5">Client Organization</th>
                  <th className="py-3.5 px-5">Created Date</th>
                  <th className="py-3.5 px-5">Proposal Total</th>
                  <th className="py-3.5 px-5">Approval Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((quote) => {
                  const clientName = quote.customerSnapshot?.name || quote.clientName || 'General Enterprise';
                  const isPending = quote.status === 'pending';

                  return (
                    <tr
                      key={quote._id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Quote Number */}
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-[#05603a]" />
                          <span>#{quote.quotationNumber || quote._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{clientName}</span>
                        </div>
                        {quote.customerSnapshot?.gstin && (
                          <span className="text-[10px] text-slate-400 font-mono block pl-5.5">
                            GSTIN: {quote.customerSnapshot.gstin}
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-5 text-slate-500 font-mono">
                        {formatDate(quote.createdAt)}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {formatCurrency(quote.total)}
                        {quote.items?.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {quote.items.length} {quote.items.length === 1 ? 'line item' : 'line items'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        {getStatusBadge(quote.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manager/Owner 1-Click Approve/Reject for pending items */}
                          {(isManager || isOwner) && isPending && (
                            <>
                              <button
                                onClick={() => handleApprovalAction(quote._id, 'approve')}
                                disabled={processingId === quote._id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                                title="Approve quotation"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprovalAction(quote._id, 'reject')}
                                disabled={processingId === quote._id}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                                title="Reject quotation"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Preview Details Button */}
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Preview proposal details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download PDF Button */}
                          <button
                            onClick={() => handleDownloadPDF(quote)}
                            disabled={downloadingId === quote._id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#05603a] hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Download verified PDF"
                          >
                            {downloadingId === quote._id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#05603a]" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                          </button>

                          {/* Email Dispatch Button */}
                          <button
                            onClick={() => {
                              setEmailModalQuote(quote);
                              setRecipientEmail(quote.customerSnapshot?.email || 'delivered@resend.dev');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Email proposal to client"
                          >
                            <Mail className="w-4 h-4" />
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

      {/* Quote Preview Modal */}
      {selectedQuote && (
        <Modal
          isOpen={!!selectedQuote}
          onClose={() => setSelectedQuote(null)}
          title={`Quotation #${selectedQuote.quotationNumber || selectedQuote._id.slice(-6).toUpperCase()}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Header Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                <div className="mt-1">{getStatusBadge(selectedQuote.status)}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Client</span>
                <span className="font-bold text-slate-800 text-xs block mt-1">
                  {selectedQuote.customerSnapshot?.name || selectedQuote.clientName || 'General Enterprise'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Created On</span>
                <span className="font-mono text-slate-700 block mt-1">
                  {formatDate(selectedQuote.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Grand Total</span>
                <span className="font-mono font-bold text-[#05603a] text-sm block mt-1">
                  {formatCurrency(selectedQuote.total)}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Quotation Line Items</h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedQuote.items || []).map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.name || item.product?.name || `Custom Line Item #${i + 1}`}
                          {item.sku && <span className="text-[10px] text-slate-400 block font-mono">SKU: {item.sku}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                          {item.quantity || 1}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(item.unitPrice || item.price)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency((item.quantity || 1) * (item.unitPrice || item.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(selectedQuote.subtotal || selectedQuote.total)}</span>
                </div>
                {selectedQuote.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Applied:</span>
                    <span className="font-mono font-semibold">-{formatCurrency(selectedQuote.discountAmount)}</span>
                  </div>
                )}
                {selectedQuote.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span className="font-mono font-semibold">+{formatCurrency(selectedQuote.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Net Proposal Total:</span>
                  <span className="font-mono text-[#05603a]">{formatCurrency(selectedQuote.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedQuote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedQuote)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#05603a] text-white hover:bg-[#044e30] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Email Proposal Modal */}
      {emailModalQuote && (
        <Modal
          isOpen={!!emailModalQuote}
          onClose={() => setEmailModalQuote(null)}
          title={`Email Quote #${emailModalQuote.quotationNumber} with Attached PDF`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Dispatch a verified quotation PDF with cloud digital signature links directly to the client's inbox:
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Recipient Email Address
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 focus-within:border-[#05603a] bg-white">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@company.com or delivered@resend.dev"
                  required
                  className="w-full text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                In testing, use your registered Resend test email or delivered@resend.dev.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmailModalQuote(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#05603a] hover:bg-[#044e30] text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send PDF Proposal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
