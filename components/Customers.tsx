
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { 
  Building, Search, Plus, MapPin, Phone, Landmark, 
  ArrowUpRight, LayoutGrid, List, Mail, Edit2, 
  Trash2, User, Globe, ShieldCheck, Filter, Download,
  Check, X, Loader2, Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import BaseModal from './BaseModal';

interface CustomersProps {
  customers: Customer[];
  onAdd: (c: Customer) => void;
  onUpdate?: (c: Customer) => void;
  onDelete?: (id: string) => void;
  currency?: string;
}

const Customers: React.FC<CustomersProps> = ({ 
  customers = [], onAdd, onUpdate, onDelete, currency = '₹' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [filter, setFilter] = useState('');
  const [formData, setFormData] = useState<Partial<Customer>>({ 
    type: 'RETAILER', name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' 
  });

  const customFields = useMemo(() => {
    const raw = localStorage.getItem('erpnext_custom_fields');
    if (raw) {
      try {
        return JSON.parse(raw).filter((f: any) => f.docType === 'Customer');
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  }, [isModalOpen]);

  const filteredCustomers = useMemo(() => {
    const searchLower = (filter || '').toLowerCase();
    return (customers || []).filter(c => 
      (c.name || '').toLowerCase().includes(searchLower) || 
      (c.contactPerson || '').toLowerCase().includes(searchLower) ||
      (c.gstin || '').toLowerCase().includes(searchLower)
    );
  }, [customers, filter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const customer = { 
      ...formData, 
      id: formData.id || `CUST-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString()
    } as Customer;
    
    if (formData.id && onUpdate) onUpdate(customer);
    else onAdd(customer);
    
    setIsModalOpen(false);
    setFormData({ type: 'RETAILER', name: '', contactPerson: '', phone: '', email: '', address: '', gstin: '' });
  };

  const handleEdit = (c: Customer) => {
    setFormData(c);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in font-sans">
      
      {/* Standard Clean Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Customer Master</h2>
          <p className="text-xs text-slate-500 font-medium">Manage customer profiles, contact info and GST details</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <Download className="w-4 h-4"/> Export CSV
          </button>
          <button 
            onClick={() => {
              setFormData({type: 'RETAILER', name: '', contactPerson: '', phone: '', email: '', address: '', gstin: ''});
              setIsModalOpen(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
             <Plus className="w-4 h-4" /> New Customer
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          {/* List Controls */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500/20 w-48 sm:w-64 shadow-inner" 
                      placeholder="Search name, phone or GST..." 
                      value={filter} 
                      onChange={e => setFilter(e.target.value)}
                    />
                </div>
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
                  <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {viewMode === 'LIST' ? (
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b sticky top-0 z-10">
                        <tr>
                          <th className="p-4 w-12 text-center">#</th>
                          <th className="p-4">Customer Name</th>
                          <th className="p-4">Contact Person</th>
                          <th className="p-4">GST Number</th>
                          <th className="p-4">Type</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCustomers.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => handleEdit(c)}>
                                <td className="p-4 text-center">
                                   <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
                                      {(c.name || '?').charAt(0)}
                                   </div>
                                </td>
                                <td className="p-4">
                                   <p className="font-bold text-slate-800 dark:text-white uppercase truncate">{c.name}</p>
                                   <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-widest">{c.address?.substring(0, 40)}...</p>
                                </td>
                                <td className="p-4">
                                   <p className="font-medium text-slate-700 dark:text-slate-300 uppercase text-xs">{c.contactPerson || '-'}</p>
                                   <p className="text-slate-400 font-medium text-[10px]">{c.phone || '-'}</p>
                                </td>
                                <td className="p-4 font-mono text-xs text-slate-500 uppercase">{c.gstin || 'UNREGISTERED'}</td>
                                <td className="p-4">
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.type === 'WHOLESALER' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                                      {c.type}
                                   </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(c); }} className="p-1.5 text-slate-400 hover:text-indigo-600 border rounded-lg transition-colors shadow-sm"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(c.id); }} className="p-1.5 text-slate-400 hover:text-red-600 border rounded-lg transition-colors shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                   {filteredCustomers.map(c => (
                      <div key={c.id} onClick={() => handleEdit(c)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer">
                         <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300 border border-slate-100 dark:border-slate-700">
                               {(c.name || '?').charAt(0)}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${c.type === 'WHOLESALER' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>{c.type}</span>
                         </div>
                         <h4 className="font-bold text-slate-800 dark:text-white uppercase truncate mb-1">{c.name}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{c.contactPerson || 'Regular Customer'}</p>
                         
                         {/* Render Custom Fields if any */}
                         {customFields.some((f: any) => (c as any)[f.key]) && (
                            <div className="text-[10px] mb-3 p-1.5 bg-indigo-50/50 dark:bg-slate-900 rounded border border-indigo-50 dark:border-slate-800 space-y-1">
                               {customFields.map((f: any) => (c as any)[f.key] && (
                                  <div key={f.id} className="truncate">
                                     <span className="font-black uppercase text-indigo-700 dark:text-indigo-400">{f.label}:</span> <span className="font-bold text-slate-700 dark:text-slate-350">{(c as any)[f.key]}</span>
                                  </div>
                               ))}
                            </div>
                         )}
                         
                         <div className="mt-auto space-y-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase truncate">
                                <Phone className="w-3 h-3 text-indigo-500"/> {c.phone || 'No Phone'}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase truncate">
                                <Mail className="w-3 h-3 text-indigo-500"/> {c.email || 'No Email'}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              )}
          </div>
      </div>

      {/* Simple Standard Customer Entry Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Customer Details" : "Add New Customer"} size="lg">
         <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Company / Customer Name</label>
                    <input required className="macos-input w-full font-bold" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="e.g. RAJESH SILK EMPORIUM" />
                </div>
                
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Customer Category</label>
                    <select className="macos-input w-full font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="RETAILER">Retailer</option>
                        <option value="WHOLESALER">Wholesaler</option>
                        <option value="BRAND">Brand / Label</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">GST Number</label>
                    <input className="macos-input w-full font-mono font-bold" value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} placeholder="24XXXXX0000X0Z0" />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Person</label>
                    <input className="macos-input w-full font-bold" value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value.toUpperCase()})} placeholder="FULL NAME" />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
                    <input className="macos-input w-full font-bold" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <input type="email" className="macos-input w-full" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@customer.com" />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Office Address</label>
                    <textarea rows={3} className="macos-input w-full" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})} placeholder="FULL POSTAL ADDRESS..." />
                </div>

                {customFields.length > 0 && (
                   <div className="md:col-span-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-5 space-y-4">
                      <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-1 flex items-center gap-1.5 align-middle">
                         <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse"/> ERPNext Custom Columns
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {customFields.map((f: any) => (
                            <div key={f.id} className="space-y-1">
                               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                               {f.type === 'select' ? (
                                  <select 
                                     required={f.required}
                                     className="macos-input w-full font-bold bg-white dark:bg-slate-900"
                                     value={(formData as any)[f.key] || ''}
                                     onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                                  >
                                     <option value="">{f.placeholder}</option>
                                     {f.options.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                  </select>
                               ) : (
                                  <input 
                                     required={f.required}
                                     type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                     className="macos-input w-full font-bold bg-white dark:bg-slate-900"
                                     placeholder={f.placeholder}
                                     value={(formData as any)[f.key] || ''}
                                     onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                                  />
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-macos-border dark:border-macos-darkBorder text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  className="flex-1 macos-btn-primary py-4 uppercase text-xs font-bold tracking-widest shadow-lg"
                >
                  Save Customer
                </motion.button>
            </div>
         </form>
      </BaseModal>
    </div>
  );
};

export default Customers;
