
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order, Customer, InventoryItem, OrderItem, Design, Agent, ViewState } from '../types';
import { 
  Search, Plus, ShoppingCart, Calendar, MessageSquare, Printer, Package, Check, X, 
  Truck, DollarSign, Filter, ChevronRight, Tag, MapPin, Hash, Ship, LayoutGrid, 
  List, Share2, ClipboardCheck, ArrowUpRight, Gauge, Clock, MoreVertical, Trash2,
  ExternalLink, Download
} from 'lucide-react';
import BaseModal from './BaseModal';
import OrderDetailsModal from './OrderDetailsModal';

interface OrdersProps {
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

const Orders: React.FC<OrdersProps> = ({ 
  orders, customers, inventory, designs, agents, 
  onAddOrder, onUpdateOrder, onDeleteOrder, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'SHIPPED' | 'DELIVERED' | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Order>>({
    status: 'PENDING', paymentStatus: 'UNPAID', items: [],
    orderDate: new Date().toISOString().split('T')[0],
    taxRate: 5, vehicleNo: '', transportName: '', agentName: ''
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.items?.length) return;

    const calculatedTotal = (formData.items || []).reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const tax = calculatedTotal * ((formData.taxRate || 0) / 100);

    onAddOrder({
      id: `ORD-${Date.now().toString().slice(-4)}`,
      ...formData,
      totalAmount: calculatedTotal + tax
    } as Order);
    setIsCreateModalOpen(false);
    setFormData({ items: [], status: 'PENDING', orderDate: new Date().toISOString().split('T')[0], taxRate: 5 });
  };

  const handleWhatsApp = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    const msg = `Order #${order.id} for ${order.customerName} is ${order.status}. Total: ${currency}${order.totalAmount.toLocaleString()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-full glass border border-macos-border dark:border-macos-darkBorder rounded-2xl overflow-hidden shadow-macos dark:shadow-macos-dark"
    >
      
      {/* macOS Style Header */}
      <div className="px-6 py-5 border-b border-macos-border dark:border-macos-darkBorder flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-macos-accent/10 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-macos-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Orders</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sales Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="macos-input w-full pl-9 pr-4 py-2 text-sm"
              placeholder="Search orders..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <select 
            className="macos-input text-sm px-3 py-2 cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)} 
            className="macos-btn-primary flex items-center gap-2 whitespace-nowrap"
          >
             <Plus className="w-4 h-4" /> New Order
          </motion.button>
        </div>
      </div>

      {/* macOS Style Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse min-w-[900px]">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-macos-border dark:border-macos-darkBorder sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-center">Items</th>
              <th className="px-6 py-4 text-right">Total Amount</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-macos-border dark:divide-macos-darkBorder">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, idx) => (
                <motion.tr 
                  key={order.id} 
                  variants={itemVariants}
                  layout
                  onClick={() => setSelectedOrder(order)} 
                  className="hover:bg-macos-accent/5 dark:hover:bg-macos-accent/10 transition-colors cursor-default group"
                >
                  <td className="px-6 py-4 font-mono font-bold text-macos-accent">#{order.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white uppercase truncate max-w-[200px]">{order.customerName}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{order.orderDate}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold text-[10px] text-slate-500">
                      {order.items?.length || 0} SKU
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white tabular-nums">
                    {currency}{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
                      order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : 
                      order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30' : 
                      'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button whileHover={{ scale: 1.1 }} onClick={(e: React.MouseEvent) => handleWhatsApp(e, order)} className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><MessageSquare className="w-4 h-4"/></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} className="p-2 text-slate-400 hover:text-macos-accent rounded-lg hover:bg-macos-accent/10 transition-colors"><Printer className="w-4 h-4"/></motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteOrder(order.id); }} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 className="w-4 h-4"/></motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center opacity-30">
            <Package className="w-12 h-12 mb-4 text-slate-400" />
            <p className="text-sm font-bold uppercase tracking-widest">No orders found</p>
          </div>
        )}
      </div>

      <BaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New Sales Order" size="lg">
          <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Customer / Party</label>
                    <input list="cust-list" required className="macos-input w-full" value={formData.customerName || ''} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Search customer..." />
                    <datalist id="cust-list">{customers.map(c => <option key={c.id} value={c.name}/>)}</datalist>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Order Date</label>
                    <input type="date" required className="macos-input w-full" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                  </div>
              </div>

              <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-macos-border dark:border-macos-darkBorder space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Order Items</h3>
                    <span className="text-[10px] font-bold text-macos-accent uppercase tracking-widest">{formData.items?.length || 0} Added</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <input list="prod-list" className="macos-input w-full" placeholder="Product SKU" value={newItem.productName} onChange={e => {
                          const d = designs.find(des => des.name === e.target.value) || inventory.find(i => i.name === e.target.value);
                          setNewItem({...newItem, productName: e.target.value, unitPrice: (d as any)?.processCostPerPiece ? (d as any).processCostPerPiece * 1.5 : (d as any)?.pricePerUnit || 0});
                      }} />
                      <datalist id="prod-list">{[...designs, ...inventory].map(x => <option key={x.id} value={x.name}/>)}</datalist>
                    </div>
                    <div className="flex gap-3">
                      <input type="number" className="macos-input w-full sm:w-24" placeholder="Qty" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        onClick={() => { if(newItem.productName && newItem.quantity) { setFormData({...formData, items: [...(formData.items || []), newItem]}); setNewItem({productName:'', quantity:1, unitPrice:0, unit:'PIECE'}); } }} 
                        className="bg-macos-accent text-white p-3 rounded-xl shadow-sm shrink-0"
                      >
                        <Plus className="w-5 h-5"/>
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    <AnimatePresence mode="popLayout">
                      {formData.items?.map((item, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-macos-border dark:border-macos-darkBorder text-sm shadow-sm"
                          >
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{item.productName}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.quantity} {item.unit}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-macos-accent font-bold tabular-nums">{currency}{(item.quantity * item.unitPrice).toLocaleString()}</span>
                                <button type="button" onClick={() => { const updated = [...(formData.items || [])]; updated.splice(idx, 1); setFormData({ ...formData, items: updated }); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X className="w-4 h-4"/></button>
                              </div>
                          </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-macos-border dark:border-macos-darkBorder text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  className="flex-1 macos-btn-primary py-4 uppercase text-xs font-bold tracking-widest shadow-lg"
                >
                  Create Order
                </motion.button>
              </div>
          </form>
      </BaseModal>

      {selectedOrder && <OrderDetailsModal order={selectedOrder} customer={customers.find(c => c.name === selectedOrder.customerName)} onClose={() => setSelectedOrder(null)} />}
    </motion.div>
  );
};

export default Orders;
