import React from 'react';
import { Order, Customer } from './types';
import { MapPin, Phone, Mail, Printer, Share2, Calendar, Package, Box, FileText, Truck, ShieldCheck, User } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import BaseModal from './components/BaseModal';

interface OrderDetailsModalProps {
  order: Order;
  customer?: Customer;
  currency?: string;
  onClose: () => void;
}

/**
 * Component to display order details in a modal and provide actions like PDF generation.
 * Fix: Completed the truncated file to ensure it returns a valid ReactNode.
 */
const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, customer, currency = '₹', onClose }) => {
  
  const generateInvoice = () => {
    const doc = new jsPDF();
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFontSize(28);
    doc.setTextColor(255);
    doc.text("INVOICE", 14, 30);
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 38);
    doc.setFontSize(14);
    doc.text("RAVI-TEXTILE", 196, 25, { align: 'right' });
    doc.setFontSize(8);
    doc.text("Surat, Gujarat, India", 196, 30, { align: 'right' });
    
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text("BILL TO", 14, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(customer?.name || order.customerName, 14, 68);
    
    autoTable(doc, {
      startY: 85,
      head: [["Item Description", "Qty", "Rate", "Total Amount"]],
      body: order.items.map(item => [item.productName, item.quantity, `${currency} ${item.unitPrice}`, `${currency} ${(item.quantity * item.unitPrice).toFixed(2)}`]),
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55], textColor: 255 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' }, 1: { halign: 'center' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Order Aggregate:", 140, finalY);
    doc.text(`${currency} ${order.totalAmount.toLocaleString()}`, 196, finalY, { align: 'right' });

    doc.save(`Invoice_${order.id}.pdf`);
  };

  const shareOnWhatsApp = () => {
      const message = `Invoice Update: Order *#${order.id}* for *${order.customerName}* is *${order.status}*.\nTotal: ${currency} ${order.totalAmount.toLocaleString()}.\n\n- Ravi-Textile`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  /**
   * Fix: Added component return to satisfy ReactNode type requirements and fix assignability error.
   */
  return (
    <BaseModal isOpen={true} onClose={onClose} title="Order Document" size="xl">
      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Document Area */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-8 relative overflow-hidden">
             {/* Decorative Top Border */}
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
             
             {/* Header */}
             <div className="flex justify-between items-start mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-800 uppercase">Invoice</h1>
                   <p className="text-slate-500 mt-1 font-mono text-sm">#{order.id}</p>
                </div>
                <div className="text-right">
                   <h3 className="font-bold text-slate-700 text-lg uppercase">Ravi-Textile</h3>
                   <p className="text-xs text-slate-500">Surat, Gujarat, India</p>
                </div>
             </div>

             {/* Bill To / Ship To */}
             <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
                <div>
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Bill To</p>
                   <h4 className="font-bold text-slate-800 text-lg uppercase">{customer?.name || order.customerName}</h4>
                   <p className="text-sm text-slate-500 mt-1">{customer?.address || 'No registered address'}</p>
                   <div className="mt-3 space-y-1">
                      {customer?.email && <p className="text-xs text-slate-500 flex items-center gap-2"><Mail className="w-3 h-3"/> {customer.email}</p>}
                      {customer?.phone && <p className="text-xs text-slate-500 flex items-center gap-2"><Phone className="w-3 h-3"/> {customer.phone}</p>}
                   </div>
                </div>
                <div className="text-right lg:text-left">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Date</p>
                         <p className="font-medium text-slate-700">{order.orderDate}</p>
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Due Date</p>
                         <p className="font-medium text-slate-700">{order.dueDate || '-'}</p>
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Protocol</p>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.paymentStatus}
                         </span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Items Table */}
             <div className="mb-8">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                      <tr>
                         <th className="py-3 px-4 rounded-l-lg">Item Description</th>
                         <th className="py-3 px-4 text-center">Qty</th>
                         <th className="py-3 px-4 text-right">Rate</th>
                         <th className="py-3 px-4 rounded-r-lg text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm">
                      {order.items.map((item, idx) => (
                         <tr key={idx} className="border-b border-slate-50 last:border-0">
                            <td className="py-4 px-4 font-bold text-slate-700 uppercase tracking-tight">{item.productName}</td>
                            <td className="py-4 px-4 text-center text-slate-600 font-medium">{item.quantity} {item.unit}</td>
                            <td className="py-4 px-4 text-right text-slate-600 tabular-nums">{currency} {item.unitPrice}</td>
                            <td className="py-4 px-4 text-right font-black text-slate-800 tabular-nums">{currency} {item.quantity * item.unitPrice}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {/* Total */}
             <div className="flex justify-end">
                <div className="w-64 space-y-3">
                   <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span className="font-bold text-slate-400 text-sm uppercase tracking-widest">Aggregate</span>
                      <span className="font-black text-indigo-600 text-2xl tabular-nums">{currency} {order.totalAmount.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Sidebar Actions */}
          <div className="w-full lg:w-72 flex flex-col gap-4">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase text-[10px] tracking-widest"><FileText className="w-4 h-4"/> Document Ops</h4>
                <button 
                  onClick={generateInvoice}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 mb-3 shadow-sm uppercase tracking-widest"
                >
                   <Printer className="w-4 h-4"/> Extract PDF
                </button>
                <button 
                  onClick={shareOnWhatsApp}
                  className="w-full bg-green-500 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-green-200 uppercase tracking-widest"
                >
                   <Share2 className="w-4 h-4"/> WhatsApp Link
                </button>
             </div>

             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase text-[10px] tracking-widest"><Truck className="w-4 h-4"/> Logistics</h4>
                <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                   <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 shadow-sm"></div>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Order Shard Created</p>
                      <p className="text-[9px] text-slate-400 font-bold">{order.orderDate}</p>
                   </div>
                   <div className="relative">
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>Transit Active</p>
                   </div>
                </div>
             </div>
          </div>
      </div>
    </BaseModal>
  );
};

export default OrderDetailsModal;