export const scoreDistributionData = [
    { range: '0-20', students: 5 },
    { range: '20-40', students: 12 },
    { range: '40-60', students: 35 },
    { range: '60-80', students: 58 },
    { range: '80-100', students: 24 },
];

export const questionDifficultyData = [
    { question: 'Q1', correctPercent: 95 },
    { question: 'Q2', correctPercent: 88 },
    { question: 'Q3', correctPercent: 35 }, // Difficult
    { question: 'Q4', correctPercent: 72 },
    { question: 'Q5', correctPercent: 28 }, // Difficult
    { question: 'Q6', correctPercent: 81 },
    { question: 'Q7', correctPercent: 64 },
    { question: 'Q8', correctPercent: 90 },
    { question: 'Q9', correctPercent: 45 },
    { question: 'Q10', correctPercent: 12 }, // Very Difficult
];

export const overallPerformanceData = [
    { name: 'Correct', value: 65, color: '#10b981' },
    { name: 'Incorrect', value: 25, color: '#ef4444' },
    { name: 'Skipped', value: 10, color: '#94a3b8' },
];

export const attemptsOverTimeData = [
    { date: 'Mon', attempts: 12 },
    { date: 'Tue', attempts: 24 },
    { date: 'Wed', attempts: 18 },
    { date: 'Thu', attempts: 45 },
    { date: 'Fri', attempts: 60 },
    { date: 'Sat', attempts: 85 },
    { date: 'Sun', attempts: 42 },
];

export const averageScoreTrendData = [
    { date: 'Mon', score: 65 },
    { date: 'Tue', score: 68 },
    { date: 'Wed', score: 71 },
    { date: 'Thu', score: 69 },
    { date: 'Fri', score: 75 },
    { date: 'Sat', score: 78 },
    { date: 'Sun', score: 76 },
];

export const timeTakenDistributionData = [
    { range: '<5 min', students: 15 },
    { range: '5-10 min', students: 45 },
    { range: '10-15 min', students: 52 },
    { range: '15+ min', students: 22 },
];

export const optionSelectionData = [
    { question: 'Q1', A: 90, B: 5, C: 2, D: 3 },
    { question: 'Q2', A: 10, B: 85, C: 4, D: 1 },
    { question: 'Q3', A: 30, B: 25, C: 35, D: 10 },
    { question: 'Q4', A: 5, B: 15, C: 70, D: 10 },
    { question: 'Q5', A: 40, B: 30, C: 15, D: 15 },
];

export const questionAttemptRateData = [
    { question: 'Q1', attemptRate: 100 },
    { question: 'Q2', attemptRate: 98 },
    { question: 'Q3', attemptRate: 85 },
    { question: 'Q4', attemptRate: 95 },
    { question: 'Q5', attemptRate: 75 },
    { question: 'Q6', attemptRate: 90 },
    { question: 'Q7', attemptRate: 88 },
    { question: 'Q8', attemptRate: 92 },
    { question: 'Q9', attemptRate: 80 },
    { question: 'Q10', attemptRate: 65 },
];

export const scoreVsTimeData = [
    { time: 5, score: 60 },
    { time: 6, score: 45 },
    { time: 8, score: 80 },
    { time: 9, score: 35 },
    { time: 12, score: 95 },
    { time: 14, score: 90 },
    { time: 15, score: 100 },
    { time: 18, score: 75 },
    { time: 20, score: 85 },
    { time: 2, score: 95 }, // Possible cheating
];

// 1 = Correct (Green), 0 = Incorrect (Red), -1 = Skipped (Gray)
export const performanceHeatmapData = [
    { x: 'Q1', y: 'Student 1', z: 1 },
    { x: 'Q2', y: 'Student 1', z: 1 },
    { x: 'Q3', y: 'Student 1', z: 0 },
    { x: 'Q4', y: 'Student 1', z: 1 },

    { x: 'Q1', y: 'Student 2', z: 1 },
    { x: 'Q2', y: 'Student 2', z: 0 },
    { x: 'Q3', y: 'Student 2', z: 0 },
    { x: 'Q4', y: 'Student 2', z: 1 },

    { x: 'Q1', y: 'Student 3', z: 1 },
    { x: 'Q2', y: 'Student 3', z: 1 },
    { x: 'Q3', y: 'Student 3', z: -1 },
    { x: 'Q4', y: 'Student 3', z: 0 },

    { x: 'Q1', y: 'Student 4', z: 0 },
    { x: 'Q2', y: 'Student 4', z: 0 },
    { x: 'Q3', y: 'Student 4', z: -1 },
    { x: 'Q4', y: 'Student 4', z: -1 },
];

export const scorePercentileData = [
    { name: 'Scores', min: 25, q1: 55, median: 72, q3: 85, max: 100 }
];

export const questionAverageTimeData = [
    { question: 'Q1', avgTime: 45 }, // seconds
    { question: 'Q2', avgTime: 60 },
    { question: 'Q3', avgTime: 120 },
    { question: 'Q4', avgTime: 50 },
    { question: 'Q5', avgTime: 180 },
];

export const dailyActivityData = [
    { date: '03-01', attempts: 5 },
    { date: '03-02', attempts: 15 },
    { date: '03-03', attempts: 35 },
    { date: '03-04', attempts: 28 },
    { date: '03-05', attempts: 60 },
    { date: '03-06', attempts: 95 },
    { date: '03-07', attempts: 110 },
];

export const passFailRatioData = [
    { name: 'Passed', value: 85, color: '#6798e7ff' },
    { name: 'Failed', value: 15, color: '#e25757ff' },
];

export const leaderboardData = [
    { name: 'Alex Johnson', score: 100 },
    { name: 'Samantha Lee', score: 98 },
    { name: 'Michael Chen', score: 95 },
    { name: 'Emily Davis', score: 95 },
    { name: 'David Smith', score: 92 },
];
