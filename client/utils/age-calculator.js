export const getChildAgeInMonths = (birthDate) => {
  if (!birthDate) return 24; // Default to toddler if no birthdate

  const birth = new Date(birthDate);
  const today = new Date();

  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();

  // Adjust for day of month
  if (today.getDate() < birth.getDate()) {
    months--;
  }

  return months;
};
