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
    <div className="border-b last:border-b-0" style={{ borderColor: 'rgb(var(--color-border-rgb))' }}>
      <div
        className="flex items-center justify-between p-4 hover:bg-[rgba(var(--color-text-rgb),0.02)] transition-colors cursor-pointer group"
        style={{ backgroundColor: 'rgb(var(--color-card-rgb))' }}
        onClick={() => hasSubcategories && setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className={`mr-3 p-2 rounded-full bg-[rgba(var(--color-primary-rgb),0.1)] text-[rgb(var(--color-primary-rgb))]`}>
             {category.icon ? <span className="text-xl">{category.icon}</span> : <span className="w-6 h-6 block"></span>}
          </div>
          <span className="font-medium text-lg">{category.name}</span>
        </div>
        <div className="flex items-center">
           {hasSubcategories && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              className="p-2 rounded-full hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors"
            >
              <div style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
              </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Subcategories List */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && hasSubcategories ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ backgroundColor: 'rgb(var(--color-card-muted-rgb))' }}
      >
        {category.subcategories?.map(subCategory => (
          <div
            key={subCategory.id}
            className="flex items-center justify-between py-3 px-4 pl-16 border-t group hover:bg-[rgba(var(--color-text-rgb),0.03)] transition-colors"
            style={{ borderColor: 'rgba(var(--color-border-rgb), 0.5)' }}
          >
            <div className="flex items-center">
              {subCategory.icon && <span className="mr-3 text-lg opacity-80">{subCategory.icon}</span>}
              <span className="text-[rgb(var(--color-text-rgb))]">{subCategory.name}</span>
            </div>
            <div className="flex items-center transition-opacity">
              <button
                onClick={() => onEdit(subCategory)}
                className="p-1.5 mr-2 rounded hover:bg-[rgba(var(--color-primary-rgb),0.1)] transition-colors"
                title="Edit"
                style={{ color: 'rgb(var(--color-primary-subtle-text-rgb))' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(subCategory.name)}
                className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <div className="p-4 pl-16 border-t" style={{ borderColor: 'rgba(var(--color-border-rgb), 0.5)' }}>
          <button
            onClick={() => onAddSubCategory(category)}
            className="flex items-center text-sm font-medium hover:underline transition-all"
            style={{ color: 'rgb(var(--color-primary-rgb))' }}
          >
            <span className="mr-1 text-lg">+</span> Add Sub-category
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryItem;