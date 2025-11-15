import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import IconPicker from './IconPicker';
import { Category } from '../types/category';

interface CategoryFormProps {
  onSave: (category: Omit<Category, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  category?: Category | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSave, onCancel, category }) => {
  const { theme } = useTheme();
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [icon, setIcon] = useState(category?.icon || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return; // Basic validation
    onSave({ id: category?.id, name, description, icon });
  };

  return (
    <div className="p-4 border rounded shadow-lg mb-4" style={{ backgroundColor: 'rgb(var(--color-card-rgb))', borderColor: 'rgb(var(--color-border-rgb))' }}>
      <h2 className="text-xl font-bold mb-4">Add New Category</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="category-name" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
            Category Name
          </label>
          <input
            type="text"
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            style={{ backgroundColor: 'rgb(var(--color-bg-rgb))', borderColor: 'rgb(var(--color-border-rgb))', color: 'rgb(var(--color-text-rgb))' }}
            placeholder="e.g., Groceries"
          />
        </div>
        <div className="mb-4">
          <IconPicker value={icon} onChange={setIcon} />
        </div>
        <div className="mb-4">
          <label htmlFor="category-description" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
            Description (Optional)
          </label>
          <textarea
            id="category-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            style={{ backgroundColor: 'rgb(var(--color-bg-rgb))', borderColor: 'rgb(var(--color-border-rgb))', color: 'rgb(var(--color-text-rgb))' }}
            placeholder="e.g., Weekly grocery shopping"
          ></textarea>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 mr-2 rounded" style={{ backgroundColor: 'rgb(var(--color-card-muted-rgb))', color: 'rgb(var(--color-text-muted-rgb))' }}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded text-white" style={{ backgroundColor: 'rgb(var(--color-primary-rgb))' }}>
            Save Category
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;