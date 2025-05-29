// Import createContext from React to create a global context
import { createContext } from "react";

// Create a context for user-related data (e.g., profile info)
// This will allow us to share user state across components like Header, Sidebar, Settings, etc.
export const UserContext = createContext();
