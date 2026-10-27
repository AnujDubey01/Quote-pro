import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Edit2, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  FileText
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { TableSkeleton } from '../components/ui/Skeleton';

const Customers = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userRole = (user?.role || '').toLowerCase();
  const canDelete = userRole.includes('admin') || userRole.includes('owner') || userRole.includes('manager');
  const canCreateQuote = userRole.includes('admin') || userRole.includes('owner') || userRole.includes('sales');

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/customers?limit=100');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      companyName: c.companyName || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      gstNumber: c.gstNumber || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (editingCustomer) {
        const res = await axios.patch(`/api/v1/customers/${editingCustomer._id}`, formData);
        if (res.data.success) {
          setSuccess('Customer profile updated successfully.');
          setShowModal(false);
          fetchCustomers();
        }
      } else {
        const res = await axios.post('/api/v1/customers', formData);
        if (res.data.success) {
          setSuccess('New client added successfully.');
          setShowModal(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/v1/customers/${id}`);
      if (res.data.success) {
        setSuccess('Customer deleted.');
        setDeleteConfirmId(null);
        fetchCustomers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.gstNumber && c.gstNumber.toLowerCase().includes(q))
    );
  }, [customers, search]);

  // Color generator for avatar badges
  const getAvatarBg = (str = '') => {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-800',
      'bg-teal-100 text-teal-700'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (c) => {
    const title = c.companyName || c.name || 'CP';
    const parts = title.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
              Client Accounts & Accounts Receivable
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
              {customers.length} Accounts
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Commercial Client Accounts
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Maintain verified corporate accounts, GSTIN identifiers, registered billing addresses, and initiate instant proposals.
          </p>
        </div>

        <Button
          variant="forest"
          size="md"
          icon={Plus}
          onClick={handleOpenAddModal}
          className="shadow-sm font-bold text-xs"
        >
          Add Commercial Client
        </Button>
      </div>

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search clients by company, contact, email, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
            className="rounded-xl"
            rightSlot={
              search ? (
                <button
                  onClick={() => setSearch('')}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null
            }
          />
        </div>

        <span className="text-xs text-zinc-500 font-medium">
          Showing <span className="font-bold text-zinc-900">{filteredCustomers.length}</span> of {customers.length} active clients
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#05603a] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-950">No client accounts found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Add your first commercial client to quickly pre-populate proposals with verified billing and tax identifiers.
          </p>
          <Button
            variant="forest"
            size="sm"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="text-xs font-bold"
          >
            Add Commercial Client
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50/75 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="px-6 py-3.5">Company & Contact</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">GSTIN / Tax ID</th>
                  <th className="px-6 py-3.5">Registered Address</th>
                  <th className="px-6 py-3.5 text-center w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-zinc-50/60 transition-colors">
                    {/* Company & Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${getAvatarBg(c.companyName || c.name)}`}>
                          {getInitials(c)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 text-sm">
                            {c.companyName || c.name}
                          </div>
                          {c.companyName && (
                            <div className="text-xs text-zinc-500 mt-0.5">
                              Attn: {c.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="px-6 py-4 text-xs text-zinc-600 space-y-1">
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* GSTIN with copy button */}
                    <td className="px-6 py-4">
                      {c.gstNumber ? (
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/80 text-zinc-800">
                          <span>{c.gstNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.gstNumber, c._id)}
                            className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
                            title="Copy GSTIN"
                          >
                            {copiedId === c._id ? (
                              <Check className="w-3 h-3 text-[#05603a]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">Not recorded</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-6 py-4 text-xs text-zinc-500 max-w-xs truncate">
                      {c.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canCreateQuote && (
                          <Button
                            variant="forest"
                            size="sm"
                            icon={FileSpreadsheet}
                            onClick={() => navigate(`/quotations/new?customerId=${c._id}`)}
                            className="text-xs font-bold"
                          >
                            Quote
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                          title="Edit client profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(c._id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Edit Client Profile' : 'Add New Commercial Client'}
        description="Save official company identity, tax details, and billing contacts for automated proposal generation."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="e.g. Rathi Buildmart Pvt Ltd"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="rounded-xl"
          />

          <Input
            label="Primary Contact Person"
            required
            placeholder="e.g. Anjali Dubey"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="rounded-xl"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="billing@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="rounded-xl"
            />

            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <Input
            label="GSTIN / Tax Identification"
            placeholder="e.g. 29ABCDE1234F1Z5"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            className="rounded-xl"
          />

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Registered Billing Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, City, State, PIN..."
              className="w-full p-3 text-xs rounded-xl border border-zinc-200 focus:border-[#05603a] focus:ring-1 focus:ring-[#05603a] outline-none transition"
              rows="2"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="forest"
              size="sm"
              loading={submitting}
              className="font-bold text-xs"
            >
              {editingCustomer ? 'Save Changes' : 'Create Client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Client Deletion"
        description="Are you sure you want to remove this commercial client account? This will not alter existing historical quotations."
        maxWidth="max-w-sm"
      >
        <div className="pt-2 flex justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(deleteConfirmId)}
          >
            Delete Client
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
