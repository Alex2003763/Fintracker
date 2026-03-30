import { useRef } from 'react';
import { Notification, NotificationSettings } from '../types';

export function useNotificationManager() {
  const sentNotifications = useRef<Map<string, number>>(new Map());
  const goalMilestoneNotifications = useRef<Map<string, number>>(new Map());
  const billReminderNotifications = useRef<Map<string, number>>(new Map());

  // 判斷通知是否在 cooldown 內
  function isNotificationRecentlySent(key: string, cooldownMs = 5 * 60 * 1000): boolean {
    const lastSent = sentNotifications.current.get(key);
    if (!lastSent) return false;
    return Date.now() - lastSent < cooldownMs;
  }

  function markNotificationAsSent(key: string) {
    sentNotifications.current.set(key, Date.now());
  }

  function isGoalMilestoneRecentlyNotified(goalId: string, milestone: number, cooldownMs = 60 * 60 * 1000): boolean {
    const key = `${goalId}-${milestone}`;
    const lastSent = goalMilestoneNotifications.current.get(key);
    if (!lastSent) return false;
    return Date.now() - lastSent < cooldownMs;
  }

  function markGoalMilestoneAsNotified(goalId: string, milestone: number) {
    const key = `${goalId}-${milestone}`;
    goalMilestoneNotifications.current.set(key, Date.now());
  }

  function isBillReminderRecentlySent(billId: string, cooldownMs = 24 * 60 * 60 * 1000): boolean {
    const lastSent = billReminderNotifications.current.get(billId);
    if (!lastSent) return false;
    return Date.now() - lastSent < cooldownMs;
  }

  function markBillReminderAsSent(billId: string) {
    billReminderNotifications.current.set(billId, Date.now());
  }

  return {
    sentNotifications,
    goalMilestoneNotifications,
    billReminderNotifications,
    isNotificationRecentlySent,
    markNotificationAsSent,
    isGoalMilestoneRecentlyNotified,
    markGoalMilestoneAsNotified,
    isBillReminderRecentlySent,
    markBillReminderAsSent
  };
}
