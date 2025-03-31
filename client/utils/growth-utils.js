// WHO standards data for growth measurements
export const WHO_STANDARDS = {
  boys: [
    { age: 0, weight: 3.3, height: 49.9, headCirc: 34.5 }, // Newborn
    { age: 1, weight: 4.5, height: 54.7, headCirc: 37.1 }, // 1 month
    { age: 2, weight: 5.6, height: 58.4, headCirc: 39.1 }, // 2 months
    { age: 3, weight: 6.4, height: 61.4, headCirc: 40.5 }, // 3 months
    { age: 4, weight: 7.0, height: 63.9, headCirc: 41.7 }, // 4 months
    { age: 5, weight: 7.5, height: 65.9, headCirc: 42.5 }, // 5 months
    { age: 6, weight: 7.9, height: 67.6, headCirc: 43.2 }, // 6 months
    { age: 7, weight: 8.3, height: 69.2, headCirc: 43.8 }, // 7 months
    { age: 8, weight: 8.6, height: 70.6, headCirc: 44.3 }, // 8 months
    { age: 9, weight: 8.9, height: 72.0, headCirc: 44.7 }, // 9 months
    { age: 10, weight: 9.2, height: 73.3, headCirc: 45.2 }, // 10 months
    { age: 11, weight: 9.4, height: 74.5, headCirc: 45.6 }, // 11 months
    { age: 12, weight: 9.6, height: 75.7, headCirc: 46.0 }, // 12 months
  ],
  girls: [
    { age: 0, weight: 3.2, height: 49.1, headCirc: 33.9 }, // Newborn
    { age: 1, weight: 4.2, height: 53.7, headCirc: 36.0 }, // 1 month
    { age: 2, weight: 5.1, height: 57.1, headCirc: 37.9 }, // 2 months
    { age: 3, weight: 5.8, height: 59.8, headCirc: 39.3 }, // 3 months
    { age: 4, weight: 6.4, height: 62.1, headCirc: 40.5 }, // 4 months
    { age: 5, weight: 6.9, height: 64.0, headCirc: 41.3 }, // 5 months
    { age: 6, weight: 7.3, height: 65.7, headCirc: 42.0 }, // 6 months
    { age: 7, weight: 7.6, height: 67.3, headCirc: 42.6 }, // 7 months
    { age: 8, weight: 7.9, height: 68.7, headCirc: 43.1 }, // 8 months
    { age: 9, weight: 8.2, height: 70.1, headCirc: 43.6 }, // 9 months
    { age: 10, weight: 8.5, height: 71.5, headCirc: 44.0 }, // 10 months
    { age: 11, weight: 8.7, height: 72.8, headCirc: 44.4 }, // 11 months
    { age: 12, weight: 8.9, height: 74.0, headCirc: 44.8 }, // 12 months
  ],
};

// Constants for maximum values based on WHO standards for 12 months
export const MAX_VALUES = {
  weight: 10000, // 10kg in grams
  height: 80, // 80cm (converted from mm)
  headCirc: 48, // 48cm (converted from mm)
};

// Helper function to convert mm to cm as integer
export const mmToCm = (mm) => {
  if (!mm && mm !== 0) return 0;
  return Math.round(mm / 10);
};

// Calculate height progress based on WHO standards
export const calculateHeightProgressFromWHO = (height, ageInMonths, gender) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get WHO standards for the child's gender
  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  // Find the closest age in the standards
  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  // Convert height from mm to cm for comparison with WHO standards
  const heightInCm = height > 100 ? mmToCm(height) : height;

  // Calculate percentage based on WHO standard (100% means exactly at the standard)
  const percentage = Math.round((heightInCm / closestStandard.height) * 100);

  // Return a value between 0 and 100
  return Math.min(Math.max(percentage, 0), 100);
};

// Calculate weight progress based on WHO standards
export const calculateWeightProgressFromWHO = (weight, ageInMonths, gender) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get WHO standards for the child's gender
  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  // Find the closest age in the standards
  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  // Convert weight from grams to kg for comparison with WHO standards
  const weightInKg = weight / 1000;

  // Calculate percentage based on WHO standard (100% means exactly at the standard)
  const percentage = Math.round((weightInKg / closestStandard.weight) * 100);

  // Return a value between 0 and 100
  return Math.min(Math.max(percentage, 0), 100);
};

// Calculate head circumference progress based on WHO standards
export const calculateHeadCircProgressFromWHO = (
  headCirc,
  ageInMonths,
  gender
) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get WHO standards for the child's gender
  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  // Find the closest age in the standards
  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  // Convert head circumference from mm to cm for comparison with WHO standards
  const headCircInCm = headCirc > 100 ? mmToCm(headCirc) : headCirc;

  // Calculate percentage based on WHO standard (100% means exactly at the standard)
  const percentage = Math.round(
    (headCircInCm / closestStandard.headCirc) * 100
  );

  // Return a value between 0 and 100
  return Math.min(Math.max(percentage, 0), 100);
};

// Calculate progress percentage for any growth measurement
export const calculateGrowthProgress = (
  birthValue,
  currentValue,
  targetValue,
  measurementType
) => {
  // Handle null or undefined values
  if (birthValue === null || birthValue === undefined) return 0;
  if (currentValue === null || currentValue === undefined) return 0;
  if (targetValue === null || targetValue === undefined) return 0;

  // Get the appropriate max value based on measurement type
  const maxValue =
    MAX_VALUES[measurementType] ||
    (measurementType === "weight"
      ? MAX_VALUES.weight
      : measurementType === "height"
      ? MAX_VALUES.height
      : MAX_VALUES.headCirc);

  // Convert height and head circumference from mm to cm if needed
  let birth = birthValue;
  let current = currentValue;
  let target = targetValue;

  if (measurementType === "height" || measurementType === "headCirc") {
    // Check if values are in mm (typically over 100) and convert to cm
    if (birth > 100) birth = mmToCm(birth);
    if (current > 100) current = mmToCm(current);
    if (target > 100) target = mmToCm(target);
  }

  // Calculate total value (birth + growth)
  const totalValue = current;

  // Calculate total target (birth + target growth)
  const totalTarget = Math.min(birth + target, maxValue);

  // If total value is already equal to or greater than total target, return 100%
  if (totalValue >= totalTarget) return 100;

  // If total value is already equal to or greater than max value, return 100%
  if (totalValue >= maxValue) return 100;

  // Calculate how much progress has been made from birth to total target
  const totalGrowthNeeded = totalTarget - birth;

  // Calculate actual growth
  const actualGrowth = totalValue - birth;

  // Calculate percentage (capped at 100%)
  const percentage = Math.min(
    Math.round((actualGrowth / totalGrowthNeeded) * 100),
    100
  );

  // Ensure percentage is not negative
  return Math.max(percentage, 0);
};

// Format growth value with appropriate unit
export const formatGrowthValueOld = (value, measurementType) => {
  if (value === null || value === undefined) return "0";

  if (measurementType === "weight") {
    return `${Math.round(value)}g`;
  } else if (measurementType === "height" || measurementType === "headCirc") {
    // Convert to cm if in mm
    if (value > 100) {
      return `${mmToCm(value)}cm`;
    }
    return `${Math.round(value)}cm`;
  }

  return `${Math.round(value)}`;
};

// Get appropriate color based on progress percentage
export const getProgressColor = (progress, theme) => {
  if (!theme) {
    // Default colors if theme is not provided
    if (progress >= 85) {
      return "#4CD964"; // Green
    } else if (progress >= 50) {
      return "#007AFF"; // Blue
    } else {
      return "#FF9500"; // Orange
    }
  }

  if (progress >= 85) {
    return theme.success || "#4CD964";
  } else if (progress >= 50) {
    return theme.primary || "#007AFF";
  } else {
    return theme.warning || "#FF9500";
  }
};

// Get appropriate status text based on progress percentage
export const getGrowthStatusTextOld = (progress) => {
  if (progress >= 100) {
    return "Target Reached";
  } else if (progress >= 85) {
    return "On Track";
  } else if (progress >= 50) {
    return `${progress}% Complete`;
  } else {
    return `${progress}% Complete`;
  }
};

// Get WHO standards for a specific age and gender
export const getWHOStandards = (ageInMonths, gender) => {
  // Cap age at 12 months for now since we only have data up to 12 months
  const cappedAge = Math.min(ageInMonths, 12);

  // Get the standards for the child's gender
  const genderStandards = WHO_STANDARDS[gender === "female" ? "girls" : "boys"];

  // Find the closest age in the standards
  // For exact matches
  const exactMatch = genderStandards.find(
    (standard) => standard.age === cappedAge
  );
  if (exactMatch) return exactMatch;

  // For ages between standard measurements, interpolate
  const lowerStandard = genderStandards
    .filter((standard) => standard.age < cappedAge)
    .sort((a, b) => b.age - a.age)[0];
  const upperStandard = genderStandards
    .filter((standard) => standard.age > cappedAge)
    .sort((a, b) => a.age - b.age)[0];

  if (lowerStandard && upperStandard) {
    const ageDiff = upperStandard.age - lowerStandard.age;
    const ageRatio = (cappedAge - lowerStandard.age) / ageDiff;

    return {
      age: cappedAge,
      weight:
        lowerStandard.weight +
        (upperStandard.weight - lowerStandard.weight) * ageRatio,
      height:
        lowerStandard.height +
        (upperStandard.height - lowerStandard.height) * ageRatio,
      headCirc:
        lowerStandard.headCirc +
        (upperStandard.headCirc - lowerStandard.headCirc) * ageRatio,
    };
  }

  // If we can't interpolate, return the closest standard
  return lowerStandard || upperStandard || genderStandards[0];
};

// Calculate expected monthly growth based on WHO standards
export const calculateExpectedMonthlyGrowth = (ageInMonths, gender) => {
  const currentStandard = getWHOStandards(ageInMonths, gender);
  const previousStandard = getWHOStandards(
    Math.max(0, ageInMonths - 1),
    gender
  );

  return {
    weight: Math.round(
      (currentStandard.weight - previousStandard.weight) * 1000
    ), // grams per month
    height: Math.round((currentStandard.height - previousStandard.height) * 10), // mm per month
    headCirc: Math.round(
      (currentStandard.headCirc - previousStandard.headCirc) * 10
    ), // mm per month
  };
};

// Calculate monthly growth progress percentage
export const calculateMonthlyGrowthProgress = (
  startValue,
  currentValue,
  targetValue,
  metricType
) => {
  // Convert to numbers and handle null/undefined
  const start = Number.parseFloat(startValue) || 0;
  const current = Number.parseFloat(currentValue) || 0;
  const target = Number.parseFloat(targetValue) || 1; // Avoid division by zero

  // Calculate actual growth
  const actualGrowth = current - start;

  // Calculate percentage of target achieved
  const percentage = Math.round((actualGrowth / target) * 100);

  // Limit to 0-100% range
  return Math.min(Math.max(percentage, 0), 100);
};

// Get growth recommendations based on WHO standards
export const getGrowthRecommendations = (ageInMonths, gender) => {
  // Get WHO standards for current age
  const whoStandard = getWHOStandards(ageInMonths, gender);

  // Calculate expected monthly growth
  const expectedMonthlyGrowth = calculateExpectedMonthlyGrowth(
    ageInMonths,
    gender
  );

  // Convert monthly growth to weekly (divide by ~4.3 weeks per month)
  const weeklyGrowthFactor = 1 / 4.3;
  const expectedWeeklyGrowth = {
    weight: Math.round(expectedMonthlyGrowth.weight * weeklyGrowthFactor), // grams per week
    height: Math.round(expectedMonthlyGrowth.height * weeklyGrowthFactor), // mm per week
    headCirc: Math.round(expectedMonthlyGrowth.headCirc * weeklyGrowthFactor), // mm per week
  };

  // Allow for a range of +/- 15% around the expected growth
  const minGrowth = {
    weight: Math.round(expectedWeeklyGrowth.weight * 0.85),
    height: Math.round(expectedMonthlyGrowth.height * 0.85),
    headCirc: Math.round(expectedMonthlyGrowth.headCirc * 0.85),
  };

  const maxGrowth = {
    weight: Math.round(expectedWeeklyGrowth.weight * 1.15),
    height: Math.round(expectedMonthlyGrowth.height * 1.15),
    headCirc: Math.round(expectedMonthlyGrowth.headCirc * 1.15),
  };

  // Allow for a range of +/- 10% around the expected measurements
  const expectedRange = {
    weight: {
      min: Math.round(whoStandard.weight * 0.9 * 10) / 10, // kg with 1 decimal
      max: Math.round(whoStandard.weight * 1.1 * 10) / 10, // kg with 1 decimal
    },
    height: {
      min: Math.round(whoStandard.height * 0.95),
      max: Math.round(whoStandard.height * 1.05),
    },
    headCirc: {
      min: Math.round(whoStandard.headCirc * 0.95),
      max: Math.round(whoStandard.headCirc * 1.05),
    },
  };

  // Helper function to get simplified age group label (only 0-3 and 4-12)
  const getAgeGroupLabel = (ageInMonths) => {
    if (ageInMonths <= 3) return "0-3 months";
    if (ageInMonths <= 12) return "4-12 months";
    return "Over 12 months";
  };

  return {
    ageGroup: getAgeGroupLabel(ageInMonths),
    exactAge: ageInMonths,
    whoStandard: whoStandard,
    weightGainPerWeek: `${minGrowth.weight}-${maxGrowth.weight} grams`,
    heightGainPerMonth: `${expectedMonthlyGrowth.height / 10}-${
      Math.round(expectedMonthlyGrowth.height * 1.15) / 10
    } cm`,
    headCircGainPerMonth: `${expectedMonthlyGrowth.headCirc / 10}-${
      Math.round(expectedMonthlyGrowth.headCirc * 1.15) / 10
    } cm`,
    minWeightGain: minGrowth.weight,
    maxWeightGain: maxGrowth.weight,
    minHeightGain: minGrowth.height,
    maxHeightGain: maxGrowth.height,
    minHeadCircGain: minGrowth.headCirc,
    maxHeadCircGain: maxGrowth.headCirc,
    expectedWeight: expectedRange.weight,
    expectedHeight: expectedRange.height,
    expectedHeadCirc: expectedRange.headCirc,
    // Add dynamic monthly targets
    targetWeightPerMonth: expectedMonthlyGrowth.weight,
    targetHeightPerMonth: expectedMonthlyGrowth.height,
    targetHeadCircPerMonth: expectedMonthlyGrowth.headCirc,
  };
};

// Format growth value for display
export const formatGrowthValue = (value, metricType) => {
  if (value === null || value === undefined) return "Not recorded";

  // Convert to number
  const numValue = Number.parseFloat(value);
  if (isNaN(numValue)) return "Invalid";

  // Format based on metric type
  switch (metricType) {
    case "weight":
      return `${(numValue / 1000).toFixed(2)} kg`; // Convert grams to kg
    case "height":
      return `${(numValue / 10).toFixed(1)} cm`; // Convert mm to cm
    case "headCirc":
      return `${(numValue / 10).toFixed(1)} cm`; // Convert mm to cm
    default:
      return numValue.toString();
  }
};

// Get growth status text based on percentage
export const getGrowthStatusText = (percentage) => {
  if (percentage < 50) return "Below Target";
  if (percentage < 80) return "Approaching Target";
  if (percentage <= 100) return "On Target";
  return "Exceeding Target";
};
