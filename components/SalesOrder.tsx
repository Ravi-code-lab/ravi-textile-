
import React, { useState, useMemo, useEffect } from 'react';
import { Order, Customer, InventoryItem, OrderItem, Design, Agent } from '../types';
import { 
  Search, Plus, ShoppingCart, Calendar, MessageSquare, Printer, Package, Check, X, 
  Truck, IndianRupee, Filter, ChevronRight, Tag, MapPin, Hash, Ship, LayoutGrid, 
  List, Share2, ClipboardCheck, ArrowUpRight, Gauge, Clock, Trash2, BadgePercent
} from 'lucide-react';
import BaseModal from './BaseModal';
import OrderDetailsModal from './OrderDetailsModal';

interface SalesOrderProps {
  orders: Order[];
  customers: Customer[];
  inventory: InventoryItem[];
  designs: Design[];
  agents: Agent[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  currency?: string;
}

const SalesOrder: React.FC<SalesOrderProps> = ({ 
  orders, customers, inventory, designs, agents, 
  onAddOrder, onUpdateOrder, onDeleteOrder, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'SHIPPED' | 'DELIVERED' | 'ALL'>('PENDING');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('erpnext_custom_fields');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setCustomFields(parsed.filter((f: any) => f.docType === 'Order'));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  
  const [formData, setFormData] = useState<Partial<Order>>({
    status: 'PENDING', paymentStatus: 'UNPAID', items: [],
    orderDate: new Date().toISOString().split('T')[0],
    taxRate: 5, vehicleNo: '', transportName: '', agentName: '',
    agentCommissionRate: 2, agentCommissionAmount: 0
  });
  
  const [newItem, setNewItem] = useState<OrderItem>({ productName: '', quantity: 1, unitPrice: 0, unit: 'PIECE' });

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = o.customerName || '';
      const id = o.id || '';
      const match = name.toLowerCase().includes(filter.toLowerCase()) || id.toLowerCase().includes(filter.toLowerCase());
      return statusFilter === 'ALL' ? match : (match && o.status === statusFilter);
    });
  }, [orders, filter, statusFilter]);

  // Sync Agent Commission when agent changes
  useEffect(() => {
      if (formData.agentName) {
          const agent = agents.find(a => a.name === formData.agentName);
          if (agent) {
              setFormData(prev => ({ ...prev, agentCommissionRate: agent.commissionRate || 2 }));
          }
      }
  }, [formData.agentName, agents]);

  const subTotal = useMemo(() => (formData.items || []).reduce((s, i) => s + (i.quantity * i.unitPrice), 0), [formData.items]);
  const taxAmount = (subTotal * (formData.taxRate || 5)) / 100;
  const commissionAmount = (subTotal * (formData.agentCommissionRate || 0)) / 100;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.items?.length) return;

    onAddOrder({
      id: `ORD-${Date.now().toString().slice(-4)}`,
      ...formData,
      agentCommissionAmount: commissionAmount,
      totalAmount: subTotal + taxAmount
    } as Order);
    setIsCreateModalOpen(false);
    setFormData({ items: [], status: 'PENDING', orderDate: new Date().toISOString().split('T')[0], taxRate: 5 });
  };

  const handleAddItem = () => {
    if(newItem.productName && newItem.quantity > 0) {
      setFormData({
        ...formData,
        items: [...(formData.items || []), { ...newItem }]
      });
      setNewItem({ productName: '', quantity: 1, unitPrice: 0, unit: 'PIECE' });
    }
  };

  const removeItem = (idx: number) => {
    const updated = [...(formData.items || [])];
    updated.splice(idx, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleWhatsApp = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const msg = `Order #${order.id} for ${order.customerName} is ${order.status}. Total: ${currency}${order.totalAmount.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 -m-6 animate-fade-in">
      
      {/* Standard Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Sales Orders</h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
              placeholder="Search party or order ID..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap">
             <Plus className="w-4 h-4" /> New Order
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono text-indigo-600 font-bold">ORD #{order.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                  order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-100' : 
                  order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                  'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {order.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white uppercase truncate mb-4">{order.customerName}</h3>
              <div className="grid grid-cols-2 gap-4 text-[11px] font-medium text-slate-500 mb-4 uppercase">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {order.orderDate}</div>
                <div className="flex items-center gap-1.5 justify-end"><Package className="w-3.5 h-3.5"/> {order.items.length} SKUs</div>
              </div>

              {customFields.some((f: any) => (order as any)[f.key]) && (
                 <div className="mb-4 p-2 bg-indigo-50/50 dark:bg-slate-950/30 rounded border border-indigo-100/50 dark:border-indigo-900/10 space-y-1 text-[10px] uppercase">
                    {customFields.map((f: any) => (order as any)[f.key] && (
                       <div key={f.id} className="flex justify-between">
                          <span className="font-extrabold text-indigo-700 dark:text-indigo-400">{f.label}:</span>
                          <span className="font-bold text-slate-600 dark:text-slate-350">{(order as any)[f.key]}</span>
                       </div>
                    ))}
                 </div>
              )}
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                 <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Payload</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{currency}{order.totalAmount.toLocaleString()}</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={(e) => handleWhatsApp(e, order)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><MessageSquare className="w-4 h-4"/></button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Printer className="w-4 h-4"/></button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Order Popup */}
      <BaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Sales Order" size="xl">
          <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer / Party Name</label>
                    <input list="cust-list" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10" value={formData.customerName || ''} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Search or select party..." />
                    <datalist id="cust-list">{customers.map(c => <option key={c.id} value={c.name}/>)}</datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Booking Date</label>
                    <input type="date" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                  </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-4 flex items-center gap-2"><Package className="w-4 h-4"/> Order Payload Registry</h4>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input list="prod-list" className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900" placeholder="Product SKU / Barcode" value={newItem.productName} onChange={e => {
                        const d = designs.find(des => des.name === e.target.value) || inventory.find(i => i.name === e.target.value);
                        setNewItem({...newItem, productName: e.target.value, unitPrice: (d as any)?.processCostPerPiece ? (d as any).processCostPerPiece * 1.5 : (d as any)?.pricePerUnit || 0});
                    }} />
                    <datalist id="prod-list">{[...designs, ...inventory].map(x => <option key={x.id} value={x.name}/>)}</datalist>
                    <input type="number" className="w-full sm:w-24 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900" placeholder="Qty" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                    <input type="number" className="w-full sm:w-32 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900" placeholder="Rate" value={newItem.unitPrice || ''} onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})} />
                    <button type="button" onClick={handleAddItem} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"><Plus className="w-4 h-4"/></button>
                  </div>

                  <div className="overflow-x-auto border rounded-lg bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-950 border-b">
                        <tr>
                          <th className="px-4 py-2 uppercase font-bold text-slate-500">Item Description</th>
                          <th className="px-4 py-2 text-right uppercase font-bold text-slate-500">Qty</th>
                          <th className="px-4 py-2 text-right uppercase font-bold text-slate-500">Rate</th>
                          <th className="px-4 py-2 text-right uppercase font-bold text-slate-500">Amount</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {formData.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium uppercase">{item.productName}</td>
                            <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-3 text-right">{currency}{item.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold">{currency}{(item.quantity * item.unitPrice).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-600"><X className="w-4 h-4"/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>

              {/* Distribution & Commission Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sales Broker / Agent</label>
                    <select className="w-full border dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 outline-none" value={formData.agentName} onChange={e => setFormData({...formData, agentName: e.target.value})}>
                      <option value="">Direct Office Booking</option>
                      {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comm Rate (%)</label>
                        <input type="number" className="w-full border dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold bg-white dark:bg-slate-900" value={formData.agentCommissionRate} onChange={e => setFormData({...formData, agentCommissionRate: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Broker Payout</label>
                        <div className="w-full bg-slate-900 text-amber-400 rounded-lg px-4 py-2.5 text-sm font-black tabular-nums border border-slate-700">
                          {currency}{commissionAmount.toLocaleString()}
                        </div>
                      </div>
                  </div>
              </div>

              {customFields.length > 0 && (
                 <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                       ERPNext Custom DocType Columns
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {customFields.map((f: any) => (
                          <div key={f.id} className="space-y-1">
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                             {f.type === 'select' ? (
                                <select 
                                   required={f.required}
                                   className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 px-3 py-2 text-sm rounded-lg"
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
                                   className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-755 px-3 py-2 text-sm rounded-lg"
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

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shipping Details</label>
                    <textarea rows={2} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm bg-slate-50 dark:bg-slate-800 outline-none" placeholder="Delivery coordinate shards..." value={formData.shippingAddress || ''} onChange={e => setFormData({...formData, shippingAddress: e.target.value})} />
                  </div>
                </div>
                <div className="w-full md:w-72 bg-slate-950 p-4 rounded-xl border border-white/5 space-y-3 shadow-2xl">
                  <div className="flex justify-between text-xs font-medium text-slate-400 uppercase tracking-widest">
                    <span>Sub Total</span>
                    <span>{currency}{subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1">GST (%) <input type="number" className="w-12 bg-slate-800 border-none rounded px-1 ml-1 text-white" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} /></span>
                    <span>{currency}{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center font-bold text-white">
                    <span className="uppercase text-[10px] tracking-widest text-indigo-400">Grand Total</span>
                    <span className="text-xl text-emerald-400 tabular-nums">{currency}{(subTotal + taxAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-widest">Discard Shard</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-2.5 rounded-lg text-sm font-bold shadow-2xl transition-all active:scale-95 uppercase tracking-widest">Commit Order Node</button>
              </div>
          </form>
      </BaseModal>

      {selectedOrder && <OrderDetailsModal order={selectedOrder} customer={customers.find(c => c.name === selectedOrder.customerName)} onClose={() => setSelectedOrder(null)} currency={currency} />}
    </div>
  );
};

export default SalesOrder;
