import React from 'react';
import { useTheme } from './ThemeContext';
import { Category } from '../types/category';
import { ChevronDownIcon } from './icons';

interface CategoryItemProps {
  category: Category;
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
  onAddSubCategory: (parent: Category) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onDelete, onEdit, onAddSubCategory }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  return (
    <div className="border-b" style={{ borderColor: 'rgb(var(--color-border-rgb))' }}>
      <div
        className="flex items-center justify-between p-3"
        style={{ backgroundColor: 'rgb(var(--color-card-rgb))' }}
      >
        <div className="flex items-center">
          {hasSubcategories && (
            <button onClick={() => setIsOpen(!isOpen)} className="p-1">
              <ChevronDownIcon className={`w-5 h-5 mr-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
          )}
          {category.icon && <span className="mr-2">{category.icon}</span>}
          <span>{category.name}</span>
        </div>
        {/* No edit/delete for parent categories */}
        <div className="flex items-center"></div>
      </div>
      {isOpen && hasSubcategories && (
        <div className="pl-12" style={{ backgroundColor: 'rgb(var(--color-card-muted-rgb))' }}>
          {category.subcategories?.map(subCategory => (
            <div key={subCategory.id} className="flex items-center justify-between p-3 border-t" style={{ borderColor: 'rgb(var(--color-border-rgb))' }}>
              <span>{subCategory.icon && <span className="mr-2">{subCategory.icon}</span>}{subCategory.name}</span>
              <div className="flex items-center">
                <button onClick={() => onEdit(subCategory)} className="text-sm hover:underline mr-3" style={{ color: 'rgb(var(--color-primary-subtle-text-rgb))' }}>
                  Edit
                </button>
                <button onClick={() => onDelete(subCategory.name)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
          <div className="p-3">
            <button
              onClick={() => onAddSubCategory(category)}
              className="w-full p-2 text-sm rounded text-white"
              style={{ backgroundColor: 'rgb(var(--color-primary-rgb))' }}
            >
              + Add Sub-category
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryItem;