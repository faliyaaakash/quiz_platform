import React, { lazy, Suspense, memo, useMemo } from 'react';

// Lazy-load every chart → code-split into separate chunks so they don't block initial render
const OverallPerformanceChart    = lazy(() => import('./charts/OverallPerformanceChart'));
const PassFailRatioChart         = lazy(() => import('./charts/PassFailRatioChart'));
const ScoreDistributionChart     = lazy(() => import('./charts/ScoreDistributionChart'));
const QuestionDifficultyChart    = lazy(() => import('./charts/QuestionDifficultyChart'));
const QuestionAttemptRateChart   = lazy(() => import('./charts/QuestionAttemptRateChart'));
const OptionSelectionChart       = lazy(() => import('./charts/OptionSelectionChart'));
const LeaderboardChart           = lazy(() => import('./charts/LeaderboardChart'));
const AttemptsOverTimeChart      = lazy(() => import('./charts/AttemptsOverTimeChart'));
const ScoreVsTimeChart           = lazy(() => import('./charts/ScoreVsTimeChart'));
const TimeTakenDistributionChart = lazy(() => import('./charts/TimeTakenDistributionChart'));
const AverageScoreTrendChart     = lazy(() => import('./charts/AverageScoreTrendChart'));
const DailyActivityChart         = lazy(() => import('./charts/DailyActivityChart'));
const ScorePercentileChart       = lazy(() => import('./charts/ScorePercentileChart'));
const PerformanceHeatmapChart    = lazy(() => import('./charts/PerformanceHeatmapChart'));

// Fixed-height skeleton shown while a chart bundle loads
// CRITICAL: same h-[300px] as charts → prevents CLS (layout shift)
const ChartSkeleton = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[300px] flex items-center justify-center animate-pulse">
        <div className="w-full h-full p-5 flex flex-col gap-3">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="flex-1 bg-slate-50 rounded-xl" />
        </div>
    </div>
);

const ChartSkeleton2 = () => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[300px] md:col-span-2 flex items-center justify-center animate-pulse">
        <div className="w-full h-full p-5 flex flex-col gap-3">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="flex-1 bg-slate-50 rounded-xl" />
        </div>
    </div>
);

interface QuizAnalyticsDashboardProps {
    quizTitle: string;
    data: any;
}

const QuizAnalyticsDashboard: React.FC<QuizAnalyticsDashboardProps> = memo(({ quizTitle, data }) => {

    // Derive scoreVsTime from responses: [{ time: mins, score: % }]
    const scoreVsTimeData = useMemo(() =>
        (data.responses || []).map((r: any) => ({
            time: r.timeTaken || 0,
            score: r.score || 0,
            name: r.userName
        })), [data.responses]);

    // Derive timeTakenDistribution from responses: bucket by 5-min ranges
    const timeTakenDistData = useMemo(() => {
        const buckets: Record<string, number> = {
            '0-5m': 0, '6-10m': 0, '11-20m': 0, '21-30m': 0, '30m+': 0
        };
        (data.responses || []).forEach((r: any) => {
            const t = r.timeTaken || 0;
            if (t <= 5) buckets['0-5m']++;
            else if (t <= 10) buckets['6-10m']++;
            else if (t <= 20) buckets['11-20m']++;
            else if (t <= 30) buckets['21-30m']++;
            else buckets['30m+']++;
        });
        return Object.entries(buckets).map(([range, students]) => ({ range, students }));
    }, [data.responses]);

    // Derive averageScoreTrend from attemptsOverTime + responses: score per date
    const avgScoreTrendData = useMemo(() => {
        const dateScores: Record<string, number[]> = {};
        (data.responses || []).forEach((r: any) => {
            if (r.submittedAt) {
                const date = new Date(r.submittedAt).toLocaleDateString('en-US', { weekday: 'short' });
                if (!dateScores[date]) dateScores[date] = [];
                dateScores[date].push(r.score || 0);
            }
        });
        return Object.entries(dateScores).map(([date, scores]) => ({
            date,
            score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        }));
    }, [data.responses]);

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="mb-2">
                <h3 className="text-xl font-bold text-slate-800">Advanced Analytics Dashboard</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Comprehensive performance insights for <strong>{quizTitle}</strong>.
                </p>
            </div>

            {/* Row 1: Top-level KPI charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <OverallPerformanceChart averageScore={data.averageScore} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <PassFailRatioChart
                        passRate={data.passRate}
                        totalAttempts={data.totalAttempts}
                        passingMarks={data.passingMarks}
                        totalMarks={data.totalMarks}
                        responses={data.responses}
                    />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <ScoreDistributionChart data={data.scoreDistribution} />
                </Suspense>
            </div>

            {/* Row 2: Attempt trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <AttemptsOverTimeChart data={data.attemptsOverTime || []} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <DailyActivityChart data={data.attemptsOverTime || []} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <AverageScoreTrendChart data={avgScoreTrendData} />
                </Suspense>
            </div>

            {/* Row 3: Score analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <ScoreVsTimeChart data={scoreVsTimeData} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <TimeTakenDistributionChart data={timeTakenDistData} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <LeaderboardChart data={data.leaderboard || []} />
                </Suspense>
            </div>

            {/* Row 4: Question-level analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <QuestionDifficultyChart data={data.questionPerformance || []} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <QuestionAttemptRateChart data={data.questionPerformance || []} />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                    <OptionSelectionChart data={data.questionPerformance || []} />
                </Suspense>
            </div>

            {/* Row 5: Advanced charts (wide) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                    <ScorePercentileChart />
                </Suspense>
                <Suspense fallback={<ChartSkeleton2 />}>
                    <PerformanceHeatmapChart />
                </Suspense>
            </div>
        </div>
    );
});

export default QuizAnalyticsDashboard;
