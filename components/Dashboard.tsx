
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  IndianRupee, AlertTriangle, Factory, Users, 
  History, ShoppingCart, 
  CheckCircle2, TrendingUp, Package,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { InventoryItem, ProductionJob, Order, Machine, Karigar } from '../types';

interface DashboardProps {
  inventory: InventoryItem[];
  production: ProductionJob[];
  orders: Order[];
  currency?: string;
  features: Record<string, boolean>;
  machines?: Machine[];
  karigars?: Karigar[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  inventory, production, orders, currency = '₹', machines = [], karigars = [] 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Dynamic KPI Calculations ---
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [orders]);
  const activeJobsCount = useMemo(() => production.filter(j => j.status !== 'READY').length, [production]);
  const lowStockItemsCount = useMemo(() => inventory.filter(i => i.quantity <= i.minStockLevel).length, [inventory]);
  const totalKarigarsCount = useMemo(() => karigars.length, [karigars]);

  // --- Dynamic Revenue Trend Data (Last 7 Days) ---
  const revenueTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTotal = orders
        .filter(o => o.orderDate === date)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { date: label, amount: dayTotal };
    });
  }, [orders]);

  // --- Dynamic Recent Activity Feed ---
  const recentActivity = useMemo(() => {
    const activities: { label: string; time: string; icon: any; color: string; timestamp: number }[] = [];

    // Order Activities
    orders.slice(0, 5).forEach(o => {
      activities.push({
        label: `Order #${o.id} for ${o.customerName}`,
        time: o.orderDate,
        icon: ShoppingCart,
        color: 'text-blue-500',
        timestamp: new Date(o.updatedAt || o.orderDate).getTime()
      });
    });

    // Production Activities
    production.slice(0, 5).forEach(j => {
      activities.push({
        label: `Job ${j.id}: ${j.status.toLowerCase()}`,
        time: j.startDate,
        icon: j.status === 'READY' ? CheckCircle2 : Factory,
        color: j.status === 'READY' ? 'text-emerald-500' : 'text-indigo-500',
        timestamp: new Date(j.updatedAt || j.startDate).getTime()
      });
    });

    // Low Stock Alerts
    inventory.filter(i => i.quantity <= i.minStockLevel).slice(0, 3).forEach(i => {
      activities.push({
        label: `Low Stock: ${i.name}`,
        time: 'Immediate Action Required',
        icon: AlertTriangle,
        color: 'text-amber-500',
        timestamp: Date.now() // Always current for alerts
      });
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [orders, production, inventory]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  } as const;

  return (
    <motion.div 
      className="space-y-6 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <div className="flex justify-between items-end mb-2">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of your textile operations</p>
        </motion.div>
        <motion.div variants={itemVariants} className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Time</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </motion.div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Total Revenue', val: `${currency}${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: '+12.5%', isUp: true },
           { label: 'Active Jobs', val: activeJobsCount, icon: Factory, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: '4 Running', isUp: true },
           { label: 'Total Staff', val: totalKarigarsCount, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: '98% Present', isUp: true },
           { label: 'Low Stock Alerts', val: lowStockItemsCount, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', trend: 'Critical', isUp: false }
         ].map((card, i) => (
           <motion.div 
             key={i} 
             variants={itemVariants}
             whileHover={{ y: -4, transition: { duration: 0.2 } }}
             className="macos-card p-5 flex flex-col gap-4 group cursor-default"
           >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color} shrink-0`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                  card.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                }`}>
                  {card.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {card.trend}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums tracking-tight">{card.val}</h3>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 macos-card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-macos-accent" />
                Revenue Performance
              </h3>
              <p className="text-xs text-slate-500 mt-1">Daily revenue trends over the last week</p>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-macos-border dark:border-macos-darkBorder">
              Weekly View
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007aff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#007aff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 500}} 
                  tickFormatter={(v) => `${v/1000}k`} 
                />
                <Tooltip 
                  formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Revenue']}
                  cursor={{stroke: '#007aff', strokeWidth: 1, strokeDasharray: '4 4'}} 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(0, 0, 0, 0.1)', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#007aff" 
                  strokeWidth={3} 
                  fill="url(#dashGradient)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Lists */}
        <div className="space-y-6">
           {/* Recent Activity */}
          <motion.div variants={itemVariants} className="macos-card p-6 flex flex-col min-h-[400px]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Recent Activity
            </h3>
            <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {recentActivity.map((act, i) => (
                  <motion.div 
                    key={act.timestamp + i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default"
                  >
                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${act.color} shrink-0`}>
                      <act.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug truncate">{act.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-medium">{act.time}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {recentActivity.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                  <Package className="w-10 h-10 mb-2"/>
                  <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Activity</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Machine Status */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-900 dark:bg-macos-accent rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-default"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
              <Activity className="w-32 h-32"/>
            </div>
            <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-6 relative z-10">Production Pulse</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {machines.filter(m => m.status === 'RUNNING').length}
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Units Active</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  {production.filter(j => j.status === 'CUTTING').length}
                </p>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Lots Cutting</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
