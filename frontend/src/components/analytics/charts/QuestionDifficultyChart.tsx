import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface QuestionDifficultyChartProps {

    data: { question: string, correctPercent: number }[];
}

const QuestionDifficultyChart: React.FC<QuestionDifficultyChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-bold text-slate-700">2. Question Difficulty</h3>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">Red = &lt;40% Correct</span>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="question" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`${value}%`, 'Correct']}
                        />
                        <Bar dataKey="correctPercent" radius={[4, 4, 0, 0]} animationDuration={1000}>
                            {
                                data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.correctPercent < 40 ? '#f43f5e' : '#14b8a6'} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


export default QuestionDifficultyChart;
