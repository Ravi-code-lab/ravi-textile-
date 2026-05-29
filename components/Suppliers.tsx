
import React, { useState, useMemo } from 'react';
import { Supplier, PurchaseOrder, InventoryItem, PurchaseOrderItem, Unit } from '../types';
import { 
  Truck, Mail, MapPin, Star, AlertTriangle, Cpu, Plus, 
  ShoppingBag, Calendar, Printer, Trash2, Save, 
  LayoutGrid, List, Phone, TrendingUp, DollarSign, 
  Package, ChevronDown, Check, X, Filter, Search, 
  ShieldCheck, History, RefreshCcw, Download,
  Edit2, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeSupplierRisk } from '../services/geminiService';
import BaseModal from './BaseModal';

interface SuppliersProps {
  suppliers: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  inventory?: InventoryItem[];
  onAddPO?: (po: PurchaseOrder) => void;
  onUpdatePO?: (po: PurchaseOrder) => void;
  onAddSupplier?: (s: Supplier) => void;
  onUpdateSupplier?: (s: Supplier) => void;
  onDeleteSupplier?: (id: string) => void;
  currency?: string;
}

const Suppliers: React.FC<SuppliersProps> = ({ 
  suppliers = [], purchaseOrders = [], inventory = [], 
  onAddPO, onUpdatePO, onAddSupplier, onUpdateSupplier, onDeleteSupplier,
  currency = '₹' 
}) => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PURCHASE_ORDERS' | 'ANALYSIS'>('DIRECTORY');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '', contactPerson: '', email: '', phone: '', location: '', reliabilityScore: 90, materialsProvided: []
  });

  const [poData, setPoData] = useState<Partial<PurchaseOrder>>({
    supplierId: '',
    items: [], date: new Date().toISOString().split('T')[0], status: 'DRAFT'
  });

  const stats = useMemo(() => {
    const total = suppliers.length;
    const activePOs = purchaseOrders.filter(po => po.status !== 'RECEIVED' && po.status !== 'CANCELLED').length;
    const avgScore = total > 0 ? Math.round(suppliers.reduce((s, v) => s + v.reliabilityScore, 0) / total) : 0;
    return { total, activePOs, avgScore };
  }, [suppliers, purchaseOrders]);

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return suppliers.filter(s => {
      const name = s.name || '';
      const contactPerson = s.contactPerson || '';
      const materialsProvided = s.materialsProvided || [];
      return name.toLowerCase().includes(query) || 
             contactPerson.toLowerCase().includes(query) ||
             materialsProvided.some(m => (m || '').toLowerCase().includes(query));
    });
  }, [suppliers, searchQuery]);

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const supplier = {
      ...formData,
      id: formData.id || `SUP-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString()
    } as Supplier;

    if (formData.id && onUpdateSupplier) onUpdateSupplier(supplier);
    else onAddSupplier?.(supplier);
    
    setIsModalOpen(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeSupplierRisk(suppliers);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const getScoreBadge = (score: number) => {
    const color = score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                  score >= 60 ? 'text-amber-600 bg-amber-50 border-amber-100' : 
                  'text-rose-600 bg-rose-50 border-rose-100';
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${color}`}>{score}% Reliable</span>;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in font-sans">
      
      {/* Standard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Supplier Master</h2>
          <p className="text-xs text-slate-500 font-medium">Manage raw material vendors and procurement performance</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <Download className="w-4 h-4"/> Export CSV
          </button>
          <button 
            onClick={() => {
              setFormData({ name: '', contactPerson: '', email: '', phone: '', location: '', reliabilityScore: 90, materialsProvided: [] });
              setIsModalOpen(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
             <Plus className="w-4 h-4" /> New Supplier
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Vendors</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">{stats.total} Registered</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Active Pipeline</p>
              <h3 className="text-xl font-bold text-indigo-600 tabular-nums">{stats.activePOs} Purchase Orders</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Matrix Health</p>
              <h3 className="text-xl font-bold text-emerald-600 tabular-nums">{stats.avgScore}% Reliability</h3>
          </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {[
                        { id: 'DIRECTORY', label: 'Directory', icon: List },
                        { id: 'PURCHASE_ORDERS', label: 'Purchase Orders', icon: ShoppingBag },
                        { id: 'ANALYSIS', label: 'AI Intelligence', icon: Cpu }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)} 
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase flex items-center gap-2 ${activeTab === t.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <t.icon className="w-3.5 h-3.5"/> {t.label}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500/20 w-48 sm:w-64 shadow-inner" 
                      placeholder="Search vendors..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border">
                    <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
                    <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
                </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'DIRECTORY' ? (
                viewMode === 'LIST' ? (
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b sticky top-0 z-10">
                            <tr>
                              <th className="p-4">Vendor Entity</th>
                              <th className="p-4">Contact Person</th>
                              <th className="p-4">Materials Provided</th>
                              <th className="p-4 text-center">Score</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredSuppliers.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => { setFormData(s); setIsModalOpen(true); }}>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 dark:text-white uppercase truncate">{s.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.location}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-medium text-slate-600 dark:text-slate-300 uppercase text-xs">{s.contactPerson || '-'}</p>
                                        <p className="text-slate-400 text-[10px]">{s.phone || '-'}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {s.materialsProvided.slice(0, 2).map(m => (
                                                <span key={m} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 uppercase">{m}</span>
                                            ))}
                                            {s.materialsProvided.length > 2 && <span className="text-[9px] text-slate-400">+{s.materialsProvided.length-2}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">{getScoreBadge(s.reliabilityScore)}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setPoData({ 
                                                  supplierId: s.id, 
                                                  supplierName: s.name, 
                                                  items: [], 
                                                  date: new Date().toISOString().split('T')[0], 
                                                  status: 'DRAFT',
                                                  totalAmount: 0
                                                }); 
                                                setIsPoModalOpen(true); 
                                              }} 
                                              className="p-1.5 text-slate-400 hover:text-amber-600 border rounded-lg shadow-sm"
                                              title="Create Purchase Order"
                                            >
                                              <ShoppingBag className="w-4 h-4"/>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setFormData(s); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 border rounded-lg shadow-sm"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteSupplier?.(s.id); }} className="p-1.5 text-slate-400 hover:text-red-600 border rounded-lg shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        {filteredSuppliers.map(s => (
                            <div key={s.id} onClick={() => { setFormData(s); setIsModalOpen(true); }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600 font-bold uppercase">{s.name ? s.name.charAt(0) : '?'}</div>
                                    {getScoreBadge(s.reliabilityScore)}
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white uppercase truncate mb-1">{s.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{s.location}</p>
                                <div className="flex gap-2 mb-4">
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setPoData({ 
                                          supplierId: s.id, 
                                          supplierName: s.name, 
                                          items: [], 
                                          date: new Date().toISOString().split('T')[0], 
                                          status: 'DRAFT',
                                          totalAmount: 0
                                        }); 
                                        setIsPoModalOpen(true); 
                                      }}
                                      className="flex-1 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <ShoppingBag className="w-3 h-3"/> Create PO
                                    </button>
                                </div>
                                <div className="mt-auto pt-3 border-t space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><Phone className="w-3 h-3"/> {s.phone || 'NA'}</div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase truncate"><Mail className="w-3 h-3"/> {s.email || 'NA'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
              ) : activeTab === 'PURCHASE_ORDERS' ? (
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Procurement History</h3>
                        <button 
                          onClick={() => {
                            setPoData({ items: [], date: new Date().toISOString().split('T')[0], status: 'DRAFT', totalAmount: 0 });
                            setIsPoModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                        >
                            <Plus className="w-3 h-3"/> New PO
                        </button>
                    </div>
                    {purchaseOrders.length === 0 && <div className="py-20 text-center text-slate-400 italic">No purchase order history found.</div>}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {purchaseOrders.map(po => (
                            <div key={po.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex justify-between items-center group">
                                <div>
                                    <p className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest">#{po.id}</p>
                                    <h4 className="font-bold text-slate-800 dark:text-white uppercase mt-1">{po.supplierName}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{po.date} • {po.items.length} Items</p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Amount</p>
                                        <p className="font-black text-slate-800 dark:text-white tabular-nums">{currency}{po.totalAmount.toLocaleString()}</p>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors border rounded-lg"><Printer className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              ) : (
                <div className="p-10 max-w-2xl mx-auto space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Cpu className="w-32 h-32 text-indigo-400"/></div>
                        <h3 className="text-lg font-black uppercase tracking-widest mb-4">Gemini Risk Assessment</h3>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed">Analyze vendor reliability, procurement delays, and supply chain bottlenecks using real-time historical data.</p>
                        <button 
                            onClick={handleAnalyze} 
                            disabled={analyzing}
                            className="bg-white text-slate-900 px-10 py-3 rounded-xl font-bold uppercase text-[10px] hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            {analyzing ? <RefreshCcw className="w-4 h-4 animate-spin"/> : <Cpu className="w-4 h-4"/>} Run Diagnostic Analysis
                        </button>
                    </div>

                    {analysis && (
                        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 p-6 rounded-2xl shadow-sm animate-slide-up">
                            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Intelligence Report</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{analysis}</p>
                        </div>
                    )}
                </div>
              )}
          </div>
      </div>

      {/* Supplier Entry Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Vendor Profile" : "Register New Vendor"} size="lg">
         <form onSubmit={handleSaveSupplier} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Vendor / Company Legal Name</label>
                    <input required className="macos-input w-full font-bold" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="e.g. RELIANCE TEXTILE INDUSTRIES" />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Person</label>
                    <input required className="macos-input w-full font-bold uppercase" value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mobile / Phone</label>
                    <input required className="macos-input w-full font-bold" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <input type="email" className="macos-input w-full" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@customer.com" />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Operating Location</label>
                    <input className="macos-input w-full font-bold uppercase" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value.toUpperCase()})} placeholder="e.g. SURAT, GJ" />
                </div>
                <div className="md:col-span-2 space-y-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Materials / Services Provided</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.materialsProvided?.map((m, i) => (
                            <span key={i} className="bg-macos-accent/10 text-macos-accent px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border border-macos-accent/20">
                                {m} <X className="w-3 h-3 cursor-pointer hover:scale-110 transition-transform" onClick={() => setFormData({...formData, materialsProvided: formData.materialsProvided?.filter((_, idx) => idx !== i)})}/>
                            </span>
                        ))}
                    </div>
                    <input 
                        className="macos-input w-full font-medium uppercase" 
                        placeholder="Type and press Enter to add material node..." 
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                    setFormData({...formData, materialsProvided: [...(formData.materialsProvided || []), val.toUpperCase()]});
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-macos-border dark:border-macos-darkBorder text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  className="flex-1 macos-btn-primary py-4 uppercase text-xs font-bold tracking-widest shadow-lg"
                >
                  Save Supplier
                </motion.button>
            </div>
         </form>
      </BaseModal>

      {/* Purchase Order Modal */}
      <BaseModal isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} title="New Purchase Order Booking" size="xl">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!poData.supplierId || !poData.items?.length) return;
            const po = {
              ...poData,
              id: `PO-${Date.now().toString().slice(-4)}`,
              totalAmount: poData.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0),
              updatedAt: new Date().toISOString()
            } as PurchaseOrder;
            onAddPO?.(po);
            setIsPoModalOpen(false);
          }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Vendor / Supplier</label>
                    <select required className="macos-input w-full font-bold" value={poData.supplierId} onChange={e => {
                      const s = suppliers.find(sup => sup.id === e.target.value);
                      setPoData({...poData, supplierId: e.target.value, supplierName: s?.name || ''});
                    }}>
                        <option value="">Select Vendor...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Order Date</label>
                    <input type="date" className="macos-input w-full font-bold" value={poData.date} onChange={e => setPoData({...poData, date: e.target.value})} />
                  </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Manifest</h4>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <input list="inv-list" className="macos-input w-full text-xs" placeholder="Item Name (e.g. Raw Silk)" id="po-item-name" />
                      <datalist id="inv-list">{inventory.map(i => <option key={i.id} value={i.name}/>)}</datalist>
                    </div>
                    <input type="number" className="w-24 macos-input text-xs" placeholder="Qty" id="po-item-qty" />
                    <input type="number" className="w-24 macos-input text-xs" placeholder="Rate" id="po-item-rate" />
                    <button 
                      type="button" 
                      onClick={() => { 
                        const nameEl = document.getElementById('po-item-name') as HTMLInputElement;
                        const qtyEl = document.getElementById('po-item-qty') as HTMLInputElement;
                        const rateEl = document.getElementById('po-item-rate') as HTMLInputElement;
                        
                        if(nameEl.value && qtyEl.value) { 
                          setPoData({
                            ...poData, 
                            items: [
                              ...(poData.items || []), 
                              { 
                                productName: nameEl.value.toUpperCase(), 
                                quantity: Number(qtyEl.value), 
                                unit: Unit.KG, 
                                unitPrice: Number(rateEl.value) 
                              }
                            ]
                          }); 
                          nameEl.value = '';
                          qtyEl.value = '';
                          rateEl.value = '';
                        } 
                      }} 
                      className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white p-3 rounded-xl hover:scale-105 transition-transform"
                    >
                      <Plus className="w-4 h-4"/>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {poData.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-bold bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-[10px]">{idx + 1}</div>
                          <span className="uppercase">{it.productName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500">{it.quantity} {it.unit} @ {currency}{it.unitPrice}</span>
                          <button type="button" onClick={() => setPoData({...poData, items: poData.items?.filter((_, i) => i !== idx)})} className="text-rose-500 hover:text-rose-600"><X className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                    {(!poData.items || poData.items.length === 0) && (
                      <div className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed rounded-2xl">No items added to manifest</div>
                    )}
                  </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Estimated Total</span>
                  <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 tabular-nums">{currency}{(poData.items?.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0) || 0).toLocaleString()}</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsPoModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl border border-macos-border dark:border-macos-darkBorder text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Discard</button>
                <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Commit Purchase Node</button>
              </div>
          </form>
      </BaseModal>
    </div>
  );
};

export default Suppliers;
