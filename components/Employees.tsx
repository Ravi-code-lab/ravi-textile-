
import React, { useState, useMemo } from 'react';
import { TeamMember, UserRole, ShiftType } from '../types';
import { 
  Users, Search, Plus, Phone, Mail, MapPin, 
  Edit2, Trash2, Shield, UserCircle, 
  LayoutGrid, List, Download, Camera, 
  Briefcase, Calendar, Check, X,
  Clock, IndianRupee, Filter, Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import BaseModal from './BaseModal';
import { commitImage } from '../utils/imageUtils';

interface EmployeesProps {
  team: TeamMember[];
  onAdd: (m: TeamMember) => void;
  onUpdate: (m: TeamMember) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

const Employees: React.FC<EmployeesProps> = ({ team = [], onAdd, onUpdate, onDelete, currency = '₹' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<TeamMember>>({ 
    name: '', status: 'ACTIVE', role: 'WORKER', department: 'GENERAL', 
    dailyWage: 0, defaultShift: 'GENERAL'
  });

  const departments = useMemo(() => ['ALL', ...new Set(team.map(m => m.department || 'GENERAL'))], [team]);

  const stats = useMemo(() => {
    const active = team.filter(m => m.status === 'ACTIVE').length;
    const totalWage = team.reduce((sum, m) => sum + (m.dailyWage || 0), 0);
    return { active, totalWage, total: team.length };
  }, [team]);

  const filteredTeam = useMemo(() => {
    return (team || []).filter(m => {
      const search = filter.toLowerCase();
      const name = (m.name || '').toLowerCase();
      const dept = (m.department || '').toLowerCase();
      const matchesSearch = name.includes(search) || dept.includes(search);
      const matchesDept = selectedDept === 'ALL' || (m.department || 'GENERAL') === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [team, filter, selectedDept]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const member = { 
      ...formData, 
      id: formData.id || `EMP-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString()
    } as TeamMember;
    
    if (formData.id) onUpdate(member);
    else onAdd(member);
    
    setIsModalOpen(false);
    setFormData({ name: '', status: 'ACTIVE', role: 'WORKER', department: 'GENERAL', dailyWage: 0, defaultShift: 'GENERAL' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const resultUrl = await commitImage(file, 400);
        setFormData(prev => ({ ...prev, profileImageUrl: resultUrl }));
      } catch (err) {
        console.error("Profile photo commit failed:", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      ADMIN: 'bg-rose-50 text-rose-700 border-rose-100',
      MANAGER: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      ACCOUNTANT: 'bg-amber-50 text-amber-700 border-amber-100',
      SALES: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      WORKER: 'bg-slate-50 text-slate-700 border-slate-100'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[role] || colors.WORKER}`}>{role}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in font-sans">
      
      {/* Standard Clean Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Staff Database</h2>
          <p className="text-xs text-slate-500 font-medium">Manage employees, roles and department hierarchy</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <Download className="w-4 h-4"/> Export CSV
          </button>
          <button 
            onClick={() => {
              setFormData({ name: '', status: 'ACTIVE', role: 'WORKER', department: 'GENERAL', dailyWage: 0, defaultShift: 'GENERAL' });
              setIsModalOpen(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
             <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Headcount</p>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{stats.total} Employees</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Currently Active</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 animate-pulse"></div>
              </div>
              <h3 className="text-lg font-bold text-emerald-600 tabular-nums">{stats.active} Active</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Wage Bill (Day)</p>
                <IndianRupee className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{currency}{stats.totalWage.toLocaleString()}</h3>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Departments</p>
                <Briefcase className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{departments.length - 1} Units</h3>
          </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          {/* List Controls */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <select 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500" 
                      value={selectedDept} 
                      onChange={e => setSelectedDept(e.target.value)}
                    >
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500/20 w-48 sm:w-64 shadow-inner" 
                      placeholder="Search name or ID..." 
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
                          <th className="p-4">Name</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Department</th>
                          <th className="p-4">Shift</th>
                          <th className="p-4 text-right">Daily Wage</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTeam.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                         {m.profileImageUrl ? <img src={m.profileImageUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-5 h-5 text-slate-300"/>}
                                      </div>
                                      <div>
                                         <p className="font-bold text-slate-800 dark:text-white uppercase truncate">{m.name}</p>
                                         <p className="text-[10px] font-mono text-slate-400">ID: {m.id}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-4">{getRoleBadge(m.role)}</td>
                                <td className="p-4 font-medium text-slate-500 uppercase">{m.department || 'GENERAL'}</td>
                                <td className="p-4 font-medium text-slate-400 uppercase text-xs">{m.defaultShift || 'GENERAL'}</td>
                                <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-300 tabular-nums">{currency}{m.dailyWage?.toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setFormData(m); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 border rounded-lg transition-colors shadow-sm"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => onDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 border rounded-lg transition-colors shadow-sm"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                   {filteredTeam.map(m => (
                      <div key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
                         <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center border dark:border-slate-700">
                               {m.profileImageUrl ? <img src={m.profileImageUrl} className="w-full h-full object-cover" /> : <UserCircle className="w-8 h-8 text-slate-300"/>}
                            </div>
                            <div className="text-right">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${m.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{m.status}</span>
                               <p className="text-[10px] font-mono text-slate-400 mt-1">{m.id}</p>
                            </div>
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800 dark:text-white uppercase truncate">{m.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.department || 'GENERAL'} • {m.role}</p>
                         </div>
                         <div className="flex justify-between items-end border-t border-slate-50 dark:border-slate-800 pt-3 mt-1">
                            <div>
                               <p className="text-[10px] text-slate-400 uppercase font-bold">Shift</p>
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{m.defaultShift || 'GENERAL'}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] text-slate-400 uppercase font-bold">Day Wage</p>
                               <p className="text-base font-black text-indigo-600 tabular-nums">{currency}{m.dailyWage?.toLocaleString()}</p>
                            </div>
                         </div>
                         <div className="flex gap-2 pt-1">
                            <button onClick={() => { setFormData(m); setIsModalOpen(true); }} className="flex-1 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700">Edit Profile</button>
                            <button onClick={() => onDelete(m.id)} className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-300 hover:text-rose-600 rounded-lg transition-all border border-slate-200 dark:border-slate-700"><Trash2 className="w-4 h-4"/></button>
                         </div>
                      </div>
                   ))}
                </div>
              )}
          </div>
      </div>

      {/* Simple Standard Entry Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Employee Profile" : "Register New Employee"} size="lg">
          <form onSubmit={handleSave} className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                  {/* Photo Upload Area */}
                  <div className="w-full md:w-48 shrink-0 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Profile Photo</label>
                      <div className="w-full aspect-square bg-black/[0.02] dark:bg-white/[0.02] border-2 border-dashed border-macos-border dark:border-macos-darkBorder rounded-2xl flex flex-col items-center justify-center relative group hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden shadow-inner">
                          {isUploading ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-macos-accent animate-spin" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Committing...</span>
                              </div>
                          ) : formData.profileImageUrl ? (
                              <img src={formData.profileImageUrl} className="w-full h-full object-cover" />
                          ) : (
                              <>
                                  <Camera className="w-8 h-8 text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Upload Image</span>
                              </>
                          )}
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                      </div>
                  </div>

                  <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                          <input required className="macos-input w-full font-bold uppercase" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} placeholder="e.g. RAJESH KUMAR" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Role / Rank</label>
                              <select className="macos-input w-full font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                                  <option value="WORKER">Production Worker</option>
                                  <option value="MANAGER">Unit Manager</option>
                                  <option value="ACCOUNTANT">Accountant</option>
                                  <option value="SALES">Sales Agent</option>
                                  <option value="ADMIN">Administrator</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Department</label>
                              <input className="macos-input w-full font-bold uppercase" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value.toUpperCase()})} placeholder="e.g. STITCHING" />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Shift Timing</label>
                              <select className="macos-input w-full font-bold" value={formData.defaultShift} onChange={e => setFormData({...formData, defaultShift: e.target.value as ShiftType})}>
                                  <option value="GENERAL">General (09:00 - 18:00)</option>
                                  <option value="MORNING">Morning (06:00 - 14:00)</option>
                                  <option value="EVENING">Evening (14:00 - 22:00)</option>
                                  <option value="NIGHT">Night (22:00 - 06:00)</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                              <select className="macos-input w-full font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                  <option value="ACTIVE">Active Node</option>
                                  <option value="INACTIVE">Decommissioned</option>
                                  <option value="ON_LEAVE">Temporary Leave</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/[0.02] dark:bg-white/[0.02] p-6 rounded-2xl border border-macos-border dark:border-macos-darkBorder space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Fiscal Specification</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">{currency}</span>
                          <input type="number" className="w-full bg-white dark:bg-slate-900 border border-macos-border dark:border-macos-darkBorder rounded-xl pl-10 pr-4 py-4 text-xl font-black outline-none focus:ring-1 focus:ring-macos-accent shadow-inner tabular-nums" value={formData.dailyWage || ''} onChange={e => setFormData({...formData, dailyWage: Number(e.target.value)})} placeholder="Daily Wage" />
                      </div>
                  </div>
                  <div className="bg-black/[0.02] dark:bg-white/[0.02] p-6 rounded-2xl border border-macos-border dark:border-macos-darkBorder space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Link</label>
                      <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input className="macos-input w-full pl-12 py-4 font-bold" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mobile Number" />
                      </div>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-macos-border dark:border-macos-darkBorder text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  disabled={isUploading} 
                  className="flex-1 macos-btn-primary py-4 uppercase text-xs font-bold tracking-widest shadow-lg flex items-center justify-center gap-2"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>} 
                    {formData.id ? 'Update Employee' : 'Save Employee'}
                </motion.button>
              </div>
          </form>
      </BaseModal>
    </div>
  );
};

export default Employees;
