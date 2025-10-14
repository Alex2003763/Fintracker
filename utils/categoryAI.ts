// Simple AI-powered category suggestion system
// Maps common keywords to transaction categories

// import { TRANSACTION_CATEGORIES } from '../constants';

export interface CategorySuggestion {
  category: string;
  confidence: number;
}

export const KEYWORD_MAP: Record<string, string[]> = {
  // Food & Drink
  'restaurant': ['Restaurants'],
  'cafe': ['Coffee Shops'],
  'coffee': ['Coffee Shops'],
  'starbucks': ['Coffee Shops'],
  'mcdonalds': ['Takeout'],
  'burger': ['Takeout'],
  'pizza': ['Takeout'],
  'grocery': ['Groceries'],
  'supermarket': ['Groceries'],
  'walmart': ['Groceries'],
  'target': ['Groceries'],
  'costco': ['Groceries'],
  'whole foods': ['Groceries'],
  'trader joes': ['Groceries'],
  'food': ['Groceries'],
  'lunch': ['Restaurants'],
  'dinner': ['Restaurants'],
  'breakfast': ['Coffee Shops'],
  'snack': ['Groceries'],
  'candy': ['Groceries'],
  'chips': ['Groceries'],
  'soda': ['Groceries'],
  'beer': ['Groceries'],
  'wine': ['Groceries'],
  'liquor': ['Groceries'],
  'bar': ['Restaurants'],

  // Transportation
  'gas': ['Gas/Fuel'],
  'fuel': ['Gas/Fuel'],
  'uber': ['Ride Sharing'],
  'lyft': ['Ride Sharing'],
  'taxi': ['Ride Sharing'],
  'bus': ['Public Transit'],
  'train': ['Public Transit'],
  'subway': ['Public Transit'],
  'parking': ['Gas/Fuel'],
  'toll': ['Gas/Fuel'],
  'car': ['Maintenance'],
  'insurance': ['Insurance'],
  'repair': ['Maintenance'],
  'maintenance': ['Maintenance'],
  'oil change': ['Maintenance'],
  'tires': ['Maintenance'],

  // Shopping
  'amazon': ['General Shopping'],
  'shopping': ['General Shopping'],
  'store': ['General Shopping'],
  'mall': ['General Shopping'],
  'clothes': ['Clothing'],
  'clothing': ['Clothing'],
  'shoes': ['Clothing'],
  'electronics': ['Electronics'],
  'phone': ['Electronics'],
  'computer': ['Electronics'],
  'laptop': ['Electronics'],
  'books': ['General Shopping'],
  'music': ['General Shopping'],
  'movies': ['General Shopping'],

  // Entertainment
  'movie': ['Movies'],
  'cinema': ['Movies'],
  'netflix': ['Subscriptions'],
  'spotify': ['Subscriptions'],
  'apple music': ['Subscriptions'],
  'concert': ['Movies'],
  'show': ['Movies'],
  'game': ['Games'],
  'gaming': ['Games'],
  'steam': ['Games'],
  'playstation': ['Games'],
  'xbox': ['Games'],

  // Bills & Utilities
  'electric': ['Utilities'],
  'electricity': ['Utilities'],
  'water': ['Utilities'],
  'internet': ['Internet'],
  'wifi': ['Internet'],
  'cable': ['Internet'],
  'phone bill': ['Phone'],
  'cell phone': ['Phone'],
  'rent': ['Rent/Mortgage'],
  'mortgage': ['Rent/Mortgage'],
  'utilities': ['Utilities'],

  // Health & Wellness
  'doctor': ['Doctor'],
  'hospital': ['Doctor'],
  'pharmacy': ['Pharmacy'],
  'medicine': ['Pharmacy'],
  'drugs': ['Pharmacy'],
  'dental': ['Doctor'],
  'dentist': ['Doctor'],
  'vision': ['Doctor'],
  'optical': ['Doctor'],
  'glasses': ['Doctor'],
  'contacts': ['Doctor'],
  'gym': ['Gym'],
  'fitness': ['Gym'],
  'membership': ['Gym'],

  // Other common keywords
  'transfer': ['Transfers'],
  'subscription': ['Subscriptions'],
  'bill': ['Utilities'],
  'payment': ['Utilities'],
  'fee': ['Other'],
  'charge': ['Other'],
  'misc': ['Other'],
  'miscellaneous': ['Other'],
};

export function suggestCategory(description: string, availableCategories: string[]): CategorySuggestion[] {
  if (!description || !availableCategories.length) {
    return [];
  }

  const normalizedDescription = description.toLowerCase().trim();
  const suggestions: CategorySuggestion[] = [];

  // Check for keyword matches
  for (const [keyword, categories] of Object.entries(KEYWORD_MAP)) {
    if (normalizedDescription.includes(keyword)) {
      for (const category of categories) {
        if (availableCategories.includes(category)) {
          // Boost confidence for exact matches
          const confidence = keyword.length > 3 ? 0.9 : 0.7;
          suggestions.push({ category, confidence });
        }
      }
    }
  }

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = suggestions.reduce((acc, suggestion) => {
    const existing = acc.find(s => s.category === suggestion.category);
    if (!existing || suggestion.confidence > existing.confidence) {
      if (existing) {
        acc = acc.filter(s => s.category !== suggestion.category);
      }
      acc.push(suggestion);
    }
    return acc;
  }, [] as CategorySuggestion[]);

  return uniqueSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Return top 3 suggestions
}

// Test function to verify AI is working
export function testAI() {
  const testCases = [
    { description: 'starbucks coffee', expectedCategories: ['Coffee Shops'] },
    { description: 'uber ride to airport', expectedCategories: ['Ride Sharing'] },
    { description: 'grocery shopping at walmart', expectedCategories: ['Groceries'] },
    { description: 'electric bill payment', expectedCategories: ['Utilities'] },
    { description: 'amazon purchase', expectedCategories: ['General Shopping'] },
  ];

  console.log('🧪 Testing AI Category Suggestions:');
  testCases.forEach(({ description, expectedCategories }) => {
    // Test with common expense categories
    const availableCategories = [
      'Groceries', 'Restaurants', 'Coffee Shops', 'Takeout', 'Clothing', 'Electronics',
      'Gas/Fuel', 'Ride Sharing', 'Public Transit', 'Maintenance', 'Utilities', 'Phone',
      'Internet', 'Insurance', 'Doctor', 'Pharmacy', 'Gym', 'Movies', 'Subscriptions',
      'Games', 'General Shopping', 'Other'
    ];
    const suggestions = suggestCategory(description, availableCategories);
    console.log(`"${description}" → ${suggestions.map(s => s.category).join(', ')} (confidence: ${suggestions.map(s => s.confidence).join(', ')})`);
  });
}

export function getBestCategorySuggestion(description: string, availableCategories: string[]): string | null {
  const suggestions = suggestCategory(description, availableCategories);
  return suggestions.length > 0 ? suggestions[0].category : null;
}