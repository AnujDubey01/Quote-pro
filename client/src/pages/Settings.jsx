import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Percent, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Trash2,
  ShieldCheck
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);
  const [logoError, setLogoError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState(null);
  const [gstNumber, setGstNumber] = useState('');
  const [maxDiscountThreshold, setMaxDiscountThreshold] = useState(10);
  const [approvalPriceThreshold, setApprovalPriceThreshold] = useState(100000);
  const [pdfTerms, setPdfTerms] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/company');
        if (res.data.success) {
          const comp = res.data.data;
          setName(comp.name || '');
          setEmail(comp.email || '');
          setPhone(comp.phone || '');
          setAddress(comp.address || '');
          setLogo(comp.logo || null);

          const s = comp.settings || {};
          setGstNumber(s.gstNumber || '');
          setMaxDiscountThreshold(s.maxDiscountThreshold !== undefined ? s.maxDiscountThreshold : 10);
          setApprovalPriceThreshold(s.approvalPriceThreshold !== undefined ? s.approvalPriceThreshold : 100000);
          setPdfTerms(s.pdfTerms || '');
        }
      } catch (err) {
        console.error('Failed to load company settings:', err);
        setError(err.response?.data?.message || 'Failed to load company settings');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setLogoError('File size exceeds 2.5MB. Please choose a smaller image.');
      return;
    }

    setLogoError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await axios.patch('/api/v1/company', {
        name,
        email,
        phone,
        address,
        logo,
        settings: {
          gstNumber,
          maxDiscountThreshold: Number(maxDiscountThreshold),
          approvalPriceThreshold: Number(approvalPriceThreshold),
          bankDetails: null,
          pdfTerms
        }
      });

      if (res.data.success) {
        setSuccessMsg('Company settings & PDF branding updated successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
              Company Governance & Brand Identity
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs text-zinc-500 font-medium">Enterprise Setup</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Company Profile & PDF Branding
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Customize official entity legal credentials, corporate logo, and commercial discount approval thresholds.
          </p>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="p-12 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200/80 text-xs">
          Loading company settings...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Logo & Visual Identity Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#05603a]" />
                <span>Brand Logo & Proposal Header</span>
              </h2>
              {logo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#05603a] border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-[#05603a]" />
                  Active on PDF Exports
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Upload Controls */}
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Upload your corporate logo (PNG, SVG, or JPG). This logo appears on generated PDF quotations, client proposals, and printed invoices.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#05603a] font-bold text-xs border border-emerald-200 transition">
                    <Upload className="w-4 h-4" />
                    <span>{logo ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>

                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                {logoError && (
                  <p className="text-xs text-rose-600 font-semibold">{logoError}</p>
                )}

                <div className="text-[11px] text-zinc-400">
                  Recommended size: 400×120px (transparent PNG or SVG). Max file size: 2.5MB.
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[130px] text-center">
                {logo ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-white rounded-xl border border-zinc-200/80 shadow-2xs inline-block max-w-[240px]">
                      <img
                        src={logo}
                        alt="Company Logo Preview"
                        className="max-h-16 max-w-full object-contain mx-auto"
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-zinc-500">Live Proposal Header Preview</p>
                  </div>
                ) : (
                  <div className="text-zinc-400 space-y-1">
                    <Building2 className="w-8 h-8 mx-auto text-zinc-300" />
                    <p className="text-xs font-semibold">No custom logo uploaded</p>
                    <p className="text-[11px] text-zinc-400">Default company trade name will be displayed in PDF exports</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* General Information Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="font-bold text-zinc-950 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Building2 className="w-4 h-4 text-[#05603a]" />
              <span>General Organization Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Trade Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />

              <Input
                label="Official GSTIN Number"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="rounded-xl font-mono uppercase"
              />

              <Input
                label="Primary Commercial Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={Mail}
                className="rounded-xl"
              />

              <Input
                label="Official Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={Phone}
                className="rounded-xl"
              />

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Billing & Registered Address
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#05603a]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Approval Workflow & Margin Governance */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
            <h2 className="font-bold text-zinc-950 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#05603a]" />
              <span>Manager Approval Rules & Commercial Ceilings</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Discount Limit */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Max Discount Without Manager Approval (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={maxDiscountThreshold}
                    onChange={(e) => setMaxDiscountThreshold(e.target.value)}
                    className="w-32 px-3 py-2 rounded-xl border border-zinc-200 text-sm font-bold text-[#05603a] font-mono focus:outline-none focus:ring-1 focus:ring-[#05603a]"
                  />
                  <span className="text-sm font-semibold text-zinc-600">%</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  Quotations with discount &gt; this value are routed to the Manager queue.
                </p>
              </div>

              {/* Price Ceiling Limit */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Max Proposal Total Without Manager Approval (₹)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-600 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={approvalPriceThreshold}
                    onChange={(e) => setApprovalPriceThreshold(e.target.value)}
                    className="w-44 px-3 py-2 rounded-xl border border-zinc-200 text-sm font-bold text-[#05603a] font-mono focus:outline-none focus:ring-1 focus:ring-[#05603a]"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  Quotations exceeding ₹{Number(approvalPriceThreshold || 0).toLocaleString('en-IN')} require Manager sign-off before being sent to clients. Otherwise, they are directly approved and sent.
                </p>
              </div>
            </div>
          </div>

          {/* Standard PDF Terms & Conditions */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="font-bold text-zinc-950 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileText className="w-4 h-4 text-[#05603a]" />
              <span>Standard Terms & Conditions (PDF Footer)</span>
            </h2>

            <div>
              <textarea
                rows={4}
                value={pdfTerms}
                onChange={(e) => setPdfTerms(e.target.value)}
                placeholder="1. Quotation valid for 30 days from date of issue.&#10;2. 50% advance payment required upon order confirmation."
                className="w-full p-3.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#05603a] font-mono"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="forest"
              size="md"
              loading={saving}
              icon={Save}
              className="shadow-sm font-bold text-xs"
            >
              {saving ? 'Saving...' : 'Save Company Settings'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
