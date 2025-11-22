import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowDownLeft, ArrowUpRight, Wallet, HelpCircle, CreditCard } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === TransactionType.INCOME;

  return (
    <div className="group flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3 transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
          {isIncome ? <Wallet size={18} /> : <CreditCard size={18} />}
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{transaction.description}</h4>
          <p className="text-xs text-slate-400">{transaction.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-right font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toFixed(2)}
        </div>
        <button 
          onClick={() => onDelete(transaction.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500"
          aria-label="Delete transaction"
        >
          &times;
        </button>
      </div>
    </div>
  );
};