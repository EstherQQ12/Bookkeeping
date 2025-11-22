
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType, FinancialSummary, UserProfile } from './types';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AuthScreen } from './components/AuthScreen';
import { UserProfileModal } from './components/UserProfileModal';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingDown, TrendingUp, LayoutDashboard, List, Trash2, Pencil, LogOut, UserCircle2, Settings, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import * as store from './services/store';
import { isFirebaseConfigured } from './services/firebase';

const App: React.FC = () => {
  // User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Transaction State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  
  // Selection & Editing State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --- AUTH & DATA SUBSCRIPTION ---
  useEffect(() => {
    const unsubscribe = store.subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = store.subscribeToTransactions(user, (data) => {
        setTransactions(data);
      });
      return () => unsubscribe();
    } else {
      setTransactions([]);
    }
  }, [user]);

  // --- HANDLERS ---

  const handleLogin = async (userProfile: UserProfile) => {
    if (!isFirebaseConfigured) {
        setUser(userProfile);
        store.registerUser(userProfile); 
    }
  };

  const handleLogout = () => {
    store.logoutUser();
    if (!isFirebaseConfigured) setUser(null);
  };

  const handleUpdateUser = async (updatedProfile: UserProfile) => {
    // Update store (Firebase or LocalStorage)
    await store.updateUserProfile(updatedProfile);
    // Update local state immediately to reflect changes in UI
    setUser(updatedProfile);
  };

  const handleSaveTransaction = async (data: { description: string; amount: number; type: TransactionType; date: string }) => {
    if (editingTransaction) {
        await store.updateTransaction(editingTransaction.id, data);
        if (!isFirebaseConfigured) {
           setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...data } : t));
        }
        setEditingTransaction(null);
        setSelectedId(null);
    } else {
        const newItem = await store.addTransaction({ ...data } as any);
        if (!isFirebaseConfigured && newItem) {
             setTransactions(prev => [newItem as Transaction, ...prev]);
        }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    await store.deleteTransaction(deleteId);
    if (!isFirebaseConfigured) {
        setTransactions(prev => prev.filter(t => t.id !== deleteId));
    }
    setSelectedId(null);
    setDeleteId(null);
  };

  const handleEditClick = (transaction: Transaction) => {
      setEditingTransaction(transaction);
      setIsModalOpen(true);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('tr') && !target.closest('button')) {
        setSelectedId(null);
    }
  };

  // Statistics
  const stats = useMemo<FinancialSummary>(() => {
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const weeklySpending = last7Days.map(date => {
      const dayAmount = transactions
        .filter(t => t.date === date && t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);
      return { day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), amount: dayAmount };
    });

    return {
      totalBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      weeklySpending
    };
  }, [transactions]);

  if (loadingUser) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const currency = user.currency || 'RM';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" onClick={handleBackgroundClick}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 md:px-8 md:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">B</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Bookkeeping</h1>
            {isFirebaseConfigured ? (
               <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-200">
                  <Cloud size={10} /> ONLINE
               </span>
            ) : (
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full flex items-center gap-1 border border-slate-200">
                  <CloudOff size={10} /> OFFLINE
               </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            
            {/* User Badge */}
            <div className="flex items-center gap-2 bg-white pl-1 pr-4 py-1 rounded-full border border-slate-100 shadow-sm">
               <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 size={20} />
                  )}
               </div>
               <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none font-mono">#{user.displayId || '---'}</p>
               </div>
            </div>

            <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-all"
                title="My Profile & Settings"
            >
                <Settings size={20} />
            </button>

            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8 pb-28">
        
        {/* Quick Balance Card */}
        <div className="mb-8">
           <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center shadow-xl shadow-slate-900/20">
              <div className="mb-6 md:mb-0 text-center md:text-left">
                  <p className="text-slate-400 font-medium mb-1">Total Balance</p>
                  <h2 className="text-5xl font-bold tracking-tight">{currency} {stats.totalBalance.toFixed(2)}</h2>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm md:w-48">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><TrendingUp size={20}/></div>
                          <span className="text-sm text-slate-300">Income</span>
                      </div>
                      <span className="font-bold text-lg">{currency} {stats.totalIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-between p-4 bg-white/10 rounded-2xl backdrop-blur-sm md:w-48">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400"><TrendingDown size={20}/></div>
                          <span className="text-sm text-slate-300">Spent</span>
                      </div>
                      <span className="font-bold text-lg">{currency} {stats.totalExpense.toFixed(2)}</span>
                  </div>
              </div>
           </div>
        </div>

        {/* Spending Chart */}
        {transactions.length > 0 && (
            <div className="mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <LayoutDashboard size={18} className="text-slate-400"/> 
                    Spending Activity (Last 7 Days)
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.weeklySpending}>
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 12, fill: '#94a3b8'}} 
                                dy={10}
                            />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9', radius: 8}}
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                                formatter={(value: number) => `${currency} ${value.toFixed(2)}`}
                            />
                            <Bar dataKey="amount" fill="#cbd5e1" radius={[6, 6, 6, 6]} barSize={32} activeBar={{fill: '#0f172a'}} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Transactions Table Section */}
        <div>
            {/* Header Layout: Title (Left) - New Entry (Center) - Tabs/Actions (Right) */}
            <div className="relative h-14 flex items-center justify-between mb-4 z-10">
                
                {/* Left: Title */}
                <div className="flex items-center gap-2 z-10 shrink-0">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                        <List size={20} className="text-slate-400"/> 
                        Records
                    </h3>
                </div>

                {/* Center: New Entry Button - Absolute Positioned for Perfect Centering */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                        onClick={() => {
                            setEditingTransaction(null);
                            setIsModalOpen(true);
                        }}
                        className="pointer-events-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] text-sm"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Entry</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Right: Actions & Tabs */}
                <div className="flex items-center gap-3 z-10 shrink-0">
                    
                    {selectedId && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const t = transactions.find(tr => tr.id === selectedId);
                                    if (t) handleEditClick(t);
                                }}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                                title="Edit"
                            >
                                <Pencil size={16} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(selectedId);
                                }}
                                className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="bg-slate-100 p-1 rounded-xl flex shadow-sm">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Recent
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            All
                        </button>
                    </div>
                </div>
            </div>

            {/* Spreadsheet Style Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item / Description</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">Amount ({currency})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400">
                                        No records yet. Start writing in your book!
                                    </td>
                                </tr>
                            ) : (
                                transactions
                                .slice(0, activeTab === 'dashboard' ? 5 : undefined)
                                .map((t) => (
                                    <tr 
                                        key={t.id} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedId(selectedId === t.id ? null : t.id);
                                        }}
                                        className={`group cursor-pointer transition-colors ${
                                            selectedId === t.id 
                                                ? 'bg-indigo-50/50' 
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <td className="p-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                                            {t.date}
                                        </td>
                                        <td className="p-4 text-sm text-slate-800 font-semibold">
                                            {t.description}
                                        </td>
                                        <td className={`p-4 text-sm font-bold text-right whitespace-nowrap ${
                                            t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'
                                        }`}>
                                            {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {activeTab === 'dashboard' && transactions.length > 5 && (
                    <div className="p-3 border-t border-slate-100 text-center">
                        <button onClick={() => setActiveTab('history')} className="text-sm font-bold text-slate-500 hover:text-slate-800">
                            View All Records
                        </button>
                    </div>
                )}
            </div>
        </div>

      </main>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        currency={currency}
        onCurrencyChange={(newCurrency) => handleUpdateUser({ ...user, currency: newCurrency })}
      />

      {user && (
        <UserProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onUpdateUser={handleUpdateUser}
            transactions={transactions}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6 transform transition-all scale-100">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Entry?</h3>
                <p className="text-slate-500 text-sm text-center mb-6">
                    Are you sure you want to delete this record? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
