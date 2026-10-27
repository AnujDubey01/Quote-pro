import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loginSuccess } from '../features/auth/authSlice';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Package,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Crown,
  Briefcase,
  Sparkles,
  Search,
  Menu,
  X,
  Building,
  Bell,
  ChevronsUpDown,
  ChevronDown,
  User,
  Sliders,
  CheckCircle2,
  FileText,
  UserCheck,
  Plus,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Lock
} from 'lucide-react';
import { getRoleType, getDefaultRouteForRole } from '../utils/roleUtils';
import Modal from '../components/ui/Modal';

const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cmdSearchQuery, setCmdSearchQuery] = useState('');
  const [companyBrand, setCompanyBrand] = useState(null);

  // Live dynamic notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationRef = useRef(null);

  // Fetch company brand if tenant authenticated
  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      axios.get('/api/v1/company')
        .then(res => {
          if (res.data.success) {
            setCompanyBrand(res.data.data);
          }
        })
        .catch(() => { });
    }
  }, [user]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
    } catch (error) {
      console.warn('Logout API error:', error);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const roleType = getRoleType(user);
  const isSuperAdmin = roleType === 'superadmin';
  const isOwner = roleType === 'owner';
  const isManager = roleType === 'manager';
  const isSales = roleType === 'sales';

  // Live notification sync: role-aware & real-time
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!user) return;

        if (isSuperAdmin) {
          // Super Admin: Fetch platform-wide metrics
          const res = await axios.get('/api/v1/platform/stats');
          if (res.data?.success) {
            const pendingAcrossPlatform = res.data.data?.pendingCount || 0;
            setNotificationCount(pendingAcrossPlatform);
            if (pendingAcrossPlatform > 0) {
              setNotifications([
                {
                  id: 'superadmin-pending',
                  title: `${pendingAcrossPlatform} Tenant Quotations Pending Review`,
                  description: 'Proposals across tenant workspaces exceeding standard discount thresholds awaiting manager review.',
                  time: 'Live',
                  type: 'alert'
                }
              ]);
            } else {
              setNotifications([]);
            }
          }
        } else if (isManager || isOwner) {
          // Manager or Company Owner: Fetch tenant pending approval quotations
          const res = await axios.get('/api/v1/quotations?status=pending');
          if (res.data?.success) {
            const list = res.data.data || [];
            setNotificationCount(list.length);
            setNotifications(list.map(q => ({
              id: q._id,
              title: `Pending Approval: #${q.quoteNumber || q._id.slice(-6)}`,
              description: `Client: ${q.clientName || 'Commercial Project'} • ₹${Number(q.total || 0).toLocaleString('en-IN')}`,
              time: new Date(q.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'approval',
              link: isManager ? '/manager' : '/owner'
            })));
          }
        } else if (isSales) {
          // Sales: Fetch recently submitted proposals
          const res = await axios.get('/api/v1/quotations');
          if (res.data?.success) {
            const myQuotes = res.data.data || [];
            const myPending = myQuotes.filter(q => q.status === 'pending');
            setNotificationCount(myPending.length);
            setNotifications(myPending.map(q => ({
              id: q._id,
              title: `Quote #${q.quoteNumber || q._id.slice(-6)} In Review`,
              description: `Discount approval requested with manager. Total: ₹${Number(q.total || 0).toLocaleString('en-IN')}`,
              time: 'Pending Review',
              type: 'info',
              link: '/sales'
            })));
          }
        }
      } catch (err) {
        console.debug('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();

    // Re-check periodically & on quotation updates
    const interval = setInterval(fetchNotifications, 45000);
    window.addEventListener('quotation_updated', fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('quotation_updated', fetchNotifications);
    };
  }, [user, isSuperAdmin, isManager, isOwner, isSales]);

  // Click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Items strictly filtered by authorized role
  const getNavItems = () => {
    const dashboardPath = isSuperAdmin ? '/platform' : isOwner ? '/owner' : isManager ? '/manager' : '/sales';

    const items = [
      {
        name: 'Dashboard',
        path: dashboardPath,
        icon: LayoutDashboard,
      },
    ];

    // Quotations / Proposals
    if (!isSuperAdmin) {
      const isRestrictedFromCreation = isOwner || isManager;
      items.push({
        name: isSales ? 'My Proposals' : 'Quotations',
        path: isOwner ? '/owner' : isSales ? '/sales' : '/manager',
        icon: FileSpreadsheet,
        isLocked: isRestrictedFromCreation,
        lockTooltip: 'Review & Approval Console (Quotation Creation restricted to Sales)',
        badge: notificationCount > 0 
          ? String(notificationCount) 
          : isRestrictedFromCreation 
            ? 'Review Only' 
            : undefined,
        badgeColor: notificationCount > 0 
          ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' 
          : 'bg-zinc-100 text-zinc-600 font-medium border border-zinc-200 text-[10px]',
      });
    }

    // CPQ Builder (Quotation Generation)
    // Designated for Sales Representatives; locked with indicator for Owner & Manager
    if (isOwner || isManager || isSales) {
      const isRestrictedFromCreation = isOwner || isManager;
      items.push({
        name: 'CPQ Builder',
        path: isRestrictedFromCreation ? '#' : '/quotations/new',
        icon: Sliders,
        isLocked: isRestrictedFromCreation,
        lockTooltip: 'Quotation creation is restricted to Sales Representatives',
        badge: isRestrictedFromCreation ? 'Sales Only' : undefined,
        badgeColor: 'bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[10px]',
        onClick: isRestrictedFromCreation ? (e) => {
          e.preventDefault();
          alert('🔒 Quotation Creation Locked:\n\nAs a Company Owner / Catalog Manager, quotation generation is restricted to Sales Representatives.\n\nYou have audit, review, and approval authority over all submitted quotations.');
        } : undefined
      });
    }

    // Product Catalog (authorized for Owner, Manager, Sales)
    if (isOwner || isManager || isSales) {
      items.push({
        name: 'Product Catalog',
        path: '/products',
        icon: Package,
      });
    }

    // Commercial Clients Directory (authorized for Owner, Manager, Sales)
    if (isOwner || isManager || isSales) {
      items.push({
        name: 'Client Directory',
        path: '/customers',
        icon: Users,
      });
    }

    // Multi-Tenant Console (strictly SuperAdmin only)
    if (isSuperAdmin) {
      items.push({
        name: 'Multi-Tenant',
        path: '/platform',
        icon: Building,
      });
    }

    // Operations & Team Governance (strictly Owner only)
    if (isOwner) {
      items.push({
        name: 'Operations',
        path: '/team',
        icon: CheckCircle2,
      });
    }

    // Company Settings & Tax (strictly Owner only)
    if (isOwner) {
      items.push({
        name: 'Settings',
        path: '/settings',
        icon: SettingsIcon,
      });
    }

    return items;
  };

  const navItems = getNavItems();

  const getRoleDisplayName = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isOwner) return 'Company Owner';
    if (isManager) return 'Catalog Manager';
    return 'Sales Rep';
  };

  // Quick command palette items - strictly authorized commands only
  const getCommandPaletteLinks = () => {
    const links = [];
    if (isOwner || isManager || isSales) {
      links.push({ label: 'Create New Quotation', path: '/quotations/new', icon: Sliders, category: 'Actions' });
    }
    if (isOwner || isManager || isSales) {
      links.push({ label: 'Browse Products Catalog', path: '/products', icon: Package, category: 'Navigation' });
      links.push({ label: 'Commercial Clients Directory', path: '/customers', icon: Users, category: 'Navigation' });
    }
    if (isOwner) {
      links.push({ label: 'Team & Role Governance', path: '/team', icon: UserCheck, category: 'Administration' });
      links.push({ label: 'Company Settings & Tax', path: '/settings', icon: SettingsIcon, category: 'Administration' });
    }
    if (isSuperAdmin) {
      links.push({ label: 'Multi-Tenant Console', path: '/platform', icon: Building, category: 'Platform' });
    }
    return links;
  };

  const commandPaletteLinks = getCommandPaletteLinks();

  const filteredCommandLinks = commandPaletteLinks.filter(item =>
    item.label.toLowerCase().includes(cmdSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans antialiased text-zinc-900 selection:bg-[#05603a] selection:text-white">
      {/* Desktop Sidebar (Pure White with QuotePro Brand & Forest Green Active State) */}
      <aside className="hidden lg:flex w-70 bg-white text-zinc-800 flex-col border-r border-zinc-200/80 shrink-0 z-20">
        {/* Brand Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#05603a] text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-2xl tracking-tight text-zinc-950 leading-none">
                QuotePro
              </span>
            </div>
          </div>

          {/* Account Identity Badge with Coral Avatar and Role Badge matching Reference */}
          <div className="mt-4">
            <div className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs select-none">
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-full bg-[#f43f5e] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {companyBrand?.name ? companyBrand.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'AC'}
                </div>
                <div className="flex flex-col text-left truncate">
                  <span className="font-bold text-sm text-zinc-950 truncate leading-tight">
                    {companyBrand?.name || 'Acme Corp'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#7e22ce]">
                      {getRoleDisplayName()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDashboard = item.name === 'Dashboard';
            const isRoleDashboardPath = location.pathname === '/owner' || location.pathname === '/platform' || location.pathname === '/manager' || location.pathname === '/sales';
            
            const isActive = isDashboard
              ? isRoleDashboardPath
              : location.pathname === item.path && !isRoleDashboardPath;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={item.onClick}
                className={`
                  flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group select-none
                  ${isActive
                    ? 'bg-[#e8f7ee] text-[#05603a]'
                    : item.isLocked && item.path === '#'
                      ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 cursor-pointer'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70'
                  }
                `}
                title={item.lockTooltip || item.name}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#05603a]' : 'text-zinc-500 group-hover:text-zinc-900'}`} />
                  <span className="tracking-tight">{item.name}</span>
                  {item.isLocked && (
                    <span className="inline-flex items-center text-zinc-400 group-hover:text-amber-600 transition" title="Creation restricted">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                {item.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isActive ? 'bg-[#05603a] text-white' : item.badgeColor || 'bg-zinc-100 text-zinc-700'}`}>
                    {item.isLocked && <Lock className="w-2.5 h-2.5" />}
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Secondary Navigation & Upgrade to Pro Card */}
        <div className="p-3 border-t border-zinc-100 space-y-3 bg-white">
          {/* Secondary Nav Links */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <span>Integrations</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => alert('Support team is available 24/7 at support@quotepro.com')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition"
            >
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              <span>Help & Support</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>

          {/* Upgrade to Pro Card matching Reference Image */}
          <div className="bg-[#ebfaf2] border border-[#d1fae5] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-sm text-zinc-950">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Get advanced features and priority support.
            </p>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-full py-2 bg-[#05603a] hover:bg-[#044e30] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>Upgrade Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 w-72 bg-white text-zinc-900 flex flex-col z-50 lg:hidden shadow-2xl border-r border-zinc-200"
            >
              <div className="p-5 flex items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#05603a] text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight text-zinc-950">QuotePro</span>
                    <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">ENTERPRISE CPQ</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={(e) => {
                        if (item.onClick) item.onClick(e);
                        else setMobileMenuOpen(false);
                      }}
                      className={`
                        flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold
                        ${isActive ? 'bg-[#05603a] text-white' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                        {item.isLocked && <Lock className="w-3 h-3 text-zinc-400" />}
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isActive ? 'bg-white text-[#05603a]' : item.badgeColor || 'bg-zinc-100 text-zinc-700'}`}>
                          {item.isLocked && <Lock className="w-2.5 h-2.5" />}
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-zinc-200 bg-zinc-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar matching QuotePro reference */}
        <header className="h-16 bg-white border-b border-zinc-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-zinc-600 hover:text-zinc-900 rounded-md"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input with ⌘K */}
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full sm:w-80 md:w-96 flex items-center justify-between px-3.5 py-2 text-sm text-zinc-400 bg-white border border-zinc-200/90 rounded-xl hover:border-zinc-300 transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-500 truncate font-medium text-xs sm:text-sm">Search quotations, clients, products...</span>
              </div>
              <kbd className="font-mono text-[11px] bg-zinc-50 border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded font-semibold shrink-0 ml-2">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Header: + New Quotation, Notification Bell, User Avatar & Name */}
          <div className="flex items-center gap-3">
            {/* + New Quotation Button */}
            {isSales ? (
              <button
                type="button"
                onClick={() => navigate('/quotations/new')}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#05603a] hover:bg-[#044e30] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Quotation</span>
              </button>
            ) : (isOwner || isManager) ? (
              <button
                type="button"
                onClick={() => alert('🔒 Quotation Creation Locked:\n\nQuotation creation is designated for Sales Representatives.\n\nCompany Owners and Catalog Managers have audit and approval governance.')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200/70 text-zinc-500 rounded-xl text-xs font-semibold transition cursor-pointer border border-zinc-200/80"
                title="Quotation creation is restricted to Sales Representatives"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>New Quotation (Locked)</span>
              </button>
            ) : null}

            {/* Notification Bell with Dynamic Dropdown Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(prev => !prev)}
                className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                  notificationsOpen 
                    ? 'border-[#05603a] bg-emerald-50/50 text-[#05603a]' 
                    : 'border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-600 shadow-2xs'
                }`}
                title={notificationCount > 0 ? `${notificationCount} Pending Notifications` : 'No Pending Notifications'}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-zinc-200/90 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3.5 px-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900">Notifications</span>
                        {notificationCount > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            {notificationCount} Pending
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            All Caught Up
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {isSuperAdmin ? 'Platform Tier' : companyBrand?.company?.name || 'Workspace'}
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                      {notificationCount > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (n.link) navigate(n.link);
                              setNotificationsOpen(false);
                            }}
                            className="p-3.5 hover:bg-zinc-50/80 transition cursor-pointer flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-zinc-900 truncate">{n.title}</span>
                                <span className="text-[10px] text-zinc-400 shrink-0">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug line-clamp-2">{n.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-900">Zero Pending Requests</div>
                            <p className="text-[11px] text-zinc-500 mt-0.5 max-w-[240px] mx-auto">
                              {isSuperAdmin
                                ? 'No tenant quotation escalations across the platform shards.'
                                : 'All quotations and discount requests have been addressed.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isSuperAdmin && (
                      <div className="p-2.5 bg-zinc-50 border-t border-zinc-100 text-center">
                        <Link
                          to="/platform"
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[11px] font-bold text-[#05603a] hover:underline"
                        >
                          View Platform Oversight Console →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Avatar with Name & Role matching reference image */}
            <div className="flex items-center gap-2.5 pl-1 select-none">
              <div className="w-9 h-9 rounded-full bg-[#05603a] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                {user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-bold text-xs text-zinc-950 leading-tight">
                  {user?.name || 'Anuj Dubey'}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {getRoleDisplayName()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <Modal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        maxWidth="max-w-md"
        showClose={false}
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search quotes, catalogs, actions..."
              value={cmdSearchQuery}
              onChange={(e) => setCmdSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-[#05603a] outline-none"
            />
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredCommandLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-zinc-500" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{item.category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
