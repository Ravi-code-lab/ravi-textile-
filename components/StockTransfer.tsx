
import React, { useState } from 'react';
import { ArrowRightLeft, Plus, Search, MapPin, Truck, Printer, History, Clock, ArrowRight, Trash2 } from 'lucide-react';
import BaseModal from './BaseModal';
import { StockTransfer as StockTransferType, InventoryItem } from '../types';

interface StockTransferProps {
  inventory: InventoryItem[];
  transfers: StockTransferType[];
  onAdd: (transfer: StockTransferType) => void;
  onUpdate: (transfer: StockTransferType) => void;
  onDelete: (id: string) => void;
}

const StockTransfer: React.FC<StockTransferProps> = ({
  inventory, transfers, onAdd, onUpdate, onDelete
}) => {
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<StockTransferType>>({
    fromGodown: 'Main Warehouse',
    toGodown: 'Floor 1',
    items: [],
    status: 'PENDING',
    carrierDetails: ''
  });

  const filteredTransfers = transfers.filter(t => 
    t.id.toLowerCase().includes(filter.toLowerCase()) ||
    t.fromGodown.toLowerCase().includes(filter.toLowerCase()) ||
    t.toGodown.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransfer: StockTransferType = {
      id: `T-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      fromGodown: formData.fromGodown || 'Main Warehouse',
      toGodown: formData.toGodown || 'Floor 1',
      items: formData.items || [],
      totalItems: (formData.items || []).reduce((acc, item) => acc + item.quantity, 0),
      status: 'PENDING',
      carrierDetails: formData.carrierDetails,
      updatedAt: new Date().toISOString()
    };
    onAdd(newTransfer);
    setIsModalOpen(false);
    setFormData({
      fromGodown: 'Main Warehouse',
      toGodown: 'Floor 1',
      items: [],
      status: 'PENDING',
      carrierDetails: ''
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Standard Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          Internal Stock Transfers
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Search history..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
             <Plus className="w-4 h-4" /> Transfer Stock
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b dark:border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Transfer ID</th>
              <th className="px-6 py-4">Origin Godown</th>
              <th className="px-6 py-4 text-center">Path</th>
              <th className="px-6 py-4">Target Godown</th>
              <th className="px-6 py-4 text-center">Items</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransfers.map(trx => (
              <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-indigo-600">#{trx.id}</td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase text-[11px]"><MapPin className="w-3 h-3"/> {trx.fromGodown}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <ArrowRight className="w-4 h-4 text-slate-300 mx-auto" />
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase text-[11px]"><MapPin className="w-3 h-3 text-indigo-500"/> {trx.toGodown}</span>
                </td>
                <td className="px-6 py-4 text-center font-bold text-slate-500 tabular-nums">{trx.totalItems} SKU</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${trx.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {trx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600"><Printer className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(trx.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTransfers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">No transfers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initiate Stock Movement" size="md">
          <form onSubmit={handleAddTransfer} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-1">Source Godown</label>
                  <select 
                    className="w-full border dark:border-slate-700 rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-800"
                    value={formData.fromGodown}
                    onChange={e => setFormData({...formData, fromGodown: e.target.value})}
                  >
                    <option>Main Warehouse</option>
                    <option>Unit A</option>
                    <option>Floor 1</option>
                    <option>Floor 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-1">Target Godown</label>
                  <select 
                    className="w-full border dark:border-slate-700 rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-800"
                    value={formData.toGodown}
                    onChange={e => setFormData({...formData, toGodown: e.target.value})}
                  >
                    <option>Main Warehouse</option>
                    <option>Unit A</option>
                    <option>Floor 1</option>
                    <option>Floor 2</option>
                  </select>
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 px-1">Carrier Details</label>
                <input 
                  className="w-full border dark:border-slate-700 rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-800 outline-none" 
                  placeholder="Vehicle No / Hand-carrier name" 
                  value={formData.carrierDetails}
                  onChange={e => setFormData({...formData, carrierDetails: e.target.value})}
                />
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Transfer Manifest</p>
                <textarea 
                  rows={4} 
                  className="w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-3 text-sm outline-none" 
                  placeholder="Enter SKUs and Quantities..."
                  onChange={e => {
                    // Simple parser for demo: "SKU1:10, SKU2:20"
                    const lines = e.target.value.split('\n');
                    const items = lines.map(line => {
                      const [sku, qty] = line.split(':');
                      return { sku: sku?.trim(), quantity: Number(qty?.trim()) || 0, unit: 'PCS' };
                    }).filter(i => i.sku);
                    setFormData({...formData, items});
                  }}
                ></textarea>
             </div>
             <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all mt-4">Generate Gate Pass</button>
          </form>
      </BaseModal>
    </div>
  );
};

export default StockTransfer;
