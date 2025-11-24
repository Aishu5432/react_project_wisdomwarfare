// src/utils/helpers.js

// Format accuracy to 1 decimal place
export const formatAccuracy = (accuracy) => {
  if (accuracy === null || accuracy === undefined) return '0.0';
  const numAccuracy = typeof accuracy === 'number' ? accuracy : parseFloat(accuracy || 0);
  return isNaN(numAccuracy) ? '0.0' : numAccuracy.toFixed(1);
};

// Format score with commas
export const formatScore = (score) => {
  if (score === null || score === undefined) return '0';
  const numScore = typeof score === 'number' ? score : parseInt(score || 0);
  return isNaN(numScore) ? '0' : numScore.toLocaleString();
};

// Format percentage
export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0.0%';
  const percentage = (value / total) * 100;
  return formatAccuracy(percentage) + '%';
};