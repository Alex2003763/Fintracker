import { Goal, Transaction, GoalAllocationRule, GoalContribution, GoalProgressEntry } from '../types';

/**
 * Calculate how much a transaction should contribute to a specific goal based on allocation rules
 */
export function calculateGoalContribution(
  transaction: Transaction,
  goal: Goal,
  rule: GoalAllocationRule
): number {
  if (!goal.isActive || !goal.autoAllocate) return 0;

  // Check if rule applies to this transaction type
  if (transaction.type === 'income' && !rule.applyToIncome) return 0;
  if (transaction.type === 'expense' && !rule.applyToExpense) return 0;

  switch (rule.type) {
    case 'percentage':
      const percentage = Number(rule.value) / 100;
      return Math.abs(transaction.amount) * percentage;

    case 'category':
      if (rule.categories?.includes(transaction.category)) {
        return Math.abs(transaction.amount);
      }
      return 0;

    case 'amount':
      const fixedAmount = Number(rule.value);
      return Math.min(Math.abs(transaction.amount), fixedAmount);

    default:
      return 0;
  }
}

/**
 * Process a transaction against all goals and return contributions
 */
export function processTransactionForGoals(
  transaction: Transaction,
  goals: Goal[]
): { contributions: GoalContribution[], updatedGoals: Goal[] } {
  const contributions: GoalContribution[] = [];
  const updatedGoals: Goal[] = [];

  for (const goal of goals) {
    if (!goal.isActive || !goal.autoAllocate) {
      updatedGoals.push(goal);
      continue;
    }

    let totalContribution = 0;
    const applicableRules = goal.allocationRules.filter(rule => {
      // Check if rule applies to this transaction type
      if (transaction.type === 'income' && !rule.applyToIncome) return false;
      if (transaction.type === 'expense' && !rule.applyToExpense) return false;
      return true;
    });

    for (const rule of applicableRules) {
      const contributionAmount = calculateGoalContribution(transaction, goal, rule);
      totalContribution += contributionAmount;

      if (contributionAmount > 0) {
        contributions.push({
          id: `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionId: transaction.id,
          goalId: goal.id,
          amount: contributionAmount,
          date: new Date().toISOString(),
          type: 'auto'
        });
      }
    }

    if (totalContribution > 0) {
      // Create progress entry
      const progressEntry: GoalProgressEntry = {
        date: new Date().toISOString(),
        amount: totalContribution,
        source: 'transaction',
        transactionId: transaction.id
      };

      // Update goal
      const updatedGoal: Goal = {
        ...goal,
        currentAmount: goal.currentAmount + totalContribution,
        progressHistory: [...goal.progressHistory, progressEntry]
      };

      updatedGoals.push(updatedGoal);
    } else {
      updatedGoals.push(goal);
    }
  }

  return { contributions, updatedGoals };
}

/**
 * Calculate monthly target amount based on target date
 */
export function calculateMonthlyTarget(goal: Goal): number {
  if (!goal.targetDate || !goal.targetAmount || goal.currentAmount >= goal.targetAmount) {
    return 0;
  }

  const today = new Date();
  const targetDate = new Date(goal.targetDate);
  const monthsRemaining = Math.max(1,
    (targetDate.getFullYear() - today.getFullYear()) * 12 +
    (targetDate.getMonth() - today.getMonth())
  );

  const remainingAmount = goal.targetAmount - goal.currentAmount;
  return remainingAmount / monthsRemaining;
}

/**
 * Get goal progress statistics
 */
export function getGoalProgressStats(goal: Goal) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Ensure progressHistory exists and has entries
  const progressHistory = goal.progressHistory || [];

  // Monthly progress this year
  const monthlyProgress = progressHistory
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === currentYear &&
             entry.source === 'transaction';
    })
    .reduce((acc, entry) => acc + entry.amount, 0);

  // Average monthly contribution
  const monthsWithData = new Set(
    progressHistory
      .filter(entry => entry.source === 'transaction')
      .map(entry => {
        const date = new Date(entry.date);
        return `${date.getFullYear()}-${date.getMonth()}`;
      })
  ).size;

  const avgMonthly = monthsWithData > 0
    ? progressHistory
        .filter(entry => entry.source === 'transaction')
        .reduce((acc, entry) => acc + entry.amount, 0) / monthsWithData
    : 0;

  // Projected completion date
  const monthlyTarget = calculateMonthlyTarget(goal);
  const projectedDate = monthlyTarget > 0
    ? new Date(today.getTime() + (goal.targetAmount - goal.currentAmount) / monthlyTarget * 30 * 24 * 60 * 60 * 1000)
    : null;

  return {
    monthlyProgress,
    avgMonthly,
    projectedDate,
    monthsWithData,
    completionPercentage: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  };
}

/**
 * Validate allocation rules for a goal
 */
export function validateAllocationRules(rules: GoalAllocationRule[]): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    if (rule.type === 'percentage') {
      const percentage = Number(rule.value);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.push(`Invalid percentage value: ${rule.value}`);
      }
    }

    if (rule.type === 'amount') {
      const amount = Number(rule.value);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Invalid amount value: ${rule.value}`);
      }
    }

    if (!rule.applyToIncome && !rule.applyToExpense) {
      errors.push('Allocation rule must apply to either income or expense (or both)');
    }
  }

  return errors;
}

/**
 * Create default allocation rules for common goal types
 */
export function createDefaultAllocationRules(goalCategory: Goal['category']): GoalAllocationRule[] {
  const rules: GoalAllocationRule[] = [];

  switch (goalCategory) {
    case 'emergency':
      rules.push({
        id: `rule_${Date.now()}_1`,
        goalId: '', // Will be set when goal is created
        type: 'percentage',
        value: 10,
        applyToIncome: true,
        applyToExpense: false
      });
      break;

    case 'savings':
      rules.push({
        id: `rule_${Date.now()}_1`,
        goalId: '',
        type: 'percentage',
        value: 20,
        applyToIncome: true,
        applyToExpense: false
      });
      break;

    case 'investment':
      rules.push({
        id: `rule_${Date.now()}_1`,
        goalId: '',
        type: 'percentage',
        value: 15,
        applyToIncome: true,
        applyToExpense: false
      });
      break;

    case 'debt':
      rules.push({
        id: `rule_${Date.now()}_1`,
        goalId: '',
        type: 'category',
        value: 'debt',
        applyToIncome: false,
        applyToExpense: true,
        categories: ['debt', 'loan']
      });
      break;
  }

  return rules;
}