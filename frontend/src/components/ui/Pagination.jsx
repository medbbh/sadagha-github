import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className = ''
}) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    const adjustedStart = Math.max(1, end - maxVisiblePages + 1);
    
    return Array.from(
      { length: end - adjustedStart + 1 }, 
      (_, i) => adjustedStart + i
    );
  };

  const visiblePages = getVisiblePages();
  const showFirstPage = visiblePages[0] > 1;
  const showLastPage = visiblePages[visiblePages.length - 1] < totalPages;
  const showFirstEllipsis = visiblePages[0] > 2;
  const showLastEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange && onPageChange(page);
    }
  };

  const PageButton = ({ page, children, isActive = false, disabled = false }) => (
    <button
      onClick={() => handlePageChange(page)}
      disabled={disabled}
      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
      }`}
    >
      {children}
    </button>
  );

  const Ellipsis = () => (
    <span className="px-3 py-2 text-gray-500 text-sm">...</span>
  );

  return (
    <div className={`flex items-center justify-center space-x-1 mt-8 ${className}`}>
      {/* Previous Button */}
      <PageButton
        page={currentPage - 1}
        disabled={currentPage === 1}
      >
        <div className="flex items-center space-x-1">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </div>
      </PageButton>

      {showPageNumbers && (
        <>
          {/* First Page */}
          {showFirstPage && (
            <>
              <PageButton page={1}>1</PageButton>
              {showFirstEllipsis && <Ellipsis />}
            </>
          )}

          {/* Visible Pages */}
          {visiblePages.map(page => (
            <PageButton
              key={page}
              page={page}
              isActive={page === currentPage}
            >
              {page}
            </PageButton>
          ))}

          {/* Last Page */}
          {showLastPage && (
            <>
              {showLastEllipsis && <Ellipsis />}
              <PageButton page={totalPages}>{totalPages}</PageButton>
            </>
          )}
        </>
      )}

      {/* Next Button */}
      <PageButton
        page={currentPage + 1}
        disabled={currentPage === totalPages}
      >
        <div className="flex items-center space-x-1">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </PageButton>

      {/* Page Info (for mobile) */}
      <div className="sm:hidden ml-4 text-sm text-gray-500">
        {currentPage} of {totalPages}
      </div>
    </div>
  );
}