
import React from 'react';
import { FileText, Printer, Search, ClipboardList, PenTool } from 'lucide-react';

const GenerateJobSlip: React.FC = () => {
  return (
    <div className="flex flex-col h-full -m-6">
      <div className="bg-white dark:bg-slate-900 border-b p-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><FileText className="w-6 h-6"/></div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">Smart JobSlip</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Floor Document Orchestration</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
               <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><PenTool className="w-4 h-4 text-indigo-500"/> Document Initialization</h3>
               <input className="w-full border-2 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold bg-slate-50 dark:bg-slate-950" placeholder="Protocol Batch Target..." />
               <div className="grid grid-cols-2 gap-4">
                  <input className="border-2 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold bg-slate-50" placeholder="Karigar Shard" />
                  <input className="border-2 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold bg-slate-50" placeholder="Station ID" />
               </div>
            </div>
            <button className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Printer className="w-5 h-5"/> Generate Professional Slip</button>
         </div>

         <div className="bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center grayscale opacity-30 text-slate-400">
            <ClipboardList className="w-20 h-20 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Document Preview Matrix Standby</p>
         </div>
      </div>
    </div>
  );
};

export default GenerateJobSlip;
