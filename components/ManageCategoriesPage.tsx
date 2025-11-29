import React, { useState, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';
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
    <div className="p-4 md:p-8" style={{ backgroundColor: 'rgb(var(--color-bg-rgb))', color: 'rgb(var(--color-text-rgb))' }}>
      {/* Success Toast */}
      <div className={`fixed top-6 right-6 z-50 transition-transform duration-300 ${showSuccessToast ? 'translate-x-0' : 'translate-x-[150%]'}`}>
        <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMessage}</span>
        </div>
      </div>

      <div className="flex items-center mb-6">
        <button onClick={() => setActiveItem('Settings')} className="p-2 rounded-full hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold">Manage Categories</h1>
      </div>
      
      <div className="md:grid md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7 lg:col-span-6">
          <div className="flex border-b mb-5" style={{ borderColor: 'rgb(var(--color-border-rgb))' }}>
            <button
              className={`px-4 py-2.5 text-base font-medium transition-all duration-200 ${activeTab === 'expense' ? 'border-b-2' : 'opacity-60'}`}
              onClick={() => setActiveTab('expense')}
              style={{
                color: activeTab === 'expense' ? 'rgb(var(--color-primary-subtle-text-rgb))' : 'rgb(var(--color-text-muted-rgb))',
                borderColor: activeTab === 'expense' ? 'rgb(var(--color-primary-rgb))' : 'transparent',
              }}
            >
              Expense
            </button>
            <button
              className={`px-4 py-2.5 text-base font-medium transition-all duration-200 ${activeTab === 'income' ? 'border-b-2' : 'opacity-60'}`}
              onClick={() => setActiveTab('income')}
              style={{
                color: activeTab === 'income' ? 'rgb(var(--color-primary-subtle-text-rgb))' : 'rgb(var(--color-text-muted-rgb))',
                borderColor: activeTab === 'income' ? 'rgb(var(--color-primary-rgb))' : 'transparent',
              }}
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
              className="w-full p-3 pl-11 border rounded-full focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
              style={{
                backgroundColor: 'rgb(var(--color-card-rgb))',
                borderColor: 'rgb(var(--color-border-rgb))',
                color: 'rgb(var(--color-text-rgb))'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgb(var(--color-border-rgb))', backgroundColor: 'rgb(var(--color-card-rgb))' }}>
            {activeTab === 'expense' && (
              <CategoryList categories={expenseCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.subcategories && c.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))))} onDelete={handleDeleteRequest} onEdit={handleEditCategory} onAddSubCategory={handleAddSubCategory} />
            )}
            {activeTab === 'income' && (
              <CategoryList categories={incomeCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.subcategories && c.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))))} onDelete={handleDeleteRequest} onEdit={handleEditCategory} onAddSubCategory={handleAddSubCategory} />
            )}
          </div>
        </div>
        
        <div className="hidden md:block md:col-span-5 lg:col-span-6 mt-16">
          <CategoryForm onSave={handleSaveCategory} onCancel={() => { setShowForm(false); setCategoryToEdit(null); }} category={categoryToEdit} />
        </div>
        
        {showForm && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-40 flex items-end justify-center animate-fade-in">
            <div
              className="w-full bg-[rgb(var(--color-card-rgb))] rounded-t-2xl shadow-lg overflow-y-auto max-h-[90vh] animate-slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <CategoryForm onSave={handleSaveCategory} onCancel={() => { setShowForm(false); setCategoryToEdit(null); }} category={categoryToEdit} />
            </div>
          </div>
        )}
      </div>
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