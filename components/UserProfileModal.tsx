import React, { useState, useRef, useMemo } from 'react';
import { UserProfile, Transaction, TransactionType } from '../types';
import { X, User, Shield, Calendar, Trophy, Edit3, Image, PieChart as PieIcon, Send, ArrowLeft, Check } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  transactions: Transaction[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser, transactions }) => {
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currency = user.currency || 'RM';

  // --- REPORT DATA CALCULATION ---
  const reportData = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    
    // Logic: Show how much of income is spent vs remaining
    // If totalIncome is 0, we can't show % of income, so we fallback to just showing expense (100% spent notionally)
    
    const remaining = Math.max(0, totalIncome - totalExpense);
    const spent = totalExpense;
    
    const data = [
        { name: 'Spent', value: spent, color: '#ef4444' }, // Red
        { name: 'Remaining', value: remaining, color: '#10b981' } // Green
    ].filter(item => item.value > 0);

    // Additional Item Breakdown for the list view (still useful context)
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const byItem = expenses.reduce((acc: Record<string, number>, t) => {
        const key = t.description.trim();
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
    }, {} as Record<string, number>);

    let topExpenses = Object.entries(byItem)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value);
    
    if (topExpenses.length > 5) {
        const top = topExpenses.slice(0, 5);
        const otherVal = topExpenses.slice(5).reduce((s: number, i) => s + i.value, 0);
        topExpenses = [...top, { name: 'Others', value: otherVal }];
    }

    return { data, totalExpense, totalIncome, topExpenses };
  }, [transactions]);

  if (!isOpen) return null;

  const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const totalEntries = transactions.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const base64String = event.target.result as string;
                onUpdateUser({ ...user, avatar: base64String });
                setIsEditingAvatar(false);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (seed: string) => {
      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      onUpdateUser({ ...user, avatar: url });
      setIsEditingAvatar(false);
  };

  const handleSendReport = () => {
      setIsSending(true);
      // Simulate network request
      setTimeout(() => {
          setIsSending(false);
          alert(`Spending report sent to ${user.guardianEmail || 'your registered email'}!`);
      }, 1500);
  };

  const presets = [
    { id: 'Felix', label: 'Bear' },
    { id: 'Aneka', label: 'Kitty' },
    { id: 'Zack', label: 'Boy' },
    { id: 'Molly', label: 'Girl' },
    { id: 'Robot', label: 'Bot' },
    { id: 'Ginger', label: 'Cat' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="h-16 bg-slate-900 relative shrink-0 flex items-center px-4">
            {showReport ? (
                <button onClick={() => setShowReport(false)} className="text-white/80 hover:text-white flex items-center gap-1 text-sm font-bold">
                    <ArrowLeft size={18} /> Back
                </button>
            ) : (
                <span className="text-white font-bold ml-2">My Profile</span>
            )}
            <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4 text-white/50 hover:text-white z-10">
                <X size={20} />
            </button>
        </div>

        {/* --- CONTENT BODY --- */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {showReport ? (
                // --- REPORT VIEW ---
                <div className="animate-in slide-in-from-right duration-300">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Money Overview</h2>
                        <p className="text-slate-400 text-sm">Spent vs. Income</p>
                    </div>

                    {reportData.data.length > 0 ? (
                        <div className="mb-6">
                            <div className="h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reportData.data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {reportData.data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => `${currency} ${value.toFixed(2)}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                                    <p className="text-xs text-slate-400 font-medium uppercase">Spent</p>
                                    <p className="text-lg font-bold text-rose-500">{currency}{reportData.totalExpense.toFixed(0)}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Biggest Expenses</h4>
                                {reportData.topExpenses.length > 0 ? (
                                    reportData.topExpenses.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                <span className="text-slate-700 font-medium">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-900">{currency} {item.value.toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-2">No expenses recorded.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <PieIcon size={48} className="mx-auto mb-2 opacity-20"/>
                            <p>No transaction data yet.</p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                        <button 
                            onClick={handleSendReport}
                            disabled={isSending || reportData.data.length === 0}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <span className="animate-pulse">Sending...</span>
                            ) : (
                                <>
                                    <Send size={18} /> 
                                    {user.guardianEmail ? "Send to Guardian" : "Email Report"}
                                </>
                            )}
                        </button>
                        {user.guardianEmail && (
                             <p className="text-[10px] text-center text-slate-400 mt-2">
                                Will be sent to: {user.guardianEmail}
                             </p>
                        )}
                    </div>
                </div>
            ) : (
                // --- PROFILE VIEW ---
                <div className="animate-in slide-in-from-left duration-300">
                    {/* Avatar Section */}
                    <div className="relative w-24 h-24 mx-auto mb-4 group mt-2">
                        <div className="w-full h-full rounded-full bg-white p-1 shadow-lg overflow-hidden border border-slate-100">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover bg-slate-50" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                            className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-800 transition-transform active:scale-90"
                            title="Edit Profile Picture"
                        >
                            <Edit3 size={14} />
                        </button>
                    </div>

                    {/* Avatar Editor */}
                    {isEditingAvatar && (
                        <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-slate-400 uppercase">Change Picture</p>
                                <button onClick={() => setIsEditingAvatar(false)}><X size={14} className="text-slate-400"/></button>
                            </div>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-white rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 mb-4 shadow-sm"
                            >
                                <Image size={18} className="text-slate-600"/>
                                <span className="text-sm font-bold text-slate-600">Upload from Gallery</span>
                            </button>

                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Or Choose Icon</p>
                            <div className="grid grid-cols-3 gap-2">
                                {presets.map((preset) => (
                                    <button 
                                        key={preset.id}
                                        onClick={() => handlePresetSelect(preset.id)}
                                        className="aspect-square rounded-xl bg-white hover:ring-2 hover:ring-brand-500 transition-all p-1 overflow-hidden border border-slate-200"
                                    >
                                        <img 
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${preset.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                                            alt={preset.label}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>

                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                    )}

                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                        <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full mt-1">
                            <span className="text-xs font-mono text-slate-500 tracking-wider">ID: {user.displayId || '00000000'}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2">{user.age} years old</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-slate-400 mb-1"><Calendar size={18} className="mx-auto"/></div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Joined</p>
                            <p className="text-slate-800 font-bold text-sm">{joinedDate}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-slate-400 mb-1"><Trophy size={18} className="mx-auto"/></div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Entries</p>
                            <p className="text-slate-800 font-bold text-sm">{totalEntries}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                         <button 
                            onClick={() => setShowReport(true)}
                            className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                            <PieIcon size={18} /> View Spending Report
                        </button>

                        {user.guardianEmail && (
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                                <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-xs uppercase mb-1">
                                    <Shield size={14} /> Guardian Active
                                </div>
                                <p className="text-xs text-slate-600">Linked to {user.guardianEmail}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};