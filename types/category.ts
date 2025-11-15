export interface Category {
  id: string;
  name: string;
  description?: string;
  subcategories?: Category[];
  icon?: string;
}