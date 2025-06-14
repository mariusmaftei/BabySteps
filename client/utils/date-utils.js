export const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isLocalToday = (dateString) => {
  if (!dateString) return false;
  return dateString === getLocalDateString();
};

export const getLocalDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCurrentWeekDates = () => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 6);

  const endDateStr = getLocalDateString();
  const startDateStr =
    startDate.getFullYear() +
    "-" +
    String(startDate.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(startDate.getDate()).padStart(2, "0");

  return { startDate: startDateStr, endDate: endDateStr };
};

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
