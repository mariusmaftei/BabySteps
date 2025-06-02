export const getChildAgeInMonths = (birthDate) => {
  if (!birthDate) return 24;

  const birth = new Date(birthDate);
  const today = new Date();

  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += today.getMonth();

  if (today.getDate() < birth.getDate()) {
    months--;
  }

  return months;
};
