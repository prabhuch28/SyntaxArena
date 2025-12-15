import React from 'react';
import { GameMode } from '../types';
import { Sword, BookOpen, Settings, User, BarChart2, LayoutDashboard, Share2, FileText, GraduationCap, Terminal, BrainCircuit, Briefcase, Code } from 'lucide-react';

interface NavbarProps {
  currentMode: GameMode;
  setMode: (mode: GameMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: GameMode.HOME, icon: <Terminal size={24} />, label: "Home" },
    { mode: GameMode.DASHBOARD, icon: <LayoutDashboard size={24} />, label: "Dashboard" },
    { mode: GameMode.PRACTICE, icon: <Code size={24} />, label: "Practice" },
    { mode: GameMode.BATTLE, icon: <Sword size={24} />, label: "Arena" },
    { mode: GameMode.APTITUDE, icon: <BrainCircuit size={24} />, label: "Aptitude" },
    { mode: GameMode.JOBS, icon: <Briefcase size={24} />, label: "Jobs" },
    { mode: GameMode.VISUALIZER, icon: <BookOpen size={24} />, label: "Visualizer" },
    { mode: GameMode.PLAYGROUND, icon: <Share2 size={24} />, label: "Playground" },
    { mode: GameMode.TUTORIALS, icon: <GraduationCap size={24} />, label: "Tutorials" },
    { mode: GameMode.DOCS, icon: <FileText size={24} />, label: "Docs" },
    { mode: GameMode.LEADERBOARD, icon: <BarChart2 size={24} />, label: "Leaderboard" },
  ];

  return (
    <nav className="w-full h-16 bg-[#0f0f10] border-t border-[#1e1e1e] shrink-0 flex flex-row justify-between items-center md:h-full md:w-20 md:flex-col md:justify-between md:border-t-0 md:border-r md:bg-[#0f0f10] z-50">
      
      {/* Top Section / Logo (Desktop) */}
      <div className="hidden md:flex flex-col items-center pt-6 pb-4">
           {/* Logo */}
           <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg cursor-pointer hover:scale-110 transition-transform" onClick={() => setMode(GameMode.HOME)}>
                <defs>
                    <linearGradient id="nav_logo_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <path d="M50 10L89 32.5V77.5L50 100L11 77.5V32.5L50 10Z" stroke="url(#nav_logo_grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M35 48L22 58L35 68" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M65 48L78 58L65 68" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
      </div>
      
      {/* Navigation Items */}
      <div className="flex flex-row justify-around w-full md:flex-col md:w-full md:gap-2 overflow-x-auto md:overflow-visible no-scrollbar h-full md:h-auto items-center md:items-stretch">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            title={item.label}
            className={`group relative flex items-center justify-center p-3 md:py-4 w-full md:w-auto transition-all ${
              currentMode === item.mode 
                ? 'text-white' 
                : 'text-[#555] hover:text-white hover:bg-white/5'
            }`}
          >
            {/* Active Indicator */}
            {currentMode === item.mode && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyber-blue md:h-full md:w-1 md:right-auto md:left-0 shadow-[0_0_10px_#3b82f6]" />
            )}
            
            <div className={`transition-transform duration-200 flex items-center justify-center ${currentMode === item.mode ? 'scale-110 text-cyber-blue' : ''}`}>
               {item.icon}
            </div>
            
            {/* Tooltip for Desktop */}
            <div className="absolute left-full ml-4 px-2 py-1 bg-black border border-[#333] rounded text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity hidden md:block whitespace-nowrap z-50">
                {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Section (Desktop only) */}
      <div className="hidden md:flex flex-col items-center pb-6 gap-2 w-full">
         <button 
            onClick={() => setMode(GameMode.PROFILE)}
            className={`text-[#555] hover:text-white p-3 hover:bg-white/5 w-full flex justify-center transition-colors ${currentMode === GameMode.PROFILE ? 'text-cyber-blue' : ''}`}
            title="Profile"
         >
            <User size={24} />
         </button>
         <button className="text-[#555] hover:text-white p-3 hover:bg-white/5 w-full flex justify-center transition-colors" title="Settings">
            <Settings size={24} />
         </button>
      </div>
    </nav>
  );
};