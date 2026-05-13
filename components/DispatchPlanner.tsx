import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DispatchEntry, DispatchItem, DispatchMode, DispatchStatus, Order
} from '../types';
import {
  Truck, Plus, Search, Edit2, Trash2, CheckCircle, Clock, PackageCheck,
  MapPin, Phone, FileText, ChevronDown, X, AlertCircle, BarChart3,
  PackageX, RefreshCw, ArrowRight, Navigation, Scale, DollarSign, Hash,
  Package, Send, Eye, Download
} from 'lucide-react';
import BaseModal from './BaseModal';

interface DispatchPlannerProps {
  dispatches: DispatchEntry[];
  orders: Order[];
  onAdd: (entry: DispatchEntry) => void;
  onUpdate: (entry: DispatchEntry) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

const MODE_LABELS: Record<DispatchMode, string> = {
  ROAD: 'Road',
  RAIL: 'Rail',
  AIR: 'Air',
  COURIER: 'Courier',
  HAND_DELIVERY: 'Hand Delivery',
};

const MODE_ICONS: Record<DispatchMode, React.ReactNode> = {
  ROAD: <Truck className="w-3.5 h-3.5" />,
  RAIL: <Navigation className="w-3.5 h-3.5" />,
  AIR: <Send className="w-3.5 h-3.5" />,
  COURIER: <Package className="w-3.5 h-3.5" />,
  HAND_DELIVERY: <CheckCircle className="w-3.5 h-3.5" />,
};

const STATUS_COLORS: Record<DispatchStatus, string> = {
  PENDING:     'bg-amber-50 text-amber-700 border border-amber-200',
  PACKED:      'bg-blue-50 text-blue-700 border border-blue-200',
  DISPATCHED:  'bg-violet-50 text-violet-700 border border-violet-200',
  IN_TRANSIT:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  DELIVERED:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RETURNED:    'bg-rose-50 text-rose-700 border border-rose-200',
  CANCELLED:   'bg-slate-50 text-slate-500 border border-slate-200',
};

const STATUS_FLOW: DispatchStatus[] = ['PENDING', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];

const emptyItem = (): DispatchItem => ({
  orderId: '',
  orderNumber: '',
  customerName: '',
  productName: '',
  qty: 1,
  unit: 'PCS',
  weight: 0,
  value: 0,
  packed: false,
});

const emptyForm = (): Partial<DispatchEntry> => ({
  dispatchNumber: `DSP-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().slice(0, 10),
  mode: 'ROAD',
  status: 'PENDING',
  items: [emptyItem()],
  totalQty: 0,
  totalWeight: 0,
  totalValue: 0,
});

const calcTotals = (items: DispatchItem[]) => ({
  totalQty: items.reduce((s, i) => s + (i.qty || 0), 0),
  totalWeight: items.reduce((s, i) => s + (i.weight || 0), 0),
  totalValue: items.reduce((s, i) => s + (i.value || 0), 0),
});

const DispatchPlanner: React.FC<DispatchPlannerProps> = ({
  dispatches, orders, onAdd, onUpdate, onDelete, currency = '₹'
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<DispatchStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Partial<DispatchEntry> | null>(null);
  const [detailEntry, setDetailEntry] = useState<DispatchEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── derived ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = dispatches;
    if (filterStatus !== 'ALL') list = list.filter(d => d.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.dispatchNumber.toLowerCase().includes(q) ||
        (d.carrierName || '').toLowerCase().includes(q) ||
        d.items.some(i => i.customerName.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [dispatches, search, filterStatus]);

  const stats = useMemo(() => ({
    total: dispatches.length,
    pending: dispatches.filter(d => d.status === 'PENDING').length,
    inTransit: dispatches.filter(d => d.status === 'IN_TRANSIT' || d.status === 'DISPATCHED').length,
    delivered: dispatches.filter(d => d.status === 'DELIVERED').length,
  }), [dispatches]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const openNew = () => { setEditEntry(emptyForm()); setModalOpen(true); };
  const openEdit = (d: DispatchEntry) => { setEditEntry({ ...d }); setModalOpen(true); };

  const handleSave = () => {
    if (!editEntry) return;
    const totals = calcTotals(editEntry.items || []);
    const now = new Date().toISOString();
    if (editEntry.id) {
      onUpdate({ ...editEntry, ...totals, updatedAt: now } as DispatchEntry);
    } else {
      onAdd({
        ...editEntry,
        ...totals,
        id: `DSP-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      } as DispatchEntry);
    }
    setModalOpen(false);
    setEditEntry(null);
  };

  const handleStatusAdvance = (entry: DispatchEntry) => {
    const idx = STATUS_FLOW.indexOf(entry.status as DispatchStatus);
    if (idx < STATUS_FLOW.length - 1) {
      onUpdate({ ...entry, status: STATUS_FLOW[idx + 1], updatedAt: new Date().toISOString() });
    }
  };

  const updateItem = (idx: number, field: keyof DispatchItem, value: any) => {
    if (!editEntry) return;
    const items = [...(editEntry.items || [])];
    items[idx] = { ...items[idx], [field]: value };
    setEditEntry({ ...editEntry, items });
  };

  const addItem = () => {
    if (!editEntry) return;
    setEditEntry({ ...editEntry, items: [...(editEntry.items || []), emptyItem()] });
  };

  const removeItem = (idx: number) => {
    if (!editEntry) return;
    setEditEntry({ ...editEntry, items: (editEntry.items || []).filter((_, i) => i !== idx) });
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dispatch Planner</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track shipments, carriers & delivery status</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-macos-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Dispatch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Truck, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'In Transit', value: stats.inTransit, icon: Navigation, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Delivered', value: stats.delivered, icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(stat => (
          <motion.div key={stat.label} whileHover={{ y: -2 }} className={`rounded-2xl p-4 ${stat.bg} flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dispatches, customers…"
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-macos-accent/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PENDING', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === s
                  ? 'bg-macos-accent text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-macos-accent/50'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Truck className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No dispatches found</p>
            <button onClick={openNew} className="text-xs text-macos-accent hover:underline">Create first dispatch</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Dispatch #', 'Date', 'Mode', 'Carrier', 'Items', 'Weight', 'Value', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-macos-accent">{d.dispatchNumber}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{d.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        {MODE_ICONS[d.mode]}
                        {MODE_LABELS[d.mode]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">{d.carrierName || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">{d.items.length} item{d.items.length !== 1 ? 's' : ''} · {d.totalQty} units</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{d.totalWeight ? `${d.totalWeight} kg` : '—'}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs font-medium">{d.totalValue ? `${currency}${d.totalValue.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status]}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetailEntry(d)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-macos-accent transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-macos-accent transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {STATUS_FLOW.indexOf(d.status as DispatchStatus) < STATUS_FLOW.length - 1 && (
                          <button onClick={() => handleStatusAdvance(d)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 transition-colors" title="Advance Status">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-500 hover:text-rose-500 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <BaseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditEntry(null); }}
        title={editEntry?.id ? 'Edit Dispatch' : 'New Dispatch'}
        size="xl"
      >
        {editEntry && (
          <div className="space-y-5 text-sm">
            {/* Basic info */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dispatch #</label>
                <input value={editEntry.dispatchNumber || ''} onChange={e => setEditEntry({ ...editEntry, dispatchNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Date</label>
                <input type="date" value={editEntry.date || ''} onChange={e => setEditEntry({ ...editEntry, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Mode</label>
                <select value={editEntry.mode || 'ROAD'} onChange={e => setEditEntry({ ...editEntry, mode: e.target.value as DispatchMode })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm">
                  {(Object.keys(MODE_LABELS) as DispatchMode[]).map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select value={editEntry.status || 'PENDING'} onChange={e => setEditEntry({ ...editEntry, status: e.target.value as DispatchStatus })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm">
                  {(['PENDING','PACKED','DISPATCHED','IN_TRANSIT','DELIVERED','RETURNED','CANCELLED'] as DispatchStatus[]).map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Carrier Name</label>
                <input value={editEntry.carrierName || ''} onChange={e => setEditEntry({ ...editEntry, carrierName: e.target.value })} placeholder="Transport co." className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Vehicle No.</label>
                <input value={editEntry.vehicleNumber || ''} onChange={e => setEditEntry({ ...editEntry, vehicleNumber: e.target.value })} placeholder="RJ14AB1234" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Driver Name</label>
                <input value={editEntry.driverName || ''} onChange={e => setEditEntry({ ...editEntry, driverName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Driver Phone</label>
                <input value={editEntry.driverPhone || ''} onChange={e => setEditEntry({ ...editEntry, driverPhone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">LR Number</label>
                <input value={editEntry.lrNumber || ''} onChange={e => setEditEntry({ ...editEntry, lrNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">E-Way Bill #</label>
                <input value={editEntry.ewayBillNumber || ''} onChange={e => setEditEntry({ ...editEntry, ewayBillNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Expected Delivery</label>
                <input type="date" value={editEntry.expectedDelivery || ''} onChange={e => setEditEntry({ ...editEntry, expectedDelivery: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Freight Cost ({currency})</label>
                <input type="number" min={0} value={editEntry.freightCost || ''} onChange={e => setEditEntry({ ...editEntry, freightCost: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm" />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">From Address</label>
                <textarea value={editEntry.fromAddress || ''} onChange={e => setEditEntry({ ...editEntry, fromAddress: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">To Address</label>
                <textarea value={editEntry.toAddress || ''} onChange={e => setEditEntry({ ...editEntry, toAddress: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm resize-none" />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Dispatch Items</h3>
                <button onClick={addItem} className="flex items-center gap-1 text-xs text-macos-accent hover:underline font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {(editEntry.items || []).map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                    <div className="col-span-3">
                      <input value={item.customerName} onChange={e => updateItem(idx, 'customerName', e.target.value)} placeholder="Customer" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-macos-accent/40" />
                    </div>
                    <div className="col-span-3">
                      <input value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="Product" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-macos-accent/40" />
                    </div>
                    <div className="col-span-1">
                      <input type="number" min={0} value={item.qty} onChange={e => updateItem(idx, 'qty', +e.target.value)} placeholder="Qty" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-macos-accent/40" />
                    </div>
                    <div className="col-span-1">
                      <input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} placeholder="Unit" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-macos-accent/40" />
                    </div>
                    <div className="col-span-1">
                      <input type="number" min={0} value={item.weight || ''} onChange={e => updateItem(idx, 'weight', +e.target.value)} placeholder="Kg" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-macos-accent/40" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min={0} value={item.value || ''} onChange={e => updateItem(idx, 'value', +e.target.value)} placeholder={`Value (${currency})`} className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-macos-accent/40" />
                    </div>
                    <div className="col-span-1 flex justify-center items-center gap-1">
                      <input type="checkbox" checked={item.packed || false} onChange={e => updateItem(idx, 'packed', e.target.checked)} className="accent-macos-accent w-3.5 h-3.5" title="Packed?" />
                      <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {(editEntry.items || []).length > 0 && (
                <div className="mt-2 text-xs text-slate-500 text-right">
                  Total: {calcTotals(editEntry.items || []).totalQty} units · {calcTotals(editEntry.items || []).totalWeight.toFixed(1)} kg · {currency}{calcTotals(editEntry.items || []).totalValue.toLocaleString()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Remarks</label>
              <textarea value={editEntry.remarks || ''} onChange={e => setEditEntry({ ...editEntry, remarks: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-macos-accent/30 text-sm resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setModalOpen(false); setEditEntry(null); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-macos-accent text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
                {editEntry.id ? 'Update' : 'Create'} Dispatch
              </button>
            </div>
          </div>
        )}
      </BaseModal>

      {/* Detail Modal */}
      <BaseModal isOpen={!!detailEntry} onClose={() => setDetailEntry(null)} title={`Dispatch: ${detailEntry?.dispatchNumber}`} size="lg">
        {detailEntry && (
          <div className="space-y-4 text-sm">
            {/* Status bar */}
            <div className="flex gap-1 items-center overflow-x-auto pb-1">
              {STATUS_FLOW.map((s, idx) => {
                const current = STATUS_FLOW.indexOf(detailEntry.status as DispatchStatus);
                return (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      idx < current ? 'bg-emerald-100 text-emerald-700' :
                      idx === current ? 'bg-macos-accent text-white' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {idx <= current && <CheckCircle className="w-3 h-3" />}
                      {s.replace('_', ' ')}
                    </div>
                    {idx < STATUS_FLOW.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                ['Date', detailEntry.date],
                ['Mode', MODE_LABELS[detailEntry.mode]],
                ['Carrier', detailEntry.carrierName || '—'],
                ['Vehicle', detailEntry.vehicleNumber || '—'],
                ['Driver', detailEntry.driverName || '—'],
                ['LR #', detailEntry.lrNumber || '—'],
                ['E-Way Bill', detailEntry.ewayBillNumber || '—'],
                ['Freight', detailEntry.freightCost ? `${currency}${detailEntry.freightCost}` : '—'],
                ['Expected', detailEntry.expectedDelivery || '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">{k}</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{v}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Items</p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>{['Customer', 'Product', 'Qty', 'Weight', 'Value', 'Packed'].map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {detailEntry.items.map((it, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{it.customerName}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{it.productName}</td>
                        <td className="px-3 py-2 font-medium">{it.qty} {it.unit}</td>
                        <td className="px-3 py-2 text-slate-500">{it.weight ? `${it.weight} kg` : '—'}</td>
                        <td className="px-3 py-2 text-slate-700 font-medium">{it.value ? `${currency}${it.value.toLocaleString()}` : '—'}</td>
                        <td className="px-3 py-2">{it.packed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {detailEntry.remarks && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                <strong>Remarks:</strong> {detailEntry.remarks}
              </div>
            )}
          </div>
        )}
      </BaseModal>

      {/* Delete confirm */}
      <BaseModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Dispatch?" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">This dispatch record will be permanently deleted.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors shadow-sm">Delete</button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default DispatchPlanner;
