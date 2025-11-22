import React, { useState, useEffect } from 'react';
import { TransactionType } from '../types';
import { X, Calendar, Type as TypeIcon } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { description: string; amount: number; type: TransactionType; date: string }) => void;
  initialData?: { description: string; amount: number; type: TransactionType; date: string } | null;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  currency,
  onCurrencyChange
}) => {
  // Manual State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Effect to reset or populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description);
        setAmount(initialData.amount.toString());
        setType(initialData.type);
        setDate(initialData.date);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    onSave({
      description,
      amount: parseFloat(amount),
      type,
      date
    });
    if (!initialData) resetForm(); // Only reset if adding new, otherwise let parent close handle it
    onClose();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType(TransactionType.EXPENSE);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const isEditing = !!initialData;

  const currencies = ['RM', 'USD', 'EUR', 'GBP', 'SGD', 'AUD', 'JPY', 'CAD'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="p-6 pt-8">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Entry' : 'New Entry'}</h3>
                <p className="text-slate-500 text-sm">{isEditing ? 'Update your record' : 'Record in your book'}</p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
               {/* Amount Input with Currency Selector */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <select
                    value={currency}
                    onChange={(e) => onCurrencyChange(e.target.value)}
                    className="bg-transparent text-slate-500 font-bold text-sm focus:outline-none cursor-pointer py-1 pr-1 appearance-none hover:text-slate-800 transition-colors"
                    title="Change Currency"
                  >
                    {currencies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-16 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-lg text-slate-800"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="relative">
                <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Item (e.g. Lunch, Book)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-2">
                {/* Type Selector */}
                <div className="flex-1 p-1 bg-slate-100 rounded-xl flex">
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Income / Allowance
                  </button>
                </div>
              </div>

               {/* Date Input */}
               <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-700"
                    required
                  />
               </div>

              <div className="flex gap-3 mt-4">
                <button 
                    type="submit"
                    className="flex-[2] py-3 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                    {isEditing ? 'Save Changes' : 'Add to Book'}
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </form>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};