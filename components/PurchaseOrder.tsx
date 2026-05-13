
import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Supplier, InventoryItem, PurchaseOrderItem, Unit } from '../types';
import { Search, Plus, ShoppingBag, Calendar, Printer, Package, Check, X, FileText, ArrowUpRight } from 'lucide-react';
import BaseModal from './BaseModal';

interface PurchaseOrderProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  onAddPO: (po: PurchaseOrder) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  currency?: string;
}

const PurchaseOrderComp: React.FC<PurchaseOrderProps> = ({ 
  purchaseOrders, suppliers, inventory, onAddPO, onUpdatePO, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({ items: [], status: 'DRAFT', date: new Date().toISOString().split('T')[0] });
  const [newItem, setNewItem] = useState<PurchaseOrderItem>({ productName: '', quantity: 0, unit: Unit.KG, unitPrice: 0 });

  const filteredOrders = useMemo(() => 
    purchaseOrders.filter(po => po.supplierName.toLowerCase().includes(filter.toLowerCase()) || po.id.toLowerCase().includes(filter.toLowerCase())),
  [purchaseOrders, filter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.items?.length) return;
    const s = suppliers.find(sup => sup.id === formData.supplierId);
    onAddPO({
      ...formData,
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplierName: s?.name || 'Unknown',
      totalAmount: formData.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)
    } as PurchaseOrder);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="bg-white dark:bg-slate-900 border-b p-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg"><ShoppingBag className="w-6 h-6"/></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">Purchase Orders</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredOrders.length} Procurement Nodes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none w-64" placeholder="Search POs / Vendors..." value={filter} onChange={e => setFilter(e.target.value)} />
          <button onClick={() => setIsModalOpen(true)} className="bg-amber-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
             <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map(po => (
          <div key={po.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest text-white bg-amber-500">{po.status}</div>
            <span className="text-[10px] font-mono text-amber-600 font-black uppercase mb-1 block">#{po.id}</span>
            <h3 className="font-black text-lg uppercase truncate mb-4 dark:text-white">{po.supplierName}</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4 flex justify-between items-center">
              <div className="flex items-center gap-2"><Package className="w-4 h-4 text-slate-400"/><span className="text-xs font-bold dark:text-slate-300">{po.items.length} SKUs</span></div>
              <span className="text-sm font-black dark:text-white">{currency}{po.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase border-t pt-4">
               <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {po.date}</span>
               <button className="text-amber-600 hover:underline">View PO &rarr;</button>
            </div>
          </div>
        ))}
      </div>

      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Procurement Booking" size="xl">
          <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <select required className="border-2 rounded-2xl p-4 text-sm font-bold bg-slate-50 outline-none" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                      <option value="">Select Vendor Registry...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input type="date" className="border-2 rounded-2xl p-4 text-sm font-bold bg-slate-50" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl space-y-4">
                  <div className="flex gap-2">
                    <input list="inv-list" className="flex-1 p-3 rounded-xl text-xs font-bold" placeholder="Item Name" value={newItem.productName} onChange={e => setNewItem({...newItem, productName: e.target.value})} />
                    <datalist id="inv-list">{inventory.map(i => <option key={i.id} value={i.name}/>)}</datalist>
                    <input type="number" className="w-24 p-3 rounded-xl text-xs font-bold" placeholder="Qty" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                    <input type="number" className="w-24 p-3 rounded-xl text-xs font-bold" placeholder="Rate" value={newItem.unitPrice || ''} onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} />
                    <button type="button" onClick={() => { if(newItem.productName && newItem.quantity) { setFormData({...formData, items: [...(formData.items || []), newItem]}); setNewItem({productName:'', quantity:0, unit: Unit.KG, unitPrice:0}); } }} className="bg-slate-900 text-white p-3 rounded-xl"><Plus className="w-4 h-4"/></button>
                  </div>
                  {formData.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold bg-white dark:bg-slate-900 p-3 rounded-lg border">
                      <span className="uppercase">{it.productName}</span>
                      <span>{it.quantity} @ {currency}{it.unitPrice}</span>
                    </div>
                  ))}
              </div>
              <button type="submit" className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl">Commit Purchase Node</button>
          </form>
      </BaseModal>
    </div>
  );
};

export default PurchaseOrderComp;
