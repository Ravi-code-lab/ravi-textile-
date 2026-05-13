import React, { useState, useMemo } from 'react';
import { Agent } from '../types';
import { UserCheck, Search, Plus, Phone, MapPin, Edit2, Trash2, Percent, Briefcase } from 'lucide-react';
import BaseModal from './BaseModal';

interface AgentsProps {
  agents: Agent[];
  onAdd: (a: Agent) => void;
  onUpdate?: (a: Agent) => void;
  onDelete?: (id: string) => void;
}

const Agents: React.FC<AgentsProps> = ({ agents, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [formData, setFormData] = useState<Partial<Agent>>({ name: '', phone: '', area: '' });

  const filteredAgents = useMemo(() => {
    const searchLower = (filter || '').toLowerCase();
    return (agents || []).filter(a => 
      (a.name || '').toLowerCase().includes(searchLower) || 
      (a.area || '').toLowerCase().includes(searchLower)
    );
  }, [agents, filter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id && onUpdate) {
      onUpdate(formData as Agent);
    } else {
      onAdd({ ...formData, id: `AG-${Date.now().toString().slice(-4)}` } as Agent);
    }
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', area: '' });
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-600 rounded-lg text-white">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Agent Registry</h2>
            <p className="text-xs text-slate-500">Manage brokers and sales commission agents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
              placeholder="Search agents..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button onClick={() => { setFormData({name:'', phone:'', area:''}); setIsModalOpen(true); }} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
             <Plus className="w-4 h-4" /> Add Agent
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex-1">
        <div className="overflow-auto h-full custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Agent Name</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Working Area</th>
                <th className="px-6 py-4 text-center">Commission</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAgents.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sky-50 dark:bg-sky-900/30 text-sky-600 rounded-full flex items-center justify-center font-bold text-xs">{a.name.charAt(0)}</div>
                      <span className="font-bold text-slate-800 dark:text-white uppercase">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500">{a.phone || 'NA'}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium uppercase"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {a.area || 'General'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                       <Percent className="w-3 h-3"/> 2.0%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setFormData(a); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-sky-600"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => onDelete?.(a.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAgents.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic">No agents registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Agent" : "Register New Agent"} size="sm">
         <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-1">Agent Name</label>
              <input required className="w-full border dark:border-slate-700 rounded-lg p-3 text-sm bg-white dark:bg-slate-800 outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Arvind Broker" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-1">Mobile / Phone</label>
              <input required className="w-full border dark:border-slate-700 rounded-lg p-3 text-sm bg-white dark:bg-slate-800 outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-1">Operating Area</label>
              <input required className="w-full border dark:border-slate-700 rounded-lg p-3 text-sm bg-white dark:bg-slate-800 outline-none" value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="e.g. Ring Road, Surat" />
            </div>
            <button type="submit" className="w-full bg-sky-600 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-wider shadow-md hover:bg-sky-700 transition-all mt-4">Save Agent</button>
         </form>
      </BaseModal>
    </div>
  );
};

export default Agents;