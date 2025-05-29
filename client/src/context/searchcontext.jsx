// Import createContext to create a new context
import { createContext } from 'react';

// Create a SearchContext with a default value of null
// This will be used to share the search term across components 
export const SearchContext = createContext(null);
