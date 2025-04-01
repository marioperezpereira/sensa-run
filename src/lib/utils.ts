import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Time calculation utilities
export function timeToSeconds(hours: number, minutes: number, seconds: number): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToTime(seconds: number): { hours: number; minutes: number; seconds: number } {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return { hours, minutes, seconds: remainingSeconds };
}

// Format time for display
export function formatTime(hours: number, minutes: number, seconds: number): string {
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Distance formatting utilities
export function formatDistanceForDisplay(distance: string): string {
  if (distance === "5K" || distance === "10K") return distance;
  if (distance === "Half Marathon") return "Media maratón";
  if (distance === "Marathon") return "Maratón";
  return distance; // Return as is for track distances
}

export function getDbDistance(displayDistance: string): string {
  if (displayDistance === "Media maratón") return "Half Marathon";
  if (displayDistance === "Maratón") return "Marathon";
  return displayDistance;
}
