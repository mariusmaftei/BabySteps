export const getSleepRecommendations = (ageInMonths) => {
  // Cap age at 12 months since the app is only for infants
  const cappedAge = Math.min(ageInMonths, 12);

  if (cappedAge < 4) {
    // Newborn (0-3 months)
    return {
      ageGroup: "Newborn (0-3 months)",
      totalSleep: "14-17 hours/day",
      naptime: "Multiple naps (day & night)",
      bedtime: "No set bedtime (short sleep cycles)",
      naptimeHours: "Throughout the day and night",
      bedtimeHours: "No set bedtime - sleep cycles of 2-4 hours",
      minHours: 14,
      maxHours: 17,
      recommendedNapHours: 8,
      recommendedNightHours: 8,
    };
  } else {
    // Infant (4-12 months)
    return {
      ageGroup: "Infant (4-12 months)",
      totalSleep: "12-16 hours/day",
      naptime: "2-3 naps (morning, afternoon)",
      bedtime: "6:30 - 8:00 PM",
      naptimeHours: "9:00 AM, 12:00 PM, and 3:00 PM",
      bedtimeHours: "6:30 PM - 8:00 PM",
      minHours: 12,
      maxHours: 16,
      recommendedNapHours: 4,
      recommendedNightHours: 10,
    };
  }
};
