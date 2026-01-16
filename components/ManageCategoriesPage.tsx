import React, { useState, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import CategoryList from './CategoryList';
import CategoryFormModal from './CategoryFormModal';
import ConfirmationModal from './ConfirmationModal';
import { Category } from '../types/category';
import { User, SubCategory } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';

interface ManageCategoriesPageProps {
  user: User | null;
  onUpdateCategories: (updatedCategories: { expense: { [key: string]: SubCategory[] }, income: { [key: string]: SubCategory[] } }) => void;
  setActiveItem: (item: string) => void;
}

const transformCategories = (categoryObj: { [key: string]: SubCategory[] }): Category[] => {
  return Object.entries(categoryObj).map(([name, subcategories], index) => ({
    id: `${name}-${index}`,
    name,
    subcategories: subcategories.map((sub, subIndex) => ({
      id: `${name}-${sub.name}-${subIndex}`,
      name: sub.name,
      icon: sub.icon,
    })),
  }));
};

const ManageCategoriesPage: React.FC<ManageCategoriesPageProps> = ({ user, onUpdateCategories, setActiveItem }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showForm, setShowForm] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const expenseCategories = useMemo(() => user?.customCategories ? transformCategories(user.customCategories.expense) : [], [user]);
  const incomeCategories = useMemo(() => user?.customCategories ? transformCategories(user.customCategories.income) : [], [user]);

  const handleSaveCategory = (categoryData: Omit<Category, 'id'> & { id?: string }) => {
    if (!user?.customCategories) return;

    const updatedCategories = { ...user.customCategories };
    const categories = updatedCategories[activeTab];

    if (categoryData.id) {
      // Update existing sub-category
      for (const parentCategory in categories) {
        const subcategories = categories[parentCategory];
        const subCategoryIndex = subcategories.findIndex(sc => sc.name === categoryData.name);
        if (subCategoryIndex !== -1) {
          subcategories[subCategoryIndex] = { name: categoryData.name, icon: categoryData.icon };
          break;
        }
      }
    } else if (parentCategory) {
      // Add new sub-category
      categories[parentCategory.name].push({ name: categoryData.name, icon: categoryData.icon });
    }

    onUpdateCategories(updatedCategories);
    setShowForm(false);
    setCategoryToEdit(null);
    setParentCategory(null);
    setSuccessMessage('Category saved successfully!');
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const handleDeleteCategory = (id: string) => {
    console.log(`Attempting to delete subcategory with name: ${id}`);
    if (!user?.customCategories) return;

    // Check if the category is a preset one
    const presetCategories = TRANSACTION_CATEGORIES[activeTab];
    for (const parentCategory in presetCategories) {
      if (presetCategories[parentCategory].some(sc => sc.name === id)) {
        setSuccessMessage('Cannot delete a preset category.');
        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
        return;
      }
    }

    const updatedCategories = JSON.parse(JSON.stringify(user.customCategories)); // Deep copy
    const categories = updatedCategories[activeTab];
    let found = false;

    for (const parentCategory in categories) {
      const subcategories = categories[parentCategory];
      const subCategoryIndex = subcategories.findIndex(sc => sc.name === id);
      if (subCategoryIndex !== -1) {
        console.log(`Found and deleting '${id}' from parent '${parentCategory}'`);
        subcategories.splice(subCategoryIndex, 1);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`Could not find subcategory with name: ${id}`);
    }
    onUpdateCategories(updatedCategories);
  };

  const handleDeleteRequest = (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      handleDeleteCategory(categoryToDelete);
    }
    setIsConfirmModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setParentCategory(null);
    setShowForm(true);
  };

  const handleAddSubCategory = (parent: Category) => {
    setParentCategory(parent);
    setCategoryToEdit(null);
    setShowForm(true);
  };


  return (
    <div className="p-4 md:p-8 bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] min-h-screen">
      {/* Success Toast */}
      <div className={`fixed top-6 right-6 z-50 transition-transform duration-300 ${showSuccessToast ? 'translate-x-0' : 'translate-x-[150%]'}`}>
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMessage}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button
                onClick={() => setActiveItem('Settings')}
                className="p-2 -ml-2 rounded-full hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors text-[rgb(var(--color-text-muted-rgb))]"
                aria-label="Back to Settings"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            </button>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Categories</h1>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] hidden sm:block">Organize your spending & income</p>
            </div>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="flex p-1 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl mb-6">
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                activeTab === 'expense'
                ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
            }`}
            onClick={() => setActiveTab('expense')}
          >
            Expense
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'income'
                ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-primary-rgb))] shadow-sm'
                : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
            }`}
            onClick={() => setActiveTab('income')}
          >
            Income
          </button>
        </div>

        <div className="mb-5 relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-4 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full p-3 pl-11 bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-base focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] overflow-hidden shadow-sm">
          {activeTab === 'expense' && (
            <CategoryList categories={expenseCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.subcategories && c.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))))} onDelete={handleDeleteRequest} onEdit={handleEditCategory} onAddSubCategory={handleAddSubCategory} />
          )}
          {activeTab === 'income' && (
            <CategoryList categories={incomeCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.subcategories && c.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))))} onDelete={handleDeleteRequest} onEdit={handleEditCategory} onAddSubCategory={handleAddSubCategory} />
          )}
        </div>
      </div>

      <CategoryFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setCategoryToEdit(null); setParentCategory(null); }}
        onSave={handleSaveCategory}
        category={categoryToEdit}
        parentCategory={parentCategory}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </div>
  );
};

export default ManageCategoriesPage;