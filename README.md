# 💰 Finance Flow

<div align="center">
 <img width="1200" height="475" alt="Finance Flow Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A comprehensive **Personal Finance Management** Progressive Web App (PWA) built with React and TypeScript. Take control of your financial life with powerful budgeting, goal tracking, expense management, and intelligent insights - all running securely in your browser with offline support.

## ✨ Key Features

### 🏠 **Dashboard Overview**
- Real-time balance and spending insights
- Quick transaction entry
- Upcoming bills and payment reminders
- Financial goal progress tracking
- Monthly budget status at a glance

### 💳 **Transaction Management**
- **Income & Expense Tracking**: Categorize and monitor all financial activities
- **Smart Categorization**: AI-powered category suggestions for transactions
- **Recurring Transactions**: Set up automatic weekly, monthly, or yearly transactions
- **Search & Filter**: Find specific transactions with advanced filtering options
- **Bulk Operations**: Efficiently manage multiple transactions

### 📊 **Budgeting System**
- **Monthly Budgets**: Set spending limits for different categories
- **Real-time Alerts**: Get notified when approaching (80%), near (90%), or exceeding (100%) budget limits
- **Visual Progress**: Track budget performance with intuitive charts
- **Historical Analysis**: Review past budget performance

### 🎯 **Goal Setting & Tracking**
- **Multiple Goal Types**: Emergency fund, savings, investments, debt payoff, purchases
- **Automatic Contributions**: Set rules to automatically allocate income to goals
- **Progress Milestones**: Get notified at 25%, 50%, 75%, and 100% completion
- **Flexible Allocation**: Percentage-based, category-based, or fixed amount rules
- **Visual Progress Tracking**: Charts and progress indicators

### 📋 **Bill Management**
- **Bill Tracking**: Monitor recurring bills with due dates
- **Payment Reminders**: Automated notifications before due dates
- **Payment History**: Track bill payment history
- **One-click Payment**: Quick payment recording with automatic transaction creation

### 📈 **Reports & Analytics**
- **Spending Breakdown**: Visual charts showing spending by category
- **Income vs Expense Trends**: Track financial patterns over time
- **Category Analysis**: Deep dive into spending habits
- **Export Capabilities**: Export data for external analysis

### 🔐 **Security & Privacy**
- **Local-first Architecture**: All data stored encrypted in your browser
- **End-to-end Encryption**: Sensitive data encrypted with user-derived keys
- **No Data Collection**: Your financial data never leaves your device
- **Secure Authentication**: Password-based local authentication system

### 📱 **Progressive Web App**
- **Offline Support**: Full functionality without internet connection
- **Mobile Optimized**: Responsive design for all screen sizes
- **App-like Experience**: Install on mobile devices and desktop
- **Push Notifications**: Timely reminders and alerts (with permission)
- **Background Sync**: Data syncs when connection is restored

### 🎨 **User Experience**
- **Dark/Light Theme**: Automatic theme switching based on system preference
- **Intuitive Interface**: Clean, modern design focused on usability
- **Accessibility**: Screen reader support and keyboard navigation
- **Customizable Notifications**: Configure alerts and quiet hours

## 🛠️ Technical Stack

- **Frontend**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Charts**: Recharts 2.12.7
- **UI Components**: Custom component library with Tailwind CSS
- **PWA**: Workbox 7.3.0 + Vite PWA Plugin
- **Icons**: Custom SVG icon system
- **Encryption**: Web Crypto API for client-side encryption
- **Carousel**: Swiper 12.0.2 for transaction swiping

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
  ```bash
  git clone <repository-url>
  cd finance-flow
  ```

2. **Install dependencies**
  ```bash
  npm install
  ```

3. **Start development server**
  ```bash
  npm run dev
  ```

4. **Open your browser**
  Navigate to `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Getting Started

1. **Create Account**: Set up your secure local account on first launch
2. **Add Transactions**: Start by recording your income and expenses
3. **Set Budgets**: Create monthly spending limits for different categories
4. **Create Goals**: Set financial targets and allocation rules
5. **Add Bills**: Track recurring payments with reminder notifications

### Navigation

- **🏠 Home**: Dashboard with financial overview and quick actions
- **💳 Transactions**: View, edit, and manage all transactions
- **📊 Reports**: Analyze spending patterns and trends
- **💰 Budgets**: Monitor and adjust monthly budgets
- **🎯 Goals**: Track progress toward financial targets
- **⚙️ Settings**: Configure preferences and manage account

### Mobile Experience

Finance Flow is optimized for mobile use:
- **Touch-friendly Interface**: Large buttons and intuitive gestures
- **PWA Installation**: Add to home screen for app-like experience
- **Offline Functionality**: Full feature set works without internet
- **Push Notifications**: Get reminded about bills and budget limits

## 🏗️ Project Structure

```
finance-flow/
├── public/                 # Static assets and PWA files
│   ├── offline.html       # Offline fallback page
│   └── sw-custom.js       # Custom service worker logic
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard component
│   ├── TransactionsPage.tsx # Transaction management
│   ├── BudgetsPage.tsx    # Budget management interface
│   ├── GoalsPage.tsx      # Goal setting and tracking
│   ├── SettingsPage.tsx   # User preferences
│   └── modals/           # Modal components
├── utils/                # Utility functions
│   ├── formatters.ts     # Currency and data formatting
│   ├── goalUtils.ts      # Goal calculation logic
│   └── categoryAI.ts     # AI categorization helpers
├── types.ts              # TypeScript type definitions
├── constants.tsx         # App constants and categories
└── App.tsx              # Main application component
```

## 🔒 Security Features

- **Client-side Encryption**: All sensitive data encrypted before storage
- **Password-based Key Derivation**: Strong encryption keys from user passwords
- **Local Storage Only**: No data transmitted to external servers
- **Secure Authentication**: Protected local authentication system
- **No Tracking**: Zero analytics or data collection

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: All code must be properly typed
- **Responsive Design**: Ensure mobile-first approach
- **Accessibility**: Follow WCAG guidelines
- **Testing**: Test on multiple devices and browsers
- **Documentation**: Update README for new features

## 📋 Feature Roadmap

- [ ] **Multi-currency Support**: Handle multiple currencies
- [ ] **Bank Integration**: Connect with financial institutions (opt-in)
- [ ] **Advanced Analytics**: More detailed financial insights
- [ ] **Export Options**: PDF reports and CSV exports
- [ ] **Investment Tracking**: Portfolio and investment management
- [ ] **Receipt Scanning**: OCR for automatic transaction entry
- [ ] **Collaborative Features**: Share budgets with family members

## 🐛 Issues & Support

- **Bug Reports**: [Create an issue](https://github.com/your-repo/issues) with detailed information
- **Feature Requests**: Use the discussions tab for feature suggestions
- **Questions**: Check existing documentation or create a discussion

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Icons**: Custom icon set designed for financial applications
- **Community**: Thanks to all contributors and users
- **Open Source**: Built with amazing open source libraries

---

<div align="center">
 <p><strong>Take control of your financial future with Finance Flow</strong></p>
 <p>💡 Track • 🎯 Plan • 📈 Achieve</p>
</div>
