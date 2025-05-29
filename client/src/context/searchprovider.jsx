// Import React and the useState hook
import React, { useState } from 'react';
// Import the SearchContext that we created
import { SearchContext } from './searchcontext';

// Create a provider component to wrap around parts of the app that need access to search state
export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');   // State to store the search term

  // Provide `searchTerm` and `setSearchTerm` to all children components
  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};
