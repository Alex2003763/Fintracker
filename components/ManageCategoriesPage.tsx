import React, { useState, useMemo } from 'react';
import { useTheme } from './ThemeContext';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';
import { Category } from '../types/category';
import { User, SubCategory } from '../types';

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
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteCategory = (id: string) => {
    console.log(`Attempting to delete subcategory with name: ${id}`);
    if (!user?.customCategories) return;

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
    <div className="p-4 md:p-6" style={{ backgroundColor: 'rgb(var(--color-bg-rgb))', color: 'rgb(var(--color-text-rgb))' }}>
      {successMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
          {successMessage}
        </div>
      )}
      <div className="flex items-center mb-4">
        <button onClick={() => setActiveItem('Settings')} className="p-2 rounded-full hover:bg-[rgba(var(--color-text-rgb),0.1)] transition-colors mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">Manage Categories</h1>
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-6">
        <div>
          <div className="flex border-b mb-4" style={{ borderColor: 'rgb(var(--color-border-rgb))' }}>
            <button
              className={`px-4 py-2 ${activeTab === 'expense' ? 'border-b-2' : ''}`}
              onClick={() => setActiveTab('expense')}
              style={{
                color: activeTab === 'expense' ? 'rgb(var(--color-primary-subtle-text-rgb))' : 'rgb(var(--color-text-muted-rgb))',
                borderColor: activeTab === 'expense' ? 'rgb(var(--color-primary-rgb))' : 'transparent',
              }}
            >
              Expense
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'income' ? 'border-b-2' : ''}`}
              onClick={() => setActiveTab('income')}
              style={{
                color: activeTab === 'income' ? 'rgb(var(--color-primary-subtle-text-rgb))' : 'rgb(var(--color-text-muted-rgb))',
                borderColor: activeTab === 'income' ? 'rgb(var(--color-primary-rgb))' : 'transparent',
              }}
            >
              Income
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full p-2 border rounded"
              style={{ backgroundColor: 'rgb(var(--color-card-rgb))', borderColor: 'rgb(var(--color-border-rgb))', color: 'rgb(var(--color-text-rgb))' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>


          <div>
            {activeTab === 'expense' && (
              <div>
                <CategoryList categories={expenseCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.subcategories && c.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))))} onDelete={handleDeleteCategory} onEdit={handleEditCategory} onAddSubCategory={handleAddSubCategory} />
              </div>
            )}
            {activeTab === 'income' && (
              <div>
                <CategoryList categories={incomeCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.subcategories && c.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))))} onDelete={handleDeleteCategory} onEdit={handleEditCategory} onAddSubCategory={handleAddSubCategory} />
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <CategoryForm onSave={handleSaveCategory} onCancel={() => { setShowForm(false); setCategoryToEdit(null); }} category={categoryToEdit} />
        </div>
        {showForm && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center">
            <div className="w-full max-w-sm mx-auto bg-[rgb(var(--color-card-rgb))] rounded-lg shadow-lg p-4 overflow-y-auto max-h-[90vh]">
              <CategoryForm onSave={handleSaveCategory} onCancel={() => { setShowForm(false); setCategoryToEdit(null); }} category={categoryToEdit} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategoriesPage;