
import React, { useState, useMemo } from 'react';
import { Transaction, Customer, Karigar, PurchaseOrder, Order, Agent, Budget, TeamMember, LoanRecord } from '../types';
import { 
  Wallet, BookOpen, Printer, ArrowUpToLine, History,
  ArrowDownLeft, ArrowUpRight, Search, Plus, CreditCard, Scale, Activity,
  Briefcase, Landmark, ShieldCheck, BarChart3, TrendingUp, IndianRupee,
  ChevronRight, ArrowRight, FileText, Download, Filter, Table as TableIcon,
  User
} from 'lucide-react';
import BaseModal from './BaseModal';

interface AccountingProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  purchaseOrders?: PurchaseOrder[];
  salesOrders?: Order[];
  customers?: Customer[];
  karigars?: Karigar[];
  agents?: Agent[];
  team?: TeamMember[];
  loans?: LoanRecord[];
  currency?: string;
}

const Accounting: React.FC<AccountingProps> = ({ 
  transactions, onAddTransaction, purchaseOrders = [], salesOrders = [],
  customers = [], karigars = [], agents = [], team = [], loans = [],
  currency = '₹' 
}) => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'DAYBOOK' | 'BROKER_PAYOUT' | 'GST_SUMMARY'>('LEDGER');
  const [ledgerType, setLedgerType] = useState<'CLIENT' | 'KARIGAR' | 'BROKER' | 'STAFF'>('CLIENT');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ 
    amount: 0, 
    type: 'DEBIT' as 'CREDIT' | 'DEBIT', 
    description: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  const activeAccount = useMemo(() => {
    if (ledgerType === 'CLIENT') return customers.find(c => c.id === selectedAccountId);
    if (ledgerType === 'KARIGAR') return karigars.find(k => k.id === selectedAccountId);
    if (ledgerType === 'STAFF') return team.find(t => t.id === selectedAccountId);
    return agents.find(a => a.id === selectedAccountId);
  }, [ledgerType, selectedAccountId, customers, karigars, agents, team]);

  const accountLedger = useMemo(() => {
    if (!selectedAccountId) return [];
    
    const txnEntries = transactions
      .filter(t => t.referenceId === selectedAccountId)
      .map(t => ({
        date: t.date, 
        time: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        desc: t.description || 'Transaction', 
        dr: t.type === 'EXPENSE' ? t.amount : 0, 
        cr: t.type === 'INCOME' ? t.amount : 0
      }));

    if (ledgerType === 'BROKER') {
      salesOrders
        .filter(o => o.agentId === selectedAccountId || o.agentName === activeAccount?.name)
        .forEach(o => {
          txnEntries.push({
            date: o.orderDate,
            time: o.updatedAt ? new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            desc: `Commission: Order #${o.id}`,
            dr: 0,
            cr: o.agentCommissionAmount || 0
          });
        });
    }

    if (ledgerType === 'STAFF') {
      loans
        .filter(l => l.employeeId === selectedAccountId)
        .forEach(l => {
          txnEntries.push({
            date: l.date,
            time: l.updatedAt ? new Date(l.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            desc: l.type === 'GIVEN' ? `Advance Given: ${l.notes}` : `Advance Repaid: ${l.notes}`,
            dr: l.type === 'GIVEN' ? l.amount : 0,
            cr: l.type === 'REPAID' ? l.amount : 0
          });
        });
    }

    let running = 0;
    return txnEntries
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => {
        running += (e.cr - e.dr);
        return { ...e, balance: running };
      });
  }, [selectedAccountId, transactions, ledgerType, salesOrders, activeAccount, loans]);

  const gstSummary = useMemo(() => {
    const inputGst = purchaseOrders.reduce((sum, po) => sum + ((po.totalAmount * (po.taxRate || 5)) / 100), 0);
    const outputGst = salesOrders.reduce((sum, so) => sum + ((so.totalAmount * (so.taxRate || 5)) / 100), 0);
    return { inputGst, outputGst, netLiability: outputGst - inputGst };
  }, [purchaseOrders, salesOrders]);

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !paymentForm.amount) return;

    const txn: Transaction = {
      id: `TXN-${Date.now()}`,
      description: paymentForm.description || `${ledgerType} Payout/Settlement`,
      amount: paymentForm.amount,
      date: paymentForm.date,
      type: paymentForm.type === 'DEBIT' ? 'EXPENSE' : 'INCOME',
      category: ledgerType === 'BROKER' ? 'COMMISSION' : 'OTHER',
      paymentMethod: 'CASH',
      referenceId: selectedAccountId,
      subType: ledgerType === 'BROKER' ? 'COMMISSION' : 'OTHER'
    };
    onAddTransaction(txn);
    setIsPaymentModalOpen(false);
    setPaymentForm({ amount: 0, type: 'DEBIT', description: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-fade-in font-sans">
      
      {/* Standard Clean Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Party Ledgers & Accounting</h2>
          <p className="text-xs text-slate-500 font-medium">Standard financial tracking and account statements</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border bg-white dark:bg-slate-900 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <Download className="w-4 h-4"/> Export Report
          </button>
          <button 
            disabled={!selectedAccountId}
            onClick={() => setIsPaymentModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
             <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          {/* Tabs & Controls */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {[
                        { id: 'LEDGER', label: 'Ledger' },
                        { id: 'DAYBOOK', label: 'Day Book' },
                        { id: 'BROKER_PAYOUT', label: 'Broker Payouts' },
                        { id: 'GST_SUMMARY', label: 'GST Summary' }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id as any)} 
                        className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${activeTab === t.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                </div>
              </div>
              
              {activeTab === 'LEDGER' && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <select 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500" 
                      value={ledgerType} 
                      onChange={e => { setLedgerType(e.target.value as any); setSelectedAccountId(''); }}
                    >
                        <option value="CLIENT">Client Accounts</option>
                        <option value="KARIGAR">Karigar Ledger</option>
                        <option value="BROKER">Broker Commission</option>
                        <option value="STAFF">Staff / Salary Ledger</option>
                    </select>
                    <select 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-xs font-bold uppercase outline-none focus:ring-1 focus:ring-indigo-500 min-w-[200px]" 
                      value={selectedAccountId} 
                      onChange={e => setSelectedAccountId(e.target.value)}
                    >
                        <option value="">Select Account...</option>
                        {ledgerType === 'CLIENT' ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : 
                         ledgerType === 'KARIGAR' ? karigars.map(k => <option key={k.id} value={k.id}>{k.name}</option>) :
                         ledgerType === 'STAFF' ? team.map(t => <option key={t.id} value={t.id}>{t.name}</option>) :
                         agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'LEDGER' ? (
                activeAccount ? (
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b flex justify-between items-end bg-slate-50/30 dark:bg-slate-800/30">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Holder</span>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">{activeAccount.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold">{ledgerType} ID: {activeAccount.id}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Closing Balance</p>
                            <h3 className={`text-2xl font-black tabular-nums ${accountLedger[accountLedger.length-1]?.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {currency}{Math.abs(accountLedger[accountLedger.length-1]?.balance || 0).toLocaleString()} 
                                <span className="text-xs ml-1 uppercase">{accountLedger[accountLedger.length-1]?.balance >= 0 ? 'Cr' : 'Dr'}</span>
                            </h3>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b sticky top-0 z-10">
                            <tr>
                              <th className="p-4">Date / Time</th>
                              <th className="p-4">Narration / Reference</th>
                              <th className="p-4 text-right">Debit (Paid)</th>
                              <th className="p-4 text-right">Credit (Recv)</th>
                              <th className="p-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {accountLedger.slice().reverse().map((e, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 font-mono text-xs text-slate-500 uppercase">
                                      <div>{e.date}</div>
                                      <div className="text-[10px] opacity-50">{e.time}</div>
                                    </td>
                                    <td className="p-4 uppercase text-slate-700 dark:text-slate-300 truncate max-w-xs">{e.desc}</td>
                                    <td className="p-4 text-right text-rose-500 tabular-nums">{e.dr > 0 ? e.dr.toLocaleString() : '-'}</td>
                                    <td className="p-4 text-right text-emerald-600 tabular-nums">{e.cr > 0 ? e.cr.toLocaleString() : '-'}</td>
                                    <td className="p-4 text-right font-bold text-slate-800 dark:text-white tabular-nums border-l bg-slate-50/30 dark:bg-slate-800/20">{e.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                            {accountLedger.length === 0 && (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">No transaction history found for this account.</td></tr>
                            )}
                        </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 grayscale text-center">
                    <BookOpen className="w-16 h-16 text-slate-400" />
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em]">Select an Account</p>
                        <p className="text-[10px] font-bold uppercase mt-1">Please choose a party from the dropdown above to view their ledger.</p>
                    </div>
                  </div>
                )
              ) : activeTab === 'BROKER_PAYOUT' ? (
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Unpaid Commission</p>
                            <h4 className="text-xl font-black text-indigo-600 tabular-nums">{currency}{agents.reduce((s,a) => s+(a.balance||0), 0).toLocaleString()}</h4>
                        </div>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b">
                                <tr>
                                    <th className="p-4">Agent / Broker Name</th>
                                    <th className="p-4">Operating Area</th>
                                    <th className="p-4 text-center">Rate</th>
                                    <th className="p-4 text-right">Unpaid Balance</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {agents.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800 dark:text-white uppercase">{a.name}</td>
                                        <td className="p-4 font-medium text-slate-500 uppercase">{a.area}</td>
                                        <td className="p-4 text-center font-bold text-slate-400">{a.commissionRate || 2}%</td>
                                        <td className="p-4 text-right font-black text-indigo-600 tabular-nums">{currency}{(a.balance || 0).toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <button 
                                              onClick={() => { setLedgerType('BROKER'); setSelectedAccountId(a.id); setActiveTab('LEDGER'); }}
                                              className="text-indigo-600 hover:underline font-bold text-xs uppercase"
                                            >
                                                View Statement &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              ) : activeTab === 'GST_SUMMARY' ? (
                <div className="p-10 max-w-4xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Input Tax Credit (Purchases)</p>
                            <h3 className="text-3xl font-black text-indigo-600 tabular-nums">{currency}{gstSummary.inputGst.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Output Tax Credit (Sales)</p>
                            <h3 className="text-3xl font-black text-rose-600 tabular-nums">{currency}{gstSummary.outputGst.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl text-center flex flex-col items-center">
                        <div className="p-4 bg-white/10 rounded-2xl mb-4"><Landmark className="w-8 h-8 text-indigo-400"/></div>
                        <p className="text-xs font-bold text-indigo-300 uppercase mb-1">Net GST Liability</p>
                        <h2 className="text-4xl font-black tabular-nums mb-6">{currency}{Math.max(0, gstSummary.netLiability).toLocaleString()}</h2>
                        <button className="bg-white text-slate-900 px-12 py-3 rounded-xl font-bold uppercase text-xs hover:bg-slate-100 transition-all shadow-lg active:scale-95">Download GST Statement</button>
                    </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                    <FileText className="w-16 h-16 mb-4" />
                    <p className="font-bold uppercase tracking-widest">Reports Matrix Standby</p>
                </div>
              )}
          </div>
      </div>

      {/* Simple Standard Entry Modal */}
      <BaseModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="New Ledger Transaction" size="md">
          <form onSubmit={handlePostPayment} className="space-y-5">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button type="button" onClick={() => setPaymentForm({...paymentForm, type: 'DEBIT'})} className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${paymentForm.type === 'DEBIT' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500'}`}>Debit (Payment Out)</button>
                  <button type="button" onClick={() => setPaymentForm({...paymentForm, type: 'CREDIT'})} className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all ${paymentForm.type === 'CREDIT' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Credit (Payment In)</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Entry Date</label>
                      <input type="date" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 outline-none" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account</label>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 uppercase truncate">
                          {activeAccount?.name || 'Unknown'}
                      </div>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount ({currency})</label>
                  <input type="number" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-lg font-black bg-white dark:bg-slate-800 outline-none focus:ring-1 focus:ring-indigo-500" value={paymentForm.amount || ''} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} placeholder="0.00" />
              </div>

              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Narration / Reference</label>
                  <textarea required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-sm bg-white dark:bg-slate-800 outline-none" rows={3} value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} placeholder="e.g. Paid by Cash against Bill #104" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 border hover:bg-slate-50 transition-colors uppercase">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 uppercase">Post Entry</button>
              </div>
          </form>
      </BaseModal>
    </div>
  );
};

export default Accounting;
