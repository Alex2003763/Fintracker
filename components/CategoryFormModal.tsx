import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { FormField, Input, Button } from './ModalForm';
import IconPicker from './IconPicker';
import { Category } from '../types/category';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'> & { id?: string }) => void;
  category: Category | null;
  parentCategory: Category | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  parentCategory
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setIcon(category.icon || '');
        setDescription(category.description || '');
      } else {
        setName('');
        setIcon('');
        setDescription('');
      }
    }
  }, [isOpen, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    // Simulate API call/processing if needed
    try {
       onSave({
        id: category?.id,
        name: name.trim(),
        icon,
        description: description.trim()
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = category 
    ? `Edit ${parentCategory ? 'Sub-category' : 'Category'}`
    : `Add ${parentCategory ? 'Sub-category' : 'Category'}`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      animation="slide-up"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        <FormField label="Name" htmlFor="category-name" required>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={parentCategory ? `e.g., Apple Store` : `e.g., Shopping`}
            autoFocus
          />
        </FormField>

        <div>
          <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-muted-rgb))]">
            Icon
          </label>
           <div className="p-4 bg-[rgb(var(--color-card-muted-rgb))] rounded-xl border border-[rgb(var(--color-border-rgb))]">
             <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>

        <FormField label="Description (Optional)" htmlFor="category-desc">
          <Input
            id="category-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-[rgb(var(--color-border-rgb))]">
           <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Save
            </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default CategoryFormModal;