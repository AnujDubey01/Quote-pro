import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Briefcase, 
  Crown, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Lock,
  User,
  X
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';

const Team = () => {
  const { user } = useSelector((state) => state.auth);
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Invite modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/v1/team');
      if (res.data.success) {
        setMembers(res.data.data.members || []);
        const rList = res.data.data.availableRoles || [];
        setRoles(rList);
        if (rList.length > 0 && !selectedRole) {
          const defaultRole = rList.find((r) => r.name.toLowerCase().includes('sales')) || rList[0];
          setSelectedRole(defaultRole._id);
        }
      }
    } catch (err) {
      console.error('Failed to load team:', err);
      setError(err.response?.data?.message || 'Failed to load team directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await axios.post('/api/v1/team', {
        name,
        email,
        password,
        roleId: selectedRole
      });

      if (res.data.success) {
        setSuccessMsg(`Team member "${name}" successfully added!`);
        setShowModal(false);
        setName('');
        setEmail('');
        setPassword('password123');
        fetchTeam();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (memberId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await axios.patch(`/api/v1/team/${memberId}/status`, { status: newStatus });
      if (res.data.success) {
        setMembers((prev) =>
          prev.map((m) => (m._id === memberId ? { ...m, status: newStatus } : m))
        );
        setSuccessMsg(`Member status updated to ${newStatus}`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member status');
    }
  };

  const getRoleBadge = (roleName) => {
    const nameStr = (roleName || '').toLowerCase();
    if (nameStr.includes('admin') || nameStr.includes('owner')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Crown className="w-3.5 h-3.5 text-purple-600" />
          Company Admin
        </span>
      );
    }
    if (nameStr.includes('manager')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Catalog Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#05603a] border border-emerald-200">
        <Briefcase className="w-3.5 h-3.5 text-[#05603a]" />
        Sales Representative
      </span>
    );
  };

  const isOwner = user?.role?.toLowerCase().includes('admin');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-[#05603a] border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#05603a]" />
              Workforce & Access Governance
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
              {members.length} Active Roster
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Team & Role Hierarchy
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your organization’s owners, catalog managers, and sales representatives with strict RBAC boundary enforcement.
          </p>
        </div>

        {isOwner && (
          <Button
            variant="forest"
            size="md"
            icon={UserPlus}
            onClick={() => setShowModal(true)}
            className="shadow-sm font-bold text-xs"
          >
            Invite Team Member
          </Button>
        )}
      </div>

      {/* Notifications */}
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

      {/* Hierarchy Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Crown className="w-4 h-4" />
            </div>
            <span>Company Owner / Admin</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Full organizational authority. Can invite/suspend users, configure company GSTIN, and oversee whole-company revenue pipelines.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Catalog Manager</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Controls product inventory, pricing, taxes, bulk Excel imports, and reviews/approves high-discount proposals submitted by sales.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2 text-[#05603a] font-bold text-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#05603a]">
              <Briefcase className="w-4 h-4" />
            </div>
            <span>Sales Representative</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            Interacts with corporate clients, creates proposals with instant SKU lookup, stages catalog items, and exports client-ready PDFs.
          </p>
        </div>
      </div>

      {/* Team Member Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="font-bold text-zinc-950 text-base">Active Organization Members</h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full">
            {members.length} Members
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">Loading team directory...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">No team members registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-zinc-50/75 text-[11px] font-bold uppercase text-zinc-500 tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="py-3.5 px-6">Member Name</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  {isOwner && <th className="py-3.5 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((m) => {
                  const roleName = m.roleId?.name || 'Salesperson';
                  const isCurrentUser = m._id === user?.id;

                  return (
                    <tr key={m._id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-zinc-950">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs uppercase">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-zinc-950">{m.name}</span>
                            {isCurrentUser && (
                              <span className="ml-2 text-[10px] bg-emerald-50 text-[#05603a] border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(roleName)}</td>
                      <td className="py-4 px-6 text-zinc-600 font-mono text-xs">{m.email}</td>
                      <td className="py-4 px-6">
                        {m.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-zinc-500 text-xs">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      {isOwner && (
                        <td className="py-4 px-6 text-right">
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleToggleStatus(m._id, m.status)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer border ${
                                m.status === 'active'
                                  ? 'text-rose-700 border-rose-200 hover:bg-rose-50'
                                  : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              {m.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Invite Team Member"
        description="Create credentials and assign a role with specific permission boundaries."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                placeholder="e.g. Sarah Connor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#05603a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#05603a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Temporary Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#05603a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Assigned Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#05603a] bg-white cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} — {r.description || 'Standard access'}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="forest"
              size="md"
              loading={submitting}
              className="flex-1 font-bold text-xs"
            >
              {submitting ? 'Creating...' : 'Create Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;
