import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { Stats } from '../types';
import { Award, Zap, TrendingUp, Inbox, SkipForward } from 'lucide-react';

interface Milestone {
  milestoneId: string;
  completed: boolean;
  progress: number;
  target: number;
}

interface Prediction {
  predictedGrowth: number;
  trend: string;
}

interface StatsDashboardProps {
  stats: Stats;
  onStartSession: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, onStartSession }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    fetch('/api/milestones', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMilestones(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/prediction', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPrediction(data))
      .catch(console.error);
  }, []);
  const chartData = stats.activity.map(item => ({
    name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    value: item.count,
    isToday: new Date(item._id).toDateString() === new Date().toDateString()
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="mb-12">
        <p className="font-label text-[10px] font-medium tracking-widest uppercase text-primary mb-2">Performance Dashboard</p>
        <h2 className="font-headline text-4xl font-extrabold tracking-tighter leading-none mb-4">Cleaning<br/>Intelligence</h2>
        <div className="h-1 w-12 editorial-gradient rounded-full"></div>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="col-span-2 bg-surface-container-low rounded-xl p-6 flex flex-col justify-between h-40 relative overflow-hidden">
          <div className="relative z-10">
            <span className="font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">Total Processed</span>
            <div className="font-headline text-5xl font-black text-primary mt-2">{stats.totalProcessed.toLocaleString()}</div>
          </div>
          <div className="absolute -right-4 -bottom-4 text-primary/5">
            <Inbox size={120} />
          </div>
        </div>
        <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between">
          <span className="font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">Deleted</span>
          <div className="font-headline text-3xl font-bold text-primary mt-1">{stats.totalDeleted.toLocaleString()}</div>
        </div>
        <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between">
          <span className="font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">Skipped</span>
          <div className="font-headline text-3xl font-bold text-primary mt-1">{stats.totalSkipped.toLocaleString()}</div>
        </div>
        <div className="bg-surface-container rounded-xl p-5 flex flex-col justify-between">
          <span className="font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant">Efficiency</span>
          <div className="font-headline text-3xl font-bold text-primary mt-1">{stats.efficiency}%</div>
        </div>
      </div>

      <section className="mb-12 bg-surface-container-low rounded-2xl p-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-headline text-xl font-bold">Activity</h3>
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Last 7 Days</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <TrendingUp size={12} /> +12% vs LW
            </span>
          </div>
        </div>
        
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? '#d095ff' : '#262626'} 
                    className={entry.isToday ? 'drop-shadow-[0_0_10px_rgba(208,149,255,0.3)]' : ''}
                  />
                ))}
              </Bar>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#adaaaa', fontSize: 10, fontWeight: 500 }}
                dy={10}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-xl font-bold">Milestones</h3>
          <button className="text-primary text-xs font-bold hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const isSpaceGuardian = milestone.milestoneId === 'space_guardian';
            const isCompleted = milestone.completed;
            const progressPercent = Math.min(100, Math.round((milestone.progress / milestone.target) * 100));
            
            return (
              <div 
                key={milestone.milestoneId} 
                className={`bg-surface-container rounded-xl p-5 flex items-center gap-5 ${!isCompleted ? 'opacity-60' : 'transition-transform hover:scale-[1.02]'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-surface-container-highest border border-outline-variant/10' : 'bg-surface-container-low border border-outline-variant/5'}`}>
                  {isSpaceGuardian ? (
                    <Award className={isCompleted ? 'text-primary fill-primary/20' : 'text-on-surface-variant'} />
                  ) : (
                    <Zap className={isCompleted ? 'text-primary fill-primary/20' : 'text-on-surface-variant'} />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-headline text-sm font-bold ${!isCompleted ? 'text-on-surface-variant' : ''}`}>
                    {isSpaceGuardian ? 'Space Guardian' : 'Inbox Zero Streak'}
                  </h4>
                  <p className="text-on-surface-variant text-xs mt-1">
                    {isSpaceGuardian ? `Cleared ${milestone.target.toLocaleString()} emails total` : `${milestone.target} consecutive days cleared`}
                  </p>
                </div>
                <div className="text-right">
                  {!isSpaceGuardian && !isCompleted && (
                    <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full bg-primary-dim`} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  )}
                  {isCompleted ? (
                    <span className="font-label text-[10px] text-on-surface-variant uppercase">Unlocked</span>
                  ) : !isSpaceGuardian ? (
                    <span className="font-label text-[9px] text-on-surface-variant uppercase mt-1 block">{milestone.progress}/{milestone.target} Days</span>
                  ) : (
                    <span className="font-label text-[10px] text-on-surface-variant uppercase">{progressPercent}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="p-8 rounded-3xl bg-surface-container-high relative overflow-hidden group">
        <div className="absolute inset-0 editorial-gradient opacity-0 group-hover:opacity-10 transition-opacity"></div>
        <h3 className="font-headline text-lg font-bold mb-2">Ready to clear more?</h3>
        <p className="text-on-surface-variant text-sm mb-6">
          Your inbox predicted growth is {prediction ? (
            <span className="text-primary font-bold">
              {prediction.predictedGrowth > 0 ? '+' : ''}{prediction.predictedGrowth} today.
            </span>
          ) : (
            <span className="text-on-surface-variant">calculating...</span>
          )}
        </p>
        <button 
          onClick={onStartSession}
          className="w-full editorial-gradient py-4 rounded-full font-headline font-bold text-on-primary-fixed shadow-xl shadow-primary/20 scale-95 active:scale-90 transition-transform"
        >
          START CLEANING SESSION
        </button>
      </div>
    </div>
  );
};
