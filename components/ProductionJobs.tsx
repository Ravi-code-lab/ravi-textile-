
import React, { useState, useMemo } from 'react';
import { ProductionJob, Design, Machine, Karigar } from '../types';
import { 
  List, LayoutGrid, Plus, Search, Scissors, PenTool, Sparkles, 
  CheckCircle, ArrowRight, Printer, Factory, 
  Layers, Check, Trash2, Download, RefreshCw, Box, BadgeCheck,
  TrendingUp, Clock, Gauge, ShieldCheck, Target, Cpu, FlaskConical
} from 'lucide-react';
import BaseModal from './BaseModal';

interface ProductionJobsProps {
  jobs: ProductionJob[];
  designs: Design[];
  machines: Machine[];
  karigars?: Karigar[];
  onUpdateJob: (job: ProductionJob) => void;
  onAddJob: (job: ProductionJob) => void;
  onDeleteJob?: (id: string) => void;
  currency?: string;
}

const STAGES = [
  { id: 'CUTTING', label: 'Cutting', icon: Scissors, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-100' },
  { id: 'STITCHING', label: 'Stitching', icon: PenTool, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-100' },
  { id: 'FINISHING', label: 'Finishing', icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/20', border: 'border-pink-100' },
  { id: 'READY', label: 'Ready', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100' }
];

const ProductionJobs: React.FC<ProductionJobsProps> = ({ 
  jobs, designs, machines, karigars = [], onUpdateJob, onAddJob, onDeleteJob, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('GRID');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setJobForm] = useState<Partial<ProductionJob>>({ 
    status: 'CUTTING', quantity: 0, progress: 0, priority: 'NORMAL', assignedMachine: '',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  const filteredJobs = useMemo(() => {
    const searchLower = (filter || '').toLowerCase();
    return (jobs || []).filter(j => {
      const jId = (j.id || '').toLowerCase();
      const pName = (j.productName || '').toLowerCase();
      const searchMatch = jId.includes(searchLower) || pName.includes(searchLower);
      const tabMatch = activeTab === 'ALL' || j.status === activeTab;
      return searchMatch && tabMatch;
    });
  }, [jobs, filter, activeTab]);

  // Design selection logic for batch requirement projection
  const selectedDesign = useMemo(() => designs.find(d => d.name === formData.productName), [formData.productName, designs]);
  const batchRequirements = useMemo(() => {
      if (!selectedDesign || !formData.quantity) return [];
      return (selectedDesign.recipe || []).map(r => ({
          ...r,
          totalRequired: r.quantity * (formData.quantity || 0)
      }));
  }, [selectedDesign, formData.quantity]);

  const handleNextStage = (e: React.MouseEvent, job: ProductionJob) => {
    e.stopPropagation();
    const currentIdx = STAGES.findIndex(s => s.id === job.status);
    if (currentIdx < STAGES.length - 1) {
      const nextStage = STAGES[currentIdx + 1];
      const newProgress = Math.min(100, ((currentIdx + 2) / STAGES.length) * 100);
      onUpdateJob({ 
        ...job, 
        status: nextStage.id, 
        progress: newProgress,
        updatedAt: new Date().toISOString() 
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) return;

    const jobData: ProductionJob = {
      id: editingId || `JOB-${Date.now().toString().slice(-4)}`,
      productName: formData.productName!,
      quantity: formData.quantity!,
      status: formData.status || 'CUTTING',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      deadline: formData.deadline || '',
      priority: formData.priority as any || 'NORMAL',
      progress: formData.progress || 25,
      assignedMachine: formData.assignedMachine,
      updatedAt: new Date().toISOString()
    };

    if (editingId) onUpdateJob(jobData);
    else onAddJob(jobData);
    
    setIsModalOpen(false);
  };

  const handleEdit = (job: ProductionJob) => {
    setEditingId(job.id);
    setJobForm(job);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 h-full flex flex-col bg-[#f0f2f5] dark:bg-slate-950 -m-8 p-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Production Queue</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Registry of active job slips and floor yield</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4"/> Export Dispatch
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setJobForm({ status: 'CUTTING', quantity: 0, progress: 0, priority: 'NORMAL', deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] });
              setIsModalOpen(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
             <Plus className="w-4 h-4" /> Initialize Job
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden flex-1">
          
          {/* Tab Navigation */}
          <div className="px-6 border-b border-slate-100 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-900/50">
              <div className="flex gap-8 overflow-x-auto no-scrollbar">
                  {['ALL', ...STAGES.map(s => s.id)].map(t => (
                      <button 
                        key={t} 
                        onClick={() => setActiveTab(t)} 
                        className={`py-4 px-1 text-xs font-bold border-b-2 transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        {t.replace('_', ' ')}
                      </button>
                  ))}
              </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 border-b flex items-center gap-3 bg-white dark:bg-slate-900">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border dark:border-slate-700 shadow-inner">
                  <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
                  <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
              </div>

              <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500/20 shadow-inner" 
                    placeholder="Search by Lot ID or Design..." 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                  />
              </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {viewMode === 'LIST' ? (
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-[#fafafa] dark:bg-slate-950 text-slate-500 font-bold border-b text-[10px] uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                              <th className="p-4 w-12 text-center">Mark</th>
                              <th className="p-4">Lot Identifier</th>
                              <th className="p-4">Current Stage</th>
                              <th className="p-4 text-right">Batch Magnitude</th>
                              <th className="p-4 text-center">Convergence</th>
                              <th className="p-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredJobs.map(job => {
                             const stage = STAGES.find(s => s.id === job.status) || STAGES[0];
                             return (
                                <tr key={job.id} onClick={() => handleEdit(job)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer group transition-all h-16">
                                    <td className="p-3">
                                        <div className={`w-10 h-10 rounded border ${stage.bg} ${stage.border} flex items-center justify-center shrink-0 shadow-inner group-hover:border-indigo-400 transition-colors`}>
                                            <stage.icon className={`w-5 h-5 ${stage.color}`} />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-700 dark:text-white uppercase text-sm tracking-tight">{job.productName}</p>
                                        <span className="text-[10px] font-mono text-slate-400 uppercase">#{job.id}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${stage.bg} ${stage.color} ${stage.border}`}>
                                            {stage.label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-700 dark:text-slate-300 tabular-nums">{job.quantity} PCS</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 w-24 mx-auto">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-400"><span>{job.progress}%</span></div>
                                            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600" style={{width:`${job.progress}%`}}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            {job.status !== 'READY' && (
                                                <button onClick={(e) => handleNextStage(e, job)} className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg border border-transparent hover:border-emerald-100 shadow-sm" title="Promote Stage">
                                                    <Check className="w-4 h-4"/>
                                                </button>
                                            )}
                                            <button className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg border border-transparent hover:border-indigo-100 shadow-sm">
                                                <Printer className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                             );
                          })}
                      </tbody>
                  </table>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
                      {filteredJobs.map(job => {
                          const stage = STAGES.find(s => s.id === job.status) || STAGES[0];
                          return (
                            <div 
                                key={job.id} 
                                onClick={() => handleEdit(job)}
                                className="bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm hover:shadow-md transition-all group flex flex-col h-[320px] cursor-pointer active:scale-[0.98]"
                            >
                                <div className={`flex-1 ${stage.bg} dark:bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-4 relative shadow-inner`}>
                                    <stage.icon className={`w-12 h-12 ${stage.color} opacity-40 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500`} />
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-800/90 text-[8px] font-bold border uppercase shadow-sm">{stage.label}</span>
                                    {job.priority === 'HIGH' && (
                                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[8px] font-bold uppercase animate-pulse shadow-sm">Urgent</span>
                                    )}
                                </div>
                                
                                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase truncate mb-1 leading-none">{job.productName}</h3>
                                <p className="text-[10px] font-mono text-slate-400 mb-4 tracking-tighter uppercase">LOT: #{job.id}</p>
                                
                                <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Magnitude</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">{job.quantity} PCS</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Convergence</span>
                                        <span className="text-xs font-black text-indigo-600 tabular-nums">{job.progress}%</span>
                                    </div>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>
      </div>

      {/* Job Specification Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? `Protocol Node: ${formData.id}` : "New Production Job"} size="2xl">
          <div className="flex flex-col lg:flex-row gap-8 pb-24">
              
              {/* Primary Form Stream */}
              <div className="flex-1 space-y-8">
                  {/* Basic Specifications */}
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest px-1">Design Linkage</label>
                              <select required className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 bg-slate-50/50 dark:bg-slate-950 transition-all shadow-inner" value={formData.productName} onChange={e => setJobForm({...formData, productName: e.target.value})}>
                                <option value="">Select Catalog Node...</option>
                                {designs.map(d => <option key={d.id} value={d.name}>{d.name} [{d.sku}]</option>)}
                              </select>
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest px-1">Batch Magnitude (PCS)</label>
                            <input type="number" required className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-black tabular-nums bg-slate-50/50 dark:bg-slate-950 outline-none shadow-inner" value={formData.quantity || ''} onChange={e => setJobForm({...formData, quantity: Number(e.target.value)})} placeholder="E.G. 1200" />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest px-1">Temporal Egress (Deadline)</label>
                            <input type="date" required className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-bold bg-slate-50/50 dark:bg-slate-950 outline-none shadow-inner" value={formData.deadline} onChange={e => setJobForm({...formData, deadline: e.target.value})} />
                          </div>
                      </div>
                  </div>

                  {/* Design Recipe Shards Projection (UPGRADED) */}
                  {batchRequirements.length > 0 && (
                      <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50 shadow-sm space-y-4 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-indigo-100/50 dark:border-indigo-800/30 pb-2">
                             <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2"><FlaskConical className="w-3.5 h-3.5"/> Material Uses Projection</h4>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Calculated via Fabric Average</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {batchRequirements.map((req, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/60 dark:bg-slate-800/40 p-3 rounded-xl border border-white/80 dark:border-slate-700/50 shadow-sm">
                                   <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase truncate leading-none mb-1">{req.materialName}</p>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Avg: {req.quantity} {req.unit}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Required</p>
                                      <p className="text-xs font-black text-indigo-600 dark:text-indigo-300 tabular-nums">{req.totalRequired.toLocaleString()} {req.unit}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                      </div>
                  )}

                  {/* Infrastructure Linkages */}
                  <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b pb-2 px-1">Floor Allocation Matrix</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest px-1">Machine Cluster</label>
                            <select className="w-full border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 outline-none shadow-sm" value={formData.assignedMachine} onChange={e => setJobForm({...formData, assignedMachine: e.target.value})}>
                                <option value="">Floor Resource Auto-Assign...</option>
                                {machines.map(m => <option key={m.id} value={m.name}>{m.name} [{m.status}]</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest px-1">Primary Karigar Node</label>
                            <select className="w-full border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold uppercase bg-slate-50 dark:bg-slate-950 outline-none shadow-sm">
                                <option value="">Link Personnel Node...</option>
                                {karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                            </select>
                        </div>
                      </div>
                  </div>
              </div>

              {/* Sidebar Settings Panel */}
              <div className="w-full lg:w-72 space-y-6 shrink-0">
                  {/* Status Block */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Protocol Stage</h4>
                      <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500" value={formData.status} onChange={e => setJobForm({...formData, status: e.target.value as any})}>
                          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                  </div>

                  {/* Priority Block */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Engagement Priority</h4>
                      <div className="space-y-2">
                        {['LOW', 'NORMAL', 'HIGH'].map(p => (
                            <button 
                                key={p} 
                                type="button" 
                                onClick={() => setJobForm({...formData, priority: p as any})} 
                                className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${formData.priority === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600'}`}
                            >
                                {p}
                            </button>
                        ))}
                      </div>
                  </div>

                  {/* Compliance Block */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Integrity State</h4>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Artifact Type</span>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Production Lot</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Sync State</span>
                              <BadgeCheck className="w-4 h-4 text-emerald-500"/>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Permanent Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-[110] rounded-b-xl shadow-lg px-10">
             <button type="button" onClick={() => { if(formData.id && confirm('Terminate this job slip permanently?')) onDeleteJob?.(formData.id!); setIsModalOpen(false); }} className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-all uppercase tracking-widest">Terminate Shard</button>
             <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">Discard</button>
                <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-3 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center gap-3">
                    <Check className="w-5 h-5"/> Commit Job Slip
                </button>
             </div>
          </div>
      </BaseModal>
    </div>
  );
};

export default ProductionJobs;
