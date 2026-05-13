
import React, { useState, useMemo, useEffect } from 'react';
import { Order, Customer, OrderItem, CompanyInfo } from '../types';
import { 
  Search, Plus, Truck, Calendar, MapPin, 
  Printer, Package, Check, X, Ship, FileText, User,
  ArrowUpRight, ClipboardList, ShieldCheck, Download,
  Hash, Link as LinkIcon, BadgeCheck, FileCheck,
  ChevronRight, MoreHorizontal, ExternalLink, Filter, Weight, Archive, CheckCircle
} from 'lucide-react';
import BaseModal from './BaseModal';
import SmartDelivery from './SmartDelivery';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DeliveryChallanProps {
  orders: Order[];
  customers: Customer[];
  onAddChallan: (order: Order) => void;
  onUpdateChallan: (order: Order) => void;
  currency?: string;
  companyInfo?: CompanyInfo;
}

const DeliveryChallan: React.FC<DeliveryChallanProps> = ({ 
  orders, customers, onAddChallan, currency = '₹', 
  companyInfo = { name: 'RAVI-TEXTILE', address: 'Surat, GJ', gstin: '', email: '', website: '', logoUrl: '' }
}) => {
  const [filter, setFilter] = useState('');
  const [activeView, setActiveView] = useState<'LIST' | 'SMART'>('LIST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderLink, setSelectedOrderLink] = useState<string>('');
  
  // Extended form state for logistics
  const [formData, setFormData] = useState<Partial<Order & { bundles?: number, totalWeight?: number }>>({ 
    status: 'PENDING', 
    items: [], 
    orderDate: new Date().toISOString().split('T')[0],
    transportName: '',
    vehicleNo: '',
    shippingAddress: '',
    bundles: 1,
    totalWeight: 0
  });

  const challans = useMemo(() => orders.filter(o => o.id?.startsWith('DC')), [orders]);

  const filteredChallans = useMemo(() => {
    const q = filter.toLowerCase();
    return challans.filter(c => 
        c.customerName.toLowerCase().includes(q) || 
        c.id.toLowerCase().includes(q) ||
        (c.transportName || '').toLowerCase().includes(q)
    );
  }, [challans, filter]);

  // Enhanced Order Linkage Logic
  useEffect(() => {
    if (selectedOrderLink) {
        const sourceOrder = orders.find(o => o.id === selectedOrderLink);
        if (sourceOrder) {
            setFormData(prev => ({
                ...prev,
                customerName: sourceOrder.customerName,
                items: sourceOrder.items,
                shippingAddress: sourceOrder.shippingAddress || prev.shippingAddress || '',
                transportName: sourceOrder.transportName || prev.transportName || '',
                totalAmount: 0 // DCs are non-financial movement documents
            }));
        }
    }
  }, [selectedOrderLink, orders]);

  const generateDCPDF = (challan: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Industrial Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVERY CHALLAN", 15, 25);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`DC IDENTITY: ${challan.id}`, 15, 32);
    doc.text(`DISPATCH DATE: ${challan.orderDate}`, 15, 37);

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(companyInfo.name.toUpperCase(), pageWidth - 15, 25, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(companyInfo.address || "Industrial Estate, Surat, GJ", pageWidth - 15, 30, { align: 'right' });
    doc.text(`GSTIN: ${companyInfo.gstin || '24XXXXX0000X0Z0'}`, pageWidth - 15, 34, { align: 'right' });

    // Logistics & Consignee Row
    doc.setDrawColor(240);
    doc.line(15, 45, pageWidth - 15, 45);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CONSIGNEE / SHIP TO:", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(challan.customerName, 15, 62);
    const addrLines = doc.splitTextToSize(challan.shippingAddress || "As per master registry", 80);
    doc.text(addrLines, 15, 67);

    doc.setFont("helvetica", "bold");
    doc.text("TRANSPORTATION DETAILS:", 110, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Carrier: ${challan.transportName || 'EX-WORKS'}`, 110, 62);
    doc.text(`Vehicle: ${challan.vehicleNo || 'NOT REGISTERED'}`, 110, 67);
    doc.text(`Bundles/Packages: ${challan.bundles || 1}`, 110, 72);
    doc.text(`Net Weight: ${challan.totalWeight || 0} KG`, 110, 77);

    autoTable(doc, {
        startY: 90,
        head: [['SR', 'SKU / ITEM DESCRIPTION', 'QUANTITY', 'UNIT', 'PACKING TYPE']],
        body: challan.items.map((it: any, i: number) => [
            i + 1,
            it.productName.toUpperCase(),
            it.quantity,
            it.unit,
            'ROLL/PIECE'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 4 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 35;
    doc.setFontSize(8);
    doc.text("________________________", 15, finalY);
    doc.text("RECIPIENT'S STAMP/SIGN", 15, finalY + 5);
    
    doc.text("________________________", pageWidth - 15, finalY, { align: 'right' });
    doc.text("AUTHORISED SIGNATORY", pageWidth - 15, finalY + 5, { align: 'right' });

    doc.setFontSize(7);
    doc.setTextColor(180);
    doc.text("Generated via Ravi-Textile Nexus Core. Non-taxable logistics movement shard.", pageWidth/2, 285, { align: 'center' });

    doc.save(`Dispatch_${challan.id}.pdf`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName) return;
    
    onAddChallan({
      ...formData,
      id: `DC-${Date.now().toString().slice(-6)}`,
      totalAmount: 0,
      status: 'SHIPPED',
      updatedAt: new Date().toISOString()
    } as Order);
    
    setIsModalOpen(false);
    setFormData({ status: 'PENDING', items: [], orderDate: new Date().toISOString().split('T')[0], bundles: 1, totalWeight: 0 });
    setSelectedOrderLink('');
  };

  return (
    <div className="flex flex-col h-full bg-[#f6f6f7] dark:bg-slate-950 -m-8 p-8 animate-fade-in font-sans">
      
      {/* Header UI */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <span>Sales Matrix</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 dark:text-white">Fulfillment Hub</span>
          </nav>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Delivery challans</h2>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
             <button onClick={() => setActiveView('LIST')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activeView === 'LIST' ? 'bg-slate-900 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800'}`}>Challans</button>
             <button onClick={() => setActiveView('SMART')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activeView === 'SMART' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800'}`}>Smart Plan</button>
           </div>
           <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 dark:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2">
             <Plus className="w-4 h-4"/> Create delivery challan
           </button>
        </div>
      </div>

      {/* Main Table Matrix */}
      {activeView === 'SMART' ? (
        <SmartDelivery orders={orders} />
      ) : (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    placeholder="Filter by customer or challan ID..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
              </div>
              <button className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4"/> Sort
              </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-[#fcfcfc] dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold text-xs border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                          <th className="px-6 py-3">Reference</th>
                          <th className="px-6 py-3">Ship Date</th>
                          <th className="px-6 py-3">Consignee</th>
                          <th className="px-6 py-3">Carrier</th>
                          <th className="px-6 py-3">Payload</th>
                          <th className="px-6 py-3 text-right">State</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {filteredChallans.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group" onClick={() => generateDCPDF(c)}>
                              <td className="px-6 py-4">
                                  <span className="text-sm font-bold text-indigo-600">#{c.id}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{c.orderDate}</td>
                              <td className="px-6 py-4">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[180px]">{c.customerName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[180px]">{c.shippingAddress || 'Address Shard Missing'}</p>
                              </td>
                              <td className="px-6 py-4">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{c.transportName || 'EX-WORKS'}</p>
                                  <p className="text-[10px] text-slate-400 font-mono uppercase">{c.vehicleNo || 'NO VEHICLE'}</p>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                  <div className="flex items-center gap-2">
                                      <Package className="w-3 h-3"/> {c.items.length} SKUs
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end items-center gap-3">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">Dispatched</span>
                                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                                          <Printer className="w-4 h-4"/>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredChallans.length === 0 && (
                          <tr><td colSpan={6} className="py-32 text-center grayscale opacity-30"><ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-400"/><p className="text-sm font-black uppercase tracking-[0.3em]">No Dispatch Shards Found</p></td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
      )}

      {/* Creation Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize delivery challan" size="xl">
          <form onSubmit={handleCreate} className="space-y-6 pb-24">
              <div className="flex flex-col lg:flex-row gap-8">
                  
                  {/* Fulfillment Config */}
                  <div className="flex-1 space-y-6">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Order Linkage Matrix</h4>
                          <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 px-1">Source Order ID</label>
                                <select 
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold uppercase"
                                    value={selectedOrderLink}
                                    onChange={(e) => setSelectedOrderLink(e.target.value)}
                                >
                                    <option value="">Manual Entry Protocol...</option>
                                    {orders.filter(o => !o.id.startsWith('DC') && o.status !== 'DELIVERED').map(o => (
                                        <option key={o.id} value={o.id}>{o.id} — {o.customerName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 px-1">Consignee Identity</label>
                                <input required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm uppercase font-black bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/20" value={formData.customerName || ''} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} />
                            </div>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-[#fcfcfc] dark:bg-slate-950">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload Shards</h4>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded">{formData.items?.length || 0} Units Linkified</span>
                          </div>
                          <div className="p-4 space-y-3">
                              {formData.items?.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0 group">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border dark:border-slate-700 shadow-inner"><Package className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors"/></div>
                                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{item.productName}</span>
                                      </div>
                                      <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.quantity} <span className="text-[10px] font-bold text-slate-400">{item.unit}</span></span>
                                  </div>
                              ))}
                              {(!formData.items || formData.items.length === 0) && (
                                  <div className="py-10 text-center flex flex-col items-center gap-2 opacity-30">
                                      <LinkIcon className="w-8 h-8"/>
                                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Linkage Shard</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Sidebar Logistics */}
                  <div className="w-full lg:w-80 space-y-6">
                      <div className="bg-slate-900 dark:bg-slate-950 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><Ship className="w-32 h-32"/></div>
                          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 relative z-10">Carrier Spec</h4>
                          <div className="space-y-4 relative z-10">
                              <div>
                                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Transporter Node</label>
                                  <input className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-bold outline-none uppercase focus:border-indigo-500/50" value={formData.transportName} onChange={e => setFormData({...formData, transportName: e.target.value.toUpperCase()})} placeholder="E.G. VRL LOGISTICS" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Vehicle ID</label>
                                      <input className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-bold outline-none uppercase" value={formData.vehicleNo} onChange={e => setFormData({...formData, vehicleNo: e.target.value.toUpperCase()})} placeholder="GJ 01 XX 0000" />
                                  </div>
                                  <div>
                                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Dispatch Date</label>
                                      <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-[10px] font-bold outline-none" value={formData.orderDate} onChange={e => setFormData({...formData, orderDate: e.target.value})} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><Archive className="w-4 h-4 text-indigo-500"/> Physical Manifest</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Bundles / Bags</label>
                                  <input type="number" className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-black bg-white dark:bg-slate-950 tabular-nums" value={formData.bundles} onChange={e => setFormData({...formData, bundles: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gross Wt (KG)</label>
                                  <input type="number" className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-black bg-white dark:bg-slate-950 tabular-nums" value={formData.totalWeight} onChange={e => setFormData({...formData, totalWeight: Number(e.target.value)})} />
                              </div>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500"/> Shipping Egress</h4>
                          <textarea rows={3} className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-[11px] font-bold bg-white dark:bg-slate-950 outline-none uppercase shadow-inner" value={formData.shippingAddress} onChange={e => setFormData({...formData, shippingAddress: e.target.value.toUpperCase()})} placeholder="FULL DESTINATION COORDINATES..." />
                      </div>
                  </div>
              </div>

              {/* Action Interface */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-[110] rounded-b-xl shadow-lg px-10">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors px-6 py-2 border border-slate-200 dark:border-slate-800 rounded-lg">Abort Dispatch</button>
                 <div className="flex gap-4">
                    <button type="submit" className="bg-slate-900 dark:bg-indigo-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                        <CheckCircle className="w-5 h-5"/> Commit Dispatch Node
                    </button>
                 </div>
              </div>
          </form>
      </BaseModal>
    </div>
  );
};

export default DeliveryChallan;
