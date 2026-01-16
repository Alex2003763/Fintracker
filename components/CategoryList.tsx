import React from 'react';
import CategoryItem from './CategoryItem';
import { Category } from '../types/category';

interface CategoryListProps {
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  onAddSubCategory: (parent: Category) => void;
}

import { SearchIcon } from './icons';

const CategoryList: React.FC<CategoryListProps> = ({ categories, onDelete, onEdit, onAddSubCategory }) => {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-[rgb(var(--color-card-muted-rgb))] rounded-full flex items-center justify-center mb-4">
           <SearchIcon className="h-8 w-8 text-[rgb(var(--color-text-muted-rgb))]" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))]">No categories found</h3>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] max-w-xs mt-1">
          Try adjusting your search or add a new category to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {categories.map(category => (
        <CategoryItem key={category.id} category={category} onDelete={onDelete} onEdit={onEdit} onAddSubCategory={onAddSubCategory} />
      ))}
    </div>
  );
};

export default CategoryList;