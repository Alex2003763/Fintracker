import React from 'react';
import CategoryItem from './CategoryItem';
import { Category } from '../types/category';

interface CategoryListProps {
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  onAddSubCategory: (parent: Category) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onDelete, onEdit, onAddSubCategory }) => {
  return (
    <div className="divide-y" style={{ borderColor: 'rgb(var(--color-border-rgb))' }}>
      {categories.map(category => (
        <CategoryItem key={category.id} category={category} onDelete={onDelete} onEdit={onEdit} onAddSubCategory={onAddSubCategory} />
      ))}
    </div>
  );
};

export default CategoryList;