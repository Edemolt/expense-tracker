'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

interface Expense {
  Date: string;
  Time: string;
  Description: string;
  Amount: number;
  PaymentMethod: string;
  PurchaseType: string;
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [purchaseType, setPurchaseType] = useState<string>('Online');
  
  // View State
  const [activeTab, setActiveTab] = useState<'add' | 'charts'>('add');
  const [showTotalBreakdown, setShowTotalBreakdown] = useState<boolean>(false); // NEW: Toggles the payment medium breakdown

  // Daily Details State (Unhidden Div)
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<Expense[]>([]);
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('');

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const CHART_TEXT_COLOR = '#a1a1aa';

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]); 
      }
    } catch (error) {
      console.error("Failed to fetch expenses", error);
      setExpenses([]); 
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const newExpense: Expense = {
      Date: selectedDate, 
      Time: format(new Date(), 'HH:mm:ss'),
      Description: description,
      Amount: parseFloat(amount),
      PaymentMethod: paymentMethod,
      PurchaseType: purchaseType,
    };

    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense),
    });

    setAmount('');
    setDescription('');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    fetchExpenses();
    setActiveTab('charts'); 
    setSelectedDateLabel('');
  };

  // -------------------------------------------------------------
  // DATA PROCESSING
  // -------------------------------------------------------------
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // NEW: Calculate Grand Total and Payment Medium Breakdown
  const overallTotal = safeExpenses.reduce((sum, item) => sum + item.Amount, 0);
  
  const paymentMethodBreakdown = safeExpenses.reduce((acc: { method: string; amount: number }[], curr) => {
    const existing = acc.find(item => item.method === curr.PaymentMethod);
    if (existing) {
      existing.amount += curr.Amount;
    } else {
      acc.push({ method: curr.PaymentMethod, amount: curr.Amount });
    }
    return acc;
  }, []);
  // Sort breakdown from highest spent to lowest
  paymentMethodBreakdown.sort((a, b) => b.amount - a.amount);

  const dailyData = safeExpenses.reduce((acc: { Date: string; Total: number }[], curr) => {
    const existingDate = acc.find(item => item.Date === curr.Date);
    if (existingDate) {
      existingDate.Total += curr.Amount;
    } else {
      acc.push({ Date: curr.Date, Total: curr.Amount });
    }
    return acc;
  }, []);

  dailyData.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  const mainPieData = safeExpenses.reduce((acc: { name: string; value: number }[], curr) => {
    const existingItem = acc.find(item => item.name === curr.Description);
    if (existingItem) {
      existingItem.value += curr.Amount;
    } else {
      acc.push({ name: curr.Description, value: curr.Amount });
    }
    return acc;
  }, []);

  const dailyDetailTotal = selectedDayExpenses.reduce((sum, item) => sum + item.Amount, 0);
  
  const dailyDetailPieData = selectedDayExpenses.reduce((acc: { name: string; value: number }[], curr) => {
    const existingItem = acc.find(item => item.name === curr.Description);
    if (existingItem) {
      existingItem.value += curr.Amount;
    } else {
      acc.push({ name: curr.Description, value: curr.Amount });
    }
    return acc;
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-md shadow-xl text-zinc-200">
          <p className="font-semibold mb-1">{label || payload[0].name}</p>
          <p className="text-sm">Total: <span className="font-mono text-blue-400">₹{payload[0].value}</span></p>
          {payload[0].dataKey === 'Total' && (
            <p className="text-xs text-zinc-400 mt-2">Click bar to view details below</p>
          )}
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold font-mono drop-shadow-md">
        ₹{value}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-blue-500/30 pb-20 overflow-x-hidden">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 shadow-sm shadow-black/20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-wide text-zinc-100 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
            Tracker
          </h1>
          <div className="flex space-x-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button onClick={() => setActiveTab('add')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'add' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Add Expense</button>
            <button onClick={() => setActiveTab('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'charts' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Charts</button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-6 mt-8 relative">
        
        {/* VIEW: ADD EXPENSE */}
        {activeTab === 'add' && (
          <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* NEW: Total Spent Widget */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-zinc-800/80 transition-colors flex justify-between items-center"
                onClick={() => setShowTotalBreakdown(!showTotalBreakdown)}
              >
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Spent Till Now</h3>
                  <p className="text-3xl font-bold text-blue-500 font-mono mt-1">₹{overallTotal.toFixed(2)}</p>
                </div>
                <div className={`text-zinc-500 transform transition-transform duration-300 ${showTotalBreakdown ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>

              {/* Expanding Breakdown Div */}
              {showTotalBreakdown && (
                <div className="bg-zinc-950 p-6 border-t border-zinc-800 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">By Payment Medium</h4>
                  <div className="space-y-3">
                    {paymentMethodBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800/50">
                        <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                          {item.method}
                        </span>
                        <span className="text-sm font-mono text-zinc-100">₹{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {paymentMethodBreakdown.length === 0 && (
                      <p className="text-sm text-zinc-500 italic text-center py-2">No expenses recorded yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Existing Form */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl shadow-black/50">
              <h2 className="text-xl font-semibold mb-6 text-zinc-100">New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Date</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required style={{ colorScheme: 'dark' }} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Midnight coffee" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Amount (₹)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono" placeholder="0.00" step="0.01" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 appearance-none">
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Type</label>
                    <select value={purchaseType} onChange={(e) => setPurchaseType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 p-3 rounded-lg focus:outline-none focus:border-blue-500 appearance-none">
                      <option value="Online">Online</option>
                      <option value="Local Purchase">Local</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                  Save Record
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: CHARTS */}
        {activeTab === 'charts' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl shadow-black/50 h-[400px]">
              <h2 className="text-lg font-semibold mb-6 text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Daily Spending <span className="text-xs text-zinc-500 font-normal ml-2">(Click a bar to unhide details)</span>
              </h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="Date" stroke={CHART_TEXT_COLOR} tick={{fill: CHART_TEXT_COLOR, fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={(str) => { try { return format(new Date(str), 'MMM dd') } catch { return str } }} />
                  <YAxis stroke={CHART_TEXT_COLOR} tick={{fill: CHART_TEXT_COLOR, fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a'}} />
                  <Bar 
                    dataKey="Total" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={50} 
                    cursor="pointer"
                    onClick={(data) => {
                      if (data && data.Date) {
                        const dayExpenses = safeExpenses.filter(e => e.Date === data.Date);
                        setSelectedDayExpenses(dayExpenses);
                        setSelectedDateLabel(data.Date);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }
                    }}
                  /> 
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedDateLabel && (
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Details for {format(new Date(selectedDateLabel), 'MMMM do, yyyy')}
                  </h3>
                  <button onClick={() => setSelectedDateLabel('')} className="text-sm px-3 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors">
                    Hide Details ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="bg-zinc-800 text-xs uppercase text-zinc-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">What spent</th>
                            <th className="px-4 py-3 font-semibold text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {selectedDayExpenses.map((expense, idx) => (
                            <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-zinc-500">{expense.Time.substring(0, 5)}</td>
                              <td className="px-4 py-3">
                                {expense.Description} 
                                <span className="text-[10px] block text-zinc-600 mt-1 uppercase tracking-wide">
                                  {expense.PaymentMethod} • {expense.PurchaseType}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-blue-400">₹{expense.Amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-zinc-800 p-4 border-t border-zinc-700 flex justify-between items-center mt-auto">
                      <span className="font-bold text-zinc-100 uppercase tracking-wider text-sm">Total Spent</span>
                      <span className="font-bold text-xl text-blue-400 font-mono">₹{dailyDetailTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 flex flex-col justify-center items-center h-[300px]">
                    <h4 className="text-sm font-semibold mb-2 text-zinc-400">Spending Breakdown</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={dailyDetailPieData} 
                          cx="50%" cy="50%" 
                          outerRadius={90} 
                          paddingAngle={2} 
                          dataKey="value" 
                          stroke="none"
                          labelLine={false}
                          label={renderCustomizedLabel}
                        >
                          {dailyDetailPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl shadow-black/50 h-[400px]">
              <h2 className="text-lg font-semibold mb-6 text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                All-Time Spending by Item
              </h2>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={mainPieData} 
                    cx="50%" cy="50%" 
                    outerRadius={120} 
                    paddingAngle={2} 
                    dataKey="value" 
                    stroke="none"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {mainPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px', color: '#a1a1aa' }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}