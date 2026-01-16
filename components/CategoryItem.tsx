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
    <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl shadow-sm border border-[rgb(var(--color-border-rgb))] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[rgba(var(--color-text-rgb),0.02)] transition-colors"
        onClick={() => hasSubcategories && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(var(--color-bg-rgb),0.5)] flex items-center justify-center text-xl border border-[rgb(var(--color-border-rgb))]">
             {category.icon || '📁'}
          </div>
          <span className="font-semibold text-[rgb(var(--color-text-rgb))]">{category.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
            <button
                onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                className="p-2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-primary-rgb))] hover:bg-[rgba(var(--color-primary-rgb),0.1)] rounded-lg transition-colors"
                title="Edit Category"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </button>
            
           {hasSubcategories ? (
             <ChevronDownIcon 
               className={`w-5 h-5 text-[rgb(var(--color-text-muted-rgb))] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
             />
          ) : (
             <div className="w-5"></div>
          )}
        </div>
      </div>
      
      {/* Subcategories List */}
      {hasSubcategories && isOpen && (
          <div className="bg-[rgba(var(--color-bg-rgb),0.3)] border-t border-[rgb(var(--color-border-rgb))]">
            {category.subcategories?.map((subCategory) => (
                <div
                    key={subCategory.id}
                    className="flex items-center justify-between py-3 px-4 pl-16 group hover:bg-[rgba(var(--color-text-rgb),0.02)] border-b last:border-b-0 border-[rgb(var(--color-border-rgb))]"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg opacity-70 w-6 text-center">{subCategory.icon || '📄'}</span>
                        <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">{subCategory.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                         <button
                            onClick={() => onEdit(subCategory)}
                            className="p-1.5 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-primary-rgb))] hover:bg-[rgba(var(--color-primary-rgb),0.1)] rounded transition-colors"
                            title="Edit"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                         <button
                            onClick={() => onDelete(subCategory.name)}
                            className="p-1.5 text-[rgb(var(--color-text-muted-rgb))] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
            <div className="p-3 pl-16 border-t border-[rgb(var(--color-border-rgb))]">
                 <button
                    onClick={() => onAddSubCategory(category)}
                    className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-primary-rgb))] hover:opacity-80 transition-opacity py-1"
                >
                    <span className="text-lg leading-none">+</span> Add sub-category
                </button>
            </div>
          </div>
      )}
    </div>
  );
};

export default CategoryItem;