
import React, { useState, useMemo } from 'react';
import { InventoryItem, PurchaseOrder, GatePass } from '../types';
import { PackageCheck, Plus, Search, Truck, Calendar, Printer, Hash, ArrowDownToLine, MapPin } from 'lucide-react';
import BaseModal from './BaseModal';

interface PurchaseInwardProps {
  purchaseOrders: PurchaseOrder[];
  inventory: InventoryItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onUpdatePO: (po: PurchaseOrder) => void;
  currency?: string;
}

const PurchaseInward: React.FC<PurchaseInwardProps> = ({ 
  purchaseOrders, inventory, onUpdateInventory, onUpdatePO, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const pendingPos = useMemo(() => purchaseOrders.filter(po => po.status === 'SENT' || po.status === 'DRAFT'), [purchaseOrders]);
  const receivedPos = useMemo(() => purchaseOrders.filter(po => po.status === 'RECEIVED'), [purchaseOrders]);

  const handleReceive = (po: PurchaseOrder) => {
    // Update PO status
    onUpdatePO({ ...po, status: 'RECEIVED', updatedAt: new Date().toISOString() });

    // Update Inventory for each item in PO
    po.items.forEach(item => {
      const invItem = inventory.find(i => i.name === item.productName);
      if (invItem) {
        onUpdateInventory({
          ...invItem,
          quantity: invItem.quantity + item.quantity,
          updatedAt: new Date().toISOString()
        });
      } else {
        // If item doesn't exist, we might want to add it, but for now just log
        console.warn(`Item ${item.productName} not found in inventory`);
      }
    });

    setIsModalOpen(false);
    setSelectedPO(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 -m-8 p-8 animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><PackageCheck className="w-6 h-6"/></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">Purchase Inwards</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Physical Ingress Shards</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Search GRN / Batch..." value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                <ArrowDownToLine className="w-4 h-4"/> Receive PO
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {receivedPos.length > 0 ? receivedPos.map(po => (
           <div key={po.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest text-white bg-emerald-500">
                RECEIVED
              </div>
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <span className="text-[10px] font-mono text-emerald-600 font-black uppercase tracking-tighter">GRN NODE #{po.id}</span>
                    <h4 className="font-black text-slate-800 dark:text-white uppercase text-lg leading-tight mt-1 truncate max-w-[200px]">{po.supplierName}</h4>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Magnitude Inward</p>
                    <p className="text-lg font-black text-emerald-600 tabular-nums">{currency}{po.totalAmount.toLocaleString()}</p>
                 </div>
              </div>
              <div className="space-y-2 mb-6">
                 {po.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                       <span className="truncate max-w-[150px]">{it.productName}</span>
                       <span className="text-slate-800 dark:text-white tabular-nums">{it.quantity} {it.unit}</span>
                    </div>
                 ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {po.date}</span>
                    <span className="flex items-center gap-1 text-emerald-600"><Truck className="w-3.5 h-3.5"/> Delivered</span>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors"><Printer className="w-4 h-4"/></button>
                    <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors"><MapPin className="w-4 h-4"/></button>
                 </div>
              </div>
           </div>
        )) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center grayscale opacity-30 text-slate-400">
                <PackageCheck className="w-16 h-16 mb-4"/>
                <p className="text-xs font-black uppercase tracking-[0.4em]">No inward nodes detected</p>
            </div>
        )}
      </div>

      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Receive Procurement Node" size="lg">
          <div className="space-y-6">
              <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest px-1">Select Pending Purchase Order</label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {pendingPos.map(po => (
                          <div 
                            key={po.id} 
                            onClick={() => setSelectedPO(po)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedPO?.id === po.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                          >
                              <div>
                                  <p className="text-[10px] font-mono text-slate-400 uppercase">#{po.id}</p>
                                  <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">{po.supplierName}</h4>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs font-black text-emerald-600">{currency}{po.totalAmount.toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{po.items.length} Items</p>
                              </div>
                          </div>
                      ))}
                      {pendingPos.length === 0 && (
                          <p className="text-center py-10 text-slate-400 italic text-sm">No pending purchase orders found.</p>
                      )}
                  </div>
              </div>

              {selectedPO && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items to be Inwarded</h5>
                      <div className="space-y-2">
                          {selectedPO.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-xs font-bold uppercase">
                                  <span className="text-slate-600 dark:text-slate-400">{it.productName}</span>
                                  <span className="text-slate-900 dark:text-white">{it.quantity} {it.unit}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                  <button 
                    disabled={!selectedPO}
                    onClick={() => selectedPO && handleReceive(selectedPO)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                      <PackageCheck className="w-4 h-4"/> Commit Inward Node
                  </button>
              </div>
          </div>
      </BaseModal>
    </div>
  );
};

export default PurchaseInward;
