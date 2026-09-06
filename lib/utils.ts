import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function mergeArrays<T>(arr1: T[] | undefined, arr2: T[] | undefined): T[] {
  return [...new Set([...(arr1 || []), ...(arr2 || [])])];
}