import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Trash2,
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Eye,
  ShieldAlert,
  Loader2,
  RefreshCw,
  GitBranch,
  Lock,
  Mail
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';

const QuotationBuilder = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userRole = (user?.role || '').toLowerCase();
  const isRestricted = userRole.includes('owner') || userRole.includes('manager') || Boolean(user?.isSuperAdmin);
  const userRoleName = userRole.includes('owner') ? 'Company Owners' : userRole.includes('manager') ? 'Catalog Managers' : 'Super Admins';

  const [searchParams] = useSearchParams();
  const paramCustomerId = searchParams.get('customerId');
  const reviseFromId = searchParams.get('reviseFrom') || searchParams.get('cloneFrom');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [createdQuotation, setCreatedQuotation] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState('');
  const [revisionMeta, setRevisionMeta] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTargetQuote, setEmailTargetQuote] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailError, setEmailError] = useState('');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [quotationNumber, setQuotationNumber] = useState(`QT-${Date.now()}`);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days. Prices valid for 15 days from issuance.');
  const [skuSearchQuery, setSkuSearchQuery] = useState('');

  // Selected customer snapshot for immediate preview
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c._id === customerId) || null;
  }, [customers, customerId]);

  // Items State (loaded from quotation_draft_items if user added items from Products page)
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('quotation_draft_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load draft items:', e);
    }
    return [
      {
        productId: '',
        name: '',
        sku: '',
        image: '',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 0,
        tax: 0,
        discount: 0
      }
    ];
  });

  // Fetch products, customers, and optionally source quotation for revision
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          axios.get('/api/v1/products?limit=1000'),
          axios.get('/api/v1/customers')
        ]);
        if (prodRes.data.success) {
          setAvailableProducts(prodRes.data.data);
        }
        if (custRes.data.success && custRes.data.data.length > 0) {
          const list = custRes.data.data;
          setCustomers(list);
          if (paramCustomerId && list.some(c => c._id === paramCustomerId)) {
            setCustomerId(paramCustomerId);
          } else {
            setCustomerId(list[0]._id);
          }
        }

        // If revision source provided, load quotation details
        if (reviseFromId) {
          try {
            const revRes = await axios.get(`/api/v1/quotations/${reviseFromId}`);
            if (revRes.data.success) {
              const src = revRes.data.data;
              const baseNum = src.quotationNumber.replace(/-R\d+$/i, '');
              const nextRev = (src.revision || 0) + 1;
              const targetNumber = `${baseNum}-R${nextRev}`;

              setQuotationNumber(targetNumber);
              setRevisionMeta({
                originalQuotationId: src._id,
                revision: nextRev,
                originalNumber: src.quotationNumber
              });

              if (src.customerId) {
                const cId = typeof src.customerId === 'object' ? src.customerId._id : src.customerId;
                setCustomerId(cId);
              }

              if (src.items && src.items.length > 0) {
                setItems(src.items.map(it => ({
                  productId: it.productId || '',
                  name: it.name || '',
                  sku: it.sku || '',
                  image: it.image || '',
                  unit: it.unit || 'pcs',
                  quantity: it.quantity || 1,
                  unitPrice: it.unitPrice || 0,
                  tax: it.tax || 0,
                  discount: it.discount || 0
                })));
              }

              if (src.notes) setNotes(src.notes);
              if (src.terms) setTerms(src.terms);
            }
          } catch (err) {
            console.error('Failed to load source quotation for revision:', err);
            setError('Could not load source quotation for revision.');
          }
        }
      } catch (err) {
        console.error('Failed to load initial quotation builder data', err);
      }
    };
    fetchData();
  }, [paramCustomerId, reviseFromId]);

  const handleDownloadPDF = async (quotationId, quotationNumber) => {
    try {
      setDownloadingPdf(true);
      const res = await axios.get(`/api/v1/quotations/${quotationId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotation-${quotationNumber || 'export'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleEmailQuotation = (quotation) => {
    if (!quotation) return;
    const defaultRecipient = quotation.customerSnapshot?.email || selectedCustomer?.email || 'delivered@resend.dev';
    setEmailTargetQuote(quotation);
    setEmailRecipient(defaultRecipient);
    setEmailError('');
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    if (e) e.preventDefault();
    if (!emailTargetQuote) return;
    if (!emailRecipient || !emailRecipient.trim()) {
      setEmailError('Please enter a valid recipient email address.');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailError('');
      const res = await axios.post(`/api/v1/quotations/${emailTargetQuote._id}/email`, {
        recipientEmail: emailRecipient.trim()
      });
      if (res.data.success) {
        setEmailModalOpen(false);
        setEmailToast(`✓ Quotation #${emailTargetQuote.quotationNumber} emailed to ${emailRecipient.trim()}`);
        setTimeout(() => setEmailToast(''), 4500);
      }
    } catch (err) {
      console.error('Email error:', err);
      setEmailError(err.response?.data?.message || 'Failed to email quotation to client');
    } finally {
      setSendingEmail(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('quotation_draft_items');
    window.dispatchEvent(new Event('quotation_draft_updated'));
    setItems([
      {
        productId: '',
        name: '',
        sku: '',
        image: '',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 0,
        tax: 0,
        discount: 0
      }
    ]);
  };

  // Two-way synchronization: Keep quotation_draft_items in sync with valid items
  useEffect(() => {
    // If reviseFromId is loading, wait for it to finish setting items
    if (reviseFromId && !revisionMeta) {
      return;
    }

    const validDraftItems = items
      .filter(item => {
        const hasIdentity = (item.sku && item.sku.trim()) || (item.name && item.name.trim()) || item.productId;
        const hasPositiveQty = Number(item.quantity) > 0;
        return hasIdentity && hasPositiveQty;
      })
      .map(item => ({
        productId: item.productId || '',
        name: item.name || '',
        sku: item.sku || '',
        image: item.image || '',
        unit: item.unit || 'pcs',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        tax: Number(item.tax) || 0,
        discount: Number(item.discount) || 0
      }));

    try {
      localStorage.setItem('quotation_draft_items', JSON.stringify(validDraftItems));
      window.dispatchEvent(new Event('quotation_draft_updated'));
    } catch (e) {
      console.error('Failed to sync quotation draft to localStorage:', e);
    }
  }, [items, revisionMeta, reviseFromId]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Autofill logic when SKU is typed or selected
    if (field === 'sku' && value) {
      const trimmed = value.trim().toLowerCase();
      const matchedProduct = availableProducts.find(
        p => p.sku && p.sku.toLowerCase().trim() === trimmed
      );
      if (matchedProduct) {
        newItems[index].productId = matchedProduct._id;
        newItems[index].name = matchedProduct.name;
        newItems[index].unitPrice = matchedProduct.price;
        newItems[index].tax = matchedProduct.tax || 0;
        newItems[index].unit = matchedProduct.unit || 'pcs';
        newItems[index].image = matchedProduct.image || '';
      }
    }

    // Autofill logic when Product Name is typed or selected
    if (field === 'name' && value) {
      const trimmed = value.trim().toLowerCase();
      const matchedProduct = availableProducts.find(
        p => p.name && p.name.toLowerCase().trim() === trimmed
      );
      if (matchedProduct) {
        newItems[index].productId = matchedProduct._id;
        newItems[index].sku = matchedProduct.sku;
        newItems[index].unitPrice = matchedProduct.price;
        newItems[index].tax = matchedProduct.tax || 0;
        newItems[index].unit = matchedProduct.unit || 'pcs';
        newItems[index].image = matchedProduct.image || '';
      }
    }

    setItems(newItems);
  };

  const handleQuickAddProduct = (product) => {
    if (!product) return;
    const pSku = (product.sku || '').trim().toLowerCase();
    const pId = String(product._id || product.id || '');

    const existingIndex = items.findIndex(item => {
      const iSku = (item.sku || '').trim().toLowerCase();
      const iId = String(item.productId || '');
      return (iSku && pSku && iSku === pSku) || (iId && pId && iId === pId);
    });

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: (Number(newItems[existingIndex].quantity) || 0) + 1
      };
      setItems(newItems);
    } else {
      const newRow = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        image: product.image || '',
        unit: product.unit || 'pcs',
        quantity: 1,
        unitPrice: product.price || 0,
        tax: product.tax || 0,
        discount: 0
      };

      // If the only row is blank, replace it
      if (items.length === 1 && !items[0].sku && !items[0].name && !items[0].productId) {
        setItems([newRow]);
      } else {
        setItems([...items, newRow]);
      }
    }
  };

  const selectProductForRow = (index, product) => {
    const newItems = [...items];
    newItems[index].productId = product._id;
    newItems[index].name = product.name;
    newItems[index].sku = product.sku;
    newItems[index].unitPrice = product.price;
    newItems[index].tax = product.tax || 0;
    newItems[index].unit = product.unit || 'pcs';
    newItems[index].image = product.image || '';
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        name: '',
        sku: '',
        image: '',
        unit: 'pcs',
        quantity: 1,
        unitPrice: 0,
        tax: 0,
        discount: 0
      }
    ]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      setItems([
        {
          productId: '',
          name: '',
          sku: '',
          image: '',
          unit: 'pcs',
          quantity: 1,
          unitPrice: 0,
          tax: 0,
          discount: 0
        }
      ]);
    } else {
      setItems(newItems);
    }
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let discount = 0;

    items.forEach(item => {
      subtotal += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
      tax += Number(item.tax) || 0;
      discount += Number(item.discount) || 0;
    });

    const total = subtotal - discount + tax;
    const effectiveDiscountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;

    return {
      subtotal,
      tax,
      discount,
      total,
      effectiveDiscountPercent
    };
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRestricted) {
      setError(`Quotation creation is restricted to Sales Representatives. ${userRoleName} have audit, review, and approval governance.`);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    if (!customerId) {
      setError('Please select or specify a valid Customer.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/v1/quotations', {
        customerId,
        quotationNumber,
        items,
        notes,
        terms,
        originalQuotationId: revisionMeta?.originalQuotationId || null,
        revision: revisionMeta?.revision || 0,
        revisionNotes: revisionMeta ? `Revision ${revisionMeta.revision} of ${revisionMeta.originalNumber}` : undefined
      });

      if (res.data.success) {
        setCreatedQuotation(res.data.data);
        setSuccess(`Quotation ${res.data.data.quotationNumber} created successfully!`);
        localStorage.removeItem('quotation_draft_items');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
              CPQ Engine & Quotation Builder
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
              {quotationNumber}
            </span>
            {revisionMeta && (
              <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                Rev {revisionMeta.revision}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Enterprise Quotation Builder
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Build branded commercial proposals with instant SKU lookup, live tax/discount calculations, and export to verified PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/products')}
            className="text-xs font-bold text-zinc-700 hover:text-zinc-950"
          >
            ← Browse Catalog
          </Button>
          {items.length > 1 && (
            <Button
              variant="ghost"
              size="md"
              onClick={clearDraft}
              className="text-xs font-semibold text-zinc-500 hover:text-rose-600 hover:bg-rose-50"
            >
              Clear Draft
            </Button>
          )}
        </div>
      </div>

      {/* Creation Locked Warning Banner for Owner / Manager */}
      {isRestricted && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3.5 text-amber-950 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-sm text-amber-950">Quotation Creation Locked for {userRoleName}</div>
            <p className="text-amber-800 mt-1 leading-relaxed">
              Proposal creation is designated for Sales Representatives. Company Owners and Catalog Managers possess audit, review, and approval governance over submitted quotes.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <Link
                to={userRole.includes('owner') ? '/owner' : '/manager'}
                className="inline-flex items-center gap-1 font-bold text-xs px-3 py-1.5 bg-amber-200/60 hover:bg-amber-200 text-amber-900 rounded-xl transition"
              >
                Go to {userRole.includes('owner') ? 'Owner' : 'Manager'} Review Console →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Revision Advisory Banner */}
      {revisionMeta && (
        <div className="bg-amber-500/10 border border-amber-300 text-amber-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              R{revisionMeta.revision}
            </div>
            <div>
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>Creating Revision for Proposal #{revisionMeta.originalNumber}</span>
                <span className="text-xs bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  Linked Revision
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Adjust quantities, pricing, or discounts. The new proposal will be numbered <code className="font-mono font-bold">{quotationNumber}</code> while preserving original proposal records.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRevisionMeta(null);
              setQuotationNumber(`QT-${Date.now()}`);
              navigate('/quotations/new');
            }}
            className="shrink-0 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer font-bold text-xs"
          >
            Cancel Revision Mode
          </Button>
        </div>
      )}

      {/* Outcome / Success Banner */}
      <AnimatePresence>
        {createdQuotation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {createdQuotation.status === 'pending' ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Quotation #{createdQuotation.quotationNumber} Awaiting Manager Approval</span>
                  </div>
                  <p className="text-xs text-amber-800 mt-1">
                    Applied discount exceeds your standard threshold. A manager will review and approve this proposal shortly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/')}
                  >
                    View in Dashboard
                  </Button>
                  <Button
                    variant="forest"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                      setCreatedQuotation(null);
                      setQuotationNumber(`QT-${Date.now()}`);
                      clearDraft();
                    }}
                  >
                    New Quotation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#ebfaf3] border border-[#bbf7d0] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#05603a] font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-[#05603a]" />
                    <span>Quotation #{createdQuotation.quotationNumber} Ready!</span>
                  </div>
                  <p className="text-xs text-emerald-900 mt-1">
                    Client: <span className="font-semibold">{createdQuotation.customerSnapshot?.companyName || createdQuotation.customerSnapshot?.name}</span> • Total: <span className="font-bold font-mono">₹{Number(createdQuotation.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="md"
                    icon={Mail}
                    loading={sendingEmail}
                    onClick={() => handleEmailQuotation(createdQuotation)}
                    className="shadow-sm font-bold text-xs bg-white hover:bg-emerald-50 text-[#05603a] border-[#bbf7d0]"
                  >
                    Email to Client
                  </Button>
                  <Button
                    variant="forest"
                    size="md"
                    loading={downloadingPdf}
                    icon={Download}
                    onClick={() => handleDownloadPDF(createdQuotation._id, createdQuotation.quotationNumber)}
                    className="shadow-sm font-bold"
                  >
                    Download Official PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setCreatedQuotation(null);
                      setQuotationNumber(`QT-${Date.now()}`);
                      clearDraft();
                    }}
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Quote Header Configuration Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Quotation Header & Client Account
            </h2>
            <Link to="/customers" className="text-xs font-semibold text-[#05603a] hover:underline">
              + Manage Clients
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Client / Company Profile <span className="text-rose-500">*</span>
              </label>
              {customers.length > 0 ? (
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] focus:ring-2 focus:ring-[#05603a]/10 outline-none transition"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName ? `${c.companyName} (${c.name})` : c.name} — {c.phone || c.email || 'Client'}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  required
                  placeholder="Paste Customer ID or create in Customers tab"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              )}

              {selectedCustomer && (
                <div className="mt-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-200/60 text-xs text-zinc-600 flex items-start gap-2">
                  <Building className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-zinc-900">
                      {selectedCustomer.companyName || selectedCustomer.name}
                    </div>
                    <div className="text-zinc-500 mt-0.5">
                      GSTIN: {selectedCustomer.gstNumber || 'Not specified'} • {selectedCustomer.phone || selectedCustomer.email || 'No contact'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Input
                label="Quotation Reference #"
                required
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                helperText="Unique reference code assigned to this proposal"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-950 tracking-tight">
                  Proposal Line Items
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Type an SKU/name to auto-fill or choose a product directly from the catalog. Changes sync live with the Product Catalog.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {availableProducts.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const prodId = e.target.value;
                      if (!prodId) return;
                      const product = availableProducts.find(p => p._id === prodId);
                      if (product) {
                        handleQuickAddProduct(product);
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="h-9 pl-3.5 pr-8 text-xs font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#05603a] cursor-pointer shadow-2xs"
                  >
                    <option value="" disabled>+ Quick Add from Catalog...</option>
                    {availableProducts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.sku} — {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={addItem}
                className="text-xs font-bold text-zinc-700 hover:text-zinc-950"
              >
                Add Blank Row
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50/75 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="px-5 py-3 w-16">Item</th>
                  <th className="px-4 py-3 min-w-[220px]">Product Description</th>
                  <th className="px-4 py-3 w-40">SKU Code</th>
                  <th className="px-4 py-3 w-32 text-center">Qty</th>
                  <th className="px-4 py-3 w-28">Price (₹)</th>
                  <th className="px-4 py-3 w-24">Tax (₹)</th>
                  <th className="px-4 py-3 w-24">Disc (₹)</th>
                  <th className="px-5 py-3 w-32 text-right">Row Total</th>
                  <th className="px-3 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((item, index) => {
                  const rowTotal = (Number(item.unitPrice) * Number(item.quantity)) - Number(item.discount) + Number(item.tax);
                  return (
                    <tr key={index} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="px-5 py-3">
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-mono">#{index + 1}</span>
                          )}
                        </div>
                      </td>

                      {/* Name Input with datalist */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          required
                          list="catalog-names"
                          placeholder="Product Title / Description"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full h-9 px-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] focus:ring-1 focus:ring-[#05603a] outline-none"
                        />
                      </td>

                      {/* SKU Input with datalist */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          required
                          list="catalog-skus"
                          placeholder="e.g. 20114IN-0"
                          value={item.sku}
                          onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                          className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] focus:ring-1 focus:ring-[#05603a] outline-none"
                        />
                      </td>

                      {/* Quantity with inline steppers */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(item.quantity) || 1;
                              if (cur > 1) handleItemChange(index, 'quantity', cur - 1);
                            }}
                            className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-bold transition select-none cursor-pointer"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleItemChange(index, 'quantity', isNaN(val) ? '' : val);
                            }}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val < 1) {
                                handleItemChange(index, 'quantity', 1);
                              }
                            }}
                            className="w-12 h-8 px-1 text-xs font-mono font-bold rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] outline-none text-center"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cur = Number(item.quantity) || 1;
                              handleItemChange(index, 'quantity', cur + 1);
                            }}
                            className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-bold transition select-none cursor-pointer"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="w-full h-9 px-2.5 text-xs font-mono font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] outline-none text-right"
                        />
                      </td>

                      {/* Tax */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', Number(e.target.value))}
                          className="w-full h-9 px-2 text-xs font-mono rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] outline-none text-right"
                        />
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                          className="w-full h-9 px-2 text-xs font-mono rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] outline-none text-right"
                        />
                      </td>

                      {/* Row Total */}
                      <td className="px-5 py-3 text-right font-mono font-bold text-zinc-950 text-xs">
                        ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Remove Button */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* HTML5 Datalists for native browser autocompletion */}
          <datalist id="catalog-skus">
            {availableProducts.map((p) => (
              <option key={p._id} value={p.sku}>
                {p.name} — ₹{p.price}
              </option>
            ))}
          </datalist>

          <datalist id="catalog-names">
            {availableProducts.map((p) => (
              <option key={p._id} value={p.name}>
                {p.sku} — ₹{p.price}
              </option>
            ))}
          </datalist>
        </div>

        {/* Notes, Terms & Summary Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes and Terms */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Proposal Notes & Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add special instructions, warranty details, or freight notes..."
                className="w-full p-3.5 text-xs rounded-xl border border-zinc-200 focus:border-[#05603a] focus:ring-1 focus:ring-[#05603a] outline-none transition"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Commercial Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full p-3.5 text-xs rounded-xl border border-zinc-200 focus:border-[#05603a] focus:ring-1 focus:ring-[#05603a] outline-none transition"
                rows="3"
              />
            </div>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 pb-2 border-b border-zinc-100">
              Financial Summary & GST Breakdown
            </h3>

            <div className="space-y-3.5 text-sm divide-y divide-zinc-100">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-mono font-bold text-zinc-900">
                  ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-600 pt-3">
                <span className="flex items-center gap-1.5">
                  <span>Total Discount</span>
                  {totals.effectiveDiscountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {totals.effectiveDiscountPercent.toFixed(1)}% off
                    </span>
                  )}
                </span>
                <span className="font-mono font-bold text-rose-600">
                  -₹{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-zinc-600 pt-3">
                <span>Total Tax / GST (18%)</span>
                <span className="font-mono font-bold text-zinc-900">
                  +₹{totals.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-zinc-950">
                <span className="font-bold text-zinc-950 text-base">Grand Total</span>
                <span className="text-2xl font-bold font-mono text-[#05603a]">
                  ₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Threshold Advisory */}
            {totals.effectiveDiscountPercent > 10 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice: Total discount ({totals.effectiveDiscountPercent.toFixed(1)}%) exceeds standard tier and requires managerial approval before dispatch.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs text-zinc-500">
                Line Items: <span className="font-bold text-zinc-900">{items.length}</span>
              </div>
              <div className="h-4 w-px bg-zinc-200" />
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  NET PROPOSAL TOTAL
                </span>
                <div className="text-lg font-bold text-zinc-950 font-mono">
                  ₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/products')}
                className="font-bold text-xs"
              >
                Back to Catalog
              </Button>
              <Button
                type="submit"
                variant="forest"
                size="md"
                loading={loading}
                disabled={isRestricted}
                className="shadow-sm font-bold min-w-[170px] disabled:opacity-50 disabled:cursor-not-allowed"
                title={isRestricted ? 'Quotation creation is restricted to Sales Representatives' : 'Create Quotation'}
              >
                {isRestricted ? '🔒 Creation Restricted' : loading ? 'Creating Proposal...' : 'Create Quotation'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Email Quotation Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => !sendingEmail && setEmailModalOpen(false)}
        title={`Email Quotation #${emailTargetQuote?.quotationNumber || ''}`}
        description="Deliver this official proposal and attached PDF directly to your client's inbox."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={sendingEmail}
              onClick={() => setEmailModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="forest"
              size="sm"
              icon={Mail}
              loading={sendingEmail}
              onClick={handleSendEmail}
            >
              Send Quotation
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          {emailError && <Alert variant="error">{emailError}</Alert>}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Client / Account
            </label>
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-zinc-900">
                {emailTargetQuote?.customerSnapshot?.companyName || emailTargetQuote?.customerSnapshot?.name || 'Valued Client'}
              </div>
              <div className="text-zinc-500 font-mono">
                Proposal Total: ₹{Number(emailTargetQuote?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Recipient Email Address *
            </label>
            <Input
              type="email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              placeholder="e.g. client@company.com or delivered@resend.dev"
              required
              disabled={sendingEmail}
            />
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Official PDF proposal with verified company details will be compiled and attached automatically.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 space-y-1">
            <span className="font-semibold block text-emerald-950">Resend Live Delivery</span>
            <span>
              In sandbox test mode, send to your verified Resend account email or <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200 text-emerald-900">delivered@resend.dev</code>.
            </span>
          </div>
        </form>
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

export default QuotationBuilder;
