import React, { useState, useMemo } from 'react';
import { Karigar } from '../types';
import { 
  Scissors, Search, Plus, User, Phone, MapPin, 
  Edit2, Trash2, LayoutGrid, List, ShieldCheck, 
  Camera, X, Check, Download, Star, Briefcase, Zap,
  TrendingUp, Activity, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import BaseModal from './BaseModal';
import { compressImage } from '../utils/imageUtils';

const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';
const ipc = isElectron ? (window as any).require('electron').ipcRenderer : null;

interface KarigarsProps {
  karigars: Karigar[];
  onAdd: (k: Karigar) => void;
  onUpdate?: (k: Karigar) => void;
  onDelete?: (id: string) => void;
  currency?: string;
}

interface KarigarUI extends Karigar {
  status?: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  efficiency?: number;
  profileImageUrl?: string;
  joinDate?: string;
}

const Karigars: React.FC<KarigarsProps> = ({ karigars, onAdd, onUpdate, onDelete, currency = '₹' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [filter, setFilter] = useState('');
  
  const [formData, setFormData] = useState<Partial<KarigarUI>>({ 
    name: '', skill: '', balance: 0, status: 'ACTIVE', efficiency: 85 
  });

  const filteredKarigars = useMemo(() => {
    const searchLower = (filter || '').toLowerCase();
    return (karigars || []).filter(k => 
      (k.name || '').toLowerCase().includes(searchLower) || 
      (k.skill || '').toLowerCase().includes(searchLower)
    );
  }, [karigars, filter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const kData = { 
      ...formData, 
      id: formData.id || `KAR-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString()
    } as Karigar;
    
    if (formData.id && onUpdate) onUpdate(kData);
    else onAdd(kData);
    
    setIsModalOpen(false);
    setFormData({ name: '', skill: '', balance: 0, status: 'ACTIVE', efficiency: 85 });
  };

  const handleEdit = (k: Karigar) => {
    setFormData(k);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isElectron && ipc) {
      const compressed = await compressImage(file, 400, 0.7);
      const res = await ipc.invoke('file:save', { base64Data: compressed });
      if (res?.success) setFormData({ ...formData, profileImageUrl: res.url });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      {/* Standard Style Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-none">Karigar Registry</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage workforce and artisanal master records</p>
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
              placeholder="Search artisans..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button onClick={() => { setFormData({name: '', skill: '', balance: 0, status: 'ACTIVE', efficiency: 85}); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap">
             <Plus className="w-4 h-4" /> New Karigar
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
            {filteredKarigars.map((k: KarigarUI) => (
              <div key={k.id} onClick={() => handleEdit(k)} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col relative overflow-hidden">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border dark:border-slate-700 overflow-hidden shadow-inner">
                       {k.profileImageUrl ? (
                          <img src={k.profileImageUrl} className="w-full h-full object-cover" />
                       ) : (
                          <User className="w-6 h-6 text-slate-300" />
                       )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${k.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {k.status}
                    </span>
                 </div>
                 
                 <h4 className="font-bold text-slate-800 dark:text-white uppercase truncate">{k.name}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{k.skill || 'Artisan'}</p>
                 
                 <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-xs border-t border-slate-50 dark:border-slate-800 pt-3">
                        <span className="text-slate-400 uppercase font-medium">Khata Balance</span>
                        <span className={`font-bold tabular-nums ${k.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{currency}{Math.abs(k.balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(k); }} className="flex-1 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border dark:border-slate-700">Mutation</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(k.id); }} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-lg transition-all border dark:border-slate-700"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase tracking-wider border-b dark:border-slate-800">
                    <tr><th className="p-4 w-12 text-center">Img</th><th className="p-4">Artisan Name</th><th className="p-4">Skill</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Balance</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredKarigars.map((k: KarigarUI) => (
                        <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors h-14 group cursor-pointer" onClick={() => handleEdit(k)}>
                            <td className="p-3">
                                <div className="w-8 h-8 rounded border bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                    {k.profileImageUrl ? <img src={k.profileImageUrl} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-slate-300"/>}
                                </div>
                            </td>
                            <td className="p-4 font-bold text-slate-700 dark:text-white uppercase">{k.name}</td>
                            <td className="p-4 font-medium text-slate-500 uppercase">{k.skill}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${k.status === 'INACTIVE' ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700 border-green-100'}`}>{k.status}</span>
                            </td>
                            <td className="p-4 text-right font-black tabular-nums text-slate-800 dark:text-white">{currency}{Math.abs(k.balance || 0).toLocaleString()}</td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(k); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(k.id); }} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Standard Style Karigar Entry Modal - Replicating the provided layout */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Karigar Entry" : "New Karigar Entry"} size="xl">
         <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 pb-8">
            {/* Primary Form Area */}
            <div className="flex-1 space-y-8">
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Karigar Full Name</label>
                        <input required className="macos-input w-full font-bold uppercase" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Abdul Razaq Khan" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Master Skill / Craft</label>
                        <input className="macos-input w-full font-bold uppercase" value={formData.skill || ''} onChange={e => setFormData({...formData, skill: e.target.value.toUpperCase()})} placeholder="e.g. HAND EMBROIDERY" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mobile Contact</label>
                        <input className="macos-input w-full font-bold" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Home Address / Location Reference</label>
                        <textarea rows={3} className="macos-input w-full" value={formData.id ? 'Physical coordinates stored in secondary vault...' : ''} placeholder="Detailed address information..." readOnly />
                    </div>
                  </div>
               </div>

               {/* Profile Image Section */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-macos-border dark:border-macos-darkBorder pb-2">Identification Artifact</h4>
                  <div className="w-40 aspect-square bg-black/[0.02] dark:bg-white/[0.02] border-2 border-dashed border-macos-border dark:border-macos-darkBorder rounded-2xl flex flex-col items-center justify-center relative group hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden">
                      {formData.profileImageUrl ? (
                          <div className="absolute inset-0 p-1.5"><img src={formData.profileImageUrl} className="w-full h-full object-cover rounded-xl" /></div>
                      ) : (
                          <>
                              <Camera className="w-8 h-8 text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Upload Asset</span>
                          </>
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} />
                  </div>
               </div>
            </div>

            {/* Sidebar Settings Panel */}
            <div className="w-full lg:w-72 space-y-6 shrink-0">
                {/* Status Block */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-macos-border dark:border-macos-darkBorder shadow-sm p-6 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-macos-border dark:border-macos-darkBorder pb-2">Status Node</h4>
                    <select className="macos-input w-full text-xs font-bold uppercase" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                        <option value="ACTIVE">ACTIVE NODE</option>
                        <option value="INACTIVE">INACTIVE NODE</option>
                    </select>
                </div>

                {/* Fiscal Block */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-macos-border dark:border-macos-darkBorder shadow-sm p-6 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-macos-border dark:border-macos-darkBorder pb-2">Fiscal Protocol</h4>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Yield Target %</label>
                        <input type="number" className="macos-input w-full font-bold" value={formData.efficiency} onChange={e => setFormData({...formData, efficiency: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Opening Balance ({currency})</label>
                        <input type="number" className="w-full bg-slate-900 text-green-400 border border-slate-800 rounded-xl p-3 text-sm font-black tabular-nums outline-none shadow-inner" value={formData.balance} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} />
                    </div>
                </div>

                {/* Meta Block */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-macos-border dark:border-macos-darkBorder shadow-sm p-6 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-macos-border dark:border-macos-darkBorder pb-2">Organization</h4>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Registry Tags</label>
                        <input className="macos-input w-full font-bold" placeholder="e.g. Master, Piece-rate" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Joining Egress</label>
                        <input type="date" className="macos-input w-full font-bold" value={formData.joinDate || ''} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                   <motion.button 
                     whileHover={{ scale: 1.01 }}
                     whileTap={{ scale: 0.99 }}
                     type="submit" 
                     className="macos-btn-primary py-4 uppercase text-xs font-bold tracking-widest shadow-lg flex items-center justify-center gap-2"
                   >
                       <Check className="w-4 h-4"/> Commit Karigar
                   </motion.button>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-macos-border dark:border-macos-darkBorder">Cancel</button>
                   {formData.id && (
                     <button type="button" onClick={() => { if(window.confirm('Terminate this Karigar shard permanently?')) { if(formData.id) onDelete?.(formData.id); setIsModalOpen(false); } }} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 py-2 rounded-lg transition-all uppercase tracking-widest mt-2">Delete Artifact</button>
                   )}
                </div>
            </div>
         </form>
      </BaseModal>
    </div>
  );
};

export default Karigars;