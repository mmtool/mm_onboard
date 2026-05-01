import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Download, 
  Clock, 
  User, 
  Building2, 
  ChevronRight,
  Loader2,
  LogOut,
  ShieldCheck,
  Edit2,
  Save,
  FileDown,
  FileText,
  RefreshCw,
  Copy,
  Users,
  Map as MapIcon,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Application {
  id: string;
  submitted_at: string;
  status: 'pending' | 'review_requested' | 'approved' | 'rejected';
  workflow_status: 'draft' | 'submitted' | 'pending_review' | 'completed';
  maker_id?: string;
  checker_id?: string;
  merchant_label_en: string;
  merchant_label_mm: string;
  company_name_en: string;
  company_name_mm: string;
  company_short_name_en: string;
  company_short_name_mm: string;
  business_name_en: string;
  business_name_mm: string;
  applicant_email: string;
  merchant_phone_no: string;
  title: string;
  title_mm: string;
  last_name: string;
  last_name_mm: string;
  dob: string;
  father_name: string;
  gender: string;
  marital_status: string;
  nrc_full: string;
  owner_full_address: string;
  merchant_full_address: string;
  mcc_name: string;
  mcc_code: string;
  mcc_group: string;
  onboard_by: string;
  dica_grn_rcdc: string;
  latitude: string;
  longitude: string;
  doc_business_doc?: string;
  doc_agreement?: string;
  doc_shop_photo?: string;
  doc_nrc_front?: string;
  doc_nrc_back?: string;
}

export default function AdminPortal() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Application>>({});

  const [isAuth, setIsAuth] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'maker' | 'checker' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState<'checking' | 'ok' | 'error' | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showUserManagement, setShowUserManagement] = useState(false);

  useEffect(() => {
    checkAuth();
    checkSchema();

    // Set up real-time subscription
    const subscription = supabase
      .channel('merchant_applications_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'merchant_applications' 
      }, () => {
        loadApplications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (applications.length > 0) {
      setStats({
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
      });
    }
  }, [applications]);

  useEffect(() => {
    if (selectedApp) {
      loadTimeline(selectedApp.id);
    }
  }, [selectedApp]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuth(true);
      setUserEmail(session.user.email || null);
      
      // Fetch user role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUserRole(profile.role as any);
      } else {
        // Auto-create profile if missing (first time)
        const { data: newProfile } = await supabase.from('user_profiles').insert({
          id: session.user.id,
          email: session.user.email,
          role: 'maker' // Default to maker
        }).select().single();
        if (newProfile) setUserRole(newProfile.role as any);
      }

      loadApplications();
    } else {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      setIsAuth(true);
      setUserEmail(data.user?.email || null);
      loadApplications();
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuth(false);
    setApplications([]);
  };

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('merchant_applications')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      setApplications(data || []);
    } catch (err: any) {
      console.error('Error loading applications:', err);
      setError(err.message || 'Failed to load applications. Please check your Supabase connection and table setup.');
    } finally {
      setLoading(false);
    }
  };

  const checkSchema = async () => {
    setSchemaStatus('checking');
    try {
      // Try to fetch 1 row to see if table exists
      const { error } = await supabase.from('merchant_applications').select('id').limit(1);
      if (error) throw error;
      setSchemaStatus('ok');
    } catch (err: any) {
      console.error('Schema check failed:', err);
      setSchemaStatus('error');
    }
  };

  const seedTestData = async () => {
    setIsSeeding(true);
    try {
      const testId = 'TEST-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const { error } = await supabase.from('merchant_applications').insert({
        id: testId,
        merchant_label_en: 'Test Merchant ' + testId,
        applicant_email: 'test@example.com',
        status: 'pending',
        submitted_at: new Date().toISOString(),
        company_name_en: 'Test Company',
        mcc_name: 'Test MCC',
        onboard_by: 'Admin Seed'
      });

      if (error) throw error;
      alert('Test data seeded successfully!');
      loadApplications();
    } catch (err: any) {
      alert('Seeding failed: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmailLogs(data || []);
    } catch (err) {
      console.error('Error loading email logs:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAllUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      loadUsers();
      alert('User role updated successfully');
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };
  const loadTimeline = async (appId: string) => {
    try {
      const { data, error } = await supabase
        .from('application_timeline')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTimeline(data || []);
    } catch (err: any) {
      console.error('Error loading timeline:', err);
    }
  };

  const saveNote = async () => {
    if (!selectedApp || !note.trim()) return;
    setIsSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('application_timeline').insert({
        app_id: selectedApp.id,
        action: 'Admin Note',
        note: note.trim(),
        performed_by: user?.id
      });

      if (error) throw error;
      setNote('');
      loadTimeline(selectedApp.id);
      alert('Note saved successfully');
    } catch (err: any) {
      alert('Failed to save note: ' + err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Application['status'], workflowStatus?: Application['workflow_status']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = { 
        status: newStatus,
        workflow_status: workflowStatus || (newStatus === 'approved' ? 'completed' : 'pending_review')
      };
      
      if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.checker_id = user?.id;
        updates.reviewed_by = user?.id;
      } else if (newStatus === 'rejected') {
        updates.rejected_at = new Date().toISOString();
        updates.checker_id = user?.id;
        updates.reviewed_by = user?.id;
      } else if (newStatus === 'review_requested') {
        updates.maker_id = user?.id;
      }

      const { error } = await supabase
        .from('merchant_applications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Log to timeline
      await supabase.from('application_timeline').insert({
        app_id: id,
        action: `Status updated to ${newStatus}`,
        note: `Action performed by ${userRole} (${userEmail})`,
        performed_by: user?.id
      });

      // Send Email Notification (Simulation)
      if (newStatus === 'approved' || newStatus === 'rejected') {
        const app = applications.find(a => a.id === id);
        const emailBody = `
          Merchant Application ${newStatus.toUpperCase()}
          ----------------------------------
          Application ID: ${id}
          Merchant: ${app?.merchant_label_en}
          Email: ${app?.applicant_email}
          
          Status: ${newStatus}
          Reviewer: ${userEmail}
          Receiver: kaunghtet.min@mo.com.mm
        `;

        await supabase.from('email_logs').insert({
          app_id: id,
          recipient: 'kaunghtet.min@mo.com.mm',
          subject: `Application ${newStatus}: ${app?.merchant_label_en}`,
          body: emailBody
        });
      }

      loadApplications();
      setSelectedApp(null);
      alert(`Application ${newStatus} successfully`);
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedApp) return;
    try {
      const { error } = await supabase
        .from('merchant_applications')
        .update(editData)
        .eq('id', selectedApp.id);

      if (error) throw error;

      setApplications(prev => prev.map(app => app.id === selectedApp.id ? { ...app, ...editData } : app));
      setSelectedApp(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
      alert('Application updated successfully');
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const exportCSV = () => {
    if (applications.length === 0) return;
    
    const headers = Object.keys(applications[0]).join(',');
    const rows = applications.map(app => {
      return Object.values(app).map(val => {
        const str = String(val || '');
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csvContent = "\uFEFF" + [headers, ...rows].join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Merchant_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMarkdown = (app: Application) => {
    const mdContent = `
# SHWEBANK Merchant Application
**ID:** ${app.id}
**Submitted At:** ${new Date(app.submitted_at).toLocaleString()}
**Status:** ${app.status.toUpperCase()}

## 1. Application Information
- **Onboarded By:** ${app.onboard_by}
- **Applicant Email:** ${app.applicant_email}
- **Phone Number:** ${app.merchant_phone_no}

## 2. Personal Information
- **Full Name (EN):** ${app.title} ${app.last_name}
- **Full Name (MM):** ${app.title_mm} ${app.last_name_mm}
- **Date of Birth:** ${app.dob}
- **Father Name:** ${app.father_name}
- **Gender:** ${app.gender}
- **Marital Status:** ${app.marital_status}
- **NRC Number:** ${app.nrc_full}

## 3. Business Information
- **Merchant Label (EN):** ${app.merchant_label_en}
- **Merchant Label (MM):** ${app.merchant_label_mm}
- **Company Name (EN):** ${app.company_name_en}
- **MCC:** ${app.mcc_name} (${app.mcc_code})
- **MCC Group:** ${app.mcc_group}
- **DICA/GRN/RCDC:** ${app.dica_grn_rcdc}

## 4. Address Details
- **Owner Address:** ${app.owner_full_address}
- **Merchant Address:** ${app.merchant_full_address}
- **Coordinates:** ${app.latitude}, ${app.longitude}

---
Generated by SHWEBANK Admin Portal
    `.trim();

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shwebank_${app.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSignedUrl = async (path: string, bucket = 'merchant-docs') => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error) {
      alert('Error getting file: ' + error.message);
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = app.merchant_label_en.toLowerCase().includes(search.toLowerCase()) || 
                          app.id.toLowerCase().includes(search.toLowerCase()) ||
                          app.applicant_email.toLowerCase().includes(search.toLowerCase());
    
    // Role-based filtering: Checker only sees "Review Requested"
    if (userRole === 'checker') {
      return matchesFilter && matchesSearch && app.status === 'review_requested';
    }
    
    return matchesFilter && matchesSearch;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard: ' + text);
  };

  const openInMap = (lat: string, lng: string) => {
    if (!lat || !lng) return;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface border border-border rounded-lg p-8 max-w-md w-full"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold">Admin Portal</h1>
            <p className="text-text3 text-sm">Secure access for Shwebank admins</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text2 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-sm p-3 text-sm outline-none focus:border-accent"
                placeholder="admin@shwebank.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text2 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-sm p-3 text-sm outline-none focus:border-accent"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={authLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-white">S</div>
          <span className="font-bold">Admin Portal</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-accent/10 text-accent rounded-sm font-medium">
            <Clock className="w-4 h-4" /> Applications
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-text2 hover:bg-surface2 rounded-sm font-medium transition-all">
            <User className="w-4 h-4" /> Users
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-text2 hover:bg-surface2 rounded-sm font-medium transition-all">
            <Building2 className="w-4 h-4" /> Merchants
          </button>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-danger hover:bg-danger/5 rounded-sm font-medium transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
              <input 
                type="text" 
                placeholder="Search by ID, name, or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-sm pl-10 pr-4 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text3" />
              <select 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="bg-surface2 border border-border rounded-sm px-3 py-2 text-sm outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {schemaStatus === 'error' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-danger/10 text-danger border border-danger/20 rounded-full text-[10px] font-bold uppercase">
                <AlertCircle className="w-3 h-3" /> Schema Error
              </div>
            )}
            {userRole === 'admin' && (
              <button 
                onClick={() => { setShowUserManagement(true); loadUsers(); }}
                className="p-2 text-text3 hover:text-accent transition-all"
                title="User Management"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => { setShowEmailLogs(true); loadEmailLogs(); }}
              className="p-2 text-text3 hover:text-accent transition-all"
              title="View Email Logs"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button 
              onClick={loadApplications}
              className="p-2 text-text3 hover:text-accent transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={exportCSV}
              className="btn btn-ghost flex items-center gap-2 text-xs"
            >
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{userEmail || 'Admin User'}</div>
              <select 
                value={userRole || 'maker'} 
                onChange={async (e) => {
                  const newRole = e.target.value as any;
                  setUserRole(newRole);
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from('user_profiles').update({ role: newRole }).eq('id', user.id);
                  }
                }}
                className="text-[10px] bg-transparent border-none text-accent font-bold uppercase tracking-wider outline-none cursor-pointer"
              >
                <option value="maker">Maker</option>
                <option value="checker">Checker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center">
              <User className="w-5 h-5 text-text2" />
            </div>
          </div>
        </header>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Applications', value: stats.total, color: 'bg-accent', icon: FileText },
              { label: 'Pending Review', value: stats.pending, color: 'bg-warning', icon: Clock },
              { label: 'Approved', value: stats.approved, color: 'bg-success', icon: CheckCircle2 },
              { label: 'Rejected', value: stats.rejected, color: 'bg-danger', icon: XCircle },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border p-5 rounded-lg flex items-center gap-4"
              >
                <div className={`w-12 h-12 ${stat.color}/10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-text3 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface2 border-b border-border">
                  <th className="p-4 text-[11px] font-bold text-text3 uppercase tracking-widest">Application</th>
                  <th className="p-4 text-[11px] font-bold text-text3 uppercase tracking-widest">Merchant</th>
                  <th className="p-4 text-[11px] font-bold text-text3 uppercase tracking-widest">Submitted</th>
                  <th className="p-4 text-[11px] font-bold text-text3 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[11px] font-bold text-text3 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-2" />
                      <div className="text-text3 text-sm">Loading applications...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="text-danger text-sm mb-4">{error}</div>
                      <button onClick={loadApplications} className="btn btn-primary btn-sm">Retry</button>
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="text-text3 text-sm mb-4">No applications found</div>
                      <button 
                        onClick={seedTestData} 
                        disabled={isSeeding}
                        className="text-xs text-accent hover:underline font-bold uppercase tracking-widest"
                      >
                        {isSeeding ? 'Seeding...' : 'Seed Test Data'}
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => (
                    <tr key={app.id} className="border-b border-border hover:bg-surface2/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs font-bold text-accent2">{app.id}</div>
                          <button 
                            onClick={() => copyToClipboard(app.id)}
                            className="p-1 text-text3 hover:text-accent transition-all"
                            title="Copy ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs text-text3 mt-1">{app.applicant_email}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium">{app.merchant_label_en}</div>
                        <div className="text-xs text-text3 mt-1">{app.mcc_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-text2">{new Date(app.submitted_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-text3 mt-1">{new Date(app.submitted_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'approved' ? 'bg-success/10 text-success border border-success/20' :
                          app.status === 'rejected' ? 'bg-danger/10 text-danger border border-danger/20' :
                          app.status === 'review_requested' ? 'bg-accent/10 text-accent border border-accent/20' :
                          'bg-warning/10 text-warning border border-warning/20'
                        }`}>
                          {app.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : 
                           app.status === 'rejected' ? <XCircle className="w-3 h-3" /> : 
                           app.status === 'review_requested' ? <ShieldCheck className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="p-2 bg-surface2 border border-border rounded-sm text-text2 hover:text-accent hover:border-accent transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-surface2 border border-border rounded-sm text-text2 hover:text-text transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Debug Info for Netlify Troubleshooting */}
      <div className="fixed bottom-4 left-4 flex gap-4 text-[9px] font-mono text-text3 uppercase tracking-widest opacity-50 z-50">
        <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-success' : 'text-danger'}>
          URL: {import.meta.env.VITE_SUPABASE_URL ? 'LOADED' : 'MISSING'}
        </span>
        <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-success' : 'text-danger'}>
          KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'LOADED' : 'MISSING'}
        </span>
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">User Management</h2>
              <button onClick={() => setShowUserManagement(false)} className="p-1.5 bg-surface2 border border-border rounded-sm text-text2">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-xs font-bold text-text3 uppercase">Email</th>
                      <th className="py-3 px-4 text-xs font-bold text-text3 uppercase">Current Role</th>
                      <th className="py-3 px-4 text-xs font-bold text-text3 uppercase">Change Role</th>
                      <th className="py-3 px-4 text-xs font-bold text-text3 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(user => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            user.role === 'admin' ? 'bg-accent/10 text-accent' :
                            user.role === 'checker' ? 'bg-success/10 text-success' :
                            'bg-text3/10 text-text3'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select 
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="bg-bg border border-border rounded px-2 py-1 text-xs outline-none focus:border-accent"
                          >
                            <option value="maker">Maker</option>
                            <option value="checker">Checker</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-xs text-text3">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email Logs Modal */}
      {showEmailLogs && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Email Notification Logs</h2>
              <button onClick={() => setShowEmailLogs(false)} className="p-1.5 bg-surface2 border border-border rounded-sm text-text2">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {emailLogs.length === 0 ? (
                <div className="text-center py-12 text-text3 italic">No email logs found</div>
              ) : (
                emailLogs.map(log => (
                  <div key={log.id} className="bg-surface2 p-4 rounded-sm border border-border space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-accent uppercase tracking-wider">{log.subject}</div>
                      <div className="text-[10px] text-text3">{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-[11px] text-text2">To: {log.recipient}</div>
                    <pre className="text-[10px] text-text3 bg-bg p-3 rounded-sm overflow-x-auto whitespace-pre-wrap font-mono">
                      {log.body}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-lg w-full max-w-4xl my-auto"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold">Application Details</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedApp.status === 'approved' ? 'bg-success/10 text-success' :
                    selectedApp.status === 'rejected' ? 'bg-danger/10 text-danger' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {selectedApp.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadMarkdown(selectedApp)}
                    className="p-1.5 bg-surface2 border border-border rounded-sm text-text2 hover:text-accent"
                    title="Download Markdown"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setEditData(selectedApp);
                    }}
                    className={`p-1.5 border rounded-sm transition-all ${isEditing ? 'bg-accent border-accent text-white' : 'bg-surface2 border-border text-text2 hover:text-accent'}`}
                    title="Edit Application"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setSelectedApp(null); setIsEditing(false); }} className="p-1.5 bg-surface2 border border-border rounded-sm text-text2">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Left Column: Info */}
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-bg border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface2 border-b border-border">
                          <th className="py-3 px-4 text-[10px] font-bold text-text3 uppercase w-1/3">Field</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-text3 uppercase">Value / Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Application ID', key: 'id', readOnly: true },
                          { label: 'Merchant Label (EN)', key: 'merchant_label_en' },
                          { label: 'Merchant Label (MM)', key: 'merchant_label_mm' },
                          { label: 'Company Name (EN)', key: 'company_name_en' },
                          { label: 'Company Name (MM)', key: 'company_name_mm' },
                          { label: 'Short Name (EN)', key: 'company_short_name_en' },
                          { label: 'Short Name (MM)', key: 'company_short_name_mm' },
                          { label: 'Business Name (EN)', key: 'business_name_en' },
                          { label: 'Business Name (MM)', key: 'business_name_mm' },
                          { label: 'Title', key: 'title' },
                          { label: 'Title (MM)', key: 'title_mm' },
                          { label: 'Last Name', key: 'last_name' },
                          { label: 'Last Name (MM)', key: 'last_name_mm' },
                          { label: 'Applicant Email', key: 'applicant_email' },
                          { label: 'Phone Number', key: 'merchant_phone_no' },
                          { label: 'DOB', key: 'dob' },
                          { label: 'Father Name', key: 'father_name' },
                          { label: 'Gender', key: 'gender' },
                          { label: 'Marital Status', key: 'marital_status' },
                          { label: 'NRC Full', key: 'nrc_full' },
                          { label: 'MCC Name', key: 'mcc_name' },
                          { label: 'MCC Code', key: 'mcc_code' },
                          { label: 'MCC Group', key: 'mcc_group' },
                          { label: 'Onboarded By', key: 'onboard_by' },
                          { label: 'DICA/GRN/RCDC', key: 'dica_grn_rcdc' },
                          { label: 'Latitude', key: 'latitude' },
                          { label: 'Longitude', key: 'longitude' },
                          { label: 'Owner Address', key: 'owner_full_address' },
                          { label: 'Merchant Address', key: 'merchant_full_address' },
                        ].map(item => (
                          <tr key={item.label} className="border-b border-border last:border-0 hover:bg-surface2/50 transition-colors">
                            <td className="py-3 px-4 text-xs font-semibold text-text2 bg-surface2/30">{item.label}</td>
                            <td className="py-3 px-4">
                              {isEditing && !item.readOnly ? (
                                <input 
                                  type="text"
                                  value={editData[item.key as keyof Application] || ''}
                                  onChange={e => setEditData(prev => ({ ...prev, [item.key]: e.target.value }))}
                                  className="w-full bg-surface2 border border-border rounded-sm p-1.5 text-xs outline-none focus:border-accent"
                                />
                              ) : (
                                <div className="flex items-center justify-between group">
                                  <div className="text-xs break-all">{selectedApp[item.key as keyof Application] || '—'}</div>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => copyToClipboard(selectedApp[item.key as keyof Application] as string)} 
                                      className="p-1.5 text-text3 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Copy Value"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    {(item.key === 'latitude' || item.key === 'longitude') && selectedApp.latitude && selectedApp.longitude && (
                                      <button onClick={() => openInMap(selectedApp.latitude, selectedApp.longitude)} className="p-1.5 text-text3 hover:text-accent">
                                        <MapIcon className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-text3 uppercase tracking-widest">Documents</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'business_doc', label: 'Business Document', bucket: 'merchant-docs' },
                        { id: 'agreement', label: 'Agreement', bucket: 'merchant-docs' },
                        { id: 'shop_photo', label: 'Shop Photo', bucket: 'merchant-photos' },
                        { id: 'nrc_front', label: 'NRC Front', bucket: 'merchant-docs' },
                        { id: 'nrc_back', label: 'NRC Back', bucket: 'merchant-docs' },
                      ].map(doc => {
                        const path = selectedApp[`doc_${doc.id}` as keyof Application] as string;
                        return (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-bg border border-border rounded-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-surface2 rounded-sm flex items-center justify-center">
                                <Download className="w-4 h-4 text-text3" />
                              </div>
                              <span className="text-xs font-medium">{doc.label}</span>
                            </div>
                            {path ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => getSignedUrl(path, doc.bucket)}
                                  className="text-[10px] font-bold text-accent uppercase hover:underline"
                                >
                                  View
                                </button>
                                <button 
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage.from(doc.bucket).createSignedUrl(path, 60);
                                    if (data?.signedUrl) {
                                      copyToClipboard(data.signedUrl);
                                    } else {
                                      alert('Failed to get link');
                                    }
                                  }}
                                  className="p-1 text-text3 hover:text-accent"
                                  title="Copy Temporary Link"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-text3 uppercase italic">Missing</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                  {isEditing && (
                    <div className="bg-accent/10 p-5 rounded-sm border border-accent/20 space-y-4">
                      <h3 className="text-xs font-bold text-accent uppercase tracking-widest">Edit Mode</h3>
                      <button 
                        onClick={handleUpdate}
                        className="w-full btn btn-primary flex items-center justify-center gap-2 py-3"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </button>
                    </div>
                  )}

                  <div className="bg-surface2 p-5 rounded-sm border border-border space-y-4">
                    <h3 className="text-xs font-bold text-text3 uppercase tracking-widest">Review Actions</h3>
                    <div className="space-y-3">
                      {/* Maker Actions */}
                      {(userRole === 'maker' || userRole === 'admin') && selectedApp.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(selectedApp.id, 'review_requested', 'pending_review')}
                            className="w-full btn btn-primary flex items-center justify-center gap-2 py-3"
                          >
                            <ShieldCheck className="w-4 h-4" /> Request Review
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(selectedApp.id, 'rejected', 'completed')}
                            className="w-full btn bg-danger text-white flex items-center justify-center gap-2 py-3"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}

                      {/* Checker Actions */}
                      {(userRole === 'checker' || userRole === 'admin') && (selectedApp.status === 'review_requested' || userRole === 'admin') && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(selectedApp.id, 'approved', 'completed')}
                            disabled={selectedApp.status === 'approved'}
                            className="w-full btn btn-success flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(selectedApp.id, 'rejected', 'completed')}
                            disabled={selectedApp.status === 'rejected'}
                            className="w-full btn bg-danger text-white flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-surface2 p-5 rounded-sm border border-border space-y-4">
                    <h3 className="text-xs font-bold text-text3 uppercase tracking-widest">Timeline</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {timeline.length === 0 ? (
                        <div className="text-xs text-text3 italic">No history available</div>
                      ) : (
                        timeline.map((event, i) => (
                          <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
                            {i !== timeline.length - 1 && (
                              <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-border" />
                            )}
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            </div>
                            <div className="text-xs font-bold">{event.action}</div>
                            {event.note && <div className="text-[10px] text-text3 mt-0.5">{event.note}</div>}
                            <div className="text-[9px] text-text3 mt-1">{new Date(event.created_at).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-surface2 p-5 rounded-sm border border-border space-y-4">
                    <h3 className="text-xs font-bold text-text3 uppercase tracking-widest">Notes</h3>
                    <textarea 
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full bg-bg border border-border rounded-sm p-3 text-sm outline-none focus:border-accent min-h-[100px]"
                      placeholder="Add internal review notes..."
                    />
                    <button 
                      onClick={saveNote}
                      disabled={isSavingNote || !note.trim()}
                      className="w-full btn btn-ghost text-xs flex items-center justify-center gap-2"
                    >
                      {isSavingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Note'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
