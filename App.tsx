
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import UpdatePrompt from './components/UpdatePrompt';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BottomNav from './components/BottomNav';
import AuthPage from './components/AuthPage';
import AddTransactionModal from './components/AddTransactionModal';
import TransactionsPage from './components/TransactionsPage';
import SettingsPage from './components/SettingsPage';
import GoalsPage from './components/GoalsPage';
import AccountPage from './components/AccountPage';
import AddGoalModal from './components/AddGoalModal';
import ManageBillsModal from './components/ManageBillsModal';
import ManageRecurringModal from './components/ManageRecurringModal';
import ConfirmationModal from './components/ConfirmationModal';
import ReportsPage from './components/ReportsPage';
import BudgetsPage from './components/BudgetsPage';
import ManageBudgetsModal from './components/ManageBudgetsModal';
import ManageCategoriesPage from './components/ManageCategoriesPage';
import ImageCropModal from './components/ImageCropModal';
import { Transaction, User, Goal, Bill, RecurringTransaction, Budget, NotificationSettings, GoalContribution, BillPayment, SubCategory } from './types';
import type { Notification } from './types';
import { v4 as uuidv4 } from 'uuid';
import PlaceholderPage from './components/PlaceholderPage';
// FIX: Import `formatCurrency` to resolve `Cannot find name` errors.
import { encryptData, decryptData, deriveKey, generateSalt, formatCurrency } from './utils/formatters';
import { processTransactionForGoals, getGoalProgressStats } from './utils/goalUtils';
import { sendNotification } from './utils/notifications';
import { processImageForBackground, createPatternBackground } from './utils/imageProcessing';
import { TRANSACTION_CATEGORIES } from './constants';

const App: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error:', error);
    },
  });

  // Network status detection with iOS Safari compatibility
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [swSupport, setSwSupport] = useState(true);

  useEffect(() => {
    // Check if service workers are supported (iOS Safari might have issues)
    if (!('serviceWorker' in navigator)) {
      setSwSupport(false);
      console.log('Service Workers not supported');
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
      console.log('App is back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
      console.log('App is offline');
    };

    // More frequent checks for iOS Safari
    const checkConnection = () => {
      const online = navigator.onLine;
      if (online !== isOnline) {
        if (online) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection every 30 seconds for better iOS Safari support
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const closePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);

  // Main navigation state
  const [activeItem, setActiveItem] = useState('Home');

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalContributions, setGoalContributions] = useState<GoalContribution[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const initialProcessingDone = useRef(false);
  const budgetNotificationCheckInProgress = useRef(false);
  const mainContentRef = useRef<HTMLElement>(null);

  // Modal states
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [addTransactionModalType, setAddTransactionModalType] = useState<'income' | 'expense' | undefined>();
  
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isManageBillsModalOpen, setIsManageBillsModalOpen] = useState(false);
  const [isManageBudgetsModalOpen, setIsManageBudgetsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [isManageRecurringModalOpen, setIsManageRecurringModalOpen] = useState(false);
  
  // Image crop modal states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [processingType, setProcessingType] = useState<'transparent' | 'pattern'>('transparent');
  
  const [confirmationModalState, setConfirmationModalState] = useState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      confirmText: 'Confirm',
      variant: 'primary' as 'primary' | 'danger'
  });

  // Load and decrypt data when session key becomes available
  useEffect(() => {
    const loadData = async () => {
        if (!sessionKey) return;
        try {
            const dataToLoad = [
                { key: 'financeFlowTransactions', setter: setTransactions },
                { key: 'financeFlowGoals', setter: setGoals },
                { key: 'financeFlowGoalContributions', setter: setGoalContributions },
                { key: 'financeFlowBills', setter: setBills },
                { key: 'financeFlowBillPayments', setter: setBillPayments },
                { key: 'financeFlowBudgets', setter: setBudgets },
                { key: 'financeFlowNotifications', setter: setNotifications },
                { key: 'financeFlowRecurringTransactions', setter: setRecurringTransactions },
            ];

            for (const { key, setter } of dataToLoad) {
                const encryptedData = localStorage.getItem(key);
                if (encryptedData) {
                    const decrypted = await decryptData(JSON.parse(encryptedData), sessionKey);
                    setter(decrypted ? JSON.parse(decrypted) : []);
                }
            }

            // Check budget notifications after data is loaded
            setTimeout(() => {
                console.log('Checking budget notifications after data load...');
                // This will run after state updates are complete
            }, 100);
        } catch (error) {
            console.error("Failed to load or decrypt data", error);
        }
    };
    loadData();
  }, [sessionKey]);

  // Check budget notifications when transactions or budgets change - with race condition fix
  useEffect(() => {
    if (transactions.length > 0 && budgets.length > 0 && notifications.length >= 0) {
      console.log('Budget notification check triggered...');
      console.log('Current notifications count:', notifications.length);

      // Check immediately if we haven't processed today
      const todayStr = new Date().toISOString().split('T')[0];
      const hasProcessedToday = localStorage.getItem(`budget-notifications-processed-${todayStr}`);

      if (!hasProcessedToday) {
        console.log('Processing budget notifications for today...');

        // Small delay to ensure any pending state updates complete
        setTimeout(() => {
          checkBudgetNotifications();

          // Mark as processed for today immediately after checking
          localStorage.setItem(`budget-notifications-processed-${todayStr}`, 'true');
          console.log('Marked budget notifications as processed for today');
        }, 100);
      } else {
        console.log('Budget notifications already processed today, skipping...');
      }
    }
  }, [transactions, budgets, notifications.length]);

  // Clean up old notifications on app start to prevent duplicates
  useEffect(() => {
    if (notifications.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const recentNotifications = notifications.filter(n =>
        n.type === 'budget' && n.date.startsWith(today)
      );

      console.log(`Found ${recentNotifications.length} budget notifications from today`);

      // If we have multiple budget notifications from today, keep only the most recent ones
      if (recentNotifications.length > 10) {
        const notificationsToRemove = recentNotifications
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(10)
          .map(n => n.id);

        setNotifications(prev => prev.filter(n => !notificationsToRemove.includes(n.id)));
        console.log('Cleaned up old budget notifications');
      }
    }
  }, []);

  // Debug function to reset notification processing (for testing)
  const resetNotificationProcessing = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`budget-notifications-processed-${todayStr}`);
    console.log('Reset notification processing flag');
    // Force recheck
    setTimeout(() => {
      checkBudgetNotifications();
    }, 100);
  };

  // Make the function available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).resetNotificationProcessing = resetNotificationProcessing;
  }

  // Schedule bill reminders when bills or user settings change
  useEffect(() => {
    if (bills.length === 0 || !user) return;

    const scheduleBillReminders = () => {
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
        const currentMonth = today.toISOString().slice(0, 7); // "YYYY-MM" format

        // Check if bill has already been paid this month
        const isPaidThisMonth = billPayments.some(
          payment => payment.billId === bill.id && payment.month === currentMonth
        );

        // Skip reminder if bill is already paid this month
        if (isPaidThisMonth) {
          return;
        }

        const currentYear = today.getFullYear();
        const currentMonthNum = today.getMonth();

        // Calculate next bill due date
        let dueDate = new Date(currentYear, currentMonthNum, bill.dayOfMonth);

        // If the due date has passed this month, schedule for next month
        if (dueDate <= today) {
          dueDate = new Date(currentYear, currentMonthNum + 1, bill.dayOfMonth);
        }

        // Calculate reminder date (1 day before due date)
        const reminderDate = new Date(dueDate.getTime() - (settings.billReminders.advanceDays * 24 * 60 * 60 * 1000));

        // Only schedule if reminder is in the future but not too far (within 60 days)
        const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        if (daysUntilReminder > 0 && daysUntilReminder <= 60) {
          const timeoutId = setTimeout(() => {
            createBillReminderNotification(bill);
          }, reminderDate.getTime() - today.getTime());

          // Store timeout ID for cleanup if needed
          return () => clearTimeout(timeoutId);
        }
      });
    };

    // Schedule reminders
    const cleanup = scheduleBillReminders();

    // Cleanup function
    return cleanup;
  }, [bills, billPayments, user]);

  const createBillReminderNotification = (bill: Bill) => {
    const hasExistingReminder = notifications.some(
      n => n.relatedId === bill.id && n.type === 'bill_reminder'
    );

    if (!hasExistingReminder) {
      const notification: Notification = {
        id: uuidv4(),
        title: `💡 Bill Due Tomorrow: ${bill.name}`,
        message: `Your ${bill.name} bill of ${formatCurrency(bill.amount)} is due tomorrow (${new Date().getDate() + 1}).`,
        date: new Date().toISOString(),
        read: false,
        type: 'bill_reminder',
        relatedId: bill.id,
        urgent: true
      };
      setNotifications(prev => [notification, ...prev]);

      // Send push notification if enabled
      sendPushNotification(notification);
    }
  };

  // Helper functions for time calculations
  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isInQuietHours = (currentTime: number, startTime: number, endTime: number): boolean => {
    if (startTime > endTime) {
      // Quiet hours span midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Quiet hours within same day
      return currentTime >= startTime && currentTime <= endTime;
    }
  };

  // Push notification utility functions
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notifications are denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Request notification permission on app initialization for mobile users
  useEffect(() => {
    if (user && sessionKey) {
      // Check if we're on a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth <= 768;

      if (isMobile) {
        console.log('Mobile device detected, requesting notification permission...');
        // Request permission after a short delay to avoid interrupting app initialization
        setTimeout(() => {
          requestNotificationPermission();
        }, 2000);
      }
    }
  }, [user, sessionKey]);

  const sendPushNotification = async (notification: Notification) => {
    const defaultSettings: NotificationSettings = {
      goalProgress: { enabled: true, milestones: [25, 50, 75, 100] },
      billReminders: { enabled: true, advanceDays: 1 },
      budgetAlerts: { enabled: true, thresholds: [80, 90, 100] },
      monthlyReports: { enabled: false, frequency: 'monthly' },
      pushNotifications: { enabled: false, quietHours: { start: "22:00", end: "08:00" } }
    };

    const settings = user?.notificationSettings || defaultSettings;

    if (!settings.pushNotifications.enabled) return;

    // Check if push notifications are supported and permitted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Push notifications not supported or not permitted');
      return;
    }

    // Check quiet hours using improved logic
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    const startTime = timeStringToMinutes(settings.pushNotifications.quietHours.start);
    const endTime = timeStringToMinutes(settings.pushNotifications.quietHours.end);

    if (isInQuietHours(currentTime, startTime, endTime)) {
      console.log('Push notification skipped due to quiet hours');
      return;
    }

    // Send push notification via service worker
    if ('serviceWorker' in navigator) {
      try {
        // Check if service worker is ready
        navigator.serviceWorker.ready.then(registration => {
          if (registration.active) {
            const notificationData = {
              title: notification.title,
              body: notification.message,
              tag: `${notification.type}-${notification.relatedId || notification.id}`,
              urgent: notification.urgent || false,
              data: {
                type: notification.type,
                relatedId: notification.relatedId,
                url: '/',
                action: 'default'
              }
            };

            // Send message to service worker to show notification
            registration.active.postMessage({
              type: 'SHOW_NOTIFICATION',
              payload: notificationData
            });
            console.log('Push notification sent via service worker');
          } else {
            console.log('Service worker not active yet');
          }
        }).catch(error => {
          console.error('Service worker not ready:', error);
        });
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    } else {
      console.log('Service worker not supported');
    }
  };
  
    // Process recurring transactions on initial load
    useEffect(() => {
        if (recurringTransactions.length === 0 || initialProcessingDone.current) {
            return;
        }

        const calculateNextDueDate = (currentDueDate: Date, frequency: 'weekly' | 'monthly' | 'yearly'): Date => {
            const nextDate = new Date(currentDueDate);
            if (frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (frequency === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            return nextDate;
        };
        
        const newTransactions: Transaction[] = [];
        const updatedRecurringTransactions = [...recurringTransactions];
        let transactionsAdded = false;

        updatedRecurringTransactions.forEach((rt, index) => {
            let nextDueDate = new Date(rt.nextDueDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            while (nextDueDate <= today) {
                const newTransaction: Transaction = {
                    id: uuidv4(),
                    date: nextDueDate.toISOString(),
                    description: rt.description,
                    amount: rt.amount,
                    type: rt.type,
                    category: rt.category,
                };
                newTransactions.push(newTransaction);
                transactionsAdded = true;
                nextDueDate = calculateNextDueDate(nextDueDate, rt.frequency);
            }
            if (new Date(rt.nextDueDate).getTime() !== nextDueDate.getTime()) {
                updatedRecurringTransactions[index] = { ...rt, nextDueDate: nextDueDate.toISOString() };
            }
        });

        if (transactionsAdded) {
            setTransactions(prev => [...newTransactions, ...prev]);
            setRecurringTransactions(updatedRecurringTransactions);
            const newNotification: Notification = {
                id: uuidv4(),
                title: 'Recurring Transactions Processed',
                message: `${newTransactions.length} recurring transaction(s) were automatically added.`,
                date: new Date().toISOString(),
                read: false,
            };
            setNotifications(prev => [newNotification, ...prev]);
        }
        
        initialProcessingDone.current = true;
    }, [recurringTransactions]);

  // Persist and encrypt data to localStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
        if (user && sessionKey) {
            // Always save user object. It does not contain sensitive info.
            localStorage.setItem('financeFlowUser', JSON.stringify(user));

            try {
                const dataToSave = [
                    { key: 'financeFlowTransactions', data: transactions },
                    { key: 'financeFlowGoals', data: goals },
                    { key: 'financeFlowGoalContributions', data: goalContributions },
                    { key: 'financeFlowBills', data: bills },
                    { key: 'financeFlowBillPayments', data: billPayments },
                    { key: 'financeFlowBudgets', data: budgets },
                    { key: 'financeFlowNotifications', data: notifications },
                    { key: 'financeFlowRecurringTransactions', data: recurringTransactions },
                ];

                for (const { key, data } of dataToSave) {
                    const encryptedData = await encryptData(JSON.stringify(data), sessionKey);
                    localStorage.setItem(key, JSON.stringify(encryptedData));
                }
            } catch (error) {
                console.error("Failed to encrypt and save data", error);
            }
        }
    };
    saveData();
  }, [user, sessionKey, transactions, goals, goalContributions, bills, billPayments, budgets, notifications, recurringTransactions]);

  const handleAuth = (authedUser: User, key: CryptoKey) => {
    // Initialize or migrate customCategories
    if (!authedUser.customCategories) {
      authedUser.customCategories = {
        expense: { ...TRANSACTION_CATEGORIES.expense },
        income: { ...TRANSACTION_CATEGORIES.income }
      };
    } else {
      // Migration for users with old string[] structure
      const migrateCategories = (categories: { [key: string]: any[] }) => {
        const newCategories: { [key: string]: any[] } = {};
        for (const key in categories) {
          newCategories[key] = categories[key].map(c => {
            if (typeof c === 'string') {
              return { name: c, icon: '' };
            }
            return c;
          });
        }
        return newCategories;
      };
      authedUser.customCategories.expense = migrateCategories(authedUser.customCategories.expense);
      authedUser.customCategories.income = migrateCategories(authedUser.customCategories.income);
    }
    
    setUser(authedUser);
    setSessionKey(key);
    initialProcessingDone.current = false; // Reset for new session
    
    // Check if it's a new account to set initial data
    if (!localStorage.getItem('financeFlowTransactions')) {
      const welcomeNotification: Notification = { id: uuidv4(), title: 'Welcome to FinTrack!', message: 'Start by adding your first transaction.', date: new Date().toISOString(), read: false, type: 'standard' };
      setNotifications([welcomeNotification]);
    }
  };

  const handleSignOut = () => {
    // Clear in-memory state, but keep encrypted data in localStorage
    setUser(null);
    setSessionKey(null);
    setTransactions([]);
    setGoals([]);
    setGoalContributions([]);
    setBills([]);
    setBillPayments([]);
    setBudgets([]);
    setRecurringTransactions([]);
    setNotifications([]);
    setActiveItem('Home');
    setConfirmationModalState({ ...confirmationModalState, isOpen: false });
  };
  
  const handleExportData = () => {
    try {
      const backupData = {
        user,
        transactions,
        goals,
        goalContributions,
        bills,
        billPayments,
        budgets,
        recurringTransactions,
        notifications,
        version: '1.3.0',
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data", error);
      alert("An error occurred while exporting your data.");
    }
  };

  const handleImportData = (data: any) => {
      setUser(data.user); // Note: This bypasses encryption. Import is an advanced feature.
      setTransactions(data.transactions || []);
      setGoals(data.goals || []);
      setGoalContributions(data.goalContributions || []);
      setBills(data.bills || []);
      setBillPayments(data.billPayments || []);
      setRecurringTransactions(data.recurringTransactions || []);
      setBudgets(data.budgets || []);
      setNotifications(data.notifications || []);
      setConfirmationModalState({ ...confirmationModalState, isOpen: false });
      initialProcessingDone.current = false;
  };

  // Transaction Handlers
  const handleOpenAddTransactionModal = (type?: 'income' | 'expense') => {
    setTransactionToEdit(null);
    setAddTransactionModalType(type);
    setIsAddTransactionModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsAddTransactionModalOpen(true);
  };
  

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id' | 'date'> & { id?: string }) => {
    let updatedTransactions;
    let updatedGoals = [...goals];
    let newContributions: GoalContribution[] = [];

    if (transactionData.id) {
      // Editing existing transaction: merge new data but preserve date
      updatedTransactions = transactions.map(t =>
        t.id === transactionData.id
          ? { ...t, ...transactionData }
          : t
      );
      setTransactions(updatedTransactions);

      // If editing a transaction, we need to recalculate goal contributions
      // For simplicity, we'll remove old contributions and recalculate
      const editedTransaction = updatedTransactions.find(t => t.id === transactionData.id);
      if (editedTransaction) {
        // Remove old contributions for this transaction
        const filteredContributions = goalContributions.filter(gc => gc.transactionId !== transactionData.id);
        setGoalContributions(filteredContributions);

        // Recalculate contributions for the edited transaction
        const { contributions, updatedGoals: recalculatedGoals } = processTransactionForGoals(editedTransaction, goals);
        newContributions = contributions;
        updatedGoals = recalculatedGoals;
        setGoalContributions([...filteredContributions, ...contributions]);
        setGoals(updatedGoals);
      }
    } else {
      // Adding new transaction
      const newTransaction: Transaction = {
        ...transactionData,
        id: uuidv4(),
        date: new Date().toISOString(),
      };
      updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);

      // Process transaction for goal contributions
      const { contributions, updatedGoals: processedGoals } = processTransactionForGoals(newTransaction, goals);
      newContributions = contributions;
      updatedGoals = processedGoals;
      setGoalContributions([...contributions, ...goalContributions]);
      setGoals(updatedGoals);

      // Check budget and goal notifications
      checkBudgetNotifications(newTransaction, updatedTransactions);
      checkGoalProgressNotifications(newTransaction, updatedTransactions);
    }

    // Create notifications for goal contributions
    if (newContributions.length > 0) {
      const totalContribution = newContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
      const contributionNotification: Notification = {
        id: uuidv4(),
        title: '💰 Goal Contributions Added',
        message: `$${totalContribution.toFixed(2)} automatically contributed to your goals from this transaction.`,
        date: new Date().toISOString(),
        read: false,
        type: 'goal_progress',
      };
      setNotifications(prev => [contributionNotification, ...prev]);
    }

    setIsAddTransactionModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (!transactionId) return;

    // Remove the transaction
    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    setTransactions(updatedTransactions);

    // Remove any goal contributions associated with this transaction
    const filteredContributions = goalContributions.filter(gc => gc.transactionId !== transactionId);
    setGoalContributions(filteredContributions);

    // Recalculate goal amounts since contributions were removed
    const updatedGoals = goals.map(goal => {
      const goalContributionsForThisGoal = filteredContributions.filter(gc => gc.goalId === goal.id);
      const newCurrentAmount = goalContributionsForThisGoal.reduce((sum, gc) => sum + gc.amount, 0);

      return {
        ...goal,
        currentAmount: newCurrentAmount,
        progressHistory: goal.progressHistory.map(entry => {
          // Update progress history entries that came from the deleted transaction
          if (entry.transactionId === transactionId) {
            return { ...entry, source: 'adjustment' as const, transactionId: undefined };
          }
          return entry;
        })
      };
    });
    setGoals(updatedGoals);

    // Create notification about deletion
    const deletedTransaction = transactions.find(t => t.id === transactionId);
    if (deletedTransaction) {
      const deleteNotification: Notification = {
        id: uuidv4(),
        title: '🗑️ Transaction Deleted',
        message: `Deleted "${deletedTransaction.description}" transaction of ${formatCurrency(deletedTransaction.amount)}.`,
        date: new Date().toISOString(),
        read: false,
        type: 'standard',
      };
      setNotifications(prev => [deleteNotification, ...prev]);
    }

    setIsAddTransactionModalOpen(false);
    setTransactionToEdit(null);
  };

  const checkBudgetNotifications = (newTransaction?: Transaction, allTransactions?: Transaction[], forceRecheck = false) => {
    // Prevent multiple simultaneous calls
    if (budgetNotificationCheckInProgress.current && !forceRecheck) {
      console.log('Budget notification check already in progress, skipping...');
      return;
    }

    budgetNotificationCheckInProgress.current = true;

    try {
      // Use provided transactions or fall back to current state
      const transactionsToCheck = allTransactions || transactions;
      const today = new Date();
      const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      // Get current month's budgets
      const currentMonthBudgets = budgets.filter(b => b.month === currentMonthStr);

    // Check each budget category
    currentMonthBudgets.forEach(budget => {
      const spentInMonth = transactionsToCheck
          .filter(t => t.type === 'expense' &&
                       t.category === budget.category &&
                       new Date(t.date).getMonth() === today.getMonth() &&
                       new Date(t.date).getFullYear() === today.getFullYear())
          .reduce((sum, t) => sum + t.amount, 0);

      const spendingRatio = spentInMonth / budget.amount;

      // Create unique notification keys for tracking
      const exceededKey = `budget-exceeded-${budget.id}-${currentMonthStr}`;
      const approachingKey = `budget-approaching-${budget.id}-${currentMonthStr}`;
      const eightyKey = `budget-eighty-${budget.id}-${currentMonthStr}`;

      // Check for exceeded budget (100% or more) - improved tracking
      const todayStr = today.toISOString().split('T')[0];
      const hasExceededNotification = notifications.some(n =>
        n.relatedId === budget.id &&
        n.type === 'budget' &&
        n.title.includes('Exceeded') &&
        n.date.startsWith(todayStr) &&
        n.message.includes(budget.category) &&
        n.message.includes('budget') // Ensure it's a budget notification
      );

      if (spendingRatio >= 1 && !hasExceededNotification) {
          const notification: Notification = {
              id: uuidv4(),
              title: `🚨 Budget Exceeded: ${budget.category}`,
              message: `You've spent ${formatCurrency(spentInMonth)} of your ${formatCurrency(budget.amount)} budget.`,
              date: new Date().toISOString(),
              read: false,
              type: 'budget',
              relatedId: budget.id,
              urgent: true
          };
          setNotifications(prev => [notification, ...prev]);
          console.log('Budget exceeded notification created:', notification.title);

          // Send push notification if enabled
          sendPushNotification(notification);
          return; // Don't send 'approaching' if 'exceeded' is sent
      }

      // Check for approaching budget (90% or more) - improved tracking
      const hasApproachingNotification = notifications.some(n =>
        n.relatedId === budget.id &&
        n.type === 'budget' &&
        n.title.includes('Approaching') &&
        n.date.startsWith(todayStr) &&
        n.message.includes(budget.category) &&
        n.message.includes('budget')
      );

      if (spendingRatio >= 0.9 && !hasApproachingNotification && spendingRatio < 1) {
          const notification: Notification = {
              id: uuidv4(),
              title: `⚠️ Budget Approaching: ${budget.category}`,
              message: `You've spent ${formatCurrency(spentInMonth)} of your ${formatCurrency(budget.amount)} budget (${(spendingRatio * 100).toFixed(0)}%).`,
              date: new Date().toISOString(),
              read: false,
              type: 'budget',
              relatedId: budget.id,
          };
          setNotifications(prev => [notification, ...prev]);
          console.log('Budget approaching notification created:', notification.title);

          // Send push notification if enabled
          sendPushNotification(notification);
      }

      // Check for 80% threshold (new lower threshold for better mobile UX)
      const hasEightyNotification = notifications.some(n =>
        n.relatedId === budget.id &&
        n.type === 'budget' &&
        n.title.includes('80%') &&
        n.date.startsWith(todayStr) &&
        n.message.includes(budget.category) &&
        n.message.includes('budget')
      );

      if (spendingRatio >= 0.8 && !hasEightyNotification && spendingRatio < 0.9) {
          const notification: Notification = {
              id: uuidv4(),
              title: `📊 Budget Alert: ${budget.category}`,
              message: `You've used ${(spendingRatio * 100).toFixed(0)}% of your ${budget.category} budget.`,
              date: new Date().toISOString(),
              read: false,
              type: 'budget',
              relatedId: budget.id,
          };
          setNotifications(prev => [notification, ...prev]);
          console.log('Budget 80% notification created:', notification.title);

          // Send push notification if enabled
          sendPushNotification(notification);
      }
    });
    } finally {
      budgetNotificationCheckInProgress.current = false;
    }
  };

  const checkGoalProgressNotifications = (newTransaction: Transaction, allTransactions: Transaction[]) => {
    if (newTransaction.type !== 'income') return;

    // Get default notification settings if user doesn't have custom settings
    const defaultSettings: NotificationSettings = {
      goalProgress: { enabled: true, milestones: [25, 50, 75, 100] },
      billReminders: { enabled: true, advanceDays: 1 },
      budgetAlerts: { enabled: true, thresholds: [80, 90, 100] },
      monthlyReports: { enabled: false, frequency: 'monthly' },
      pushNotifications: { enabled: false, quietHours: { start: "22:00", end: "08:00" } }
    };

    const settings = user?.notificationSettings || defaultSettings;
    if (!settings.goalProgress.enabled) return;

    // Check each goal for milestone progress using updated goals state
    goals.forEach(goal => {
      const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;

      settings.goalProgress.milestones.forEach(milestone => {
        if (progressPercentage >= milestone) {
          const hasMilestoneNotification = notifications.some(
            n => n.relatedId === goal.id &&
                 n.type === 'goal_progress' &&
                 n.progress?.milestone === milestone
          );

          if (!hasMilestoneNotification) {
            const notification: Notification = {
              id: uuidv4(),
              title: `🎉 Goal Milestone: ${milestone}%`,
              message: `Congratulations! You've reached ${milestone}% of your "${goal.name}" goal (${formatCurrency(goal.currentAmount)} of ${formatCurrency(goal.targetAmount)}).`,
              date: new Date().toISOString(),
              read: false,
              type: 'goal_progress',
              relatedId: goal.id,
              progress: {
                currentAmount: goal.currentAmount,
                targetAmount: goal.targetAmount,
                percentage: progressPercentage,
                milestone: milestone
              }
            };
            setNotifications(prev => [notification, ...prev]);
            sendNotification(notification.title, { body: notification.message });
            console.log('Goal milestone notification created:', notification.title);

            // Send push notification if enabled
            sendPushNotification(notification);
          }
        }
      });
    });
  };

  // Goal Handlers
  const handleSaveGoal = (goalData: Omit<Goal, 'id'> & { id?: string }) => {
    // Ensure all required properties exist with defaults
    const completeGoalData = {
      category: 'savings' as const,
      priority: 'medium' as const,
      isActive: true,
      allocationRules: [],
      progressHistory: [],
      autoAllocate: false,
      ...goalData
    };

    if (goalData.id) {
      setGoals(goals.map(g => g.id === goalData.id ? { ...g, ...completeGoalData } : g));
    } else {
      setGoals([...goals, { ...completeGoalData, id: uuidv4() } as Goal]);
    }
    setIsAddGoalModalOpen(false);
    setGoalToEdit(null);
  };
  
  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };
  
  // Bill Handlers
  const handleSaveBill = (billData: Omit<Bill, 'id'> & { id?: string }) => {
      if(billData.id) {
          setBills(bills.map(b => b.id === billData.id ? { ...b, ...billData } : b));
      } else {
          setBills([...bills, { ...billData, id: uuidv4() }]);
      }
  };
  
  const handleDeleteBill = (id: string) => {
      setBills(bills.filter(b => b.id !== id));
  };
  
  const handlePayBill = (bill: Bill) => {
    const transaction: Omit<Transaction, 'id' | 'date'> = {
      description: `Payment for ${bill.name}`,
      amount: bill.amount,
      type: 'expense',
      category: bill.category,
    };
    handleSaveTransaction(transaction);

    // Record the bill payment
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM" format
    const billPayment: BillPayment = {
      id: uuidv4(),
      billId: bill.id,
      month: currentMonth,
      paidDate: new Date().toISOString(),
      amount: bill.amount,
    };
    setBillPayments(prev => [...prev, billPayment]);

    const newNotification: Notification = { id: uuidv4(), title: 'Bill Paid', message: `You successfully paid your ${bill.name} bill of $${bill.amount}.`, date: new Date().toISOString(), read: false, type: 'standard' };
    setNotifications([newNotification, ...notifications]);
  };

  // Recurring Transaction Handlers
  const handleSaveRecurringTransaction = (data: Omit<RecurringTransaction, 'id'> & { id?: string }) => {
      if (data.id) {
          setRecurringTransactions(recurringTransactions.map(rt => rt.id === data.id ? { ...rt, ...data } : rt));
      } else {
          setRecurringTransactions([...recurringTransactions, { ...data, id: uuidv4() }]);
      }
  };

  const handleDeleteRecurringTransaction = (id: string) => {
      setRecurringTransactions(recurringTransactions.filter(rt => rt.id !== id));
  };
  
    // Budget Handlers
  const handleSaveBudget = (budgetData: Omit<Budget, 'id'> & { id?: string }) => {
    if (budgetData.id) {
        setBudgets(budgets.map(b => b.id === budgetData.id ? { ...b, ...budgetData } : b));
    } else {
        setBudgets([...budgets, { ...budgetData, id: uuidv4() }]);
    }

    // Check budget notifications after budget changes
    setTimeout(() => {
      console.log('Checking budget notifications after budget modification...');
      // Reset the processed flag so user gets fresh notifications for the new budget
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.removeItem(`budget-notifications-processed-${todayStr}`);
      checkBudgetNotifications();
    }, 100);
  };

  const handleDeleteBudget = (id: string) => {
      setBudgets(budgets.filter(b => b.id !== id));

      // Note: No need to check notifications after deletion as deleted budgets won't trigger notifications
  };

  const handleEditBudget = (budget: Budget) => {
    setBudgetToEdit(budget);
    setIsManageBudgetsModalOpen(true);
  };

  // Image Crop Modal Handlers
  const handleOpenCropModal = (imageSrc: string, type: 'transparent' | 'pattern' = 'transparent') => {
    setImageToCrop(imageSrc);
    setProcessingType(type);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    setIsCropModalOpen(false);
    setImageToCrop(null);
    setIsProcessingImage(true);
    
    try {
      // This will be handled by triggering a custom event that SettingsPage can listen to
      const event = new CustomEvent('cropComplete', {
        detail: { croppedImageUrl, processingType }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Other Handlers
  const handleUpdateUser = (updatedUser: User) => setUser(updatedUser);

  const handleUpdateCategories = (updatedCategories: { expense: { [key: string]: SubCategory[] }, income: { [key: string]: SubCategory[] } }) => {
    if (user) {
      setUser({ ...user, customCategories: updatedCategories });
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user || !sessionKey) return false;
    try {
        const tempKey = await deriveKey(oldPassword, user.salt);
        const decryptedCheck = await decryptData(JSON.parse(user.passwordCheck), tempKey);
        if (!decryptedCheck || JSON.parse(decryptedCheck).check !== 'ok') {
            return false; // Incorrect old password
        }

        const newSalt = generateSalt();
        const newKey = await deriveKey(newPassword, newSalt);
        const newPasswordCheckEncrypted = await encryptData(JSON.stringify({ check: 'ok' }), newKey);
        
        const updatedUser: User = { ...user, salt: newSalt, passwordCheck: JSON.stringify(newPasswordCheckEncrypted) };
        
        setUser(updatedUser);
        setSessionKey(newKey);
        return true;
    } catch (e) {
        console.error("Password change failed", e);
        return false;
    }
  };

  const handleOpenConfirmModal = useCallback((title: string, message: string, onConfirm: () => void, options: { confirmText?: string; variant?: 'primary' | 'danger' } = {}) => {
    const closeModal = () => setConfirmationModalState(prev => ({ ...prev, isOpen: false }));

    setConfirmationModalState({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          onConfirm();
          closeModal();
        },
        confirmText: options.confirmText || 'Confirm',
        variant: options.variant || 'primary'
    });

    return closeModal;
  }, []);

  const sortedTransactions = useMemo(() => 
    [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [transactions]
  );

  const renderContent = () => {
    switch (activeItem) {
      case 'Home':
        return <Dashboard
          transactions={sortedTransactions}
          bills={bills}
          onAddTransaction={handleOpenAddTransactionModal}
          onEditTransaction={handleEditTransaction}
          setActiveItem={setActiveItem}
          onPayBill={handlePayBill}
          onManageBills={() => setIsManageBillsModalOpen(true)}
          user={user}
        />;
      case 'Transactions':
        return <TransactionsPage
          transactions={sortedTransactions}
          onEditTransaction={handleEditTransaction}
          onOpenManageRecurring={() => setIsManageRecurringModalOpen(true)}
          scrollContainerRef={mainContentRef}
          categoryEmojis={user?.categoryEmojis}
        />;
      case 'Reports':
          return <ReportsPage transactions={sortedTransactions} user={user!} />;
      case 'Budgets':
          return <BudgetsPage
            transactions={sortedTransactions}
            budgets={budgets}
            onManageBudgets={() => {
              setBudgetToEdit(null);
              setIsManageBudgetsModalOpen(true);
            }}
            onEditBudget={handleEditBudget}
           />;
      case 'Goals':
        return <GoalsPage
          goals={goals}
          goalContributions={goalContributions}
          onAddNewGoal={() => { setGoalToEdit(null); setIsAddGoalModalOpen(true); }}
          onEditGoal={(goal) => { setGoalToEdit(goal); setIsAddGoalModalOpen(true); }}
          onDeleteGoal={handleDeleteGoal}
          onOpenConfirmModal={handleOpenConfirmModal}
        />;
      case 'Account':
        return <AccountPage 
          user={user!} 
          onUpdateUser={handleUpdateUser} 
          onChangePassword={handleChangePassword}
          setActiveItem={setActiveItem}
        />;
      case 'Settings':
        return <SettingsPage
          user={user!}
          onUpdateUser={handleUpdateUser}
          onSignOut={handleSignOut}
          onOpenConfirmModal={handleOpenConfirmModal}
          onImportData={handleImportData}
          onExportData={handleExportData}
          setActiveItem={setActiveItem}
          onOpenCropModal={handleOpenCropModal}
          isProcessingImage={isProcessingImage}
          processingType={processingType}
          setProcessingType={setProcessingType}
        />;
      case 'Manage Categories':
        return <ManageCategoriesPage user={user} onUpdateCategories={handleUpdateCategories} setActiveItem={setActiveItem} />;
      default:
        return <PlaceholderPage title={activeItem} />;
    }
  };

  // iOS Safari fallback - if service worker fails completely, show offline message
  if (!swSupport && !isOnline && !user) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-[rgb(var(--color-text-muted-rgb))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
          <p className="text-[rgb(var(--color-text-muted-rgb))] mb-6">
            Finance Flow requires an internet connection to work properly. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[rgb(var(--color-primary-rgb))] text-white px-6 py-3 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!user || !sessionKey) {
    return <AuthPage onAuth={handleAuth} />;
  }
  
  return (
    <div className="flex h-full overflow-hidden bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] transition-colors mobile-safe-area">
      {/* Offline Warning Banner */}
      {showOfflineWarning && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium z-50 mobile-safe-area">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="flex-1">You're offline. Some features may be limited. Data will sync when connection is restored.</span>
            <button
              onClick={() => setShowOfflineWarning(false)}
              className="ml-2 text-yellow-800 hover:text-yellow-900 font-bold flex-shrink-0"
              aria-label="Close offline warning"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 flex flex-col min-h-0">
        <Header
          user={user}
          notifications={notifications}
          onMarkAsRead={(id) => {
            setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n));
            const todayStr = new Date().toISOString().split('T')[0];
            localStorage.removeItem(`budget-notifications-processed-${todayStr}`);
          }}
          onClearAllNotifications={() => {
            setNotifications([]);
            const todayStr = new Date().toISOString().split('T')[0];
            localStorage.removeItem(`budget-notifications-processed-${todayStr}`);
          }}
          pageTitle={activeItem}
          isOnline={isOnline}
          setActiveItem={setActiveItem}
        />
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 animate-fade-in-up main-content">
            {renderContent()}
        </main>
      </div>
      <BottomNav activeItem={activeItem} setActiveItem={setActiveItem} onAddTransaction={handleOpenAddTransactionModal} />

      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onSaveTransaction={handleSaveTransaction}
        user={user}
        onDeleteTransaction={handleDeleteTransaction}
        transactionToEdit={transactionToEdit}
        initialType={addTransactionModalType}
        smartSuggestionsEnabled={user?.smartFeatures?.categorySuggestions ?? true}
      />
      
      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSaveGoal={handleSaveGoal}
        goalToEdit={goalToEdit}
      />
      
      <ManageBillsModal
        isOpen={isManageBillsModalOpen}
        onClose={() => setIsManageBillsModalOpen(false)}
        bills={bills}
        onSaveBill={handleSaveBill}
        onDeleteBill={handleDeleteBill}
        onOpenConfirmModal={handleOpenConfirmModal}
        user={user}
      />

      <ManageBudgetsModal
        isOpen={isManageBudgetsModalOpen}
        onClose={() => setIsManageBudgetsModalOpen(false)}
        budgets={budgets}
        onSaveBudget={handleSaveBudget}
        onDeleteBudget={handleDeleteBudget}
        transactions={transactions}
        budgetToEdit={budgetToEdit}
        onOpenConfirmModal={handleOpenConfirmModal}
       />
      
      <ManageRecurringModal
        isOpen={isManageRecurringModalOpen}
        onClose={() => setIsManageRecurringModalOpen(false)}
        recurringTransactions={recurringTransactions}
        onSaveRecurringTransaction={handleSaveRecurringTransaction}
        onDeleteRecurringTransaction={handleDeleteRecurringTransaction}
      />

      <ImageCropModal
        isOpen={isCropModalOpen && !!imageToCrop}
        onClose={() => {
          setIsCropModalOpen(false);
          setImageToCrop(null);
        }}
        imageSrc={imageToCrop || ''}
        onCropComplete={handleCropComplete}
      />
      
      <ConfirmationModal
          isOpen={confirmationModalState.isOpen}
          onClose={() => setConfirmationModalState({ ... confirmationModalState, isOpen: false })}
          onConfirm={confirmationModalState.onConfirm}
          title={confirmationModalState.title}
          message={confirmationModalState.message}
          confirmButtonText={confirmationModalState.confirmText}
          confirmButtonVariant={confirmationModalState.variant}
      />
     {needRefresh && <UpdatePrompt onUpdate={() => updateServiceWorker(true)} />}
    </div>
  );
};

export default App;
