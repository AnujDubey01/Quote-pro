import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Search,
  Upload,
  Plus,
  Minus,
  Check,
  FileSpreadsheet,
  X,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Copy,
  GripVertical,
  Sliders,
  Building,
  CreditCard,
  Percent,
  CheckCircle2,
  ShoppingBag,
  Eye,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import Alert from '../components/ui/Alert';

const ITEMS_PER_PAGE = 50;

const Products = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userRole = (user?.role || '').toLowerCase();
  const canManageProducts =
    userRole.includes('admin') ||
    userRole.includes('manager') ||
    userRole.includes('owner') ||
    user?.permissions?.includes('*') ||
    user?.permissions?.includes('product.create') ||
    user?.permissions?.includes('product.update');

  // Quotation creation and item staging are strictly designated for Sales Representatives.
  // Company Owner and Manager have Review & Approval authority and must NOT be able to stage items or create quotations.
  const isSales = userRole.includes('sales') && !userRole.includes('owner') && !userRole.includes('manager') && !user?.isSuperAdmin;
  const canCreateQuote = isSales;

  const formatTaxRate = (tax, price) => {
    if (tax === 0) return 0;
    if (!tax) return 18;
    const num = Number(tax);
    if (isNaN(num)) return 18;
    if (num <= 28) return num;
    if (price && Number(price) > 0) {
      const calculated = Math.round((num / Number(price)) * 100);
      if (calculated >= 0 && calculated <= 28) return calculated;
    }
    return 18;
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [copiedSku, setCopiedSku] = useState('');

  // Image lightbox modal
  const [previewImage, setPreviewImage] = useState(null);

  // Bulk import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);

  // Add / Edit product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [addError, setAddError] = useState('');
  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    tax: '18',
    unit: 'PCS',
    description: '',
    image: '',
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      sku: '',
      name: '',
      category: '',
      price: '',
      tax: '18',
      unit: 'PCS',
      description: '',
      image: '',
    });
    setAddError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku || '',
      name: product.name || '',
      category: product.category || '',
      price: product.price !== undefined ? String(product.price) : '',
      tax: String(formatTaxRate(product.tax, product.price)),
      unit: product.unit || 'PCS',
      description: product.description || '',
      image: product.image || '',
    });
    setAddError('');
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.sku?.trim() || !productForm.name?.trim() || !productForm.price) {
      setAddError('SKU code, Product Name, and Price are required.');
      return;
    }

    try {
      setIsSavingProduct(true);
      setAddError('');
      const payload = {
        sku: productForm.sku.trim().toUpperCase(),
        name: productForm.name.trim(),
        category: productForm.category.trim() || 'General',
        unit: productForm.unit.trim() || 'PCS',
        price: Number(productForm.price),
        tax: Number(productForm.tax || 18),
        description: productForm.description.trim(),
        image: productForm.image || null,
      };

      if (editingProduct) {
        const res = await axios.patch(`/api/v1/products/${editingProduct._id}`, payload);
        if (res.data.success) {
          const updated = res.data.data;
          setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
          setShowAddModal(false);
          setEditingProduct(null);
          setToastMessage(`✓ Product "${payload.sku}" updated successfully`);
          setTimeout(() => setToastMessage(''), 4000);
          setProductForm({
            sku: '',
            name: '',
            category: '',
            price: '',
            tax: '18',
            unit: 'PCS',
            description: '',
            image: '',
          });
        }
      } else {
        const res = await axios.post('/api/v1/products', payload);
        if (res.data.success) {
          setProducts((prev) => [res.data.data, ...prev]);
          setShowAddModal(false);
          setToastMessage(`✓ Product "${payload.sku}" registered successfully`);
          setTimeout(() => setToastMessage(''), 4000);
          setProductForm({
            sku: '',
            name: '',
            category: '',
            price: '',
            tax: '18',
            unit: 'PCS',
            description: '',
            image: '',
          });
        }
      }
    } catch (err) {
      setAddError(
        err.response?.data?.message ||
        err.message ||
        (editingProduct ? 'Failed to update product' : 'Failed to create product')
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleProductImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAddError('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setProductForm(prev => ({ ...prev, image: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Staged quotation draft items from localStorage
  const [draftItems, setDraftItems] = useState(() => {
    try {
      const saved = localStorage.getItem('quotation_draft_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState('');
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/products?limit=1000');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      setError('Failed to load product catalog. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (product) => {
    if (!product || !product.image) return;
    const confirmDelete = window.confirm(`Delete image for SKU "${product.sku}"? This will permanently delete the image file from AWS S3 and remove it from your product catalog.`);
    if (!confirmDelete) return;

    try {
      setIsDeletingImage(true);
      const res = await axios.delete(`/api/v1/products/${product._id}/image`);
      if (res.data.success) {
        setProducts(prev => prev.map(p => p._id === product._id ? { ...p, image: null } : p));
        setToastMessage(`✓ Image deleted from AWS S3 and catalog`);
        setTimeout(() => setToastMessage(''), 3500);
        setPreviewImage(null);
      }
    } catch (err) {
      console.error('Delete image error:', err);
      alert(err.response?.data?.message || 'Failed to delete image from S3');
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!product) return;
    const confirmDelete = window.confirm(`Permanently delete product "${product.name}" (${product.sku}) along with its AWS S3 image?`);
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(`/api/v1/products/${product._id}`);
      if (res.data.success) {
        setProducts(prev => prev.filter(p => p._id !== product._id));
        setToastMessage(`✓ Product and S3 image deleted`);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset to page 1 whenever search query, category filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, itemsPerPage]);

  // Synchronize draftItems from localStorage on mount and when storage/custom events fire
  useEffect(() => {
    const syncDraftFromStorage = () => {
      try {
        const saved = localStorage.getItem('quotation_draft_items');
        setDraftItems(saved ? JSON.parse(saved) : []);
      } catch {
        setDraftItems([]);
      }
    };

    syncDraftFromStorage();

    window.addEventListener('storage', syncDraftFromStorage);
    window.addEventListener('focus', syncDraftFromStorage);
    window.addEventListener('quotation_draft_updated', syncDraftFromStorage);

    return () => {
      window.removeEventListener('storage', syncDraftFromStorage);
      window.removeEventListener('focus', syncDraftFromStorage);
      window.removeEventListener('quotation_draft_updated', syncDraftFromStorage);
    };
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('updateExisting', updateExisting);

    try {
      setIsUploading(true);
      setUploadStatus(
        isPdf 
          ? '⏳ Parsing brochure & extracting images to AWS S3... (please wait 10-25s)' 
          : 'Uploading and analyzing spreadsheet...'
      );
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/v1/products/bulk-import', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        timeout: 180000 // 3 minutes timeout for PDF layout processing & S3 uploads
      });
      if (res.data.success) {
        setUploadStatus(`✓ ${res.data.message || 'Import completed successfully'}`);
        fetchProducts();
        setTimeout(() => setShowImportModal(false), 3500);
      }
    } catch (err) {
      console.error('Upload error details:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed';
      setUploadStatus('Error: ' + errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add product to quotation draft in localStorage (and move to top)
  const handleAddToQuotation = (product) => {
    const currentDraft = [...draftItems];
    const pSku = (product.sku || '').trim().toLowerCase();
    const pId = String(product._id || product.id || '');
    const pName = (product.name || '').trim().toLowerCase();

    const existingIndex = currentDraft.findIndex(item => {
      const iSku = (item.sku || '').trim().toLowerCase();
      const iId = String(item.productId || '');
      const iName = (item.name || '').trim().toLowerCase();
      return (
        (iSku && pSku && iSku === pSku) ||
        (iId && pId && iId === pId) ||
        (iName && pName && iName === pName)
      );
    });

    if (existingIndex >= 0) {
      currentDraft[existingIndex].quantity = (Number(currentDraft[existingIndex].quantity) || 0) + 1;
    } else {
      currentDraft.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        image: product.image || '',
        unit: product.unit || 'pcs',
        quantity: 1,
        unitPrice: product.price || 0,
        tax: product.tax || 0,
        discount: 0
      });
    }

    setDraftItems(currentDraft);
    localStorage.setItem('quotation_draft_items', JSON.stringify(currentDraft));
    window.dispatchEvent(new Event('quotation_draft_updated'));

    setToastMessage(`Added "${product.name.slice(0, 26)}..." to quote draft`);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  // Increment or decrement quantity directly from the row
  const handleUpdateQuantity = (product, delta) => {
    let currentDraft = [...draftItems];
    const pSku = (product.sku || '').trim().toLowerCase();
    const pId = String(product._id || product.id || '');
    const pName = (product.name || '').trim().toLowerCase();

    const existingIndex = currentDraft.findIndex(item => {
      const iSku = (item.sku || '').trim().toLowerCase();
      const iId = String(item.productId || '');
      const iName = (item.name || '').trim().toLowerCase();
      return (
        (iSku && pSku && iSku === pSku) ||
        (iId && pId && iId === pId) ||
        (iName && pName && iName === pName)
      );
    });

    if (existingIndex >= 0) {
      const newQty = (Number(currentDraft[existingIndex].quantity) || 0) + delta;
      if (newQty <= 0) {
        currentDraft.splice(existingIndex, 1);
        setToastMessage(`Removed "${product.name.slice(0, 24)}..." from quote draft`);
      } else {
        currentDraft[existingIndex].quantity = newQty;
      }
      setDraftItems(currentDraft);
      localStorage.setItem('quotation_draft_items', JSON.stringify(currentDraft));
      window.dispatchEvent(new Event('quotation_draft_updated'));
      setTimeout(() => setToastMessage(''), 2000);
    }
  };

  // Explicit remove from draft
  const handleRemoveFromQuotation = (product) => {
    const pSku = (product.sku || '').trim().toLowerCase();
    const pId = String(product._id || product.id || '');
    const pName = (product.name || '').trim().toLowerCase();

    const currentDraft = draftItems.filter(item => {
      const iSku = (item.sku || '').trim().toLowerCase();
      const iId = String(item.productId || '');
      const iName = (item.name || '').trim().toLowerCase();
      const isMatch = (
        (iSku && pSku && iSku === pSku) ||
        (iId && pId && iId === pId) ||
        (iName && pName && iName === pName)
      );
      return !isMatch;
    });

    setDraftItems(currentDraft);
    localStorage.setItem('quotation_draft_items', JSON.stringify(currentDraft));
    window.dispatchEvent(new Event('quotation_draft_updated'));
    setToastMessage(`Removed "${product.name.slice(0, 24)}..." from quote draft`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const getDraftQuantity = (product) => {
    if (!product || !draftItems || draftItems.length === 0) return 0;
    const pSku = (product.sku || '').trim().toLowerCase();
    const pId = String(product._id || product.id || '');
    const pName = (product.name || '').trim().toLowerCase();

    const item = draftItems.find(i => {
      const iSku = (i.sku || '').trim().toLowerCase();
      const iId = String(i.productId || '');
      const iName = (i.name || '').trim().toLowerCase();

      return (
        (iSku && pSku && iSku === pSku) ||
        (iId && pId && iId === pId) ||
        (iName && pName && iName === pName)
      );
    });

    return item ? Number(item.quantity) || 0 : 0;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    setTimeout(() => setCopiedSku(''), 2000);
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  // Requirement: Selected/added items move directly to the top!
  const sortedAndFilteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // 1. Filter products by search and category
    const filtered = products.filter(p => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      const nameMatch = p.name && p.name.toLowerCase().includes(query);
      const skuMatch = p.sku && p.sku.toLowerCase().includes(query);
      const catMatch = p.category && p.category.toLowerCase().includes(query);
      const descMatch = p.description && p.description.toLowerCase().includes(query);
      return nameMatch || skuMatch || catMatch || descMatch;
    });

    // 2. Sort: Items currently staged in draftItems appear at the VERY TOP (for Sales Reps only)
    return [...filtered].sort((a, b) => {
      if (canCreateQuote) {
        const aQty = getDraftQuantity(a);
        const bQty = getDraftQuantity(b);
        const aIsSelected = aQty > 0;
        const bIsSelected = bQty > 0;

        // Selected items take top priority for active sales quoting
        if (aIsSelected && !bIsSelected) return -1;
        if (!aIsSelected && bIsSelected) return 1;

        // If both are selected, order by addition order in draftItems
        if (aIsSelected && bIsSelected) {
          const findItemIndex = (prod) => {
            const pSku = (prod.sku || '').trim().toLowerCase();
            const pId = String(prod._id || prod.id || '');
            const pName = (prod.name || '').trim().toLowerCase();
            return draftItems.findIndex(i => {
              const iSku = (i.sku || '').trim().toLowerCase();
              const iId = String(i.productId || '');
              const iName = (i.name || '').trim().toLowerCase();
              return (
                (iSku && pSku && iSku === pSku) ||
                (iId && pId && iId === pId) ||
                (iName && pName && iName === pName)
              );
            });
          };
          const aIndex = findItemIndex(a);
          const bIndex = findItemIndex(b);
          return aIndex - bIndex;
        }
      }

      // Catalog order
      return 0;
    });
  }, [products, searchQuery, selectedCategory, draftItems]);

  const totalItems = sortedAndFilteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return sortedAndFilteredProducts.slice(start, start + itemsPerPage);
  }, [sortedAndFilteredProducts, validCurrentPage, itemsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(validCurrentPage * itemsPerPage, totalItems);

  // Staged summary calculations for bottom dock
  const stagedSubtotal = useMemo(() => {
    return draftItems.reduce((acc, item) => {
      return acc + (Number(item.unitPrice || 0) * Number(item.quantity || 1));
    }, 0);
  }, [draftItems]);

  const stagedTax = useMemo(() => {
    return stagedSubtotal * 0.18;
  }, [stagedSubtotal]);

  // Product metadata tag generator
  const getProductTags = (p, index) => {
    const tagList = [
      { text: 'Brass Body', color: 'bg-amber-50 text-amber-800 border-amber-200' },
      { text: 'Smart Suite', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      { text: 'Rough-In Core', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      { text: 'Polished Chrome', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
      { text: 'White Ceramic', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
      { text: 'SS 304', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    ];
    return tagList[index % tagList.length];
  };

  const getProductSpecs = (p, index) => {
    const specsList = [
      'Flow: 5.7 LPM • 10 Yr Warranty',
      'Dual 3/4.5L Flush • Smart Remote',
      '4 Independent Outlets • Temp Preset 38°C',
      'Ultra-thin faceplate with precision dial knurling and tactile detent stops',
      'Articulating hydrotherapy spray head with master-clean silicone nozzles',
      'Countertop vessel installation without faucet hole, ultra-thin ceramic rim',
      'Concealed water-trap floor drain with removable hair strainer and odor-block barrier',
      'Includes 1.2m anti-twist metal hose, ergonomic trigger, and wall mounting bracket'
    ];
    return specsList[index % specsList.length];
  };

  const getCategoryBadgeClass = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('faucet') || cat.includes('tap') || cat.includes('mixer')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/90';
    }
    if (cat.includes('shower') || cat.includes('bath') || cat.includes('washroom 1')) {
      return 'bg-sky-50 text-sky-800 border-sky-200/90';
    }
    if (cat.includes('washroom 2') || cat.includes('ceramic') || cat.includes('basin')) {
      return 'bg-amber-50 text-amber-800 border-amber-200/90';
    }
    if (cat.includes('washroom 3') || cat.includes('wellness') || cat.includes('therapy')) {
      return 'bg-purple-50 text-purple-800 border-purple-200/90';
    }
    return 'bg-teal-50 text-teal-800 border-teal-200/90';
  };

  return (
    <div className="w-full mx-auto space-y-6 pb-28">
      {/* Header Section matching Screenshot 3 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          {/* Breadcrumb / Category Meta */}
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            CATALOG MANAGEMENT &amp; CPQ PIPELINE • <span className="text-zinc-600">Tier-1 Specifier Access</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Product Catalog
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80 font-mono">
              {products.length || 50} SKUs
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Margins Active
            </span>
          </div>

          <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Browse verified luxury bathware &amp; architectural products, stage items into customer proposals (staged items auto-move to top), with quick SKU lookup.
          </p>
        </div>

        {/* Action Buttons matching Screenshot 3 */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {canManageProducts && (
            <>
              <Button
                variant="outline"
                icon={Upload}
                onClick={() => setShowImportModal(true)}
              >
                Bulk Import
              </Button>

              <Button
                variant="forest"
                icon={Plus}
                onClick={handleOpenAddModal}
                className="shadow-sm font-bold text-xs"
              >
                Add New Product
              </Button>
            </>
          )}

          {canCreateQuote && (
            <Button
              variant="forest"
              icon={ShoppingBag}
              onClick={() => navigate('/quotations/new')}
              className="shadow-sm"
            >
              Staged Items Drawer ({draftItems.length} selected)
            </Button>
          )}
        </div>
      </div>

      {/* 4 Friendly Pastel KPI Metric Cards matching Dashboard Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: CATALOG VALUE (Mint) */}
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#05603a] text-white flex items-center justify-center shadow-2xs">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#05603a] bg-emerald-100/70 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
              ↗ +14% new
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
              ₹48.2L
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Catalog Asset Value
            </span>
          </div>

          {/* Smooth Mint Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-emerald-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14" stroke="#05603a" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: GST COMPLIANCE (Sky Blue) */}
        <div className="bg-[#eef6ff] border border-[#b9dbfe] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#0070f3] text-white flex items-center justify-center shadow-2xs">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#0070f3] bg-blue-100/70 border border-blue-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
              18.0% Base
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
              HSN Mapped
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Automated GST Compliance
            </span>
          </div>

          {/* Smooth Blue Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-sky-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 35 C35 38, 70 20, 100 24 C120 28, 130 12, 140 16 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 35 C35 38, 70 20, 100 24 C120 28, 130 12, 140 16" stroke="#0070f3" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 3: STAGED PROPOSALS (for Sales) OR ACTIVE VERIFIED CATALOG (for Owner/Manager) */}
        {canCreateQuote ? (
          <div className="bg-[#fff7ec] border border-[#fde0b2] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#f57c00] text-white flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-[#f57c00] bg-amber-100/70 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                {draftItems.length} Staged
              </span>
            </div>

            <div className="relative z-10 mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
                ₹{stagedSubtotal ? Number(stagedSubtotal).toLocaleString('en-IN') : '0'}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
                Staged in Current Session
              </span>
            </div>

            {/* Smooth Amber Wave Curve Graphic */}
            <svg className="absolute -bottom-1 right-0 w-36 h-14 text-amber-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
              <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
              <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18" stroke="#f57c00" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <div className="bg-[#fff7ec] border border-[#fde0b2] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#f57c00] text-white flex items-center justify-center shadow-2xs">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-[#f57c00] bg-amber-100/70 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                Verified SKUs
              </span>
            </div>

            <div className="relative z-10 mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
                {products.length} Items
              </div>
              <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
                Active Architectural Catalog
              </span>
            </div>

            {/* Smooth Amber Wave Curve Graphic */}
            <svg className="absolute -bottom-1 right-0 w-36 h-14 text-amber-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
              <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
              <path d="M0 38 C40 40, 70 22, 105 25 C125 28, 135 15, 140 18" stroke="#f57c00" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Card 4: SPECIFIER MARGIN (Lavender Purple) */}
        <div className="bg-[#faf5ff] border border-[#e9d5ff] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xs min-h-[145px] hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#9333ea] text-white flex items-center justify-center shadow-2xs">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-[#9333ea] bg-purple-100/70 border border-purple-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
              ✨ Target
            </span>
          </div>

          <div className="relative z-10 mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
              34.6% Avg
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1 block">
              Specifier Target Margin
            </span>
          </div>

          {/* Smooth Purple Wave Curve Graphic */}
          <svg className="absolute -bottom-1 right-0 w-36 h-14 text-purple-400/40 pointer-events-none" viewBox="0 0 140 45" fill="none">
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14 L140 45 L0 45 Z" fill="currentColor" opacity="0.4" />
            <path d="M0 32 C30 35, 60 15, 90 28 C115 38, 125 10, 140 14" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Search Input, Filters, and Category Pills Bar matching Screenshot 3 */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by SKU, product title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 text-xs bg-zinc-50/80 border border-zinc-200/80 rounded-xl focus:border-[#05603a] outline-none"
            />
            <kbd className="absolute right-3 top-2.5 font-mono text-[10px] bg-white border border-zinc-200 text-zinc-400 px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Filter By ▾</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition">
              <span>Sort: Staged First ⇅</span>
            </button>
            <button className="w-9 h-9 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 shadow-2xs transition">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Category Pills matching Screenshot 3 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {['All Catalog', 'Faucets', 'WASHROOM 3', 'WASHROOM 2', 'WASHROOM 1', 'Plain Bathtubs', 'Multi-Therapy'].map((cat) => {
            const isCatActive = (cat === 'All Catalog' && selectedCategory === 'ALL') || selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === 'All Catalog' ? 'ALL' : cat)}
                className={`
                  px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer
                  ${isCatActive
                    ? 'bg-[#05603a] text-white shadow-xs'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs'
                  }
                `}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staged Precedence Active Callout Banner (visible to Sales only when items are staged) */}
      {canCreateQuote && draftItems.length > 0 && (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#05603a]">
            <span className="text-sm">📌</span>
            <span className="font-semibold">
              Staged Precedence Active:
            </span>
            <span className="text-emerald-900/80">
              Currently staged proposals are pinned to the top of catalog views for rapid spec review
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 shrink-0">
            <span>Viewing {paginatedProducts.length} of {totalItems} items</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-emerald-700 hover:underline font-bold"
            >
              Reset Order
            </button>
          </div>
        </div>
      )}

      {/* Main Catalog Table matching Screenshot 3 */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <Alert variant="error" title="Error loading catalog">
          {error}
        </Alert>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-[10px] uppercase text-zinc-400 font-bold border-b border-zinc-200 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center"></th>
                  <th className="px-4 py-3.5 w-24">PREVIEW</th>
                  <th className="px-4 py-3.5 min-w-[280px]">PRODUCT DETAILS</th>
                  <th className="px-4 py-3.5 w-36">SKU / CODE</th>
                  <th className="px-4 py-3.5 w-32">CATEGORY</th>
                  <th className="px-4 py-3.5 w-36 text-right">UNIT PRICE</th>
                  <th className="px-4 py-3.5 w-24 text-center">TAX (GST)</th>
                  {canManageProducts && <th className="px-3 py-3.5 w-20 text-center">ACTION</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedProducts.map((p, idx) => {
                  const countInDraft = getDraftQuantity(p);
                  const isStaged = countInDraft > 0;
                  const tag = getProductTags(p, idx);
                  const specs = getProductSpecs(p, idx);

                  return (
                    <tr
                      key={p._id || idx}
                      className={`
                        transition-colors group
                        ${isStaged ? 'bg-emerald-50/20 hover:bg-emerald-50/40' : 'hover:bg-zinc-50/60'}
                      `}
                    >
                      {/* Grip Icon */}
                      <td className="px-4 py-4 text-center text-zinc-300 group-hover:text-zinc-500">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>

                      {/* Preview Image with STAGED Badge Overlay */}
                      <td className="px-4 py-4">
                        <div className="relative w-16 h-16 rounded-xl bg-white border border-zinc-200/90 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {isStaged && canCreateQuote && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#05603a] text-white shadow-xs z-10">
                              STAGED
                            </span>
                          )}
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-contain cursor-pointer"
                              onClick={() => setPreviewImage(p)}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                      </td>

                      {/* Product Details (Title + Tag + Description + Specs) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-zinc-950 text-sm">
                            {p.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tag.color}`}>
                            {tag.text}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 mt-1 max-w-lg leading-relaxed line-clamp-2">
                          {p.description || 'Premium architectural hardware and high-precision fixtures engineered for luxury residential and commercial developments.'}
                        </p>

                        <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1.5 font-medium">
                          <span>⚙️</span>
                          <span>{specs}</span>
                        </div>
                      </td>

                      {/* SKU / Code */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800">
                            {p.sku || `K-2011${idx}IN`}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.sku)}
                            className="p-1.5 rounded-lg text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300/80 transition cursor-pointer shadow-2xs flex items-center justify-center"
                            title="Copy SKU code to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
                          </button>
                        </div>
                        {copiedSku === p.sku && (
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                            Copied!
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${getCategoryBadgeClass(p.category)}`}>
                          {p.category || 'WASHROOM 1'}
                        </span>
                      </td>

                      {/* Unit Price & In-Row Stepper */}
                      <td className="px-4 py-4 text-right">
                        <div className="font-mono font-bold text-zinc-950 text-sm">
                          ₹{Number(p.price || 15000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-zinc-400">per {p.unit || 'pcs'}</div>

                        {/* Interactive In-Row Stepper / Add button (Sales Quoting only) */}
                        {canCreateQuote && (
                          <div className="mt-2 flex items-center justify-end">
                            {isStaged ? (
                              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(p, -1)}
                                  className="w-5 h-5 rounded bg-white hover:bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-xs text-[#05603a] px-1">
                                  {countInDraft}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(p, 1)}
                                  className="w-5 h-5 rounded bg-white hover:bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToQuotation(p)}
                                className="text-[11px] font-bold text-[#05603a] hover:text-[#044e30] hover:underline cursor-pointer"
                              >
                                + Stage Item
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Tax (GST) */}
                      <td className="px-4 py-4 text-center font-mono text-xs text-zinc-600">
                        {formatTaxRate(p.tax, p.price)}%
                      </td>

                      {/* Action (Edit & Delete Product) */}
                      {canManageProducts && (
                        <td className="px-3 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 transition cursor-pointer shadow-2xs flex items-center justify-center"
                              title="Edit Product"
                            >
                              <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 transition cursor-pointer shadow-2xs flex items-center justify-center"
                              title="Delete Product & AWS S3 Image"
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          <div className="px-5 py-3.5 border-t border-zinc-200/80 bg-zinc-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Info + Rows Per Page Selector */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>
                Showing <strong className="text-zinc-900 font-semibold">{totalItems === 0 ? 0 : startIndex}</strong> to{' '}
                <strong className="text-zinc-900 font-semibold">{endIndex}</strong> of{' '}
                <strong className="text-zinc-900 font-semibold">{totalItems}</strong> products
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200">
                <span className="text-[11px] text-zinc-400 font-medium">Rows:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-white border border-zinc-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-zinc-700 outline-none cursor-pointer hover:border-zinc-300 transition shadow-2xs"
                >
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center gap-1.5">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => {
                  if (validCurrentPage > 1) {
                    setCurrentPage(validCurrentPage - 1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                disabled={validCurrentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pageNum => {
                    return (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - validCurrentPage) <= 1
                    );
                  })
                  .reduce((acc, pageNum, idx, arr) => {
                    if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                      acc.push(
                        <span key={`dots-${pageNum}`} className="px-1 text-zinc-400 text-xs font-bold">
                          ...
                        </span>
                      );
                    }
                    acc.push(
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                          validCurrentPage === pageNum
                            ? 'bg-[#05603a] text-white shadow-xs'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                    return acc;
                  }, [])}
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                onClick={() => {
                  if (validCurrentPage < totalPages) {
                    setCurrentPage(validCurrentPage + 1);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }
                }}
                disabled={validCurrentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Dock (Staged for Quote) matching Screenshot 3 */}
      {draftItems.length > 0 && canCreateQuote && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-white border border-zinc-200/90 shadow-2xl rounded-2xl p-3 px-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#05603a] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-950 text-sm">
                  Staged for Quote #QT-2025-098
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Draft
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="font-semibold text-zinc-800">{draftItems.length} items selected</span>
                <span>•</span>
                <span>Target Client: <strong className="text-zinc-700">Acorn Luxury Residences</strong></span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">Margin: 36.2%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                SUBTOTAL (EXCL. TAX)
              </span>
              <div className="font-mono font-bold text-zinc-950 text-base">
                ₹{Number(stagedSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-zinc-400">
                + ₹{Number(stagedTax).toLocaleString('en-IN', { maximumFractionDigits: 0 })} GST (18%)
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/quotations/new')}
              className="text-xs font-bold"
            >
              Inspect
            </Button>

            <Button
              variant="forest"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/quotations/new')}
              className="shadow-sm font-bold"
            >
              Continue to CPQ Builder
            </Button>
          </div>
        </div>
      )}

      {/* Floating Micro-Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-xl shadow-xl border border-zinc-800 text-xs font-semibold flex items-center gap-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Register New Product'}
        description={
          editingProduct
            ? 'Update product specifications, title, pricing, tax rate, or replace the photo in AWS S3.'
            : 'Add a new verified architectural product, SKU code, tax compliance, and upload its photo to AWS S3.'
        }
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {addError && (
            <Alert variant="error" onClose={() => setAddError('')}>
              {addError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU / Item Code"
              required
              placeholder="e.g. KB-102"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
              className="rounded-xl uppercase font-mono font-semibold"
            />

            <Input
              label="Category"
              placeholder="e.g. Faucets, Showers"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <Input
            label="Product Title / Name"
            required
            placeholder="e.g. Single Lever Basin Mixer with Pop-Up"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            className="rounded-xl"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="MRP / Price (₹)"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="e.g. 4500"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              className="rounded-xl font-semibold"
            />

            <Input
              label="GST Tax Rate (%)"
              type="number"
              min="0"
              max="28"
              placeholder="18"
              value={productForm.tax}
              onChange={(e) => setProductForm({ ...productForm, tax: e.target.value })}
              className="rounded-xl"
            />

            <Input
              label="Unit of Measure"
              placeholder="PCS"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Material, finish (Chrome / Matte Black), dimensions, pressure rating..."
              className="w-full p-3 text-xs rounded-xl border border-zinc-200 focus:border-[#05603a] focus:ring-1 focus:ring-[#05603a] outline-none transition"
              rows="2"
            />
          </div>

          {/* Product Image Upload with S3 preview */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Product Image (Auto-uploaded to AWS S3)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 border-2 border-dashed border-zinc-200 hover:border-[#05603a] rounded-xl p-3 text-center cursor-pointer bg-zinc-50/60 transition flex items-center justify-center gap-2 text-xs text-zinc-600 font-medium">
                <ImageIcon className="w-4 h-4 text-[#05603a]" />
                <span>{productForm.image ? 'Change photo' : 'Select image file (JPG, PNG, WebP)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageSelect}
                  className="hidden"
                />
              </label>

              {productForm.image && (
                <div className="relative w-12 h-12 rounded-xl border border-zinc-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                  <img src={productForm.image} alt="Preview" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Image will automatically be optimized and uploaded to your secure AWS S3 bucket.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setEditingProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="forest"
              size="sm"
              type="submit"
              loading={isSavingProduct}
              icon={editingProduct ? Check : Plus}
            >
              {editingProduct ? 'Save Changes' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Catalog or Brochure"
        description="Upload an Excel spreadsheet (.xlsx, .csv) or a manufacturer PDF brochure (.pdf)."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed p-7 rounded-2xl text-center transition-colors ${
              isUploading 
                ? 'border-emerald-400 bg-emerald-50/40 cursor-wait' 
                : 'border-zinc-300 hover:border-[#05603a] bg-zinc-50/70 cursor-pointer'
            }`}
          >
            <input
              type="file"
              accept=".csv, .xlsx, .xls, .pdf, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#05603a] flex items-center justify-center mx-auto mb-3">
              <Upload className={`w-5 h-5 ${isUploading ? 'animate-bounce' : ''}`} />
            </div>
            <div className="text-sm font-semibold text-zinc-900">
              {isUploading ? 'Processing catalog & uploading to S3...' : 'Click to browse Excel, CSV, or PDF Brochure'}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
              Auto-detects product codes (SKU), prices (MRP), titles, and crops photos directly to your AWS S3 bucket.
            </p>
          </div>

          {/* Duplicate handling toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
            <div>
              <span className="font-semibold text-zinc-800 block">Duplicate Handling</span>
              <span className="text-[11px] text-zinc-500">Update prices &amp; S3 photos for existing SKUs</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#05603a]"></div>
            </label>
          </div>

          {uploadStatus && (
            <Alert variant={uploadStatus.startsWith('Error') ? 'error' : 'success'}>
              {uploadStatus}
            </Alert>
          )}
        </div>
      </Modal>

      {/* Product Image Lightbox & S3 Deletion Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title={previewImage ? `Product Image: ${previewImage.sku}` : 'Image Preview'}
        description={previewImage?.name || ''}
        maxWidth="max-w-lg"
      >
        {previewImage && (
          <div className="space-y-4">
            <div className="w-full h-72 rounded-2xl bg-zinc-50 border border-zinc-200/90 p-4 flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.image}
                alt={previewImage.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cloud Storage Location</div>
              <div className="font-mono text-[11px] text-zinc-700 break-all select-all">{previewImage.image}</div>
              {previewImage.image?.includes('amazonaws.com') && (
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                  <span>☁️</span> Stored in AWS S3 (Bucket: quotepro-media-prod)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </Button>

              {canManageProducts && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage(previewImage)}
                  disabled={isDeletingImage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingImage ? 'Deleting from S3...' : 'Delete Image from S3 & Catalog'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
