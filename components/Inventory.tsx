
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem, Unit, MaterialType, InventoryRoll, Order, ProductionJob, Design } from '../types';
import { 
  Search, Plus, Package, List, AlertTriangle, Download, 
  MapPin, Edit2, Trash2, Database, ShieldCheck, 
  Clock, TrendingUp, History, Filter, Scroll, LayoutGrid,
  CheckCircle, MoreVertical, Layers, Target, Scissors,
  ChevronRight, ArrowRight
} from 'lucide-react';
import BaseModal from './BaseModal';
import SmartPurchase from './SmartPurchase';

interface InventoryProps {
  items: InventoryItem[];
  orders?: Order[];
  production?: ProductionJob[];
  designs?: Design[];
  onAdd: (item: InventoryItem) => void;
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

const Inventory: React.FC<InventoryProps> = ({ 
  items, orders = [], production = [], designs = [], onAdd, onUpdate, onDelete, currency = '₹' 
}) => {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'AGEING' | 'ROLLS' | 'SMART'>('STOCK');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    type: MaterialType.FABRIC, unit: 'METER', quantity: 0, minStockLevel: 0, pricePerUnit: 0,
    inwardDate: new Date().toISOString().split('T')[0], rolls: []
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const name = item.name || '';
      const location = item.location || '';
      const id = item.id || '';
      return name.toLowerCase().includes(filter.toLowerCase()) || 
             location.toLowerCase().includes(filter.toLowerCase()) ||
             id.toLowerCase().includes(filter.toLowerCase());
    });
  }, [items, filter]);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const item = { ...formData, id: formData.id || `INV-${Date.now().toString().slice(-6)}`, updatedAt: new Date().toISOString() } as InventoryItem;
    if (formData.id) onUpdate(item); else onAdd(item);
    setIsModalOpen(false);
    setFormData({ type: MaterialType.FABRIC, unit: 'METER', quantity: 0, minStockLevel: 0, pricePerUnit: 0, inwardDate: new Date().toISOString().split('T')[0], rolls: [] });
  };

  const addRollShard = (item: InventoryItem) => {
    const newRoll: InventoryRoll = {
        id: `RL-${Date.now()}`,
        rollNumber: `R-${(item.rolls?.length || 0) + 1}`,
        initialQuantity: 100,
        currentQuantity: 100,
        grade: 'A',
        status: 'AVAILABLE'
    };
    const updatedRolls = [...(item.rolls || []), newRoll];
    const newTotalQty = updatedRolls.reduce((s,r) => s+r.currentQuantity, 0);
    onUpdate({ ...item, rolls: updatedRolls, quantity: newTotalQty });
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
      className="space-y-6 pb-10"
    >
      
      {/* macOS Style Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time stock management and material tracking</p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="macos-input w-full pl-9"
              placeholder="Search inventory..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setSelectedItem(null); setFormData({ type: MaterialType.FABRIC, unit: 'METER', quantity: 0, minStockLevel: 0, pricePerUnit: 0, inwardDate: new Date().toISOString().split('T')[0], rolls: [] }); setIsModalOpen(true); }} 
            className="macos-btn-primary flex items-center gap-2"
          >
             <Plus className="w-4 h-4" /> Add Item
          </motion.button>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="glass border border-macos-border dark:border-macos-darkBorder rounded-2xl overflow-hidden shadow-macos dark:shadow-macos-dark flex flex-col">
          <div className="px-6 border-b border-macos-border dark:border-macos-darkBorder bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div className="flex gap-8">
                  {[
                    { id: 'STOCK', label: 'All Stock' },
                    { id: 'ROLLS', label: 'Rolls' },
                    { id: 'AGEING', label: 'Ageing' },
                    { id: 'SMART', label: 'Smart Purchase' }
                  ].map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setActiveTab(t.id as any)} 
                        className={`py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === t.id ? 'border-macos-accent text-macos-accent' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                      >
                        {t.label}
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'STOCK' ? (
                <div className="overflow-x-auto">
                    <motion.table 
                      key="stock-table"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full text-left border-collapse min-w-[800px]"
                    >
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-macos-border dark:border-macos-darkBorder">
                            <tr>
                              <th className="px-6 py-4">Item Name</th>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4">Location</th>
                              <th className="px-6 py-4 text-right">Quantity</th>
                              <th className="px-6 py-4 text-right">Value</th>
                              <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-macos-border dark:divide-macos-darkBorder">
                            {filteredItems.map(item => (
                                <tr key={item.id} onClick={() => { setSelectedItem(item); setFormData(item); setIsModalOpen(true); }} className="hover:bg-macos-accent/5 dark:hover:bg-macos-accent/10 cursor-default transition-all group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900 dark:text-white tracking-tight">{item.name}</p>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{item.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                        <MapPin className="w-3.5 h-3.5 text-macos-accent opacity-50"/> 
                                        {item.location || 'Not Set'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-bold text-slate-900 dark:text-white tabular-nums">{item.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</span></p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.rolls?.length || 0} Rolls</p>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white tabular-nums">{currency}{(item.quantity * item.pricePerUnit).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        {item.quantity <= item.minStockLevel ? (
                                            <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30">Low Stock</span>
                                        ) : (
                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30">In Stock</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </motion.table>
                </div>
                ) : activeTab === 'ROLLS' ? (
                    <motion.div 
                      key="rolls-grid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6"
                    >
                       {items.filter(i => (i.rolls?.length || 0) > 0).map(item => (
                          <motion.div 
                            key={item.id} 
                            whileHover={{ y: -4 }}
                            className="macos-card p-6 flex flex-col"
                          >
                             <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                   <div className="p-3 bg-macos-accent/10 rounded-xl"><Scroll className="w-6 h-6 text-macos-accent"/></div>
                                   <div>
                                     <h4 className="font-bold text-slate-900 dark:text-white tracking-tight">{item.name}</h4>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.rolls?.length} Active Rolls</p>
                                   </div>
                                </div>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addRollShard(item)} 
                                  className="p-2 bg-macos-accent text-white rounded-xl shadow-sm"
                                >
                                  <Plus className="w-4 h-4"/>
                                </motion.button>
                             </div>
                             
                             <div className="space-y-2 flex-1">
                                {item.rolls?.map(roll => (
                                   <div key={roll.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-macos-border dark:border-macos-darkBorder group hover:border-macos-accent/50 transition-all">
                                      <div className="flex items-center gap-3">
                                         <span className="text-xs font-mono font-bold text-macos-accent">{roll.rollNumber}</span>
                                         <div className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-[10px] font-bold border border-macos-border dark:border-macos-darkBorder uppercase tracking-widest">Grade {roll.grade}</div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <p className="text-sm font-bold text-slate-900 dark:text-slate-300 tabular-nums">{roll.currentQuantity} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.unit}</span></p>
                                         <button className="p-1 text-slate-300 hover:text-macos-accent transition-colors opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4"/></button>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </motion.div>
                       ))}
                    </motion.div>
                ) : activeTab === 'SMART' ? (
                  <SmartPurchase production={production} designs={designs} inventory={items} />
                ) : (
                  <motion.div 
                    key="ageing-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-20 text-center opacity-30 flex flex-col items-center gap-4"
                  >
                      <Database className="w-12 h-12 text-macos-accent"/>
                      <p className="text-sm font-bold uppercase tracking-widest">Ageing Report Coming Soon</p>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
      </motion.div>

      {/* Item Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? 'Edit Item' : 'Add New Item'} size="xl">
          <form onSubmit={handleSaveItem} className="space-y-6 pb-20">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="macos-card p-6 space-y-4">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Product Name</label>
                          <input required className="macos-input w-full" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Silk Fabric" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                            <input type="number" className="macos-input w-full" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Price Per Unit</label>
                            <input type="number" className="macos-input w-full" value={formData.pricePerUnit || ''} onChange={e => setFormData({...formData, pricePerUnit: Number(e.target.value)})} />
                         </div>
                      </div>
                  </div>

                  <div className="macos-card p-6">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4">Summary</h4>
                      <div className="flex justify-between items-center py-4 border-b border-macos-border dark:border-macos-darkBorder">
                          <span className="text-sm font-medium text-slate-500">Total Valuation</span>
                          <span className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight">{currency}{((formData.quantity || 0) * (formData.pricePerUnit || 0)).toLocaleString()}</span>
                      </div>
                      <div className="pt-6 space-y-2">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Storage Location</label>
                         <div className="relative">
                           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-macos-accent opacity-50"/>
                           <input className="macos-input w-full pl-9" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Godown A" />
                         </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="macos-card p-6 space-y-6">
                     <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest border-b border-macos-border dark:border-macos-darkBorder pb-3">Organization</h4>
                     <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest px-1">Material Type</label>
                        <select className="macos-input w-full text-sm cursor-pointer" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                           <option value="FABRIC">Fabric</option>
                           <option value="YARN">Yarn</option>
                           <option value="DYE">Chemicals/Dye</option>
                           <option value="ACCESSORY">Accessories</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest px-1">Unit of Measure</label>
                        <select className="macos-input w-full text-sm cursor-pointer" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as any})}>
                           <option value="METER">Meter</option>
                           <option value="KG">Kilogram</option>
                           <option value="YARD">Yard</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest px-1">Min Stock Level</label>
                        <input type="number" className="macos-input w-full" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})} />
                     </div>
                  </div>
                </div>
             </div>

             <div className="mt-12 pt-8 border-t border-macos-border dark:border-macos-darkBorder flex flex-col sm:flex-row justify-between items-center gap-6">
                <button type="button" onClick={() => { if(formData.id && confirm('Delete this item?')) onDelete?.(formData.id!); setIsModalOpen(false); }} className="text-xs font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors order-2 sm:order-1">Delete Item</button>
                <div className="flex gap-4 w-full sm:w-auto order-1 sm:order-2">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-macos-border dark:border-macos-darkBorder text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                   <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="flex-1 sm:flex-none macos-btn-primary px-10 uppercase text-xs font-bold tracking-widest shadow-lg"
                   >
                    Save Item
                   </motion.button>
                </div>
             </div>
          </form>
      </BaseModal>
    </motion.div>
  );
};

export default Inventory;
