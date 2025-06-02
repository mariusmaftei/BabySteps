export const WHO_STANDARDS = {
  boys: [
    { age: 0, weight: 3.3, height: 49.9, headCirc: 34.5 },
    { age: 1, weight: 4.5, height: 54.7, headCirc: 37.1 },
    { age: 2, weight: 5.6, height: 58.4, headCirc: 39.1 },
    { age: 3, weight: 6.4, height: 61.4, headCirc: 40.5 },
    { age: 4, weight: 7.0, height: 63.9, headCirc: 41.7 },
    { age: 5, weight: 7.5, height: 65.9, headCirc: 42.5 },
    { age: 6, weight: 7.9, height: 67.6, headCirc: 43.2 },
    { age: 7, weight: 8.3, height: 69.2, headCirc: 43.8 },
    { age: 8, weight: 8.6, height: 70.6, headCirc: 44.3 },
    { age: 9, weight: 8.9, height: 72.0, headCirc: 44.7 },
    { age: 10, weight: 9.2, height: 73.3, headCirc: 45.2 },
    { age: 11, weight: 9.4, height: 74.5, headCirc: 45.6 },
    { age: 12, weight: 9.6, height: 75.7, headCirc: 46.0 },
  ],
  girls: [
    { age: 0, weight: 3.2, height: 49.1, headCirc: 33.9 },
    { age: 1, weight: 4.2, height: 53.7, headCirc: 36.0 },
    { age: 2, weight: 5.1, height: 57.1, headCirc: 37.9 },
    { age: 3, weight: 5.8, height: 59.8, headCirc: 39.3 },
    { age: 4, weight: 6.4, height: 62.1, headCirc: 40.5 },
    { age: 5, weight: 6.9, height: 64.0, headCirc: 41.3 },
    { age: 6, weight: 7.3, height: 65.7, headCirc: 42.0 },
    { age: 7, weight: 7.6, height: 67.3, headCirc: 42.6 },
    { age: 8, weight: 7.9, height: 68.7, headCirc: 43.1 },
    { age: 9, weight: 8.2, height: 70.1, headCirc: 43.6 },
    { age: 10, weight: 8.5, height: 71.5, headCirc: 44.0 },
    { age: 11, weight: 8.7, height: 72.8, headCirc: 44.4 },
    { age: 12, weight: 8.9, height: 74.0, headCirc: 44.8 },
  ],
};

export const MAX_VALUES = {
  weight: 10000,
  height: 80,
  headCirc: 48,
};

export const mmToCm = (mm) => {
  if (!mm && mm !== 0) return 0;
  return Math.round(mm / 10);
};

export const calculateHeightProgressFromWHO = (height, ageInMonths, gender) => {
  const cappedAge = Math.min(ageInMonths, 12);

  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  const heightInCm = height > 100 ? mmToCm(height) : height;

  const percentage = Math.round((heightInCm / closestStandard.height) * 100);

  return Math.min(Math.max(percentage, 0), 100);
};

export const calculateWeightProgressFromWHO = (weight, ageInMonths, gender) => {
  const cappedAge = Math.min(ageInMonths, 12);

  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  const weightInKg = weight / 1000;

  const percentage = Math.round((weightInKg / closestStandard.weight) * 100);

  return Math.min(Math.max(percentage, 0), 100);
};

export const calculateHeadCircProgressFromWHO = (
  headCirc,
  ageInMonths,
  gender
) => {
  const cappedAge = Math.min(ageInMonths, 12);

  const standards =
    gender === "female" ? WHO_STANDARDS.girls : WHO_STANDARDS.boys;

  const closestStandard = standards.reduce((prev, curr) => {
    return Math.abs(curr.age - cappedAge) < Math.abs(prev.age - cappedAge)
      ? curr
      : prev;
  });

  const headCircInCm = headCirc > 100 ? mmToCm(headCirc) : headCirc;

  const percentage = Math.round(
    (headCircInCm / closestStandard.headCirc) * 100
  );

  return Math.min(Math.max(percentage, 0), 100);
};

export const calculateGrowthProgress = (
  birthValue,
  currentValue,
  targetValue,
  measurementType
) => {
  if (birthValue === null || birthValue === undefined) return 0;
  if (currentValue === null || currentValue === undefined) return 0;
  if (targetValue === null || targetValue === undefined) return 0;

  const maxValue =
    MAX_VALUES[measurementType] ||
    (measurementType === "weight"
      ? MAX_VALUES.weight
      : measurementType === "height"
      ? MAX_VALUES.height
      : MAX_VALUES.headCirc);

  let birth = birthValue;
  let current = currentValue;
  let target = targetValue;

  if (measurementType === "height" || measurementType === "headCirc") {
    if (birth > 100) birth = mmToCm(birth);
    if (current > 100) current = mmToCm(current);
    if (target > 100) target = mmToCm(target);
  }

  const totalValue = current;

  const totalTarget = Math.min(birth + target, maxValue);

  if (totalValue >= totalTarget) return 100;

  if (totalValue >= maxValue) return 100;

  const totalGrowthNeeded = totalTarget - birth;

  const actualGrowth = totalValue - birth;

  const percentage = Math.min(
    Math.round((actualGrowth / totalGrowthNeeded) * 100),
    100
  );

  return Math.max(percentage, 0);
};

export const formatGrowthValueOld = (value, measurementType) => {
  if (value === null || value === undefined) return "0";

  if (measurementType === "weight") {
    return `${Math.round(value)}g`;
  } else if (measurementType === "height" || measurementType === "headCirc") {
    if (value > 100) {
      return `${mmToCm(value)}cm`;
    }
    return `${Math.round(value)}cm`;
  }

  return `${Math.round(value)}`;
};

export const getProgressColor = (progress, theme) => {
  if (!theme) {
    if (progress >= 85) {
      return "#4CD964";
    } else if (progress >= 50) {
      return "#007AFF";
    } else {
      return "#FF9500";
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

export const getWHOStandards = (ageInMonths, gender) => {
  const cappedAge = Math.min(ageInMonths, 12);

  const genderStandards = WHO_STANDARDS[gender === "female" ? "girls" : "boys"];

  const exactMatch = genderStandards.find(
    (standard) => standard.age === cappedAge
  );
  if (exactMatch) return exactMatch;

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

  return lowerStandard || upperStandard || genderStandards[0];
};

export const calculateExpectedMonthlyGrowth = (ageInMonths, gender) => {
  const currentStandard = getWHOStandards(ageInMonths, gender);
  const previousStandard = getWHOStandards(
    Math.max(0, ageInMonths - 1),
    gender
  );

  return {
    weight: Math.round(
      (currentStandard.weight - previousStandard.weight) * 1000
    ),
    height: Math.round((currentStandard.height - previousStandard.height) * 10),
    headCirc: Math.round(
      (currentStandard.headCirc - previousStandard.headCirc) * 10
    ),
  };
};

export const calculateMonthlyGrowthProgress = (
  startValue,
  currentValue,
  targetValue,
  metricType
) => {
  const start = Number.parseFloat(startValue) || 0;
  const current = Number.parseFloat(currentValue) || 0;
  const target = Number.parseFloat(targetValue) || 1;

  const actualGrowth = current - start;

  const percentage = Math.round((actualGrowth / target) * 100);

  return Math.min(Math.max(percentage, 0), 100);
};

export const getGrowthRecommendations = (ageInMonths, gender) => {
  const whoStandard = getWHOStandards(ageInMonths, gender);

  const expectedMonthlyGrowth = calculateExpectedMonthlyGrowth(
    ageInMonths,
    gender
  );

  const weeklyGrowthFactor = 1 / 4.3;
  const expectedWeeklyGrowth = {
    weight: Math.round(expectedMonthlyGrowth.weight * weeklyGrowthFactor),
    height: Math.round(expectedMonthlyGrowth.height * weeklyGrowthFactor),
    headCirc: Math.round(expectedMonthlyGrowth.headCirc * weeklyGrowthFactor),
  };

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

  const expectedRange = {
    weight: {
      min: Math.round(whoStandard.weight * 0.9 * 10) / 10,
      max: Math.round(whoStandard.weight * 1.1 * 10) / 10,
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

    targetWeightPerMonth: expectedMonthlyGrowth.weight,
    targetHeightPerMonth: expectedMonthlyGrowth.height,
    targetHeadCircPerMonth: expectedMonthlyGrowth.headCirc,
  };
};

export const formatGrowthValue = (value, metricType) => {
  if (value === null || value === undefined) return "Not recorded";

  const numValue = Number.parseFloat(value);
  if (isNaN(numValue)) return "Invalid";

  switch (metricType) {
    case "weight":
      return `${(numValue / 1000).toFixed(2)} kg`;
    case "height":
      return `${(numValue / 10).toFixed(1)} cm`;
    case "headCirc":
      return `${(numValue / 10).toFixed(1)} cm`;
    default:
      return numValue.toString();
  }
};

export const getGrowthStatusText = (percentage) => {
  if (percentage < 50) return "Below Target";
  if (percentage < 80) return "Approaching Target";
  if (percentage <= 100) return "On Target";
  return "Exceeding Target";
};
