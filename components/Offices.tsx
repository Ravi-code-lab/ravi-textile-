import React, { useState, useMemo } from 'react';
import { 
  Building, MapPin, Plus, Search, Home, Factory, Warehouse, 
  Edit2, Trash2, User, LayoutGrid, List, Map, ShieldCheck, 
  Globe, Gauge, ArrowUpRight, Filter, Download, MoreVertical,
  Activity, Database, Check, X, Tag
} from 'lucide-react';
import BaseModal from './BaseModal';

interface OfficeNode {
  id: string;
  name: string;
  type: 'OFFICE' | 'GODOWN' | 'FACTORY';
  manager: string;
  address: string;
  capacity?: number;
  utilization?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  tags?: string;
}

const Offices: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [filter, setFilter] = useState('');
  
  const [offices, setOffices] = useState<OfficeNode[]>([
    { id: '1', name: 'ROOT ADMINISTRATIVE HUB', type: 'OFFICE', manager: 'ADITYA SHARMA', address: 'B-BLOCK, RING ROAD, SURAT', capacity: 100, utilization: 45, status: 'ACTIVE' },
    { id: '2', name: 'SOUTH FABRIC REPOSITORY', type: 'GODOWN', manager: 'RAMESH BHAI', address: 'UDHNA GIDC, SURAT', capacity: 5000, utilization: 82, status: 'ACTIVE' },
    { id: '3', name: 'UNIT A - WEAVING CLUSTER', type: 'FACTORY', manager: 'SURESH VERMA', address: 'SACHIN GIDC, SURAT', capacity: 200, utilization: 65, status: 'ACTIVE' }
  ]);

  const [formData, setFormData] = useState<Partial<OfficeNode>>({ 
    type: 'GODOWN', status: 'ACTIVE', utilization: 0, capacity: 0 
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'OFFICE': return <Home className="w-5 h-5 text-indigo-500" />;
      case 'FACTORY': return <Factory className="w-5 h-5 text-amber-500" />;
      default: return <Warehouse className="w-5 h-5 text-blue-500" />;
    }
  };

  const filteredOffices = useMemo(() => {
    const searchLower = (filter || '').toLowerCase();
    return (offices || []).filter(o => 
      (o.name || '').toLowerCase().includes(searchLower) || 
      (o.manager || '').toLowerCase().includes(searchLower)
    );
  }, [offices, filter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    if (formData.id) {
      setOffices(offices.map(o => o.id === formData.id ? { ...o, ...formData } as OfficeNode : o));
    } else {
      setOffices([...offices, { ...formData, id: Date.now().toString() } as OfficeNode]);
    }
    setIsModalOpen(false);
  };

  const handleEdit = (o: OfficeNode) => {
    setFormData(o);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if(confirm('Terminate this location shard permanently?')) {
      setOffices(offices.filter(o => o.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      {/* Standard Style Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-none">Location Matrix</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry of branches, godowns and units</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
            <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
          </div>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
              placeholder="Search locations..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button onClick={() => { setFormData({type:'GODOWN', status:'ACTIVE', utilization: 0, capacity: 0}); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap">
             <Plus className="w-4 h-4" /> New Location
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
            {filteredOffices.map(office => (
              <div key={office.id} onClick={() => handleEdit(office)} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border dark:border-slate-700 shadow-inner">
                       {getTypeIcon(office.type)}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${office.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                        {office.type}
                    </span>
                 </div>
                 
                 <h4 className="font-bold text-slate-800 dark:text-white uppercase truncate">{office.name}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><User className="w-3 h-3 text-indigo-500"/> Lead: {office.manager}</p>
                 
                 <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-xs border-t border-slate-50 dark:border-slate-800 pt-3">
                        <span className="text-slate-400 uppercase font-medium">Load Index</span>
                        <span className={`font-bold tabular-nums ${office.utilization! > 80 ? 'text-red-500' : 'text-green-600'}`}>{office.utilization}%</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(office); }} className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border dark:border-slate-700">Mutation</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(office.id); }} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-lg transition-all border dark:border-slate-700"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                    <tr><th className="p-4 w-12 text-center">Mark</th><th className="p-4">Location Name</th><th className="p-4">Manager</th><th className="p-4">Status</th><th className="p-4 text-right">Utilization</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOffices.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors h-14 group cursor-pointer" onClick={() => handleEdit(o)}>
                            <td className="p-3 text-center">{getTypeIcon(o.type)}</td>
                            <td className="p-4 font-bold text-slate-700 dark:text-white uppercase">{o.name}</td>
                            <td className="p-4 font-medium text-slate-500 uppercase">{o.manager}</td>
                            <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${o.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700 border-green-100'}`}>{o.status}</span>
                            </td>
                            <td className="p-4 text-right font-black tabular-nums text-slate-800 dark:text-white">{o.utilization}%</td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(o); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Standard Style Location Entry Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Location Entry" : "New Location Entry"} size="xl">
         <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 pb-20">
            {/* Primary Form Area */}
            <div className="flex-1 space-y-8">
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Location Name (Legal)</label>
                        <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="e.g. SOUTH MAIN REPOSITORY" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Node Manager</label>
                        <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-bold uppercase outline-none" value={formData.manager || ''} onChange={e => setFormData({...formData, manager: e.target.value.toUpperCase()})} placeholder="FULL NAME" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Design Capacity (Units)</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-bold outline-none" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Physical Egress (Address)</label>
                        <textarea rows={3} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm outline-none" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} placeholder="Detailed address coordinates..." />
                    </div>
                  </div>
               </div>

               {/* Meta Artifacts Section */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b pb-2">Storage Artifacts</h4>
                  <div className="grid grid-cols-4 gap-4">
                      <div className="aspect-square bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center group hover:bg-slate-100 transition-all cursor-pointer">
                          <Database className="w-6 h-6 text-slate-300 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">View Shards</span>
                      </div>
                  </div>
               </div>
            </div>

            {/* Sidebar Settings Panel */}
            <div className="w-full lg:w-72 space-y-6 shrink-0">
                {/* Status Block */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Status Node</h4>
                    <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                        <option value="ACTIVE">ACTIVE NODE</option>
                        <option value="INACTIVE">DECOMMISSIONED</option>
                    </select>
                </div>

                {/* Type Block */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Node Classification</h4>
                    <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold uppercase" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="OFFICE">OFFICE HUB</option>
                        <option value="GODOWN">GODOWN / REPO</option>
                        <option value="FACTORY">PROD. UNIT</option>
                    </select>
                </div>

                {/* Performance Block */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Load Factor</h4>
                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Current Load %</label>
                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold" value={formData.utilization} onChange={e => setFormData({...formData, utilization: Number(e.target.value)})} />
                    </div>
                    <div className="pt-2">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                           <div className={`h-full ${formData.utilization! > 80 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${formData.utilization}%`}}></div>
                        </div>
                    </div>
                </div>

                {/* Meta Block */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Organization</h4>
                    <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Registry Tags</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold" placeholder="Separate with commas..." value={formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value})} />
                    </div>
                </div>
            </div>

            {/* Permanent Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-[110] rounded-b-xl shadow-lg px-10">
               <button onClick={() => { if(formData.id && confirm('Terminate this location shard?')) handleDelete(formData.id); setIsModalOpen(false); }} className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-all uppercase tracking-widest">Delete Artifact</button>
               <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2">
                      <Check className="w-4 h-4"/> Commit Location
                  </button>
               </div>
            </div>
         </form>
      </BaseModal>
    </div>
  );
};

export default Offices;