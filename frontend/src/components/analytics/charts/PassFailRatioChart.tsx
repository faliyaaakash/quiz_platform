import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Response {
    rawScore: number;
    totalMarks: number;
    userName?: string;
}

interface PassFailRatioChartProps {
    passRate: number;
    totalAttempts?: number;
    passingMarks?: number;
    totalMarks?: number;  // from quiz — slider max is capped to this
    responses?: Response[];
}

// Label rendered inside each slice showing the count
const renderCount = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            fontSize={18} fontWeight={800}>
            {value}
        </text>
    );
};

const PassFailRatioChart: React.FC<PassFailRatioChartProps> = ({
    totalAttempts = 0,
    passingMarks = 0,
    totalMarks,           // no default — derived below so slider max matches the quiz exactly
    responses = [],
}) => {
    // Primary: use totalMarks from API. Fallback: read it from response data.
    // This ensures a 2-mark quiz caps the slider at 2, not 100.
    const effectiveTotalMarks =
        totalMarks ||
        (responses.length > 0 ? Math.max(...responses.map(r => r.totalMarks || 0)) : 100);

    const [threshold, setThreshold] = useState(
        passingMarks || Math.ceil(effectiveTotalMarks * 0.4)
    );

    // Dynamically recalculate pass/fail whenever the threshold slider changes
    const { passed, failed } = useMemo(() => {
        if (responses.length > 0) {
            const passed = responses.filter(r => r.rawScore >= threshold).length;
            return { passed, failed: responses.length - passed };
        }
        // Fallback if no response data
        const passed = Math.round(totalAttempts * (passingMarks / effectiveTotalMarks));
        return { passed, failed: totalAttempts - passed };
    }, [threshold, responses, totalAttempts, passingMarks, totalMarks]);

    const total = passed + failed;

    const data = [
        { name: 'Passed', value: passed, color: '#10b981' },
        { name: 'Failed', value: failed, color: '#ef4444' },
    ];

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-bold text-slate-700">Pass vs Fail</h3>
                <span className="text-xs text-slate-400">{total} students</span>
            </div>

            {/* Threshold slider */}
            <div className="px-1 mb-2">
                <div className="flex items-center justify-between mb-0.5">
                    <label className="text-xs text-slate-500 font-medium">
                        Passing marks threshold
                    </label>
                    <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        {threshold} / {effectiveTotalMarks}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={effectiveTotalMarks}
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-violet-600 cursor-pointer"
                />
            </div>

            {/* Pie chart */}
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={total > 0 ? data : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
                            cx="50%"
                            cy="50%"
                            outerRadius={68}
                            dataKey="value"
                            labelLine={false}
                            label={total > 0 ? renderCount : undefined}
                            animationDuration={600}
                        >
                            {(total > 0 ? data : [{ name: 'No data', value: 1, color: '#e2e8f0' }]).map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any, name: any) => [`${value} student${value !== 1 ? 's' : ''}`, name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend with counts */}
            <div className="flex justify-center gap-6 pt-1">
                {data.map(d => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {d.name}: <strong>{d.value}</strong>
                    </span>
                ))}
            </div>
        </div>
    );
};

export default PassFailRatioChart;
