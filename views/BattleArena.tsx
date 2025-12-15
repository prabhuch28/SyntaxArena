import React, { useState, useEffect, useRef } from 'react';
import { Play, Send, AlertTriangle, Flag, CheckCircle2, ChevronDown, ChevronUp, List, Terminal as TerminalIcon, FileText, Lightbulb, XCircle, Search, Cpu, Wifi, Zap, Timer, MessageSquare, Code2, ChevronRight, User, RefreshCw, Target, Clock, BarChart2, Layers } from 'lucide-react';
import { Problem, BattleState, ChatMessage, GameMode } from '../types';
import { SAMPLE_PROBLEMS, MOCK_USER } from '../constants';
import { CodeEditor } from '../components/CodeEditor';
import { generateProblemVariant, getInvigilatorHint } from '../services/geminiService';

interface BattleArenaProps {
  mode?: GameMode;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ mode = GameMode.BATTLE }) => {
  const [matchState, setMatchState] = useState<'SEARCHING' | 'FOUND' | 'BATTLE'>('SEARCHING');
  const [problem, setProblem] = useState<Problem>(SAMPLE_PROBLEMS[0]);
  const [code, setCode] = useState(`function solve(nums, target) {
  // Write your code here
  
}`);
  const [isLoading, setIsLoading] = useState(false);
  const [currentXp, setCurrentXp] = useState(MOCK_USER.xp);
  
  // Tabs State
  const [activeLeftTab, setActiveLeftTab] = useState<'DESCRIPTION' | 'SUBMISSIONS'>('DESCRIPTION');
  const [activeBottomTab, setActiveBottomTab] = useState<'CONSOLE' | 'TESTS'>('CONSOLE');
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [testResults, setTestResults] = useState<{ id: number; input: string; expected: string; actual: string; passed: boolean }[]>([]);

  // Hint Menu State
  const [showHintMenu, setShowHintMenu] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; type: 'SYNTAX' | 'LOGIC' | 'OPTIMIZATION' | 'EXPLANATION'; cost: number } | null>(null);

  // Practice State
  const [practiceDifficulty, setPracticeDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [practiceStats, setPracticeStats] = useState({ solved: 0, attempts: 0 });

  // Battle State
  const [battle, setBattle] = useState<BattleState>({
    isActive: false,
    timeLeft: 900, // 15 mins
    myProgress: 0,
    opponentProgress: 0,
    opponentName: "CyberGhost_99"
  });

  // Chat/Invigilator State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Practice or Matchmaking Sequence
  useEffect(() => {
    if (mode === GameMode.PRACTICE) {
        // Skip matchmaking for Practice mode
        setMatchState('BATTLE');
        loadPracticeProblem(practiceDifficulty);
        return;
    }

    // Normal Battle/Assessment Matchmaking
    if (matchState === 'SEARCHING') {
        const timer = setTimeout(() => {
            setMatchState('FOUND');
        }, 3000);
        return () => clearTimeout(timer);
    }
    if (matchState === 'FOUND') {
        const timer = setTimeout(() => {
            setMatchState('BATTLE');
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [matchState, mode]);

  // Load a problem for practice based on difficulty
  const loadPracticeProblem = async (difficulty: 'Easy' | 'Medium' | 'Hard') => {
      setIsLoading(true);
      const available = SAMPLE_PROBLEMS.filter(p => p.difficulty === difficulty);
      const selected = available.length > 0 ? available[0] : SAMPLE_PROBLEMS[0];
      
      // Reset state for new problem
      setProblem(selected);
      setCode(`function solve(input) {\n  // Write your ${difficulty} solution here\n  \n}`);
      setTestResults([]);
      setMessages([{ role: 'model', text: `>> PRACTICE MODE INITIALIZED.\n>> DIFFICULTY: ${difficulty.toUpperCase()}` }]);
      
      // Add a slight delay for "loading" effect
      setTimeout(() => setIsLoading(false), 500);
  };

  // Initialize Battle when entering BATTLE state
  useEffect(() => {
    if (matchState !== 'BATTLE' || mode === GameMode.PRACTICE) return;

    const initBattle = async () => {
      setIsLoading(true);
      const variantDesc = await generateProblemVariant(problem);
      setProblem(prev => ({ ...prev, generatedStory: variantDesc }));
      setBattle(prev => ({ ...prev, isActive: true, opponentProgress: 0 }));
      setMessages([{ role: 'model', text: 'System Initialized. Invigilator AI active.' }]);
      setIsLoading(false);
    };
    initBattle();
  }, [matchState, problem.id, mode]); 

  // Simulate Opponent & Timer
  useEffect(() => {
    if (!battle.isActive && mode !== GameMode.PRACTICE) return;

    const interval = setInterval(() => {
      setBattle(prev => {
        let newOppProgress = prev.opponentProgress;
        
        if (mode === GameMode.BATTLE) {
            const oppChance = Math.random();
            newOppProgress = prev.opponentProgress < 100 && oppChance > 0.7 
            ? prev.opponentProgress + 5 
            : prev.opponentProgress;
        }

        return {
          ...prev,
          timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 0,
          opponentProgress: newOppProgress
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [battle.isActive, mode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (isConsoleOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeBottomTab, isConsoleOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsgText = inputMessage;
    const newUserMsg: ChatMessage = { role: 'user', text: userMsgText };
    
    // Update local state and input immediately
    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage("");

    // Create a history snapshot that includes the new message for the API call
    const currentHistory = [...messages, newUserMsg];

    // Call Invigilator (General Hint)
    const response = await getInvigilatorHint(currentHistory, problem.generatedStory || problem.baseDescription, code, 'GENERAL');
    setMessages(prev => [...prev, { role: 'model', text: response }]);
  };

  const handleBuyHint = (type: 'SYNTAX' | 'LOGIC' | 'OPTIMIZATION' | 'EXPLANATION', cost: number) => {
    if (currentXp < cost) {
      setMessages(prev => [...prev, { role: 'model', text: `[SYSTEM] Insufficient XP. Required: ${cost} XP.` }]);
      setShowHintMenu(false);
      return;
    }
    setConfirmModal({ show: true, type, cost });
    setShowHintMenu(false);
  };

  const onConfirmPurchase = async () => {
    if (!confirmModal) return;
    const { type, cost } = confirmModal;

    setConfirmModal(null);
    setCurrentXp(prev => prev - cost);
    
    const systemMsg: ChatMessage = { role: 'user', text: `>> PURCHASE_HINT --type=${type} --cost=${cost}` };
    const processingMsg: ChatMessage = { role: 'model', text: 'Processing transaction... Analyzing code context...' };

    setMessages(prev => [...prev, systemMsg, processingMsg]);
    
    // Create history snapshot including these new messages
    const currentHistory = [...messages, systemMsg, processingMsg];
    
    const response = await getInvigilatorHint(currentHistory, problem.generatedStory || problem.baseDescription, code, type);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
  };

  const handleSurrender = () => {
    if (confirm("End session?")) {
      setBattle(prev => ({ ...prev, isActive: false }));
      setMessages(prev => [...prev, { role: 'model', text: "Session ended. Solution key decrypted." }]);
      setCode("// Solution revealed: \n function solve() { return 'Optimized Result'; }");
    }
  };

  const handleSubmit = () => {
    // Simulate submission
    const success = Math.random() > 0.3; // 70% success chance for demo
    
    // Generate mock test results
    const newResults = [
        { id: 1, input: "nums = [2,7,11,15], target = 9", expected: "[0,1]", actual: "[0,1]", passed: true },
        { id: 2, input: "nums = [3,2,4], target = 6", expected: "[1,2]", actual: "[1,2]", passed: true },
        { id: 3, input: "nums = [3,3], target = 6", expected: "[0,1]", actual: success ? "[0,1]" : "[0,0]", passed: success }
    ];
    setTestResults(newResults);
    setActiveBottomTab('TESTS');
    setIsConsoleOpen(true); // Auto-open console on run

    if (success) {
        if (mode === GameMode.PRACTICE) {
            setPracticeStats(prev => ({ ...prev, solved: prev.solved + 1, attempts: prev.attempts + 1 }));
            setMessages(prev => [...prev, { role: 'model', text: ">> EXCELLENT. Problem solved. Ready for next challenge." }]);
        } else {
            setBattle(prev => ({ ...prev, myProgress: 100, isActive: false }));
            setMessages(prev => [...prev, { role: 'model', text: ">> EXECUTION SUCCESS. All test cases passed." }]);
        }
    } else {
        if (mode === GameMode.PRACTICE) {
             setPracticeStats(prev => ({ ...prev, attempts: prev.attempts + 1 }));
        } else {
             setBattle(prev => ({ ...prev, myProgress: prev.myProgress + 10 }));
        }
        setMessages(prev => [...prev, { role: 'model', text: ">> RUNTIME ERROR: Test case #3 failed logic check." }]);
    }
  };

  const toggleConsole = () => {
      setIsConsoleOpen(!isConsoleOpen);
  };

  const selectConsoleTab = (tab: 'CONSOLE' | 'TESTS') => {
      setActiveBottomTab(tab);
      if (!isConsoleOpen) setIsConsoleOpen(true);
  };

  // -----------------------------------------------------------
  // RENDER: MATCHMAKING OVERLAY (Skipped in Practice)
  // -----------------------------------------------------------
  if (matchState === 'SEARCHING') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-cyber-dark text-white font-mono relative overflow-hidden">
            <div className="absolute inset-0 bg-[#0f172a] opacity-50"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                {/* Radar Animation */}
                <div className="relative w-80 h-80 mb-10 flex items-center justify-center">
                    <div className="absolute inset-0 border border-[#333] rounded-full opacity-50"></div>
                    <div className="absolute inset-8 border border-[#333] rounded-full opacity-50"></div>
                    <div className="absolute inset-16 border border-[#333] rounded-full opacity-50"></div>
                    
                    <div className="absolute inset-0 rounded-full border-t-2 border-cyber-blue shadow-[0_0_15px_#3b82f6] animate-[spin_3s_linear_infinite]"></div>
                    <div className="absolute inset-10 rounded-full border-b-2 border-cyber-purple shadow-[0_0_15px_#8b5cf6] animate-[spin_2s_linear_infinite_reverse]"></div>
                    
                    <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse"></div>
                </div>

                <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-2 text-[#858585] text-xs font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-2 text-cyber-blue"><Wifi size={14} className="animate-pulse"/> Node: US-EAST-1</span>
                        <span className="flex items-center gap-2"><Cpu size={14}/> Matching Protocol: RANKED</span>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // -----------------------------------------------------------
  // RENDER: MATCH FOUND / VS SCREEN
  // -----------------------------------------------------------
  if (matchState === 'FOUND') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#050505] text-white font-mono relative overflow-hidden">
            <div className="absolute inset-0 bg-cyber-blue/5 animate-pulse"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-32 animate-fade-in relative z-10">
                {/* You */}
                <div className="flex flex-col items-center gap-6 animate-slide-in-left">
                    <div className="relative">
                        <div className="w-40 h-40 rounded-full border-4 border-cyber-blue bg-[#1e1e1e] flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)] z-10 relative overflow-hidden">
                            <span className="text-5xl font-bold text-white z-10">{MOCK_USER.username.slice(0, 2).toUpperCase()}</span>
                            <div className="absolute inset-0 bg-cyber-blue/20"></div>
                        </div>
                        <div className="absolute -inset-4 border border-cyber-blue/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white tracking-wide">{MOCK_USER.username}</h3>
                        <p className="text-cyber-blue font-bold text-sm tracking-wider uppercase">Lvl 12 Architect</p>
                        <div className="mt-2 flex gap-2 justify-center">
                            <span className="px-2 py-0.5 bg-[#1e1e1e] border border-[#333] text-[10px] text-[#888] rounded">Elo {MOCK_USER.logicRating}</span>
                        </div>
                    </div>
                </div>

                {/* VS Badge */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative">
                        <span className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-bounce">VS</span>
                        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-pulse"></div>
                    </div>
                </div>

                {/* Opponent */}
                <div className="flex flex-col items-center gap-6 animate-slide-in-right">
                    <div className="relative">
                         <div className="w-40 h-40 rounded-full border-4 border-cyber-danger bg-[#1e1e1e] flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)] z-10 relative overflow-hidden">
                             <span className="text-5xl font-bold text-white z-10">CG</span>
                             <div className="absolute inset-0 bg-cyber-danger/20"></div>
                        </div>
                         <div className="absolute -inset-4 border border-cyber-danger/30 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-white tracking-wide">{battle.opponentName}</h3>
                        <p className="text-cyber-danger font-bold text-sm tracking-wider uppercase">Lvl 14 Phantom</p>
                        <div className="mt-2 flex gap-2 justify-center">
                            <span className="px-2 py-0.5 bg-[#1e1e1e] border border-[#333] text-[10px] text-[#888] rounded">Elo 1950</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-20 text-center animate-pulse z-10">
                <div className="w-96 h-1 bg-[#222] mt-6 mx-auto rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
            </div>
        </div>
      );
  }

  // -----------------------------------------------------------
  // RENDER: BATTLE ARENA (Main IDE)
  // -----------------------------------------------------------
  return (
    <div className="h-full w-full flex flex-col bg-[#0f0f10] overflow-hidden relative animate-fade-in font-sans">
      
      {/* Top Bar / Header */}
      <div className="h-16 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between px-6 shrink-0 z-20 shadow-md">
          {/* Left: Problem Info */}
          <div className="flex items-center gap-4">
              <div className={`w-2 h-8 rounded-full ${
                  mode === GameMode.PRACTICE ? 'bg-cyber-neon shadow-[0_0_10px_#10b981]' : 
                  problem.difficulty === 'Hard' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-green-500 shadow-[0_0_10px_#10b981]'
              }`}></div>
              <div>
                  <h1 className="font-bold text-white tracking-tight leading-none text-base">{problem.title}</h1>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    mode === GameMode.PRACTICE ? 'text-cyber-neon' :
                    problem.difficulty === 'Hard' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {mode === GameMode.PRACTICE ? 'Practice Mode' : problem.difficulty}
                  </span>
              </div>
          </div>

          {/* Center: Timer */}
          <div className={`flex items-center gap-3 bg-[#111] px-4 py-2 rounded-lg border border-[#333] shadow-inner ${battle.timeLeft < 60 && mode !== GameMode.PRACTICE ? 'border-red-900/50 bg-red-900/10' : ''}`}>
              <Timer size={16} className={battle.timeLeft < 60 && mode !== GameMode.PRACTICE ? 'text-red-500 animate-pulse' : 'text-[#858585]'} />
              <span className={`font-mono text-xl font-bold tracking-widest ${battle.timeLeft < 60 && mode !== GameMode.PRACTICE ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(battle.timeLeft / 60).toString().padStart(2, '0')}:{String(battle.timeLeft % 60).padStart(2, '0')}
              </span>
          </div>
          
          {/* Right: Actions & Stats */}
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-2 rounded border border-[#333] mr-2">
                 <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                 <span className="font-mono text-sm text-white font-bold">{currentXp}</span>
                 <span className="text-[10px] text-[#666] font-bold">XP</span>
              </div>

              {/* Hint Dropdown */}
              <div className="relative">
                <button 
                    onClick={() => setShowHintMenu(!showHintMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold transition-all border ${
                        showHintMenu ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : 'bg-[#27272a] hover:bg-[#333] text-[#a1a1aa] border-[#3f3f46]'
                    }`}
                >
                    <Lightbulb size={14} className={showHintMenu ? "fill-yellow-500" : ""} /> Hint
                </button>
                {showHintMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowHintMenu(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl z-50 flex flex-col p-1 animate-scale-in origin-top-right">
                            <div className="px-3 py-2 text-[10px] text-[#666] uppercase font-bold tracking-wider border-b border-[#333] mb-1 flex justify-between">
                                <span>AI Assistance</span>
                                <span>Balance: {currentXp} XP</span>
                            </div>
                            {[
                                { id: 'EXPLANATION', label: 'Explain Problem', desc: 'Clarify requirements', cost: 30, color: 'text-blue-400' },
                                { id: 'SYNTAX', label: 'Syntax Check', desc: 'Find typos & errors', cost: 50, color: 'text-cyber-blue' },
                                { id: 'LOGIC', label: 'Logic Clue', desc: 'Algorithmic direction', cost: 100, color: 'text-cyber-neon' },
                                { id: 'OPTIMIZATION', label: 'Optimize', desc: 'Improve complexity', cost: 150, color: 'text-cyber-purple' }
                            ].map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleBuyHint(item.id as any, item.cost)}
                                    className="flex items-center justify-between p-3 hover:bg-[#2a2a2a] rounded-lg text-left group transition-colors"
                                >
                                    <div>
                                        <div className={`text-xs font-bold text-white group-hover:${item.color} transition-colors`}>{item.label}</div>
                                        <div className="text-[10px] text-[#666]">{item.desc}</div>
                                    </div>
                                    <div className="text-xs font-mono text-red-400 font-bold bg-red-900/10 px-2 py-1 rounded border border-red-900/20">-{item.cost}</div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
              </div>

              <div className="h-6 w-px bg-[#333] mx-1"></div>

              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded text-xs font-bold transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] hover:scale-105"
            >
                <Play size={14} fill="currentColor" /> Run Code
            </button>
            <button 
                onClick={handleSurrender}
                className="p-2.5 bg-[#27272a] hover:bg-red-900/20 hover:text-red-400 text-[#666] rounded border border-transparent hover:border-red-900/30 transition-colors"
                title="End Session"
            >
                <Flag size={14} />
            </button>
          </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* Left Panel: Problem & Description */}
        <div className="w-full lg:w-[35%] h-[40%] lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-[#27272a] bg-[#18181b] overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-[#27272a] bg-[#18181b] shrink-0">
             <button 
                onClick={() => setActiveLeftTab('DESCRIPTION')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all relative ${activeLeftTab === 'DESCRIPTION' ? 'text-white bg-[#202023]' : 'text-[#666] hover:bg-[#1e1e1e] hover:text-[#999]'}`}
             >
                <FileText size={14} /> Problem
                {activeLeftTab === 'DESCRIPTION' && <div className="absolute top-0 left-0 w-full h-0.5 bg-cyber-blue shadow-[0_0_10px_#3b82f6]"></div>}
             </button>
             <button 
                onClick={() => setActiveLeftTab('SUBMISSIONS')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all relative ${activeLeftTab === 'SUBMISSIONS' ? 'text-white bg-[#202023]' : 'text-[#666] hover:bg-[#1e1e1e] hover:text-[#999]'}`}
             >
                <List size={14} /> Submissions
                {activeLeftTab === 'SUBMISSIONS' && <div className="absolute top-0 left-0 w-full h-0.5 bg-cyber-blue shadow-[0_0_10px_#3b82f6]"></div>}
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
             {activeLeftTab === 'DESCRIPTION' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                    {isLoading ? (
                        <div className="space-y-4 animate-pulse mt-4">
                            <div className="h-6 bg-[#27272a] rounded w-3/4"></div>
                            <div className="h-4 bg-[#27272a] rounded w-full"></div>
                            <div className="h-4 bg-[#27272a] rounded w-full"></div>
                            <div className="h-4 bg-[#27272a] rounded w-5/6"></div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="text-cyber-purple">#</span> Story Mode
                                </h3>
                                <div className="p-5 bg-[#202023] border border-[#333] rounded-lg shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyber-purple"></div>
                                    <p className="text-gray-300 leading-relaxed font-sans text-sm">{problem.generatedStory || problem.baseDescription}</p>
                                </div>
                            </div>
                            
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                <ChevronRight size={14} className="text-cyber-blue"/> Examples
                            </h4>
                            <div className="bg-[#0f0f10] p-4 rounded-lg border border-[#333] font-mono text-xs mb-6 shadow-inner space-y-2">
                                <div>
                                    <span className="text-blue-400 font-bold">Input:</span> <span className="text-gray-400">nums = [2,7,11,15], target = 9</span>
                                </div>
                                <div>
                                    <span className="text-green-400 font-bold">Output:</span> <span className="text-gray-400">[0,1]</span>
                                </div>
                            </div>

                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                <ChevronRight size={14} className="text-cyber-blue"/> Constraints
                            </h4>
                            <ul className="grid grid-cols-1 gap-2">
                                <li className="bg-[#202023] px-3 py-2 rounded border border-[#2e2e31] text-xs text-gray-400 font-mono">2 {'<='} nums.length {'<='} 10^4</li>
                                <li className="bg-[#202023] px-3 py-2 rounded border border-[#2e2e31] text-xs text-gray-400 font-mono">-10^9 {'<='} nums[i] {'<='} 10^9</li>
                            </ul>
                        </>
                    )}
                </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-[#666] space-y-4">
                     <List size={48} className="opacity-20" />
                     <span className="text-sm font-medium">No submission history found.</span>
                 </div>
             )}
          </div>
        </div>

        {/* Center/Right Split */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] h-[60%] lg:h-full relative overflow-hidden">
             
             {/* Editor Region - Grows to fill available space */}
             <div className="flex-1 flex flex-col min-h-0 p-0 border-b border-[#27272a] relative overflow-hidden">
                <CodeEditor code={code} setCode={setCode} preventPaste={true} />
             </div>

             {/* Collapsible Bottom Panel: Terminal & Battle Stats */}
             <div 
                className={`flex flex-col border-t border-[#27272a] bg-[#0f0f10] transition-all duration-300 ease-in-out shrink-0 ${isConsoleOpen ? 'h-[40%] md:h-64' : 'h-10'}`}
             >
                 {/* Console Header / Toggle */}
                 <div 
                    className="flex border-b border-[#27272a] bg-[#18181b] justify-between items-center pr-2 h-10 shrink-0 cursor-pointer hover:bg-[#202023] transition-colors"
                    onClick={toggleConsole}
                 >
                    <div className="flex h-full">
                        <button 
                            onClick={(e) => { e.stopPropagation(); selectConsoleTab('CONSOLE'); }}
                            className={`px-5 h-full text-xs font-bold flex items-center gap-2 transition-colors relative ${activeBottomTab === 'CONSOLE' && isConsoleOpen ? 'text-white bg-[#0f0f10]' : 'text-[#666] hover:text-[#ccc]'}`}
                        >
                            <TerminalIcon size={12} /> Console
                            {activeBottomTab === 'CONSOLE' && isConsoleOpen && <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_8px_#10b981]"></div>}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); selectConsoleTab('TESTS'); }}
                            className={`px-5 h-full text-xs font-bold flex items-center gap-2 transition-colors relative ${activeBottomTab === 'TESTS' && isConsoleOpen ? 'text-white bg-[#0f0f10]' : 'text-[#666] hover:text-[#ccc]'}`}
                        >
                            <CheckCircle2 size={12} /> Test Results
                            {activeBottomTab === 'TESTS' && isConsoleOpen && <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_8px_#10b981]"></div>}
                        </button>
                    </div>
                    <div className="flex items-center gap-3 pr-2">
                        <div className="text-[10px] text-[#444] font-mono flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> LIVE CONNECTION
                        </div>
                        {isConsoleOpen ? <ChevronDown size={14} className="text-[#666]" /> : <ChevronUp size={14} className="text-[#666]" />}
                    </div>
                 </div>

                 {/* Console Body */}
                 <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                     {/* Console / Output Content */}
                     <div className="flex-1 flex flex-col min-w-0 relative">
                         {activeBottomTab === 'CONSOLE' ? (
                             <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs scrollbar-thin scrollbar-thumb-[#333]">
                                     {messages.map((msg, i) => (
                                         <div key={i} className={`flex gap-3 ${msg.role === 'model' ? 'text-green-400' : 'text-blue-400'} animate-fade-in`}>
                                             <span className="select-none opacity-30 text-white w-16 text-right">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                                             <span className="font-bold select-none">{msg.role === 'user' ? '>>' : '$'}</span>
                                             <span className={msg.role === 'model' ? 'text-[#e2e8f0]' : ''}>{msg.text}</span>
                                         </div>
                                     ))}
                                     <div ref={chatEndRef} />
                                 </div>
                                 <div className="p-2 bg-[#18181b] flex gap-2 border-t border-[#27272a] items-center shrink-0">
                                    <span className="text-green-500 font-mono py-1 pl-2 animate-pulse">{'>'}</span>
                                    <input 
                                        type="text" 
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Enter command or ask for help..."
                                        className="flex-1 bg-transparent text-gray-300 text-xs font-mono focus:outline-none placeholder-[#444]"
                                    />
                                    <button onClick={handleSendMessage} className="p-1.5 bg-[#27272a] text-[#888] hover:text-white rounded transition-colors"><Send size={12}/></button>
                                 </div>
                             </>
                         ) : (
                             <div className="flex-1 overflow-y-auto p-4 font-mono text-xs scrollbar-thin scrollbar-thumb-[#333]">
                                {testResults.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-[#444] space-y-2">
                                        <Code2 size={32} className="opacity-20"/>
                                        <span>Execute code to view test output</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {testResults.map((result) => (
                                            <div key={result.id} className={`p-3 rounded border flex flex-col gap-2 ${result.passed ? 'bg-green-900/10 border-green-900/30' : 'bg-red-900/10 border-red-900/30'}`}>
                                                <div className="flex items-center gap-2">
                                                    {result.passed ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                                                    <span className={`font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>Test Case {result.id}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                                                    <div className="bg-[#0f0f10] p-2 rounded border border-[#27272a]">
                                                        <span className="text-[#666] block mb-1">Input</span>
                                                        <span className="text-gray-300">{result.input}</span>
                                                    </div>
                                                    <div className="bg-[#0f0f10] p-2 rounded border border-[#27272a]">
                                                        <span className="text-[#666] block mb-1">Expected</span>
                                                        <span className="text-gray-300">{result.expected}</span>
                                                    </div>
                                                    <div className="bg-[#0f0f10] p-2 rounded border border-[#27272a]">
                                                        <span className="text-[#666] block mb-1">Actual</span>
                                                        <span className={`font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.actual}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                         )}
                     </div>

                     {/* Battle Progress Sidebar - ONLY SHOW IN BATTLE MODE */}
                     {mode === GameMode.BATTLE && (
                         <div className="w-full md:w-72 bg-[#141417] p-4 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-[#27272a] overflow-y-auto">
                             <h4 className="text-[10px] font-bold text-[#666] uppercase flex items-center gap-2 tracking-widest border-b border-[#27272a] pb-2">
                                 <Zap size={10} className="text-yellow-500"/> System Monitor
                             </h4>
                             
                             <div className="space-y-2">
                                 <div className="flex justify-between text-xs items-center">
                                     <span className="font-bold text-cyber-blue flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue shadow-[0_0_5px_#3b82f6]"></div> YOU
                                     </span>
                                     <span className="font-mono text-white">{battle.myProgress}%</span>
                                 </div>
                                 <div className="h-1.5 bg-[#0f0f10] w-full relative overflow-hidden rounded-full border border-[#27272a]">
                                     <div className="absolute inset-y-0 left-0 bg-cyber-blue shadow-[0_0_10px_#3b82f6] transition-all duration-700 ease-out" style={{ width: `${battle.myProgress}%` }}></div>
                                 </div>
                             </div>

                             <div className="space-y-2">
                                 <div className="flex justify-between text-xs items-center">
                                     <span className="font-bold text-cyber-danger flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-cyber-danger shadow-[0_0_5px_#ef4444]"></div> OPPONENT
                                     </span>
                                     <span className="font-mono text-white">{battle.opponentProgress}%</span>
                                 </div>
                                 <div className="h-1.5 bg-[#0f0f10] w-full relative overflow-hidden rounded-full border border-[#27272a]">
                                     <div className="absolute inset-y-0 left-0 bg-cyber-danger shadow-[0_0_10px_#ef4444] transition-all duration-700 ease-out" style={{ width: `${battle.opponentProgress}%` }}></div>
                                 </div>
                             </div>

                             <div className="mt-auto bg-[#1e1e20] p-3 rounded border border-[#27272a] text-[10px] space-y-1">
                                 <div className="flex justify-between text-[#888]">
                                     <span>Latency</span>
                                     <span className="text-green-500">24ms</span>
                                 </div>
                                 <div className="flex justify-between text-[#888]">
                                     <span>Memory</span>
                                     <span className="text-blue-500">42MB</span>
                                 </div>
                             </div>
                         </div>
                     )}
                     
                     {/* Practice Mode Sidebar */}
                     {mode === GameMode.PRACTICE && (
                         <div className="w-full md:w-72 bg-[#141417] p-4 flex flex-col border-t md:border-t-0 md:border-l border-[#27272a] overflow-y-auto">
                             <div className="mb-6">
                                <h4 className="text-[10px] font-bold text-[#666] uppercase flex items-center gap-2 tracking-widest border-b border-[#27272a] pb-2 mb-3">
                                    <User size={10} className="text-cyber-neon"/> Practice Config
                                </h4>
                                
                                <div className="space-y-3">
                                    <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                                        <div className="text-[10px] text-[#888] mb-2 font-bold uppercase">Difficulty Level</div>
                                        <div className="flex gap-1">
                                            {(['Easy', 'Medium', 'Hard'] as const).map(diff => (
                                                <button
                                                    key={diff}
                                                    onClick={() => loadPracticeProblem(diff)}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all border ${
                                                        practiceDifficulty === diff 
                                                        ? 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                                        : 'bg-[#252526] text-[#666] border-transparent hover:bg-[#333]'
                                                    }`}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => loadPracticeProblem(practiceDifficulty)}
                                        className="w-full py-2 bg-[#252526] hover:bg-[#333] border border-[#333] hover:border-cyber-neon text-[#ccc] hover:text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-all shadow-lg"
                                    >
                                        <RefreshCw size={12} /> Load New Problem
                                    </button>
                                </div>
                             </div>

                             <div className="mb-6">
                                <h4 className="text-[10px] font-bold text-[#666] uppercase flex items-center gap-2 tracking-widest border-b border-[#27272a] pb-2 mb-3">
                                    <BarChart2 size={10} className="text-cyber-blue"/> Session Stats
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#1e1e1e] border border-[#333] p-3 rounded text-center hover:border-green-500/30 transition-colors">
                                        <div className="text-2xl font-bold text-white">{practiceStats.solved}</div>
                                        <div className="text-[9px] text-[#666] uppercase font-bold mt-1">Solved</div>
                                    </div>
                                    <div className="bg-[#1e1e1e] border border-[#333] p-3 rounded text-center hover:border-blue-500/30 transition-colors">
                                        <div className="text-2xl font-bold text-white">{practiceStats.attempts}</div>
                                        <div className="text-[9px] text-[#666] uppercase font-bold mt-1">Attempts</div>
                                    </div>
                                </div>
                             </div>

                             <div className="mt-auto">
                                <div className="bg-[#1e1e1e] border border-[#333] rounded p-3">
                                    <div className="flex items-center gap-2 mb-3 text-cyber-neon border-b border-[#333] pb-2">
                                        <Target size={14} />
                                        <span className="text-xs font-bold">Focus Area</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Arrays', 'Hash Map', 'Two Pointers', 'DP'].map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-[#252526] border border-[#333] rounded text-[10px] text-[#888] hover:text-white hover:border-[#555] transition-colors cursor-default">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-[#333] p-0 rounded-xl shadow-2xl max-w-sm w-full relative overflow-hidden transform scale-100 transition-all">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
             
             <div className="p-6">
                 <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="text-yellow-500" size={20} /> 
                    Confirm Purchase
                 </h3>
                 <p className="text-sm text-[#888] mb-6">Are you sure you want to spend XP to reveal this hint?</p>
                 
                 <div className="bg-[#202023] p-4 rounded-lg border border-[#333] mb-6 space-y-3">
                     <div className="flex justify-between items-center">
                         <span className="text-[#888] text-xs uppercase font-bold">Item</span>
                         <span className="text-cyber-blue font-bold text-sm">{confirmModal.type} HINT</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-[#888] text-xs uppercase font-bold">Cost</span>
                         <span className="text-red-400 font-mono font-bold">-{confirmModal.cost} XP</span>
                     </div>
                     <div className="h-px bg-[#333] my-1"></div>
                     <div className="flex justify-between items-center">
                         <span className="text-[#888] text-xs uppercase font-bold">Balance After</span>
                         <span className="text-white font-mono text-xs">{currentXp - confirmModal.cost} XP</span>
                     </div>
                 </div>
                 
                 <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 text-xs font-bold text-[#888] hover:text-white transition-colors hover:bg-[#27272a] rounded-lg"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={onConfirmPurchase}
                      className="px-4 py-2 bg-cyber-blue hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} /> CONFIRM
                    </button>
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};