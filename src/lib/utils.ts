/**
 * Utility function for merging Tailwind CSS classes
 * 
 * This function combines clsx (for conditional class names) and tailwind-merge
 * (for resolving Tailwind class conflicts) to create a robust class name utility.
 * 
 * @param inputs - Variable number of class value inputs (strings, objects, arrays, etc.)
 * @returns A merged string of class names with Tailwind conflicts resolved
 * 
 * @example
 * cn("px-2 py-1", "px-4") // Returns "py-1 px-4" (px-2 is overridden by px-4)
 * cn("text-red-500", { "text-blue-500": isActive }) // Conditional classes
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
