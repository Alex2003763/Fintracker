
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
import { Transaction, User, Goal, Bill, Notification, RecurringTransaction, Budget } from './types';
import { v4 as uuidv4 } from 'uuid';
import PlaceholderPage from './components/PlaceholderPage';
// FIX: Import `formatCurrency` to resolve `Cannot find name` errors.
import { encryptData, decryptData, deriveKey, generateSalt, formatCurrency } from './utils/formatters';

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
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const initialProcessingDone = useRef(false);

  // Modal states
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [addTransactionModalType, setAddTransactionModalType] = useState<'income' | 'expense' | undefined>();
  
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isManageBillsModalOpen, setIsManageBillsModalOpen] = useState(false);
  const [isManageBudgetsModalOpen, setIsManageBudgetsModalOpen] = useState(false);
  const [isManageRecurringModalOpen, setIsManageRecurringModalOpen] = useState(false);
  
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
                { key: 'financeFlowBills', setter: setBills },
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
        } catch (error) {
            console.error("Failed to load or decrypt data", error);
        }
    };
    loadData();
  }, [sessionKey]);
  
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
                    { key: 'financeFlowBills', data: bills },
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
  }, [user, sessionKey, transactions, goals, bills, budgets, notifications, recurringTransactions]);

  const handleAuth = (authedUser: User, key: CryptoKey) => {
    setUser(authedUser);
    setSessionKey(key);
    initialProcessingDone.current = false; // Reset for new session
    
    // Check if it's a new account to set initial data
    if (!localStorage.getItem('financeFlowTransactions')) {
      const welcomeNotification: Notification = { id: uuidv4(), title: 'Welcome to Finance Flow!', message: 'Start by adding your first transaction.', date: new Date().toISOString(), read: false, type: 'standard' };
      setNotifications([welcomeNotification]);
    }
  };

  const handleSignOut = () => {
    // Clear in-memory state, but keep encrypted data in localStorage
    setUser(null);
    setSessionKey(null);
    setTransactions([]);
    setGoals([]);
    setBills([]);
    setBudgets([]);
    setRecurringTransactions([]);
    setNotifications([]);
    setActiveItem('Home');
    setConfirmationModalState({ ...confirmationModalState, isOpen: false });
  };
  
  const handleImportData = (data: any) => {
      setUser(data.user); // Note: This bypasses encryption. Import is an advanced feature.
      setTransactions(data.transactions);
      setGoals(data.goals);
      setBills(data.bills);
      setRecurringTransactions(data.recurringTransactions || []);
      setBudgets(data.budgets || []);
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
    if (transactionData.id) {
      // Editing existing transaction: merge new data but preserve date
      updatedTransactions = transactions.map(t => 
        t.id === transactionData.id 
          ? { ...t, ...transactionData } 
          : t
      );
      setTransactions(updatedTransactions);
    } else {
      // Adding new transaction
      const newTransaction: Transaction = {
        ...transactionData,
        id: uuidv4(),
        date: new Date().toISOString(),
      };
      updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      checkBudgetNotifications(newTransaction, updatedTransactions);
    }
    setIsAddTransactionModalOpen(false);
    setTransactionToEdit(null);
  };

  const checkBudgetNotifications = (newTransaction: Transaction, allTransactions: Transaction[]) => {
    if (newTransaction.type !== 'expense') return;

    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const relevantBudget = budgets.find(b => b.category === newTransaction.category && b.month === currentMonthStr);
    if (!relevantBudget) return;

    const spentInMonth = allTransactions
        .filter(t => t.type === 'expense' && t.category === newTransaction.category && new Date(t.date).getMonth() === today.getMonth() && new Date(t.date).getFullYear() === today.getFullYear())
        .reduce((sum, t) => sum + t.amount, 0);

    const spendingRatio = spentInMonth / relevantBudget.amount;

    const hasExceededNotification = notifications.some(n => n.relatedId === relevantBudget.id && n.title.includes('Exceeded'));
    if (spendingRatio >= 1 && !hasExceededNotification) {
        const notification: Notification = {
            id: uuidv4(),
            title: `Budget Exceeded: ${relevantBudget.category}`,
            message: `You've spent ${formatCurrency(spentInMonth)} of your ${formatCurrency(relevantBudget.amount)} budget.`,
            date: new Date().toISOString(),
            read: false,
            type: 'budget',
            relatedId: relevantBudget.id,
        };
        setNotifications(prev => [notification, ...prev]);
        return; // Don't send 'approaching' if 'exceeded' is sent
    }

    const hasApproachingNotification = notifications.some(n => n.relatedId === relevantBudget.id && n.title.includes('Approaching'));
    if (spendingRatio >= 0.9 && !hasApproachingNotification && !hasExceededNotification) {
        const notification: Notification = {
            id: uuidv4(),
            title: `Budget Approaching: ${relevantBudget.category}`,
            message: `You've spent ${formatCurrency(spentInMonth)} of your ${formatCurrency(relevantBudget.amount)} budget (${(spendingRatio * 100).toFixed(0)}%).`,
            date: new Date().toISOString(),
            read: false,
            type: 'budget',
            relatedId: relevantBudget.id,
        };
        setNotifications(prev => [notification, ...prev]);
    }
  };

  // Goal Handlers
  const handleSaveGoal = (goalData: Omit<Goal, 'id'> & { id?: string }) => {
    if (goalData.id) {
      setGoals(goals.map(g => g.id === goalData.id ? { ...g, ...goalData } : g));
    } else {
      setGoals([...goals, { ...goalData, id: uuidv4() }]);
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
  };

  const handleDeleteBudget = (id: string) => {
      setBudgets(budgets.filter(b => b.id !== id));
  };


  // Other Handlers
  const handleUpdateUser = (updatedUser: User) => setUser(updatedUser);

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
    setConfirmationModalState({
        isOpen: true,
        title,
        message,
        onConfirm,
        confirmText: options.confirmText || 'Confirm',
        variant: options.variant || 'primary'
    });
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
        />;
      case 'Transactions':
        return <TransactionsPage 
          transactions={sortedTransactions} 
          onEditTransaction={handleEditTransaction} 
          onOpenManageRecurring={() => setIsManageRecurringModalOpen(true)}
        />;
      case 'Reports':
          return <ReportsPage transactions={sortedTransactions} user={user!} />;
      case 'Budgets':
          return <BudgetsPage
            transactions={sortedTransactions}
            budgets={budgets}
            onManageBudgets={() => setIsManageBudgetsModalOpen(true)}
           />;
      case 'Goals':
        return <GoalsPage 
          goals={goals} 
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
        />;
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
    <div className="flex h-screen bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] transition-colors">
      {/* Offline Warning Banner */}
      {showOfflineWarning && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium z-50">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            You're offline. Some features may be limited. Data will sync when connection is restored.
            <button
              onClick={() => setShowOfflineWarning(false)}
              className="ml-2 text-yellow-800 hover:text-yellow-900 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          notifications={notifications}
          onMarkAsRead={(id) => setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n))}
          onClearAllNotifications={() => setNotifications(notifications.map(n => ({...n, read: true})))}
          pageTitle={activeItem}
          onSaveTransaction={handleSaveTransaction}
          isOnline={isOnline}
          setActiveItem={setActiveItem}
        />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 animate-fade-in-up">
            {renderContent()}
        </div>
      </main>
      <BottomNav activeItem={activeItem} setActiveItem={setActiveItem} onAddTransaction={handleOpenAddTransactionModal} />

      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        onSaveTransaction={handleSaveTransaction}
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
      />

      <ManageBudgetsModal
        isOpen={isManageBudgetsModalOpen}
        onClose={() => setIsManageBudgetsModalOpen(false)}
        budgets={budgets}
        onSaveBudget={handleSaveBudget}
        onDeleteBudget={handleDeleteBudget}
        transactions={transactions}
       />
      
      <ManageRecurringModal
        isOpen={isManageRecurringModalOpen}
        onClose={() => setIsManageRecurringModalOpen(false)}
        recurringTransactions={recurringTransactions}
        onSaveRecurringTransaction={handleSaveRecurringTransaction}
        onDeleteRecurringTransaction={handleDeleteRecurringTransaction}
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

