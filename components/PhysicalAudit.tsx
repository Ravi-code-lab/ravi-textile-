
import React, { useState, useMemo } from 'react';
import { InventoryItem, StockAudit } from '../types';
import { 
  SearchCheck, Plus, Search, Calendar, User, ShieldCheck, 
  AlertTriangle, ArrowRight, Save, History, Hash, MapPin, 
  CheckCircle2, Download, Filter, FileText, Calculator,
  RefreshCcw, ClipboardCheck, ArrowUpRight, ArrowDownLeft,
  // Fix: Added missing Printer import to resolve line 187 error
  Printer
} from 'lucide-react';
import BaseModal from './BaseModal';

interface PhysicalAuditProps {
  items: InventoryItem[];
  audits: StockAudit[];
  onCommitAudit: (audit: StockAudit) => void;
  currency?: string;
}

const PhysicalAudit: React.FC<PhysicalAuditProps> = ({ items, audits = [], onCommitAudit, currency = '₹' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [filter, setFilter] = useState('');
  
  // New Audit State
  const [auditForm, setAuditForm] = useState<Partial<StockAudit>>({
    date: new Date().toISOString().split('T')[0],
    godown: 'MAIN WAREHOUSE',
    performedBy: '',
    items: [],
    status: 'DRAFT'
  });

  const filteredAudits = useMemo(() => {
    const searchLower = filter.toLowerCase();
    return audits.filter(a => {
        const matchesSearch = a.performedBy.toLowerCase().includes(searchLower) || 
                            a.godown.toLowerCase().includes(searchLower) ||
                            a.id.toLowerCase().includes(searchLower);
        const isCompleted = a.status === 'COMPLETED';
        if (activeTab === 'PENDING') return matchesSearch && !isCompleted;
        return matchesSearch && isCompleted;
    });
  }, [audits, filter, activeTab]);

  const stats = useMemo(() => {
    const total = audits.length;
    const pending = audits.filter(a => a.status !== 'COMPLETED').length;
    const lastDate = total > 0 ? audits[0].date : 'Never';
    return { total, pending, lastDate };
  }, [audits]);

  const handleStartAudit = () => {
    // Pre-populate with current system items
    const auditItems = items.map(i => ({
        itemId: i.id,
        name: i.name,
        systemQty: i.quantity,
        physicalQty: i.quantity,
        unit: i.unit,
        variance: 0
    }));

    setAuditForm({
        id: `AUD-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        godown: 'MAIN WAREHOUSE',
        performedBy: '',
        items: auditItems,
        status: 'DRAFT'
    });
    setIsModalOpen(true);
  };

  const updatePhysicalQty = (itemId: string, qty: number) => {
    const updatedItems = (auditForm.items || []).map(item => {
        if (item.itemId === itemId) {
            return {
                ...item,
                physicalQty: qty,
                variance: qty - item.systemQty
            };
        }
        return item;
    });
    setAuditForm({ ...auditForm, items: updatedItems });
  };

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.performedBy) return;
    
    onCommitAudit({
        ...auditForm,
        status: 'COMPLETED',
        updatedAt: new Date().toISOString()
    } as StockAudit);
    
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in font-sans">
      
      {/* Standard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Inventory Audit Hub</h2>
          <p className="text-xs text-slate-500 font-medium">Verify physical stock accuracy and resolve ledger variances</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <Download className="w-4 h-4"/> Export Logs
          </button>
          <button 
            onClick={handleStartAudit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
             <Plus className="w-4 h-4" /> Start Physical Audit
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Audit Queue</p>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">{stats.pending} In-Progress</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Verification History</p>
              <h3 className="text-xl font-bold text-indigo-600 tabular-nums">{stats.total} Records</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last Reconciliation</p>
              <h3 className="text-xl font-bold text-emerald-600 tabular-nums">{stats.lastDate}</h3>
          </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden flex-1">
          {/* Controls Bar */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setActiveTab('PENDING')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${activeTab === 'PENDING' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Pending</button>
                    <button onClick={() => setActiveTab('COMPLETED')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${activeTab === 'COMPLETED' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>History</button>
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500/20 w-48 sm:w-64 shadow-inner" 
                      placeholder="Search auditor or location..." 
                      value={filter} 
                      onChange={e => setFilter(e.target.value)}
                    />
                </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b sticky top-0 z-10">
                      <tr>
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4">Audit ID</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Godown / Location</th>
                        <th className="p-4">Performed By</th>
                        <th className="p-4 text-center">Items</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAudits.map((audit, idx) => (
                          <tr key={audit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4 text-center font-bold text-slate-300">{idx + 1}</td>
                              <td className="p-4 font-mono font-bold text-indigo-600">#{audit.id}</td>
                              <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{audit.date}</td>
                              <td className="p-4 uppercase font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-slate-400"/> {audit.godown}
                              </td>
                              <td className="p-4 uppercase font-bold text-slate-600 dark:text-slate-400">{audit.performedBy}</td>
                              <td className="p-4 text-center font-bold tabular-nums">{audit.items?.length || 0} SKUs</td>
                              <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 border rounded-lg transition-colors shadow-sm"><FileText className="w-4 h-4"/></button>
                                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 border rounded-lg transition-colors shadow-sm"><Printer className="w-4 h-4"/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredAudits.length === 0 && (
                          <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic">No audit records found in this category.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Execution Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Physical Stock Verification Protocol" size="xl">
          <form onSubmit={handleCommit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 px-1">Auditor Name</label>
                      <input required className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm font-bold uppercase bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-indigo-500" value={auditForm.performedBy} onChange={e => setAuditForm({...auditForm, performedBy: e.target.value.toUpperCase()})} placeholder="e.g. ADITYA VERMA" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 px-1">Target Location</label>
                      <select className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm font-bold uppercase bg-white dark:bg-slate-900 outline-none" value={auditForm.godown} onChange={e => setAuditForm({...auditForm, godown: e.target.value})}>
                          <option value="MAIN WAREHOUSE">Main Warehouse</option>
                          <option value="SOUTH GODOWN">South Godown</option>
                          <option value="UNIT A FLOOR">Unit A Floor</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 px-1">Verification Date</label>
                      <input type="date" required className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-sm font-bold bg-white dark:bg-slate-900 outline-none" value={auditForm.date} onChange={e => setAuditForm({...auditForm, date: e.target.value})} />
                  </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Item Verification Matrix</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase">Real-time Variance Enabled</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold uppercase border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                              <tr>
                                  <th className="p-3">Material Node</th>
                                  <th className="p-3 text-center">System Stock</th>
                                  <th className="p-3 text-center">Physical Count</th>
                                  <th className="p-3 text-right">Variance</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(auditForm.items || []).map((item: any) => (
                                  <tr key={item.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300 uppercase">{item.name}</td>
                                      <td className="p-3 text-center font-bold text-slate-400 tabular-nums">{item.systemQty} {item.unit}</td>
                                      <td className="p-2 text-center">
                                          <input 
                                            type="number" 
                                            className="w-24 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center text-sm font-black bg-white dark:bg-slate-800 outline-none focus:ring-1 focus:ring-indigo-500" 
                                            value={item.physicalQty} 
                                            onChange={e => updatePhysicalQty(item.itemId, Number(e.target.value))} 
                                          />
                                      </td>
                                      <td className={`p-3 text-right font-black tabular-nums ${item.variance > 0 ? 'text-emerald-600' : item.variance < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                          {item.variance > 0 ? '+' : ''}{item.variance}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center shadow-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <Calculator className="w-5 h-5 text-indigo-400"/>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Integrity Metric</p>
                        <h3 className="text-sm font-black uppercase tracking-widest">
                           {(auditForm.items || []).filter((i:any) => i.variance !== 0).length} Discrepancies Found
                        </h3>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] text-indigo-400 uppercase font-bold mb-0.5">Audit Mode</p>
                      <h3 className="text-xs font-black uppercase tracking-widest">Full Node Recon</h3>
                  </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">Discard Shard</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4"/> Commit Verification
                </button>
              </div>
          </form>
      </BaseModal>
    </div>
  );
};

export default PhysicalAudit;
