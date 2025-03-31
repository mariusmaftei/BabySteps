export const getSleepRecommendation = (ageInMonths) => {
  if (ageInMonths < 4) {
    // Newborn (0-3 months)
    return {
      minHours: 14,
      maxHours: 17,
      recommendedNapHours: 8,
      recommendedNightHours: 8,
    };
  } else if (ageInMonths >= 4 && ageInMonths <= 12) {
    // Infant (4-12 months)
    return {
      minHours: 12,
      maxHours: 16,
      recommendedNapHours: 4,
      recommendedNightHours: 10,
    };
  } else if (ageInMonths > 12 && ageInMonths <= 24) {
    // Toddler (1-2 years)
    return {
      minHours: 11,
      maxHours: 14,
      recommendedNapHours: 2,
      recommendedNightHours: 11,
    };
  } else if (ageInMonths > 24 && ageInMonths <= 60) {
    // Preschooler (3-5 years)
    return {
      minHours: 10,
      maxHours: 13,
      recommendedNapHours: 1,
      recommendedNightHours: 11,
    };
  } else {
    // School-age (6-12 years)
    return {
      minHours: 9,
      maxHours: 12,
      recommendedNapHours: 0,
      recommendedNightHours: 10,
    };
  }
};
