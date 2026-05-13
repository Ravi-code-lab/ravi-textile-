import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DyeingJob, DyeingProcess, DyeClass, DyeingChemical } from '../types';
import {
  Plus, Search, Filter, Edit2, Trash2, FlaskConical, Thermometer,
  CheckCircle, AlertTriangle, Clock, RefreshCw, BarChart3,
  Droplets, Zap, Activity, ChevronDown, X, Beaker,
  Calendar, User, Truck, Package
} from 'lucide-react';
import BaseModal from './BaseModal';

interface DyeingProcessingProps {
  jobs: DyeingJob[];
  onAddJob: (job: DyeingJob) => void;
  onUpdateJob: (job: DyeingJob) => void;
  onDeleteJob: (id: string) => void;
  currency?: string;
}

const PROCESSES: DyeingProcess[] = [
  'YARN_DYEING', 'FABRIC_DYEING', 'PIECE_DYEING',
  'PRINTING', 'BLEACHING', 'MERCERIZING', 'CALENDERING', 'SANFORIZING'
];
const DYE_CLASSES: DyeClass[] = [
  'REACTIVE', 'VATS', 'DIRECT', 'ACID', 'DISPERSE', 'PIGMENT', 'INDIGO'
];

const processLabel: Record<DyeingProcess, string> = {
  YARN_DYEING: 'Yarn Dyeing', FABRIC_DYEING: 'Fabric Dyeing', PIECE_DYEING: 'Piece Dyeing',
  PRINTING: 'Printing', BLEACHING: 'Bleaching', MERCERIZING: 'Mercerizing',
  CALENDERING: 'Calendering', SANFORIZING: 'Sanforizing'
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.FC<any> }> = {
  PENDING:    { label: 'Pending',    color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   icon: Clock },
  IN_PROCESS: { label: 'In Process', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: RefreshCw },
  COMPLETED:  { label: 'Completed',  color: 'text-emerald-700',bg: 'bg-emerald-50 border-emerald-200',icon: CheckCircle },
  FAILED:     { label: 'Failed',     color: 'text-red-700',    bg: 'bg-red-50 border-red-200',        icon: AlertTriangle },
  'RE-PROCESS': { label: 'Re-Process', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: RefreshCw },
};

const processColors: Record<string, string> = {
  YARN_DYEING: 'bg-violet-100 text-violet-800',
  FABRIC_DYEING: 'bg-indigo-100 text-indigo-800',
  PIECE_DYEING: 'bg-sky-100 text-sky-800',
  PRINTING: 'bg-pink-100 text-pink-800',
  BLEACHING: 'bg-slate-100 text-slate-700',
  MERCERIZING: 'bg-teal-100 text-teal-800',
  CALENDERING: 'bg-orange-100 text-orange-800',
  SANFORIZING: 'bg-lime-100 text-lime-800',
};

const emptyForm = (): Partial<DyeingJob> => ({
  process: 'FABRIC_DYEING',
  status: 'PENDING',
  isJobWork: false,
  inputQty: 0,
  inputUnit: 'METER',
  issueDate: new Date().toISOString().split('T')[0],
  expectedDate: '',
  chemicals: [],
});

const DyeingProcessing: React.FC<DyeingProcessingProps> = ({
  jobs, onAddJob, onUpdateJob, onDeleteJob, currency = '₹'
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'KANBAN' | 'ANALYTICS'>('LIST');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processFilter, setProcessFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DyeingJob | null>(null);
  const [form, setForm] = useState<Partial<DyeingJob>>(emptyForm());

  const filtered = useMemo(() => jobs.filter(j => {
    const matchSearch = !search ||
      j.jobNumber?.toLowerCase().includes(search.toLowerCase()) ||
      j.shade?.toLowerCase().includes(search.toLowerCase()) ||
      j.fabricName?.toLowerCase().includes(search.toLowerCase()) ||
      j.vendorName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
    const matchProcess = processFilter === 'ALL' || j.process === processFilter;
    return matchSearch && matchStatus && matchProcess;
  }), [jobs, search, statusFilter, processFilter]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter(j => j.status === 'PENDING').length;
    const inProcess = jobs.filter(j => j.status === 'IN_PROCESS').length;
    const completed = jobs.filter(j => j.status === 'COMPLETED').length;
    const failed = jobs.filter(j => j.status === 'FAILED' || j.status === 'RE-PROCESS').length;
    const totalCost = jobs.reduce((s, j) => s + (j.totalCost || 0), 0);
    const jobWork = jobs.filter(j => j.isJobWork).length;
    return { total, pending, inProcess, completed, failed, totalCost, jobWork };
  }, [jobs]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setIsModalOpen(true); };
  const openEdit = (j: DyeingJob) => { setEditing(j); setForm(j); setIsModalOpen(true); };

  const handleSave = () => {
    const totalCost = (form.laborCost || 0) + (form.chemicalCost || 0) + (form.machineCost || 0);
    const job: DyeingJob = {
      ...form,
      id: editing?.id || `DYE-${Date.now().toString().slice(-6)}`,
      jobNumber: form.jobNumber || `DYE-${Date.now().toString().slice(-6)}`,
      totalCost,
      updatedAt: new Date().toISOString(),
      createdAt: editing ? editing.createdAt : new Date().toISOString(),
    } as DyeingJob;
    if (editing) onUpdateJob(job); else onAddJob(job);
    setIsModalOpen(false);
  };

  const addChemical = () => {
    setForm(f => ({
      ...f,
      chemicals: [...(f.chemicals || []), { name: '', quantity: 0, unit: 'g/L', costPerUnit: 0 }]
    }));
  };

  const updateChemical = (i: number, field: keyof DyeingChemical, value: any) => {
    setForm(f => {
      const chems = [...(f.chemicals || [])];
      chems[i] = { ...chems[i], [field]: value };
      const chemCost = chems.reduce((s, c) => s + (c.quantity * c.costPerUnit), 0);
      return { ...f, chemicals: chems, chemicalCost: chemCost };
    });
  };

  const removeChemical = (i: number) => {
    setForm(f => ({ ...f, chemicals: (f.chemicals || []).filter((_, j) => j !== i) }));
  };

  const kanbanCols: (DyeingJob['status'])[] = ['PENDING', 'IN_PROCESS', 'COMPLETED', 'FAILED', 'RE-PROCESS'];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: stats.total, icon: FlaskConical, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'In Process', value: stats.inProcess, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Cost', value: `${currency}${stats.totalCost.toLocaleString()}`, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs, shades..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 outline-none">
            <option value="ALL">All Status</option>
            {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
          </select>
          <select value={processFilter} onChange={e => setProcessFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 outline-none">
            <option value="ALL">All Processes</option>
            {PROCESSES.map(p => <option key={p} value={p}>{processLabel[p]}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {(['LIST', 'KANBAN', 'ANALYTICS'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
              {t}
            </button>
          ))}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
            <Plus className="w-4 h-4" /> New Job
          </button>
        </div>
      </div>

      {/* LIST TAB */}
      {activeTab === 'LIST' && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No dyeing jobs found</p>
            </div>
          ) : filtered.map(job => {
            const sc = statusConfig[job.status] || statusConfig.PENDING;
            const StatusIcon = sc.icon;
            const shrinkage = job.outputQty && job.inputQty > 0
              ? (((job.inputQty - job.outputQty) / job.inputQty) * 100).toFixed(1)
              : null;
            return (
              <motion.div key={job.id} layout
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Droplets className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{job.jobNumber}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${processColors[job.process] || 'bg-slate-100 text-slate-700'}`}>
                          {processLabel[job.process as DyeingProcess] || job.process}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sc.bg} ${sc.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />{sc.label}
                        </span>
                        {job.isJobWork && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-medium">Job Work</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                        {job.shade && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block border" style={{ backgroundColor: job.shade.startsWith('#') ? job.shade : undefined }} />{job.shade}</span>}
                        {job.fabricName && <span>{job.fabricName}</span>}
                        {job.vendorName && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{job.vendorName}</span>}
                        <span><Calendar className="w-3 h-3 inline mr-1" />{job.issueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        {job.inputQty} {job.inputUnit}
                        {job.outputQty ? ` → ${job.outputQty}` : ''}
                      </p>
                      {shrinkage && <p className="text-xs text-slate-500">Shrinkage: {shrinkage}%</p>}
                      {job.totalCost ? <p className="text-xs text-indigo-600 font-semibold">{currency}{job.totalCost.toLocaleString()}</p> : null}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(job)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeleteJob(job.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quality params */}
                {(job.temperature || job.ph || job.fastness) && (
                  <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 flex flex-wrap gap-4 text-xs">
                    {job.temperature && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Thermometer className="w-3 h-3 text-red-400" /> {job.temperature}°C
                      </span>
                    )}
                    {job.ph && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Beaker className="w-3 h-3 text-blue-400" /> pH {job.ph}
                      </span>
                    )}
                    {job.fastness?.washing && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Droplets className="w-3 h-3 text-cyan-400" /> Wash fastness: {job.fastness.washing}/5
                      </span>
                    )}
                    {job.colorMatchStatus && (
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        job.colorMatchStatus === 'PASS' ? 'bg-emerald-50 text-emerald-700' :
                        job.colorMatchStatus === 'FAIL' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
                      }`}>
                        Color Match: {job.colorMatchStatus}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* KANBAN TAB */}
      {activeTab === 'KANBAN' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {kanbanCols.map(col => {
            const colJobs = jobs.filter(j => j.status === col);
            const sc = statusConfig[col];
            const StatusIcon = sc.icon;
            return (
              <div key={col} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 min-h-[200px]">
                <div className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-xl ${sc.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${sc.color}`} />
                  <span className={`text-xs font-bold ${sc.color}`}>{sc.label}</span>
                  <span className={`ml-auto text-xs font-bold ${sc.color}`}>{colJobs.length}</span>
                </div>
                <div className="space-y-2">
                  {colJobs.map(job => (
                    <motion.div key={job.id} whileHover={{ scale: 1.01 }}
                      onClick={() => openEdit(job)}
                      className="bg-white dark:bg-slate-800 rounded-xl p-3 cursor-pointer border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{job.jobNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{job.shade || '—'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${processColors[job.process] || 'bg-slate-100 text-slate-700'}`}>
                          {processLabel[job.process as DyeingProcess]?.split(' ')[0]}
                        </span>
                        <span className="text-xs text-slate-400">{job.inputQty}{job.inputUnit === 'METER' ? 'm' : 'kg'}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Process breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" /> Jobs by Process
            </h3>
            <div className="space-y-3">
              {PROCESSES.map(p => {
                const count = jobs.filter(j => j.process === p).length;
                const max = Math.max(...PROCESSES.map(pp => jobs.filter(j => j.process === pp).length), 1);
                return (
                  <div key={p}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{processLabel[p]}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Status Overview
            </h3>
            <div className="space-y-3">
              {Object.entries(statusConfig).map(([status, cfg]) => {
                const count = jobs.filter(j => j.status === status).length;
                const StatusIcon = cfg.icon;
                return (
                  <div key={status} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${cfg.bg}`}>
                    <span className={`flex items-center gap-2 text-sm font-medium ${cfg.color}`}>
                      <StatusIcon className="w-4 h-4" />{cfg.label}
                    </span>
                    <span className={`font-bold ${cfg.color}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost summary */}
          <div className="md:col-span-2 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border border-violet-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Cost Breakdown (All Jobs)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Chemical Cost', value: jobs.reduce((s, j) => s + (j.chemicalCost || 0), 0), color: 'text-purple-600' },
                { label: 'Labor Cost', value: jobs.reduce((s, j) => s + (j.laborCost || 0), 0), color: 'text-blue-600' },
                { label: 'Machine Cost', value: jobs.reduce((s, j) => s + (j.machineCost || 0), 0), color: 'text-indigo-600' },
              ].map(c => (
                <div key={c.label} className="text-center">
                  <p className={`text-xl font-bold ${c.color}`}>{currency}{c.value.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Dyeing Job' : 'New Dyeing Job'}>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job Number *</label>
              <input value={form.jobNumber || ''} onChange={e => setForm(f => ({ ...f, jobNumber: e.target.value }))}
                placeholder="DYE-001"
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Process *</label>
              <select value={form.process || 'FABRIC_DYEING'} onChange={e => setForm(f => ({ ...f, process: e.target.value as DyeingProcess }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300">
                {PROCESSES.map(p => <option key={p} value={p}>{processLabel[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dye Class</label>
              <select value={form.dyeClass || ''} onChange={e => setForm(f => ({ ...f, dyeClass: e.target.value as DyeClass || undefined }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">— Select —</option>
                {DYE_CLASSES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shade / Color</label>
              <input value={form.shade || ''} onChange={e => setForm(f => ({ ...f, shade: e.target.value }))}
                placeholder="e.g. Navy Blue, #1A2B3C"
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pantone Ref</label>
              <input value={form.pantoneRef || ''} onChange={e => setForm(f => ({ ...f, pantoneRef: e.target.value }))}
                placeholder="e.g. 19-4150 TCX"
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fabric / Material</label>
              <input value={form.fabricName || ''} onChange={e => setForm(f => ({ ...f, fabricName: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Input Qty</label>
              <div className="flex gap-2 mt-1">
                <input type="number" value={form.inputQty || ''} onChange={e => setForm(f => ({ ...f, inputQty: Number(e.target.value) }))}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
                <select value={form.inputUnit || 'METER'} onChange={e => setForm(f => ({ ...f, inputUnit: e.target.value as any }))}
                  className="w-24 px-2 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none">
                  <option value="METER">Meter</option>
                  <option value="KG">KG</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Output Qty</label>
              <input type="number" value={form.outputQty || ''} onChange={e => setForm(f => ({ ...f, outputQty: Number(e.target.value) }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Issue Date</label>
              <input type="date" value={form.issueDate || ''} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expected Date</label>
              <input type="date" value={form.expectedDate || ''} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
              <select value={form.status || 'PENDING'} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Color Match</label>
              <select value={form.colorMatchStatus || ''} onChange={e => setForm(f => ({ ...f, colorMatchStatus: e.target.value as any || undefined }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">— Not Set —</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Job Work toggle */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-slate-700 rounded-xl">
            <input type="checkbox" id="jobwork" checked={form.isJobWork || false} onChange={e => setForm(f => ({ ...f, isJobWork: e.target.checked }))}
              className="w-4 h-4 accent-orange-500" />
            <label htmlFor="jobwork" className="text-sm font-medium text-slate-700 dark:text-slate-300">This is a Job Work (Outsourced)</label>
            {form.isJobWork && (
              <input value={form.vendorName || ''} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                placeholder="Vendor name" className="ml-2 flex-1 px-3 py-1.5 border border-orange-200 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none" />
            )}
          </div>

          {/* Process Parameters */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Process Parameters</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500">Temperature (°C)</label>
                <input type="number" value={form.temperature || ''} onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Duration (min)</label>
                <input type="number" value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500">pH Level</label>
                <input type="number" step="0.1" value={form.ph || ''} onChange={e => setForm(f => ({ ...f, ph: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
            </div>
          </div>

          {/* Chemicals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chemicals Used</p>
              <button onClick={addChemical} className="text-xs text-violet-600 hover:text-violet-800 font-medium">+ Add Chemical</button>
            </div>
            {(form.chemicals || []).length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs text-slate-400 font-semibold px-1">
                  <span>Chemical</span><span>Qty</span><span>Unit</span><span>Rate/unit</span>
                </div>
                {(form.chemicals || []).map((c, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center">
                    <input value={c.name} onChange={e => updateChemical(i, 'name', e.target.value)} placeholder="Chemical name"
                      className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none" />
                    <input type="number" value={c.quantity || ''} onChange={e => updateChemical(i, 'quantity', Number(e.target.value))}
                      className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none" />
                    <input value={c.unit} onChange={e => updateChemical(i, 'unit', e.target.value)} placeholder="g/L"
                      className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none" />
                    <div className="flex gap-1">
                      <input type="number" value={c.costPerUnit || ''} onChange={e => updateChemical(i, 'costPerUnit', Number(e.target.value))}
                        className="flex-1 px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 outline-none" />
                      <button onClick={() => removeChemical(i)} className="p-1 text-red-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-500 px-1">
                  Chemical cost: <strong className="text-violet-600">{currency}{(form.chemicalCost || 0).toFixed(2)}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Costs */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Cost Entry</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500">Labor ({currency})</label>
                <input type="number" value={form.laborCost || ''} onChange={e => setForm(f => ({ ...f, laborCost: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Machine ({currency})</label>
                <input type="number" value={form.machineCost || ''} onChange={e => setForm(f => ({ ...f, machineCost: Number(e.target.value) }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Total (auto)</label>
                <div className="mt-1 w-full px-3 py-2 bg-violet-50 dark:bg-slate-700 border border-violet-200 rounded-xl text-sm font-bold text-violet-700">
                  {currency}{((form.laborCost || 0) + (form.chemicalCost || 0) + (form.machineCost || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Remarks</label>
            <textarea value={form.remarks || ''} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-violet-300 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={handleSave}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
            {editing ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      </BaseModal>
    </div>
  );
};

export default DyeingProcessing;
