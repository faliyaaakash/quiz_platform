import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { performanceHeatmapData } from '../mockData';

const PerformanceHeatmapChart: React.FC = () => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px] lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-700 mb-2 px-2">10. Performance Heatmap</h3>
            <div className="flex items-center gap-4 px-2 mb-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Correct</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-rose-500"></div> Incorrect</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-slate-300"></div> Skipped</span>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="category" dataKey="x" name="Question" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis type="category" dataKey="y" name="Student" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any, name: any) => {
                                if (name === 'Status') {
                                    return [value === 1 ? 'Correct' : value === 0 ? 'Incorrect' : 'Skipped', 'Status'];
                                }
                                return [value, name];
                            }}
                        />
                        <Scatter name="Status" data={performanceHeatmapData} shape="square" animationDuration={1000}>
                            {performanceHeatmapData.map((entry, index) => {
                                let color = entry.z === 1 ? '#10b981' : entry.z === 0 ? '#f43f5e' : '#cbd5e1';
                                return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PerformanceHeatmapChart;
