import React, { useState } from 'react';
import { MOCK_USER } from '../constants';
import { TodoItem } from '../types';
import { Trophy, Flame, Target, CheckSquare, Plus, Trash2, Book, Code, ArrowUpRight, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';

interface DashboardProps {
  // toggleBlackhole?: () => void; // Removed
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Master REST API concepts', completed: true },
    { id: '2', text: 'Visualize JWT flow', completed: false },
    { id: '3', text: 'Complete DB Indexing tutorial', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodo, completed: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const activityData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 2 },
    { day: 'Thu', count: 12 },
    { day: 'Fri', count: 8 },
    { day: 'Sat', count: 15 },
    { day: 'Sun', count: 5 },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e] overflow-hidden font-mono text-sm">
      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-8">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                            {MOCK_USER.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-[#1e1e1e] rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                            Welcome back, {MOCK_USER.username}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-[#858585]">
                            <span className="bg-[#333] px-2 py-0.5 rounded text-xs text-white border border-[#444]">Lvl 12 Architect</span>
                            <span>•</span>
                            <span className="text-cyber-blue font-bold">{MOCK_USER.xp.toLocaleString()} XP</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="px-4 py-2 bg-[#252526] hover:bg-[#333] border border-[#333] text-white rounded text-xs transition-colors flex-1 md:flex-initial">Edit Profile</button>
                    <button className="px-4 py-2 bg-cyber-blue hover:bg-blue-600 text-white rounded text-xs font-bold transition-colors shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 transform flex-1 md:flex-initial">Resume</button>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#252526] p-6 rounded-xl border border-[#333] flex items-center gap-5 hover:border-[#555] transition-all hover:-translate-y-1 shadow-lg h-full">
                    <div className="p-4 bg-cyber-purple/10 text-cyber-purple rounded-lg flex items-center justify-center h-14 w-14 shrink-0 border border-cyber-purple/20"><Trophy size={24} /></div>
                    <div>
                        <div className="text-[#858585] text-xs uppercase tracking-wider font-bold mb-1">Global Rank</div>
                        <div className="text-2xl font-bold text-white">#42 <span className="text-xs text-green-500 font-normal ml-2">▲ 3</span></div>
                    </div>
                </div>
                <div className="bg-[#252526] p-6 rounded-xl border border-[#333] flex items-center gap-5 hover:border-[#555] transition-all hover:-translate-y-1 shadow-lg h-full">
                    <div className="p-4 bg-cyber-danger/10 text-cyber-danger rounded-lg flex items-center justify-center h-14 w-14 shrink-0 border border-cyber-danger/20"><Flame size={24} /></div>
                    <div>
                        <div className="text-[#858585] text-xs uppercase tracking-wider font-bold mb-1">Daily Streak</div>
                        <div className="text-2xl font-bold text-white">{MOCK_USER.streak} <span className="text-sm text-[#666] font-normal">Days</span></div>
                    </div>
                </div>
                <div className="bg-[#252526] p-6 rounded-xl border border-[#333] flex items-center gap-5 hover:border-[#555] transition-all hover:-translate-y-1 shadow-lg h-full">
                    <div className="p-4 bg-cyber-blue/10 text-cyber-blue rounded-lg flex items-center justify-center h-14 w-14 shrink-0 border border-cyber-blue/20"><Target size={24} /></div>
                    <div>
                        <div className="text-[#858585] text-xs uppercase tracking-wider font-bold mb-1">Tutorials</div>
                        <div className="text-2xl font-bold text-white">{MOCK_USER.tutorialsCompleted.length} <span className="text-sm text-[#666] font-normal">Completed</span></div>
                    </div>
                </div>
              </div>

              {/* Main Content Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* Learning Progress */}
                <div className="bg-[#252526] rounded-xl border border-[#333] flex flex-col overflow-hidden shadow-lg h-full min-h-[320px]">
                    <div className="p-5 border-b border-[#333] flex justify-between items-center bg-[#2d2d2d]">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Book size={18} className="text-cyber-neon" /> Current Path
                        </h2>
                        <button className="text-xs text-cyber-blue hover:text-white flex items-center gap-1 transition-colors">
                            View Curriculum <ArrowUpRight size={12}/>
                        </button>
                    </div>
                    <div className="p-6 space-y-8 flex-1 flex flex-col justify-center">
                        <div className="group cursor-pointer">
                            <div className="flex justify-between text-xs mb-2 text-[#ccc] group-hover:text-white transition-colors">
                                <span className="font-bold">Backend Fundamentals</span>
                                <span>80%</span>
                            </div>
                            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                                <div className="h-full bg-cyber-neon w-[80%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            </div>
                        </div>
                        <div className="group cursor-pointer">
                            <div className="flex justify-between text-xs mb-2 text-[#ccc] group-hover:text-white transition-colors">
                                <span className="font-bold">Database Design</span>
                                <span>33%</span>
                            </div>
                            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                                <div className="h-full bg-cyber-blue w-[33%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            </div>
                        </div>
                        <div className="group cursor-pointer">
                            <div className="flex justify-between text-xs mb-2 text-[#ccc] group-hover:text-white transition-colors">
                                <span className="font-bold">API Security</span>
                                <span>25%</span>
                            </div>
                            <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                                <div className="h-full bg-cyber-danger w-[25%] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Todo List */}
                <div className="bg-[#252526] rounded-xl border border-[#333] flex flex-col overflow-hidden shadow-lg h-full min-h-[320px]">
                    <div className="p-5 border-b border-[#333] flex justify-between items-center bg-[#2d2d2d]">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <CheckSquare size={18} className="text-cyber-blue" /> Priority Tasks
                        </h2>
                        <span className="text-xs text-[#858585]">{todos.filter(t => !t.completed).length} remaining</span>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-2 max-h-[250px] lg:max-h-none">
                        {todos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#333] rounded transition-all group">
                                <button 
                                    onClick={() => toggleTodo(todo.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${todo.completed ? 'bg-cyber-blue border-cyber-blue' : 'border-[#555] hover:border-cyber-blue'}`}
                                >
                                    {todo.completed && <CheckSquare size={14} className="text-white" />}
                                </button>
                                <span className={`flex-1 text-sm ${todo.completed ? 'text-[#555] line-through' : 'text-[#d4d4d4]'}`}>
                                    {todo.text}
                                </span>
                                <button onClick={() => deleteTodo(todo.id)} className="text-[#555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {todos.length === 0 && (
                            <div className="text-center text-[#555] py-8 italic">No tasks. Time to relax?</div>
                        )}
                    </div>
                    <div className="p-4 border-t border-[#333] bg-[#2d2d2d]">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newTodo} 
                                onChange={(e) => setNewTodo(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                                placeholder="Add a new learning goal..."
                                className="flex-1 bg-[#1e1e1e] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-cyber-blue text-xs transition-colors"
                            />
                            <button onClick={handleAddTodo} className="bg-cyber-blue hover:bg-blue-600 text-white p-2 rounded transition-colors shadow-lg flex items-center justify-center">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Chart */}
                <div className="col-span-1 lg:col-span-2 bg-[#252526] rounded-xl border border-[#333] p-6 shadow-lg flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Code size={18} className="text-yellow-500" /> Coding Frequency
                        </h2>
                        <select className="bg-[#1e1e1e] border border-[#333] text-xs text-white p-1 rounded focus:outline-none focus:border-cyber-blue">
                            <option>Last 7 Days</option>
                            <option>Last Month</option>
                        </select>
                    </div>
                    <div className="w-full h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <Tooltip 
                                    cursor={{fill: '#333', opacity: 0.4}} 
                                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500}>
                                    {activityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.count > 10 ? '#10b981' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

              </div>
          </div>
      </div>
    </div>
  );
};