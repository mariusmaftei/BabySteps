/**
 * Gets the current date in local timezone as YYYY-MM-DD
 * This ensures dates are in the user's local timezone (Romania)
 */
export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date for display
 */
export const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Checks if a date is today in local timezone
 */
export const isLocalToday = (dateString) => {
  if (!dateString) return false;
  return dateString === getLocalDateString();
};

/**
 * Gets date for N days ago in local timezone
 */
export const getLocalDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gets the start and end dates for the current week in local timezone
 */
export const getCurrentWeekDates = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 6); // Last 7 days

  const endDateStr = getLocalDateString();
  const startDateStr =
    startDate.getFullYear() +
    "-" +
    String(startDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(startDate.getDate()).padStart(2, "0");

  return { startDate: startDateStr, endDate: endDateStr };
};

/**
 * Gets the start and end dates for a month in local timezone
 */
export const getMonthDates = (year, month) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const startDateStr =
    startDate.getFullYear() +
    "-" +
    String(startDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(startDate.getDate()).padStart(2, "0");

  const endDateStr =
    endDate.getFullYear() +
    "-" +
    String(endDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(endDate.getDate()).padStart(2, "0");

  return { startDate: startDateStr, endDate: endDateStr };
};
