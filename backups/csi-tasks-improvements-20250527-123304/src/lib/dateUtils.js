/**
 * Date utility functions for consistent date formatting across the application
 * Handles timezone issues with YYYY-MM-DD date strings
 */

/**
 * Formats a date string for display, handling timezone issues with YYYY-MM-DD format
 * @param {string} dateStr - Date string (preferably YYYY-MM-DD format)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatLocalDate = (dateStr, options = {}) => {
  if (!dateStr) return 'N/A';
  
  // Check if dateStr is in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create Date object using local timezone parts to avoid UTC timezone shifts
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString(undefined, options);
  }
  
  // Fallback for other date formats (ISO strings, etc.)
  return new Date(dateStr).toLocaleDateString(undefined, options);
};

/**
 * Formats a date for display with default short format
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date string (e.g., "Mon, Jan 15, 2024")
 */
export const formatDateShort = (dateStr) => {
  return formatLocalDate(dateStr, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Formats a date for display with full format
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date string (e.g., "Monday, January 15, 2024")
 */
export const formatDateFull = (dateStr) => {
  return formatLocalDate(dateStr, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats a date for simple display (no weekday)
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date string (e.g., "1/15/2024")
 */
export const formatDateSimple = (dateStr) => {
  return formatLocalDate(dateStr);
}; 