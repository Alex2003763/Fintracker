import { Bill, BillPayment, NotificationSettings, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useBillScheduler(dbMutations: any, bills: Bill[], billPayments: BillPayment[], user: any, notifications: Notification[]) {
  function scheduleBillReminders() {
    if (bills.length === 0 || !user) return;
    const defaultSettings: NotificationSettings = {
      goalProgress: { enabled: true, milestones: [25, 50, 75, 100] },
      billReminders: { enabled: true, advanceDays: 1 },
      budgetAlerts: { enabled: true, thresholds: [80, 90, 100] },
      monthlyReports: { enabled: false, frequency: 'monthly' },
      pushNotifications: { enabled: false, quietHours: { start: "22:00", end: "08:00" } }
    };
    const settings = user.notificationSettings || defaultSettings;
    if (!settings.billReminders.enabled) return;
    bills.forEach(bill => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);
      const isPaidThisMonth = billPayments.some(payment => payment.billId === bill.id && payment.month === currentMonth);
      if (isPaidThisMonth) return;
      const currentYear = today.getFullYear();
      const currentMonthNum = today.getMonth();
      let dueDate = new Date(currentYear, currentMonthNum, bill.dayOfMonth);
      if (dueDate <= today) dueDate = new Date(currentYear, currentMonthNum + 1, bill.dayOfMonth);
      const reminderDate = new Date(dueDate.getTime() - (settings.billReminders.advanceDays * 24 * 60 * 60 * 1000));
      const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      if (daysUntilReminder > 0 && daysUntilReminder <= 60) {
        setTimeout(() => {
          createBillReminderNotification(bill);
        }, reminderDate.getTime() - today.getTime());
      }
    });
  }

  function createBillReminderNotification(bill: Bill) {
    const isRecentlySent = false; // 應由 useNotificationManager 判斷
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const hasRecentReminder = notifications.some(
      n => n.relatedId === bill.id && n.type === 'bill_reminder' && new Date(n.date) >= sevenDaysAgo
    );
    if (!hasRecentReminder && !isRecentlySent) {
      const notification: Notification = {
        id: uuidv4(),
        title: `💡 Bill Due Tomorrow: ${bill.name}`,
        message: `Your ${bill.name} bill of $${bill.amount} is due tomorrow (${new Date().getDate() + 1}).`,
        date: new Date().toISOString(),
        read: false,
        type: 'bill_reminder',
        relatedId: bill.id,
        urgent: true
      };
      dbMutations.addNotification(notification);
      // TODO: 呼叫 useNotificationManager 的 markBillReminderAsSent
      // TODO: 觸發 push notification
    }
  }

  return {
    scheduleBillReminders,
    createBillReminderNotification
  };
}
