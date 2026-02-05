/**
 * Application Entry Point
 * 
 * This is the main entry point for the React application. It initializes
 * the React root and renders the App component into the DOM.
 * 
 * @module main
 */

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root DOM element
const rootElement = document.getElementById("root");

// Ensure the root element exists before rendering
if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a <div id='root'></div> in your HTML.");
}

// Create React root and render the App component
createRoot(rootElement).render(<App />);
