import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AverageScoreTrendChartProps {
    data: { date: string; score: number }[];
}

const AverageScoreTrendChart: React.FC<AverageScoreTrendChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            <h3 className="text-sm font-bold text-slate-700 mb-4 px-2">Average Score Trend</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                            formatter={(value: any) => [`${value}%`, 'Average Score']}
                        />
                        <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={1000} name="Avg Score" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AverageScoreTrendChart;
