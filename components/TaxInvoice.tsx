
import React, { useState, useMemo } from 'react';
import { Order, Customer } from '../types';
import { 
  Plus, Receipt, Calendar, Printer, IndianRupee, Check, X, ShieldCheck
} from 'lucide-react';
import BaseModal from './BaseModal';

interface TaxInvoiceProps {
  orders: Order[];
  customers: Customer[];
  onAddInvoice: (order: Order) => void;
  currency?: string;
}

const TaxInvoice: React.FC<TaxInvoiceProps> = ({ 
  orders, customers, onAddInvoice, currency = '₹' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const invoices = useMemo(() => orders.filter(o => o.id.startsWith('INV')), [orders]);

  return (
    <div className="flex flex-col h-full -m-6">
      <div className="bg-white dark:bg-slate-900 border-b p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#6366f1] rounded-2xl text-white shadow-lg"><Receipt className="w-6 h-6"/></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">Tax Invoices</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Ledger Nodes</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#6366f1] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
           <Plus className="w-4 h-4" /> Generate Invoice
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
         <div className="bg-white dark:bg-slate-900 rounded-[2rem] border overflow-hidden">
            <table className="w-full text-left text-xs">
               <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b">
                  <tr><th className="p-6">Invoice #</th><th className="p-6">Party</th><th className="p-6">Date</th><th className="p-6 text-right">MAGNITUDE</th><th className="p-6 text-center">Protocol</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                       <td className="p-6 font-mono font-black text-indigo-600">#{inv.id}</td>
                       <td className="p-6 font-black uppercase text-slate-800 dark:text-white">{inv.customerName}</td>
                       <td className="p-6 font-bold text-slate-400">{inv.orderDate}</td>
                       <td className="p-6 text-right font-black dark:text-white tabular-nums">{currency}{inv.totalAmount.toLocaleString()}</td>
                       <td className="p-6 text-center"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{inv.paymentStatus}</span></td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Finalize Tax Invoice">
         <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }} className="space-y-4">
             <p className="text-sm font-bold text-slate-400 uppercase italic">Financial compliance matrix initialization...</p>
             <input list="cust-list" required className="w-full border-2 rounded-2xl p-4 text-sm font-bold bg-slate-50" placeholder="Billed to Node" />
             <div className="grid grid-cols-3 gap-4">
                <input type="number" className="border-2 rounded-2xl p-4 text-sm font-bold bg-slate-50" placeholder="GST %" defaultValue={5} />
                <input className="border-2 rounded-2xl p-4 text-sm font-bold bg-slate-50 col-span-2" placeholder="Bank Details Reference" />
             </div>
             <button type="submit" className="w-full bg-[#6366f1] text-white py-4 rounded-2xl font-black uppercase text-xs">Commit Fiscal Record</button>
         </form>
      </BaseModal>
    </div>
  );
};

export default TaxInvoice;
