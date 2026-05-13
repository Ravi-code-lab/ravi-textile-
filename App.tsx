
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Production from './components/Production';
import Orders from './components/Orders';
import Masters from './components/Masters';
import Karigars from './components/Karigars';
import KarigarKhata from './components/KarigarKhata';
import Agents from './components/Agents';
import Offices from './components/Offices';
import Employees from './components/Employees';
import Accounting from './components/Accounting';
import Attendance from './components/Attendance';
import AgentKhata from './components/AgentKhata';
import CashBook from './components/CashBook';
import Settings from './components/Settings';
import Login from './components/Login';
import DesignCatalog from './components/DesignCatalog';
import DesignRecipe from './components/DesignRecipe';
import JobWorkComp from './components/JobWork';
import Assets from './components/Assets';
import CRM from './components/CRM';
import Gallery from './components/Gallery';
import Reports from './components/Reports';
import Suppliers from './components/Suppliers';
import QualityControl from './components/QualityControl';
import Projects from './components/Projects';
import TexBot from './components/TexBot';
import UserProfileModal from './components/UserProfileModal';
import CommandPalette from './components/CommandPalette';
import OpeningStock from './components/OpeningStock';
import PackDesign from './components/PackDesign';
import StockTransferComp from './components/StockTransfer';
import PhysicalAudit from './components/PhysicalAudit';
import TaxInvoice from './components/TaxInvoice';
import SalesReturn from './components/SalesReturn';
import PurchaseOrderComp from './components/PurchaseOrder';
import PurchaseInward from './components/PurchaseInward';
import PurchaseReturn from './components/PurchaseReturn';
import CreditDebitNotes from './components/CreditDebitNotes';
import TrackLots from './components/TrackLots';
import SalesOrder from './components/SalesOrder';
import DeliveryChallan from './components/DeliveryChallan';
import Sampling from './components/Sampling';
import NotificationCenter from './components/NotificationCenter';
import TaskManager from './components/TaskManager';
import YarnManagement from './components/YarnManagement';
import DyeingProcessing from './components/DyeingProcessing';
import FabricCostingComp from './components/FabricCosting';
import DispatchPlanner from './components/DispatchPlanner';
import { 
  InventoryItem, Order, Customer, TeamMember, Supplier, Design, JobWork, 
  Machine, Project, Transaction, Agent, JobSlip, Karigar, AttendanceRecord, 
  Cheque, Budget, Lead, MaintenanceRecord, QualityReport, LoanRecord, 
  LeaveRequest, GalleryItem, UIPreferences, CompanyInfo, ViewState, ProductionLog, 
  FabricInspection, PurchaseOrder, ProductionJob, BaseEntity, GatePass,
  StockAudit, PayrollAdjustment, SampleRequest, Pack, StockTransfer,
  ShopifyConfig, InvoiceConfig, SecurityConfig, CommunicationConfig, AdvancedConfig,
  Notification, Task,
  YarnLot, YarnBlend, DyeingJob, FabricCosting, DispatchEntry
} from './types';
import { getItem, setItem, hydrateFromNative } from './utils/indexedDB';
import { Loader2, Command, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  const [uiPrefs, setUiPrefs] = useState<UIPreferences>({
    theme: 'light', sidebarStyle: 'modern', backgroundPattern: 'mesh', 
    reduceMotion: false, primaryColor: 'indigo', borderRadius: 'md', density: 'comfortable', scale: 1
  });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Ravi-Textile', address: '', gstin: '', email: '', website: '', logoUrl: ''
  });
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [shopifyConfig, setShopifyConfig] = useState<ShopifyConfig>({ enabled: false, shopUrl: '', accessToken: '' });
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({ geminiApiKey: '', sessionTimeout: 30, twoFactorEnabled: false });
  const [communicationConfig, setCommunicationConfig] = useState<CommunicationConfig>({ smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', whatsappEnabled: false });
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({ enableAuditLogs: true, auditLogRetentionDays: 90, debugMode: false, autoBackupInterval: 24 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({ 
    prefix: 'INV', 
    nextNumber: 1001, 
    defaultGst: 5, 
    terms: '', 
    bankDetails: '', 
    currency: 'INR',
    footerText: '',
    showLogo: true 
  });

  // Data States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [production, setProduction] = useState<ProductionJob[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [jobWorks, setJobWorks] = useState<JobWork[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [slips, setSlips] = useState<JobSlip[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [qualityReports, setQualityReports] = useState<QualityReport[]>([]);
  const [inspections, setInspections] = useState<FabricInspection[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([]);
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [stockAudits, setStockAudits] = useState<StockAudit[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [payrollAdjustments, setPayrollAdjustments] = useState<Record<string, PayrollAdjustment>>({});
  const [yarnLots, setYarnLots] = useState<YarnLot[]>([]);
  const [yarnBlends, setYarnBlends] = useState<YarnBlend[]>([]);
  const [dyeingJobs, setDyeingJobs] = useState<DyeingJob[]>([]);
  const [fabricCostings, setFabricCostings] = useState<FabricCosting[]>([]);
  const [dispatches, setDispatches] = useState<DispatchEntry[]>([]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
        // Hydrate from physical vault if on Electron
        await hydrateFromNative();

        setUiPrefs(await getItem<UIPreferences>('uiPrefs') || uiPrefs);
        setCompanyInfo(await getItem<CompanyInfo>('companyInfo') || companyInfo);
        setFeatures(await getItem<Record<string, boolean>>('texflow_features') || {});
        setInvoiceConfig(await getItem<InvoiceConfig>('texflow_invoice_config') || invoiceConfig);
        setShopifyConfig(await getItem<ShopifyConfig>('texflow_shopify_config') || shopifyConfig);

        setInventory(await getItem<InventoryItem[]>('inventory') || []);
        setGatePasses(await getItem<GatePass[]>('gatePasses') || []);
        setProduction(await getItem<ProductionJob[]>('production') || []);
        setOrders(await getItem<Order[]>('orders') || []);
        setPurchaseOrders(await getItem<PurchaseOrder[]>('purchaseOrders') || []);
        setCustomers(await getItem<Customer[]>('customers') || []);
        setSuppliers(await getItem<Supplier[]>('suppliers') || []);
        setTeam(await getItem<TeamMember[]>('team') || []);
        setDesigns(await getItem<Design[]>('designs') || []);
        setJobWorks(await getItem<JobWork[]>('jobWorks') || []);
        setMachines(await getItem<Machine[]>('machines') || []);
        setProjects(await getItem<Project[]>('projects') || []);
        setTransactions(await getItem<Transaction[]>('transactions') || []);
        setAgents(await getItem<Agent[]>('agents') || []);
        setSlips(await getItem<JobSlip[]>('slips') || []);
        setAttendance(await getItem<AttendanceRecord[]>('attendance') || []);
        setCheques(await getItem<Cheque[]>('cheques') || []);
        setBudgets(await getItem<Budget[]>('budgets') || []);
        setLeads(await getItem<Lead[]>('leads') || []);
        setMaintenance(await getItem<MaintenanceRecord[]>('maintenance') || []);
        setQualityReports(await getItem<QualityReport[]>('qualityReports') || []);
        setInspections(await getItem<FabricInspection[]>('inspections') || []);
        setLoans(await getItem<LoanRecord[]>('loans') || []);
        setLeaves(await getItem<LeaveRequest[]>('leaves') || []);
        setGallery(await getItem<GalleryItem[]>('gallery') || []);
        setProductionLogs(await getItem<ProductionLog[]>('productionLogs') || []);
        setSamples(await getItem<SampleRequest[]>('samples') || []);
        setKarigars(await getItem<Karigar[]>('karigars') || []);
        setStockAudits(await getItem<StockAudit[]>('stockAudits') || []);
        setTransfers(await getItem<StockTransfer[]>('transfers') || []);
        setPacks(await getItem<Pack[]>('packs') || []);
        setPayrollAdjustments(await getItem<Record<string, PayrollAdjustment>>('payrollAdjustments') || {});
        setNotifications(await getItem<Notification[]>('notifications') || []);
        setTasks(await getItem<Task[]>('tasks') || []);
        
        setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
        console.error("Critical Error loading local data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [uiPrefs, companyInfo]);

  useEffect(() => { refreshData(); }, []);

  useEffect(() => {
    if (uiPrefs.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    // Apply global scale
    document.documentElement.style.setProperty('--app-scale', (uiPrefs.scale || 1).toString());
    document.documentElement.style.fontSize = `${(uiPrefs.scale || 1) * 16}px`;
  }, [uiPrefs.theme, uiPrefs.scale]);

  const active = <T extends BaseEntity>(items: T[]) => items.filter(i => !i.deleted);

  const handleCollection = <T extends BaseEntity & { id: string }>(key: string, data: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) => ({
    add: (item: T) => { 
        const newData = [{ ...(item as any), updatedAt: new Date().toISOString() } as T, ...data]; 
        setter(newData); setItem(key, newData); setLastSync(new Date().toLocaleTimeString());
    },
    update: (item: T) => { 
        const newData = data.map(i => (i as any).id === (item as any).id ? { ...(item as any), updatedAt: new Date().toISOString() } as T : i); 
        setter(newData); setItem(key, newData); setLastSync(new Date().toLocaleTimeString());
    },
    upsert: (item: T) => {
        const exists = data.some(i => (i as any).id === (item as any).id);
        if (exists) {
            const newData = data.map(i => (i as any).id === (item as any).id ? { ...(item as any), updatedAt: new Date().toISOString() } as T : i);
            setter(newData); setItem(key, newData); setLastSync(new Date().toLocaleTimeString());
        } else {
            const newData = [{ ...(item as any), updatedAt: new Date().toISOString() } as T, ...data];
            setter(newData); setItem(key, newData); setLastSync(new Date().toLocaleTimeString());
        }
    },
    upsertMany: (items: T[]) => {
        const newData = [...data];
        items.forEach(item => {
            const idx = newData.findIndex(i => (i as any).id === (item as any).id);
            if (idx > -1) {
                newData[idx] = { ...(item as any), updatedAt: new Date().toISOString() } as T;
            } else {
                newData.unshift({ ...(item as any), updatedAt: new Date().toISOString() } as T);
            }
        });
        setter(newData); setItem(key, newData); setLastSync(new Date().toLocaleTimeString());
    },
    remove: (id: string) => { 
        const newData = data.map(i => (i as any).id === id ? { ...(i as any), deleted: true, updatedAt: new Date().toISOString() } as T : i); 
        setter(newData); setItem(key, newData); setLastSync(new Date().toLocaleTimeString());
    }
  });

  const ordMgr = handleCollection('orders', orders, setOrders);
  const prodMgr = handleCollection('production', production, setProduction);
  const designMgr = handleCollection('designs', designs, setDesigns);
  const karigarMgr = handleCollection('karigars', karigars, setKarigars);
  const agentMgr = handleCollection('agents', agents, setAgents);
  const custMgr = handleCollection('customers', customers, setCustomers);
  const supplierMgr = handleCollection('suppliers', suppliers, setSuppliers);
  const teamMgr = handleCollection('team', team, setTeam);
  const invMgr = handleCollection('inventory', inventory, setInventory);
  const txnMgr = handleCollection('transactions', transactions, setTransactions);
  const jobWorkMgr = handleCollection('jobWorks', jobWorks, setJobWorks);
  const sampleMgr = handleCollection('samples', samples, setSamples);
  const qualityMgr = handleCollection('qualityReports', qualityReports, setQualityReports);
  const inspectionMgr = handleCollection('inspections', inspections, setInspections);
  const attendanceMgr = handleCollection('attendance', attendance, setAttendance);
  const loanMgr = handleCollection('loans', loans, setLoans);
  const leaveMgr = handleCollection('leaves', leaves, setLeaves);
  const packMgr = handleCollection('packs', packs, setPacks);
  const transferMgr = handleCollection('transfers', transfers, setTransfers);
  const auditMgr = handleCollection('stockAudits', stockAudits, setStockAudits);
  const projectMgr = handleCollection('projects', projects, setProjects);

  const handleUpdatePayrollAdjustment = (key: string, adjustment: PayrollAdjustment) => {
    const newAdjustments = { ...payrollAdjustments, [key]: adjustment };
    setPayrollAdjustments(newAdjustments);
    setItem('payrollAdjustments', newAdjustments);
  };

  const handleUpdateFeatures = (newFeatures: Record<string, boolean>) => {
    setFeatures(newFeatures);
    setItem('texflow_features', newFeatures);
  };

  const handleUpdateShopifyConfig = (config: ShopifyConfig) => {
    setShopifyConfig(config);
    setItem('texflow_shopify_config', config);
  };

  const handleUpdateSecurityConfig = (config: SecurityConfig) => {
    setSecurityConfig(config);
    setItem('texflow_security_config', config);
  };

  const handleUpdateCommunicationConfig = (config: CommunicationConfig) => {
    setCommunicationConfig(config);
    setItem('texflow_communication_config', config);
  };

  const handleUpdateAdvancedConfig = (config: AdvancedConfig) => {
    setAdvancedConfig(config);
    setItem('texflow_advanced_config', config);
  };

  const handleAddNotification = (notification: Partial<Notification>) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'INFO',
      read: false,
      createdAt: new Date().toISOString(),
      ...notification
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    setItem('notifications', updated);
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    setItem('notifications', updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setItem('notifications', updated);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    setItem('notifications', updated);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setItem('notifications', []);
  };

  const handleAddTask = (task: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: task.title || 'New Task',
      description: task.description || '',
      status: task.status || 'TODO',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      ...task
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    setItem('tasks', updated);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(updated);
    setItem('tasks', updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    setItem('tasks', updated);
  };

  const handleUpdateInvoiceConfig = (config: InvoiceConfig) => {
    setInvoiceConfig(config);
    setItem('texflow_invoice_config', config);
  };

  const handleLogout = () => { setIsAuthenticated(false); setCurrentUser(null); };

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-macos-bg dark:bg-black text-slate-900 dark:text-white gap-8">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-macos-accent animate-spin opacity-20" />
                <Loader2 className="w-16 h-16 text-macos-accent animate-spin absolute top-0 left-0" style={{ animationDuration: '3s' }} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Ravi-Textile ERP</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">Initializing macOS Interface...</p>
              </div>
          </div>
      );
  }

  if (!isAuthenticated) {
      return <Login onLogin={(u, p) => { if (u === 'admin' && p === 'admin') { setIsAuthenticated(true); setCurrentUser(team.find(t => t.name === u) || { id: 'admin', name: 'Administrator', role: 'ADMIN', status: 'ACTIVE' } as TeamMember); refreshData(); return true; } return false; }} companyInfo={companyInfo} />;
  }

  const currencySymbol = (invoiceConfig.currency === 'INR' ? '₹' : 
                          invoiceConfig.currency === 'USD' ? '$' : 
                          invoiceConfig.currency === 'EUR' ? '€' : 
                          invoiceConfig.currency) || '₹';

  return (
    <div className="flex h-screen bg-macos-bg dark:bg-black text-slate-900 dark:text-white font-sans overflow-hidden transition-all duration-500">
        <Sidebar 
          currentView={currentView} 
          setView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} 
          onLogout={handleLogout} 
          user={currentUser || undefined} 
          onProfileClick={() => setIsProfileOpen(true)} 
          uiPrefs={uiPrefs} 
          onUpdateUiPrefs={setUiPrefs} 
          companyInfo={companyInfo} 
          features={features}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <header className="h-16 flex items-center justify-between px-4 lg:px-8 glass border-b border-macos-border dark:border-macos-darkBorder shrink-0 z-40">
                <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">
                        {currentView.replace('_', ' ')}
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-slate-500 hover:bg-black/10 dark:hover:bg-white/10 transition-all text-xs font-medium"
                    >
                        <Command className="w-3.5 h-3.5" />
                        <span>Search...</span>
                        <span className="opacity-40 ml-2">⌘K</span>
                    </button>
                    <div className="h-4 w-px bg-macos-border dark:bg-macos-darkBorder" />
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Sync: {lastSync}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 custom-scrollbar" id="main-content">
                <div className="max-w-[1400px] mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            {currentView === 'DASHBOARD' && <Dashboard inventory={active(inventory)} production={active(production)} orders={active(orders)} karigars={active(karigars)} machines={active(machines)} features={features} currency={currencySymbol} />}
                            
                            {/* Master Hubs */}
                            {currentView === 'KARIGARS' && <Karigars karigars={active(karigars)} onAdd={karigarMgr.add} onUpdate={karigarMgr.update} onDelete={karigarMgr.remove} currency={currencySymbol} />}
                            {currentView === 'KARIGAR_KHATA' && <KarigarKhata karigars={active(karigars)} onUpdateKarigar={karigarMgr.update} currency={currencySymbol} />}
                            {currentView === 'AGENTS' && <Agents agents={active(agents)} onAdd={agentMgr.add} onUpdate={agentMgr.update} onDelete={agentMgr.remove} />}
                            {currentView === 'OFFICES' && <Offices />}
                            {currentView === 'TEAM' && <Employees team={active(team)} onAdd={teamMgr.add} onUpdate={teamMgr.update} onDelete={teamMgr.remove} currency={currencySymbol} />}
                            {currentView === 'CUSTOMERS' && <Masters customers={active(customers)} team={active(team)} agents={active(agents)} karigars={active(karigars)} suppliers={active(suppliers)} onAddCustomer={custMgr.add} onUpdateCustomer={custMgr.update} onAddTeam={teamMgr.add} onUpdateTeam={teamMgr.update} onAddAgent={agentMgr.add} onUpdateAgent={agentMgr.update} onDeleteAgent={agentMgr.remove} onAddKarigar={karigarMgr.add} onUpdateKarigar={karigarMgr.update} onAddSupplier={supplierMgr.add} onUpdateSupplier={supplierMgr.update} onDeleteCustomer={custMgr.remove} onDeleteKarigar={karigarMgr.remove} onDeleteSupplier={supplierMgr.remove} onDeleteTeam={teamMgr.remove} currency={currencySymbol} />}
                            {currentView === 'SUPPLIERS' && <Suppliers suppliers={active(suppliers)} purchaseOrders={active(purchaseOrders)} inventory={active(inventory)} onAddPO={handleCollection('purchaseOrders', purchaseOrders, setPurchaseOrders).add} onUpdatePO={handleCollection('purchaseOrders', purchaseOrders, setPurchaseOrders).update} onAddSupplier={supplierMgr.add} onUpdateSupplier={supplierMgr.update} onDeleteSupplier={supplierMgr.remove} currency={currencySymbol} />}

                            {/* Sales & Orders */}
                            {currentView === 'ORDERS' && <SalesOrder orders={active(orders)} customers={active(customers)} inventory={active(inventory)} designs={active(designs)} agents={active(agents)} onAddOrder={ordMgr.add} onUpdateOrder={ordMgr.update} onDeleteOrder={ordMgr.remove} currency={currencySymbol} />}
                            {currentView === 'DELIVERY_CHALLAN' && <DeliveryChallan orders={active(orders)} customers={active(customers)} onAddChallan={ordMgr.add} onUpdateChallan={ordMgr.update} currency={currencySymbol} companyInfo={companyInfo} />}

                            {/* Production & Inventory */}
                            {currentView === 'PRODUCTION' && <Production jobs={active(production)} karigars={active(karigars)} designs={active(designs)} machines={active(machines)} samples={active(samples)} onAddJob={prodMgr.add} onUpdateJob={prodMgr.update} currency={currencySymbol} />}
                            {currentView === 'SAMPLING' && <Sampling samples={active(samples)} designs={active(designs)} karigars={active(karigars)} customers={active(customers)} onAdd={sampleMgr.add} onUpdate={sampleMgr.update} onDelete={sampleMgr.remove} currency={currencySymbol} />}
                            {currentView === 'TRACK_LOTS' && <TrackLots jobs={active(production)} onUpdateJob={prodMgr.update} />}
                            {currentView === 'QUALITY' && <QualityControl reports={active(qualityReports)} inspections={active(inspections)} onAddInspection={inspectionMgr.add} currency={currencySymbol} />}
                            {currentView === 'INVENTORY' && <Inventory items={active(inventory)} production={active(production)} designs={active(designs)} onAdd={invMgr.add} onUpdate={invMgr.update} onDelete={invMgr.remove} currency={currencySymbol} />}
                            {currentView === 'CATALOG' && <DesignCatalog designs={active(designs)} inventory={active(inventory)} onAdd={designMgr.add} onUpdate={designMgr.update} onDelete={designMgr.remove} currency={currencySymbol} />}
                            {currentView === 'DESIGN_RECIPE' && <DesignRecipe designs={active(designs)} inventory={active(inventory)} onAdd={designMgr.add} onUpdate={designMgr.update} onDelete={designMgr.remove} currency={currencySymbol} />}
                            {currentView === 'JOB_WORK' && <JobWorkComp jobs={active(jobWorks)} designs={active(designs)} inventory={active(inventory)} onAdd={jobWorkMgr.add} onUpdate={jobWorkMgr.update} currency={currencySymbol} />}
                            {currentView === 'STOCK_TRANSFER' && <StockTransferComp inventory={active(inventory)} transfers={active(transfers)} onAdd={transferMgr.add} onUpdate={transferMgr.update} onDelete={transferMgr.remove} />}
                            {currentView === 'PACK_DESIGN' && <PackDesign designs={active(designs)} packs={active(packs)} onAddPack={packMgr.add} onUpdatePack={packMgr.update} onDeletePack={packMgr.remove} currency={currencySymbol} />}
                            {currentView === 'STOCK_AUDIT' && <PhysicalAudit items={active(inventory)} audits={active(stockAudits)} onCommitAudit={auditMgr.add} currency={currencySymbol} />}
                            {currentView === 'ASSETS' && (
                              <Assets 
                                machines={active(machines)} 
                                maintenance={active(maintenance)} 
                                onAddMachine={handleCollection('machines', machines, setMachines).add}
                                onUpdateMachine={handleCollection('machines', machines, setMachines).update}
                                onDeleteMachine={handleCollection('machines', machines, setMachines).remove}
                                onAddMaintenance={handleCollection('maintenance', maintenance, setMaintenance).add}
                                currency={currencySymbol} 
                              />
                            )}

                            {/* Utilities & Settings */}
                            {currentView === 'TAX_INVOICE' && (
                              <TaxInvoice 
                                orders={active(orders)} 
                                customers={active(customers)} 
                                onAddInvoice={ordMgr.add}
                                currency={currencySymbol} 
                              />
                            )}
                            {currentView === 'SALES_RETURN' && <SalesReturn orders={active(orders)} customers={active(customers)} onAddReturn={ordMgr.add} currency={currencySymbol} />}
                            {currentView === 'PURCHASE_ORDER' && <PurchaseOrderComp purchaseOrders={active(purchaseOrders)} suppliers={active(suppliers)} inventory={active(inventory)} onAddPO={handleCollection('purchaseOrders', purchaseOrders, setPurchaseOrders).add} onUpdatePO={handleCollection('purchaseOrders', purchaseOrders, setPurchaseOrders).update} currency={currencySymbol} />}
                            {currentView === 'PURCHASE_INWARD' && <PurchaseInward purchaseOrders={active(purchaseOrders)} inventory={active(inventory)} onUpdateInventory={invMgr.update} onUpdatePO={handleCollection('purchaseOrders', purchaseOrders, setPurchaseOrders).update} currency={currencySymbol} />}
                            {currentView === 'PURCHASE_RETURN' && <PurchaseReturn purchaseOrders={active(purchaseOrders)} onAddReturn={(poId, reason) => {
                                const po = purchaseOrders.find(p => p.id === poId);
                                if (po) {
                                    handleCollection('purchaseOrders', purchaseOrders, setPurchaseOrders).update({ ...po, status: 'CANCELLED' });
                                    txnMgr.add({
                                        id: `DN-${Date.now()}`,
                                        date: new Date().toISOString().split('T')[0],
                                        description: `Purchase Return: ${po.supplierName} - ${reason}`,
                                        amount: po.totalAmount,
                                        type: 'INCOME',
                                        category: 'PURCHASE_RETURN',
                                        paymentMethod: 'ADJUSTMENT',
                                        subType: 'DEBIT_NOTE',
                                        referenceId: po.supplierId
                                    } as Transaction);
                                }
                            }} currency={currencySymbol} />}
                            {currentView === 'CREDIT_NOTE' && <CreditDebitNotes type="CREDIT" transactions={active(transactions)} customers={active(customers)} suppliers={active(suppliers)} onAddNote={txnMgr.add} currency={currencySymbol} />}
                            {currentView === 'DEBIT_NOTE' && <CreditDebitNotes type="DEBIT" transactions={active(transactions)} customers={active(customers)} suppliers={active(suppliers)} onAddNote={txnMgr.add} currency={currencySymbol} />}
                            {currentView === 'CRM' && (
                              <CRM 
                                leads={active(leads)} 
                                designs={active(designs)}
                                onAddLead={handleCollection('leads', leads, setLeads).add} 
                                onUpdateLead={handleCollection('leads', leads, setLeads).update} 
                                onDeleteLead={handleCollection('leads', leads, setLeads).remove}
                                onConvertToCustomer={(lead) => {
                                  const customer: Customer = {
                                    id: `CUST-${Date.now().toString().slice(-4)}`,
                                    name: lead.companyName,
                                    contactPerson: lead.contactPerson,
                                    phone: lead.phone || '',
                                    email: lead.email || '',
                                    address: lead.address || '',
                                    gstin: '',
                                    type: 'RETAILER',
                                    status: 'ACTIVE',
                                    creditLimit: 0,
                                    balance: 0,
                                    tags: ['FROM_LEAD']
                                  };
                                  custMgr.add(customer);
                                  handleCollection('leads', leads, setLeads).update({ ...lead, status: 'WON' });
                                }}
                                currency={currencySymbol} 
                              />
                            )}
                            {currentView === 'REPORTS' && (
                              <Reports 
                                inventory={active(inventory)} 
                                production={active(production)} 
                                orders={active(orders)} 
                                suppliers={active(suppliers)}
                                currency={currencySymbol} 
                              />
                            )}
                            {currentView === 'ACCOUNTING' && <Accounting transactions={active(transactions)} onAddTransaction={txnMgr.add} customers={active(customers)} karigars={active(karigars)} agents={active(agents)} team={active(team)} loans={active(loans)} purchaseOrders={active(purchaseOrders)} salesOrders={active(orders)} currency={currencySymbol} />}
                            {currentView === 'CASH_BOOK' && <CashBook transactions={active(transactions)} onAddTransaction={txnMgr.add} currency={currencySymbol} />}
                            {currentView === 'AGENT_KHATA' && <AgentKhata agents={active(agents)} onUpdateAgent={agentMgr.update} currency={currencySymbol} />}
                            {currentView === 'ATTENDANCE' && (
                            <Attendance 
                                team={active(team)} 
                                records={active(attendance)} 
                                loans={active(loans)} 
                                leaves={active(leaves)} 
                                payrollAdjustments={payrollAdjustments}
                                onSaveRecord={attendanceMgr.upsert} 
                                onSaveManyRecords={attendanceMgr.upsertMany}
                                onUpdateTeamMember={teamMgr.update}
                                onAddLoan={loanMgr.upsert}
                                onDeleteLoan={loanMgr.remove}
                                onAddLeave={leaveMgr.upsert}
                                onUpdateLeave={leaveMgr.upsert}
                                onUpdatePayrollAdjustment={handleUpdatePayrollAdjustment}
                                currency={currencySymbol}
                                companyInfo={companyInfo}
                            />
                            )}
                            {currentView === 'PAYROLL' && (
                            <Attendance 
                                team={active(team)} 
                                records={active(attendance)} 
                                loans={active(loans)} 
                                leaves={active(leaves)} 
                                payrollAdjustments={payrollAdjustments}
                                onSaveRecord={attendanceMgr.upsert} 
                                onSaveManyRecords={attendanceMgr.upsertMany}
                                onUpdateTeamMember={teamMgr.update}
                                onAddLoan={loanMgr.upsert}
                                onDeleteLoan={loanMgr.remove}
                                onAddLeave={leaveMgr.upsert}
                                onUpdateLeave={leaveMgr.upsert}
                                onUpdatePayrollAdjustment={handleUpdatePayrollAdjustment}
                                currency={currencySymbol}
                                companyInfo={companyInfo}
                                initialTab="PAYROLL"
                            />
                            )}
                            {currentView === 'SETTINGS' && (
                              <Settings 
                                uiPrefs={uiPrefs} 
                                onUpdateUiPrefs={setUiPrefs} 
                                companyInfo={companyInfo} 
                                onUpdateCompanyInfo={setCompanyInfo} 
                                features={features} 
                                onUpdateFeatures={handleUpdateFeatures} 
                                shopifyConfig={shopifyConfig}
                                onUpdateShopifyConfig={handleUpdateShopifyConfig}
                                securityConfig={securityConfig}
                                onUpdateSecurityConfig={handleUpdateSecurityConfig}
                                communicationConfig={communicationConfig}
                                onUpdateCommunicationConfig={handleUpdateCommunicationConfig}
                                advancedConfig={advancedConfig}
                                onUpdateAdvancedConfig={handleUpdateAdvancedConfig}
                                invoiceConfig={invoiceConfig}
                                onUpdateInvoiceConfig={handleUpdateInvoiceConfig}
                                team={active(team)} 
                                lastSync={lastSync} 
                              />
                            )}
                            {currentView === 'NOTIFICATIONS' && <NotificationCenter notifications={notifications} onMarkAsRead={handleMarkAsRead} onMarkAllAsRead={handleMarkAllAsRead} onDelete={handleDeleteNotification} onClearAll={handleClearAllNotifications} />}
                            {currentView === 'TASKS' && <TaskManager tasks={tasks} team={active(team)} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />}
                            {currentView === 'PROJECTS' && <Projects projects={active(projects)} team={active(team)} customers={active(customers)} onAddProject={projectMgr.add} onUpdateProject={projectMgr.update} onDeleteProject={projectMgr.remove} currency={currencySymbol} />}
                            {currentView === 'OPENING_STOCK' && <OpeningStock items={active(inventory)} onAdd={invMgr.add} onUpdate={invMgr.update} onDelete={invMgr.remove} currency={currencySymbol} />}
                            {currentView === 'YARN_MANAGEMENT' && (
                              <YarnManagement
                                lots={active(yarnLots)}
                                blends={active(yarnBlends)}
                                onAddLot={handleCollection('yarnLots', yarnLots, setYarnLots).add}
                                onUpdateLot={handleCollection('yarnLots', yarnLots, setYarnLots).update}
                                onDeleteLot={handleCollection('yarnLots', yarnLots, setYarnLots).remove}
                                onAddBlend={handleCollection('yarnBlends', yarnBlends, setYarnBlends).add}
                                onUpdateBlend={handleCollection('yarnBlends', yarnBlends, setYarnBlends).update}
                                currency={currencySymbol}
                              />
                            )}
                            {currentView === 'DYEING_PROCESSING' && (
                              <DyeingProcessing
                                jobs={active(dyeingJobs)}
                                onAddJob={handleCollection('dyeingJobs', dyeingJobs, setDyeingJobs).add}
                                onUpdateJob={handleCollection('dyeingJobs', dyeingJobs, setDyeingJobs).update}
                                onDeleteJob={handleCollection('dyeingJobs', dyeingJobs, setDyeingJobs).remove}
                                currency={currencySymbol}
                              />
                            )}
                            {currentView === 'FABRIC_COSTING' && (
                              <FabricCostingComp
                                costings={active(fabricCostings)}
                                designs={active(designs)}
                                onAdd={handleCollection('fabricCostings', fabricCostings, setFabricCostings).add}
                                onUpdate={handleCollection('fabricCostings', fabricCostings, setFabricCostings).update}
                                onDelete={handleCollection('fabricCostings', fabricCostings, setFabricCostings).remove}
                                currency={currencySymbol}
                              />
                            )}
                            {currentView === 'DISPATCH_PLANNER' && (
                              <DispatchPlanner
                                dispatches={active(dispatches)}
                                orders={active(orders)}
                                onAdd={handleCollection('dispatches', dispatches, setDispatches).add}
                                onUpdate={handleCollection('dispatches', dispatches, setDispatches).update}
                                onDelete={handleCollection('dispatches', dispatches, setDispatches).remove}
                                currency={currencySymbol}
                              />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
        <TexBot contextData={{ inventory: active(inventory), production: active(production), orders: active(orders) }} />
        {currentUser && <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={currentUser} onUpdate={u => { setCurrentUser(u); teamMgr.update(u); }} onLogout={handleLogout} />}
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
          onNavigate={setCurrentView}
          inventory={active(inventory)}
          orders={active(orders)}
          jobs={active(production)}
        />
    </div>
  );
};

export default App;
