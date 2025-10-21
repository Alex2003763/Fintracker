import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Button } from './ModalForm';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { [key: string]: string[] };
  onUpdateCategories: (categories: { [key: string]: string[] }) => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories
}) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ group: string; category: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Set first tab as active when modal opens
  React.useEffect(() => {
    if (isOpen && Object.keys(categories).length > 0 && !activeTab) {
      setActiveTab(Object.keys(categories)[0]);
    }
  }, [isOpen, categories, activeTab]);

  const handleAddCategory = (group: string) => {
    if (!newCategoryName.trim()) return;

    const updatedCategories = { ...categories };
    if (!updatedCategories[group]) {
      updatedCategories[group] = [];
    }

    if (!updatedCategories[group].includes(newCategoryName.trim())) {
      updatedCategories[group].push(newCategoryName.trim());
      onUpdateCategories(updatedCategories);
    }

    setNewCategoryName('');
  };

  const handleDeleteCategory = (group: string, category: string) => {
    const updatedCategories = { ...categories };
    updatedCategories[group] = updatedCategories[group].filter(cat => cat !== category);

    // Remove empty groups
    if (updatedCategories[group].length === 0) {
      delete updatedCategories[group];
      // Switch to another tab if current tab becomes empty
      if (activeTab === group && Object.keys(updatedCategories).length > 0) {
        setActiveTab(Object.keys(updatedCategories)[0]);
      }
    }

    onUpdateCategories(updatedCategories);
  };

  const handleEditCategory = (group: string, oldCategory: string) => {
    setEditingCategory({ group, category: oldCategory });
    setEditValue(oldCategory);
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editValue.trim()) return;

    const updatedCategories = { ...categories };
    const { group, category } = editingCategory;

    // Remove old category
    updatedCategories[group] = updatedCategories[group].filter(cat => cat !== category);

    // Add new category name
    if (!updatedCategories[group].includes(editValue.trim())) {
      updatedCategories[group].push(editValue.trim());
    }

    onUpdateCategories(updatedCategories);
    setEditingCategory(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Categories"
      size="2xl"
      animation="slide-up"
    >
      <div className="flex flex-col h-[85vh] max-h-[700px]">
        {/* Compact Tab Navigation */}
        <div className="border-b border-[rgb(var(--color-border-rgb))] bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))]">
          <div className="flex space-x-1 p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-[rgb(var(--color-border-rgb))] scrollbar-track-transparent">
            {(Object.entries(categories) as [string, string[]][]).map(([group, groupCategories]) => (
              <button
                key={group}
                onClick={() => setActiveTab(group)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap min-w-fit ${
                  activeTab === group
                    ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-md transform scale-105'
                    : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-border-rgb))] hover:scale-102'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <span className="capitalize">{group}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === group
                      ? 'bg-white/20 text-white'
                      : 'bg-[rgb(var(--color-primary-rgb))]/10 text-[rgb(var(--color-primary-rgb))]'
                  }`}>
                    {groupCategories.length}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab && categories[activeTab] ? (
            <div className="h-full flex flex-col">
              {/* Add Category Section */}
              <div className="p-4 bg-gradient-to-r from-[rgba(var(--color-primary-rgb),0.03)] to-[rgba(var(--color-primary-rgb),0.01)] border-b border-[rgb(var(--color-border-rgb))]">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-[rgb(var(--color-primary-rgb))] rounded-full flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={`Add new category to ${activeTab}...`}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCategoryName.trim()) {
                          handleAddCategory(activeTab);
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={() => handleAddCategory(activeTab)}
                    variant="primary"
                    disabled={!newCategoryName.trim()}
                    className="whitespace-nowrap px-4"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-1">
                    {activeTab} Categories
                  </h3>
                  <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                    {categories[activeTab].length} categories • Click to edit, hover for actions
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {categories[activeTab].map((category: string, index: number) => (
                    <div
                      key={category}
                      className="group relative bg-[rgb(var(--color-card-rgb))] rounded-lg border border-[rgb(var(--color-border-rgb))] hover:border-[rgb(var(--color-primary-rgb))] hover:shadow-md transition-all duration-200 animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {editingCategory && editingCategory.group === activeTab && editingCategory.category === category ? (
                        <div className="p-3">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] rounded text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                          />
                          <div className="flex justify-end space-x-1 mt-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                              title="Save"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 cursor-pointer" onClick={() => handleEditCategory(activeTab, category)}>
                            <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors block">
                              {category}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCategory(activeTab, category);
                                }}
                                className="p-1.5 text-[rgb(var(--color-primary-rgb))] hover:text-[rgb(var(--color-primary-hover-rgb))] hover:bg-[rgba(var(--color-primary-rgb),0.1)] rounded transition-colors"
                                title="Edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(activeTab, category);
                                }}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {categories[activeTab].length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center w-16 h-16 bg-[rgb(var(--color-card-muted-rgb))] rounded-full mx-auto mb-4">
                      <svg className="w-8 h-8 text-[rgb(var(--color-text-muted-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-[rgb(var(--color-text-muted-rgb))]">No categories in {activeTab} yet</p>
                    <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">Add your first category above</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-[rgb(var(--color-card-muted-rgb))] rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8 text-[rgb(var(--color-text-muted-rgb))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-[rgb(var(--color-text-muted-rgb))]">Select a category group to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="border-t border-[rgb(var(--color-border-rgb))] p-4 bg-gradient-to-r from-[rgb(var(--color-card-muted-rgb))] to-[rgb(var(--color-card-rgb))]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-[rgb(var(--color-text-muted-rgb))]">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>{Object.keys(categories).length} groups</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{Object.values(categories).flat().length} categories</span>
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </BaseModal>
  );
};

export default ManageCategoriesModal;