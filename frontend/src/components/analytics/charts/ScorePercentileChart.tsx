import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar } from 'recharts';
import { scorePercentileData } from '../mockData';

const ScorePercentileChart: React.FC = () => {
    // Transforming the data slightly so Recharts ErrorBar can render the whiskers
    // We treat the "median" as the bar height, but we hide the bar.
    // ErrorBar expects [low, high] relative to the data value or absolute.
    const transformedData = scorePercentileData.map(d => ({
        ...d,
        errorY: [d.median - d.min, d.max - d.median]
    }));

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            <h3 className="text-sm font-bold text-slate-700 mb-4 px-2">11. Score Percentile</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={transformedData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any, name: any, props: any) => {
                                if (name === 'median') {
                                    const { min, q1, median, q3, max } = props.payload;
                                    return [
                                        `Min: ${min}, Q1: ${q1}, Median: ${median}, Q3: ${q3}, Max: ${max}`,
                                        'Stats'
                                    ];
                                }
                                return [value, name];
                            }}
                        />
                        <Bar dataKey="median" fill="#818cf8" barSize={40} opacity={0.5}>
                            <ErrorBar dataKey="errorY" width={20} strokeWidth={2} stroke="#4f46e5" />
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ScorePercentileChart;
