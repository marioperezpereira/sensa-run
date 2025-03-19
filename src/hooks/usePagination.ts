
import { useState } from 'react';

interface PaginationProps {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
}

export function usePagination({ 
  totalItems, 
  initialPage = 1, 
  itemsPerPage = 5 
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is within bounds
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  
  // Get current page items
  const getPaginatedItems = <T>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Page navigation functions
  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const firstPage = () => {
    setCurrentPage(1);
  };
  
  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  return {
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToPage,
    getPaginatedItems,
  };
}
