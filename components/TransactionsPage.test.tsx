import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TransactionsPage from './TransactionsPage';
import { Transaction } from '../types';

// Mock the Card component since it's a UI wrapper
jest.mock('./Card', () => {
  return {
    __esModule: true,
    default: (props: any) => <div data-testid="card">{props.children}</div>,
    CardContent: (props: any) => <div data-testid="card-content">{props.children}</div>,
    CardHeader: (props: any) => <div data-testid="card-header">{props.children}</div>,
    CardTitle: (props: any) => <div data-testid="card-title">{props.children}</div>,
  };
});

// Mock icons
jest.mock('./icons', () => ({
  __esModule: true,
  RecurringIcon: () => <span>RecurringIcon</span>,
  ChevronUpIcon: () => <span>ChevronUpIcon</span>,
  SearchIcon: () => <span>SearchIcon</span>,
}));

// Mock CategoryIcon
jest.mock('./CategoryIcon', () => {
  return {
    __esModule: true,
    default: () => <span>CategoryIcon</span>,
  };
});

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    description: 'Grocery Shopping',
    amount: 50.00,
    type: 'expense',
    category: 'Food',
  },
  {
    id: '2',
    date: new Date().toISOString(),
    description: 'Salary',
    amount: 2000.00,
    type: 'income',
    category: 'Salary',
  },
];

describe('TransactionsPage', () => {
  const mockOnEditTransaction = jest.fn();
  const mockOnOpenManageRecurring = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders transactions correctly', () => {
    render(
      <TransactionsPage
        transactions={mockTransactions}
        onEditTransaction={mockOnEditTransaction}
        onOpenManageRecurring={mockOnOpenManageRecurring}
        user={null}
      />
    );

    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Grocery Shopping')).toBeInTheDocument();
    expect(screen.getAllByText('Salary')[0]).toBeInTheDocument();
  });

  it('filters transactions by search query', () => {
    render(
      <TransactionsPage
        transactions={mockTransactions}
        onEditTransaction={mockOnEditTransaction}
        onOpenManageRecurring={mockOnOpenManageRecurring}
        user={null}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search description or category...');
    fireEvent.change(searchInput, { target: { value: 'Grocery' } });

    expect(screen.getByText('Grocery Shopping')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
  });

  it('filters transactions by type', () => {
    render(
      <TransactionsPage
        transactions={mockTransactions}
        onEditTransaction={mockOnEditTransaction}
        onOpenManageRecurring={mockOnOpenManageRecurring}
        user={null}
      />
    );

    const incomeButton = screen.getByText(/Income/i);
    fireEvent.click(incomeButton);

    expect(screen.queryByText('Grocery Shopping')).not.toBeInTheDocument();
    expect(screen.getAllByText('Salary')[0]).toBeInTheDocument();
  });

  it('calls onEditTransaction when a transaction is clicked', () => {
    render(
      <TransactionsPage
        transactions={mockTransactions}
        onEditTransaction={mockOnEditTransaction}
        onOpenManageRecurring={mockOnOpenManageRecurring}
        user={null}
      />
    );

    const transactionItem = screen.getByText('Grocery Shopping');
    fireEvent.click(transactionItem);

    expect(mockOnEditTransaction).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('calls onOpenManageRecurring when recurring button is clicked', () => {
    render(
      <TransactionsPage
        transactions={mockTransactions}
        onEditTransaction={mockOnEditTransaction}
        onOpenManageRecurring={mockOnOpenManageRecurring}
        user={null}
      />
    );

    const recurringButton = screen.getByText('Recurring');
    fireEvent.click(recurringButton);

    expect(mockOnOpenManageRecurring).toHaveBeenCalled();
  });
});