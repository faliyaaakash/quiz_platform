import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface OverallPerformanceChartProps {
    averageScore: number;
}

const OverallPerformanceChart: React.FC<OverallPerformanceChartProps> = ({ averageScore }) => {
    const data = [
        { name: 'Average Score', value: averageScore, color: '#6366f1' },
        { name: 'Remaining', value: 100 - averageScore, color: '#f1f5f9' },
    ];

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            <h3 className="text-sm font-bold text-slate-700 mb-2 px-2">3. Overall Performance</h3>
            <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={1000}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`${value}%`, 'Score']}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-6">
                    <span className="text-3xl font-black text-slate-800">{averageScore}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</span>
                </div>
            </div>
        </div>
    );
};

export default OverallPerformanceChart;
