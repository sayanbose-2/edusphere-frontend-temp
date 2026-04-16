/**
 * Truncates a string to a maximum length, appending '...' if truncated.
 */
const truncate = (text: string, maxLength = 60): string => {
  if (!text) return '-';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Formats a date string to locale-aware short date.
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

/**
 * Converts an UPPER_SNAKE_CASE string to Title Case.
 */
const formatEnum = (value: string): string => {
  if (!value) return '-';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export { truncate, formatDate, formatEnum };
