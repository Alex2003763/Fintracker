import React, { useMemo } from 'react';
import { Bill } from '../types';
import { BillIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

interface UpcomingBillsCardProps {
    bills: Bill[];
    onPayBill: (bill: Bill) => void;
    onManageBills: () => void;
}

const UpcomingBillsCard: React.FC<UpcomingBillsCardProps> = ({ bills, onPayBill, onManageBills }) => {

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return bills.map(bill => {
        let dueDate = new Date(currentYear, currentMonth, bill.dayOfMonth);
        if (dueDate < today) {
            dueDate.setMonth(currentMonth + 1);
        }
        return { ...bill, nextDueDate: dueDate };
    })
    .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime())
    .slice(0, 3);
  }, [bills]);

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-6 rounded-2xl shadow-sm transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">Upcoming Bills</h2>
        <button onClick={onManageBills} className="text-sm font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">Manage Bills</button>
      </div>
      <div className="space-y-3">
        {upcomingBills.length > 0 ? (
          upcomingBills.map(bill => (
            <div key={bill.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors">
              <div className="flex items-center">
                <div className="bg-[rgba(var(--color-border-rgb),0.5)] rounded-full p-3 mr-4">
                  <BillIcon className="h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
                </div>
                <div>
                  <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{bill.name}</p>
                  <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Due on {bill.nextDueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <p className="font-bold text-[rgb(var(--color-text-rgb))]">{formatCurrency(bill.amount)}</p>
                <button onClick={() => onPayBill(bill)} className="px-3 py-1 text-xs font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] bg-[rgba(var(--color-primary-rgb),0.2)] rounded-full hover:bg-[rgba(var(--color-primary-rgb),0.3)]">
                  Pay
                </button>
              </div>
            </div>
          ))
        ) : (
            <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-4">No upcoming bills. Add one through "Manage Bills".</p>
        )}
      </div>
    </div>
  );
};

export default UpcomingBillsCard;