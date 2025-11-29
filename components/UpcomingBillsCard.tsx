import React, { useMemo } from 'react';
import { Bill } from '../types';
import { BillIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

interface UpcomingBillsCardProps {
    bills: Bill[];
    onPayBill: (bill: Bill) => void;
    onManageBills: () => void;
}

const UpcomingBillsCard: React.FC<UpcomingBillsCardProps> = ({ bills, onPayBill, onManageBills }) => {

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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

  const formatDueDate = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `Due in ${diffDays} days`;
    
    return `Due on ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Upcoming Bills</CardTitle>
        <button onClick={onManageBills} className="text-sm font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">Manage Bills</button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingBills.length > 0 ? (
            upcomingBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-[rgba(var(--color-border-rgb),0.5)] rounded-full p-3">
                    <BillIcon className="h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{bill.name}</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{formatDueDate(bill.nextDueDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-bold text-[rgb(var(--color-text-rgb))]">{formatCurrency(bill.amount)}</p>
                  <button
                    onClick={() => onPayBill(bill)}
                    className="px-4 py-2 text-xs font-bold text-white bg-[rgb(var(--color-primary-rgb))] rounded-full hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2"
                    aria-label={`Pay ${bill.name} bill of ${formatCurrency(bill.amount)}`}
                  >
                    Pay
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[rgb(var(--color-text-muted-rgb))]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(var(--color-border-rgb),0.3)] flex items-center justify-center">
                    <BillIcon className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">No upcoming bills</p>
                <p className="text-sm opacity-75 mt-1">Add bills to see them here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingBillsCard;