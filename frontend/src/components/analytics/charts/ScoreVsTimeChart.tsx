import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScoreVsTimeChartProps {
    data: { time: number; score: number; name?: string }[];
}

const ScoreVsTimeChart: React.FC<ScoreVsTimeChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            <h3 className="text-sm font-bold text-slate-700 mb-4 px-2">Score vs Time Taken</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" dataKey="time" name="Time Taken" unit="m" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis type="number" dataKey="score" name="Score" unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Scatter name="Students" data={data} fill="#ec4899" animationDuration={1000} />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ScoreVsTimeChart;
