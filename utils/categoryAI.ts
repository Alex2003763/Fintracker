// Enhanced AI-powered category suggestion system
// Uses fuzzy matching, context awareness, and comprehensive keyword mapping

// import { TRANSACTION_CATEGORIES } from '../constants';

export interface CategorySuggestion {
  category: string;
  confidence: number;
  matchedKeywords?: string[];
}

export interface KeywordMapping {
  keywords: string[];
  category: string;
  weight: number;
  context?: string[];
}

// Cache for performance optimization
const suggestionCache = new Map<string, CategorySuggestion[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const KEYWORD_MAPPINGS: KeywordMapping[] = [
  // Food & Drink - Expanded with weights and context
  { keywords: ['restaurant', 'restaurants', 'resto'], category: 'Restaurants', weight: 0.9, context: ['dinner', 'lunch', 'food'] },
  { keywords: ['cafe', 'coffee shop', 'coffee house', 'cafeteria'], category: 'Coffee Shops', weight: 0.95 },
  { keywords: ['coffee', 'latte', 'espresso', 'cappuccino', 'mocha'], category: 'Coffee Shops', weight: 0.9 },
  { keywords: ['starbucks', 'bucks', 'starbuck'], category: 'Coffee Shops', weight: 1.0 },
  { keywords: ['mcdonalds', 'mc donalds', 'mcdonald', 'mcds', 'macdonalds'], category: 'Takeout', weight: 1.0 },
  { keywords: ['burger', 'burgers', 'burger king', 'bk', 'wendys', 'wendy'], category: 'Takeout', weight: 0.85 },
  { keywords: ['pizza', 'pizza hut', 'dominos', 'papa johns', 'papa john'], category: 'Takeout', weight: 0.9 },
  { keywords: ['subway', 'sub way'], category: 'Takeout', weight: 0.8 },
  { keywords: ['kfc', 'kentucky fried chicken'], category: 'Takeout', weight: 0.9 },
  { keywords: ['taco bell', 'taco'], category: 'Takeout', weight: 0.85 },
  { keywords: ['grocery', 'groceries', 'supermarket', 'super market', 'food store'], category: 'Groceries', weight: 0.9 },
  { keywords: ['walmart', 'wal mart', 'wal-mart'], category: 'Groceries', weight: 0.95 },
  { keywords: ['target', 'tar get'], category: 'Groceries', weight: 0.9 },
  { keywords: ['costco', 'cost co'], category: 'Groceries', weight: 0.95 },
  { keywords: ['whole foods', 'wholefoods'], category: 'Groceries', weight: 0.9 },
  { keywords: ['trader joes', 'trader joe', 'tj'], category: 'Groceries', weight: 0.9 },
  { keywords: ['safeway', 'safe way'], category: 'Groceries', weight: 0.85 },
  { keywords: ['kroger', 'krogers'], category: 'Groceries', weight: 0.85 },
  { keywords: ['publix'], category: 'Groceries', weight: 0.85 },
  { keywords: ['food', 'foods'], category: 'Groceries', weight: 0.7 },
  { keywords: ['lunch', 'luncheon'], category: 'Restaurants', weight: 0.8 },
  { keywords: ['dinner', 'supper'], category: 'Restaurants', weight: 0.8 },
  { keywords: ['breakfast', 'brunch'], category: 'Coffee Shops', weight: 0.85 },
  { keywords: ['snack', 'snacks'], category: 'Groceries', weight: 0.75 },
  { keywords: ['candy', 'candies', 'sweets'], category: 'Groceries', weight: 0.8 },
  { keywords: ['chips', 'crisps'], category: 'Groceries', weight: 0.8 },
  { keywords: ['soda', 'pop', 'soft drink'], category: 'Groceries', weight: 0.8 },
  { keywords: ['beer', 'beers', 'ale'], category: 'Groceries', weight: 0.85 },
  { keywords: ['wine', 'wines'], category: 'Groceries', weight: 0.85 },
  { keywords: ['liquor', 'alcohol', 'spirits'], category: 'Groceries', weight: 0.8 },
  { keywords: ['bar', 'bars', 'pub'], category: 'Restaurants', weight: 0.75 },

  // Transportation - Enhanced
  { keywords: ['gas', 'gasoline', 'petrol', 'fuel'], category: 'Gas/Fuel', weight: 0.9 },
  { keywords: ['uber', 'uber ride', 'uberx'], category: 'Ride Sharing', weight: 1.0 },
  { keywords: ['lyft', 'lyft ride'], category: 'Ride Sharing', weight: 1.0 },
  { keywords: ['taxi', 'cab', 'taxis', 'cabs'], category: 'Ride Sharing', weight: 0.9 },
  { keywords: ['bus', 'buses', 'transit'], category: 'Public Transit', weight: 0.85 },
  { keywords: ['train', 'trains', 'rail'], category: 'Public Transit', weight: 0.85 },
  { keywords: ['subway', 'metro'], category: 'Public Transit', weight: 0.9 },
  { keywords: ['parking', 'parking fee', 'parking meter'], category: 'Gas/Fuel', weight: 0.8 },
  { keywords: ['toll', 'tolls', 'toll road'], category: 'Gas/Fuel', weight: 0.85 },
  { keywords: ['car', 'auto'], category: 'Maintenance', weight: 0.7 },
  { keywords: ['insurance', 'auto insurance', 'car insurance'], category: 'Insurance', weight: 0.9 },
  { keywords: ['repair', 'repairs', 'fix'], category: 'Maintenance', weight: 0.8 },
  { keywords: ['maintenance', 'service'], category: 'Maintenance', weight: 0.85 },
  { keywords: ['oil change', 'oil'], category: 'Maintenance', weight: 0.9 },
  { keywords: ['tires', 'tyre', 'tire'], category: 'Maintenance', weight: 0.9 },

  // Shopping - Comprehensive
  { keywords: ['amazon', 'amazon.com', 'amzn'], category: 'General Shopping', weight: 1.0 },
  { keywords: ['shopping', 'shop'], category: 'General Shopping', weight: 0.7 },
  { keywords: ['store', 'stores'], category: 'General Shopping', weight: 0.65 },
  { keywords: ['mall', 'shopping mall'], category: 'General Shopping', weight: 0.8 },
  { keywords: ['clothes', 'clothing', 'apparel'], category: 'Clothing', weight: 0.9 },
  { keywords: ['shoes', 'shoe', 'sneakers', 'boots'], category: 'Clothing', weight: 0.9 },
  { keywords: ['electronics', 'electronic'], category: 'Electronics', weight: 0.9 },
  { keywords: ['phone', 'phones', 'smartphone', 'mobile'], category: 'Electronics', weight: 0.85 },
  { keywords: ['computer', 'computers', 'pc', 'laptop'], category: 'Electronics', weight: 0.9 },
  { keywords: ['books', 'book'], category: 'General Shopping', weight: 0.8 },
  { keywords: ['music', 'songs', 'album'], category: 'General Shopping', weight: 0.75 },
  { keywords: ['movies', 'movie', 'film'], category: 'General Shopping', weight: 0.75 },
  { keywords: ['ebay'], category: 'General Shopping', weight: 0.9 },
  { keywords: ['etsy'], category: 'General Shopping', weight: 0.85 },
  { keywords: ['best buy', 'bestbuy'], category: 'Electronics', weight: 0.9 },
  { keywords: ['apple store', 'apple'], category: 'Electronics', weight: 0.9 },
  { keywords: ['nike', 'adidas'], category: 'Clothing', weight: 0.9 },
  { keywords: ['h&m', 'hm', 'zara'], category: 'Clothing', weight: 0.9 },

  // Entertainment - Enhanced
  { keywords: ['movie', 'movies', 'cinema', 'theater'], category: 'Movies', weight: 0.9 },
  { keywords: ['netflix', 'net flix'], category: 'Subscriptions', weight: 1.0 },
  { keywords: ['spotify', 'spotify premium'], category: 'Subscriptions', weight: 1.0 },
  { keywords: ['apple music', 'applemusic'], category: 'Subscriptions', weight: 1.0 },
  { keywords: ['youtube premium', 'youtube'], category: 'Subscriptions', weight: 0.9 },
  { keywords: ['disney plus', 'disney+', 'disney'], category: 'Subscriptions', weight: 0.95 },
  { keywords: ['hulu'], category: 'Subscriptions', weight: 0.95 },
  { keywords: ['amazon prime', 'prime'], category: 'Subscriptions', weight: 0.9 },
  { keywords: ['concert', 'concerts', 'show'], category: 'Movies', weight: 0.8 },
  { keywords: ['game', 'games', 'gaming'], category: 'Games', weight: 0.8 },
  { keywords: ['steam', 'steam game'], category: 'Games', weight: 1.0 },
  { keywords: ['playstation', 'ps4', 'ps5', 'playstation network'], category: 'Games', weight: 0.95 },
  { keywords: ['xbox', 'xbox live', 'xbox game pass'], category: 'Games', weight: 0.95 },
  { keywords: ['nintendo'], category: 'Games', weight: 0.9 },
  { keywords: ['twitch'], category: 'Subscriptions', weight: 0.9 },

  // Bills & Utilities - Comprehensive
  { keywords: ['electric', 'electricity', 'power'], category: 'Utilities', weight: 0.9 },
  { keywords: ['water', 'water bill'], category: 'Utilities', weight: 0.9 },
  { keywords: ['internet', 'wifi', 'broadband'], category: 'Internet', weight: 0.9 },
  { keywords: ['cable', 'cable tv'], category: 'Internet', weight: 0.85 },
  { keywords: ['phone bill', 'phone', 'cell phone', 'mobile bill'], category: 'Phone', weight: 0.9 },
  { keywords: ['rent', 'rental'], category: 'Rent/Mortgage', weight: 0.9 },
  { keywords: ['mortgage', 'mortgage payment'], category: 'Rent/Mortgage', weight: 0.95 },
  { keywords: ['utilities', 'utility'], category: 'Utilities', weight: 0.8 },
  { keywords: ['gas bill', 'natural gas'], category: 'Utilities', weight: 0.85 },
  { keywords: ['heating'], category: 'Utilities', weight: 0.8 },
  { keywords: ['cooling'], category: 'Utilities', weight: 0.8 },

  // Health & Wellness - Enhanced
  { keywords: ['doctor', 'doctors', 'physician'], category: 'Doctor', weight: 0.9 },
  { keywords: ['hospital', 'clinic'], category: 'Doctor', weight: 0.85 },
  { keywords: ['pharmacy', 'pharmacies', 'drugstore'], category: 'Pharmacy', weight: 0.9 },
  { keywords: ['medicine', 'medication', 'prescription'], category: 'Pharmacy', weight: 0.85 },
  { keywords: ['drugs', 'drug'], category: 'Pharmacy', weight: 0.8 },
  { keywords: ['dental', 'dentist', 'dentistry'], category: 'Doctor', weight: 0.9 },
  { keywords: ['vision', 'optical', 'eye doctor'], category: 'Doctor', weight: 0.85 },
  { keywords: ['glasses', 'eyeglasses'], category: 'Doctor', weight: 0.9 },
  { keywords: ['contacts', 'contact lenses'], category: 'Doctor', weight: 0.9 },
  { keywords: ['gym', 'gyms', 'fitness center'], category: 'Gym', weight: 0.9 },
  { keywords: ['fitness', 'workout'], category: 'Gym', weight: 0.8 },
  { keywords: ['membership', 'gym membership'], category: 'Gym', weight: 0.85 },
  { keywords: ['planet fitness', 'planetfitness'], category: 'Gym', weight: 0.95 },
  { keywords: ['anytime fitness'], category: 'Gym', weight: 0.9 },
  { keywords: ['yoga', 'pilates'], category: 'Gym', weight: 0.8 },
  { keywords: ['personal trainer'], category: 'Gym', weight: 0.85 },

  // Financial & Other - Enhanced
  { keywords: ['transfer', 'transfers', 'bank transfer'], category: 'Transfers', weight: 0.9 },
  { keywords: ['subscription', 'subscriptions', 'monthly'], category: 'Subscriptions', weight: 0.8 },
  { keywords: ['bill', 'bills', 'payment'], category: 'Utilities', weight: 0.7 },
  { keywords: ['fee', 'fees', 'charge'], category: 'Other', weight: 0.7 },
  { keywords: ['misc', 'miscellaneous'], category: 'Other', weight: 0.6 },
  { keywords: ['atm', 'atm fee'], category: 'Other', weight: 0.9 },
  { keywords: ['bank fee', 'banking fee'], category: 'Other', weight: 0.85 },
  { keywords: ['overdraft'], category: 'Other', weight: 0.9 },
  { keywords: ['late fee'], category: 'Other', weight: 0.85 },
  { keywords: ['interest'], category: 'Other', weight: 0.8 },
];

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Calculate fuzzy match similarity (0-1)
function fuzzyMatchSimilarity(word1: string, word2: string): number {
  const maxLength = Math.max(word1.length, word2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(word1, word2);
  return 1 - (distance / maxLength);
}

// Check if words are similar (handles typos)
function areWordsSimilar(word1: string, word2: string, threshold = 0.8): boolean {
  return fuzzyMatchSimilarity(word1, word2) >= threshold;
}

// Extract words from description for better context analysis
function extractWords(description: string): string[] {
  return description.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

// Calculate confidence score based on multiple factors
function calculateConfidence(
  keyword: string,
  description: string,
  mapping: KeywordMapping,
  matchedWords: string[]
): number {
  let confidence = mapping.weight;

  // Boost for exact matches
  if (description.toLowerCase().includes(keyword.toLowerCase())) {
    confidence += 0.1;
  }

  // Boost for word boundaries (more precise matches)
  const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
  if (wordBoundaryRegex.test(description)) {
    confidence += 0.15;
  }

  // Boost for multiple matched keywords
  if (matchedWords.length > 1) {
    confidence += Math.min(matchedWords.length * 0.05, 0.2);
  }

  // Boost for longer, more specific keywords
  if (keyword.length > 5) {
    confidence += 0.1;
  }

  // Penalty for very short descriptions
  if (description.length < 3) {
    confidence -= 0.3;
  }

  return Math.max(0, Math.min(1, confidence));
}

export function suggestCategory(description: string, availableCategories: string[]): CategorySuggestion[] {
  if (!description || !availableCategories.length) {
    return [];
  }

  // Check cache first
  const cacheKey = `${description.toLowerCase()}:${availableCategories.sort().join(',')}`;
  const cached = suggestionCache.get(cacheKey);
  if (cached && Date.now() - (cached as any)._timestamp < CACHE_TTL) {
    return cached;
  }

  const normalizedDescription = description.toLowerCase().trim();
  const words = extractWords(normalizedDescription);
  const suggestions = new Map<string, { confidence: number; matchedKeywords: string[] }>();

  // Enhanced keyword matching with fuzzy logic
  for (const mapping of KEYWORD_MAPPINGS) {
    if (!availableCategories.includes(mapping.category)) {
      continue;
    }

    let bestMatch = { similarity: 0, matchedKeyword: '' };
    const matchedKeywords: string[] = [];

    // Check each keyword in the mapping
    for (const keyword of mapping.keywords) {
      const keywordWords = extractWords(keyword);

      // Check for exact phrase matches first
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        bestMatch = { similarity: 1.0, matchedKeyword: keyword };
        matchedKeywords.push(keyword);
        break;
      }

      // Check for fuzzy word matches
      for (const descWord of words) {
        for (const keyWord of keywordWords) {
          const similarity = fuzzyMatchSimilarity(descWord, keyWord);
          if (similarity > bestMatch.similarity && similarity > 0.75) {
            bestMatch = { similarity, matchedKeyword: keyword };
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        }
      }
    }

    // If we found matches, calculate confidence
    if (bestMatch.similarity > 0) {
      const confidence = calculateConfidence(
        bestMatch.matchedKeyword,
        normalizedDescription,
        mapping,
        matchedKeywords
      );

      const existing = suggestions.get(mapping.category);
      if (!existing || confidence > existing.confidence) {
        suggestions.set(mapping.category, {
          confidence,
          matchedKeywords
        });
      }
    }
  }

  // Convert to array and sort by confidence
  const results: CategorySuggestion[] = Array.from(suggestions.entries())
    .map(([category, data]) => ({
      category,
      confidence: data.confidence,
      matchedKeywords: data.matchedKeywords
    }))
    .filter(suggestion => suggestion.confidence > 0.3) // Filter low confidence suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Return top 3 suggestions

  // Cache the results
  (results as any)._timestamp = Date.now();
  suggestionCache.set(cacheKey, results);

  return results;
}

// Enhanced test function with more comprehensive test cases
export function testAI() {
  const testCases = [
    { description: 'starbucks coffee', expectedCategories: ['Coffee Shops'] },
    { description: 'uber ride to airport', expectedCategories: ['Ride Sharing'] },
    { description: 'grocery shopping at walmart', expectedCategories: ['Groceries'] },
    { description: 'electric bill payment', expectedCategories: ['Utilities'] },
    { description: 'amazon purchase', expectedCategories: ['General Shopping'] },
    { description: 'mcdonalds lunch', expectedCategories: ['Takeout'] },
    { description: 'netflix subscription', expectedCategories: ['Subscriptions'] },
    { description: 'gas station fill up', expectedCategories: ['Gas/Fuel'] },
    { description: 'doctor appointment', expectedCategories: ['Doctor'] },
    { description: 'gym membership fee', expectedCategories: ['Gym'] },
    { description: 'spotify premium', expectedCategories: ['Subscriptions'] },
    { description: 'whole foods groceries', expectedCategories: ['Groceries'] },
    { description: 'iphone case from amazon', expectedCategories: ['General Shopping'] },
    { description: 'steam game purchase', expectedCategories: ['Games'] },
    { description: 'taco bell dinner', expectedCategories: ['Takeout'] },
    { description: 'water bill payment', expectedCategories: ['Utilities'] },
    { description: 'pharmacy medicine', expectedCategories: ['Pharmacy'] },
    { description: 'costco shopping trip', expectedCategories: ['Groceries'] },
    { description: 'parking meter downtown', expectedCategories: ['Gas/Fuel'] },
    { description: 'disney plus subscription', expectedCategories: ['Subscriptions'] },
  ];

  console.log('🧪 Testing Enhanced AI Category Suggestions:');
  console.log('='.repeat(80));

  testCases.forEach(({ description, expectedCategories }, index) => {
    const availableCategories = [
      'Groceries', 'Restaurants', 'Coffee Shops', 'Takeout', 'Clothing', 'Electronics',
      'Gas/Fuel', 'Ride Sharing', 'Public Transit', 'Maintenance', 'Utilities', 'Phone',
      'Internet', 'Insurance', 'Doctor', 'Pharmacy', 'Gym', 'Movies', 'Subscriptions',
      'Games', 'General Shopping', 'Other', 'Rent/Mortgage'
    ];

    const suggestions = suggestCategory(description, availableCategories);

    console.log(`${(index + 1).toString().padStart(2)}. "${description}"`);
    console.log(`    Expected: ${expectedCategories.join(', ')}`);
    console.log(`    AI: ${suggestions.map(s => `${s.category} (${s.confidence.toFixed(2)})`).join(', ')}`);

    if (suggestions.length > 0) {
      const topSuggestion = suggestions[0].category;
      const isCorrect = expectedCategories.includes(topSuggestion);
      console.log(`    Result: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
    } else {
      console.log(`    Result: ❌ No suggestions`);
    }
    console.log('');
  });

  console.log('='.repeat(80));
}

// Test fuzzy matching capabilities
export function testFuzzyMatching() {
  console.log('🧪 Testing Fuzzy Matching:');

  const testCases = [
    { input: 'starbuks', expected: 'starbucks' },
    { input: 'mcdonlads', expected: 'mcdonalds' },
    { input: 'amazn', expected: 'amazon' },
    { input: 'netflx', expected: 'netflix' },
    { input: 'walmrt', expected: 'walmart' },
  ];

  testCases.forEach(({ input, expected }) => {
    const similarity = fuzzyMatchSimilarity(input, expected);
    console.log(`"${input}" vs "${expected}": ${(similarity * 100).toFixed(1)}% match`);
  });
}

export function getBestCategorySuggestion(description: string, availableCategories: string[]): string | null {
  const suggestions = suggestCategory(description, availableCategories);
  return suggestions.length > 0 ? suggestions[0].category : null;
}

// Clear cache utility (useful for testing)
export function clearSuggestionCache(): void {
  suggestionCache.clear();
}