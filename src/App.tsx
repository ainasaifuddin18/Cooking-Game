import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  ChefHat, 
  Coins, 
  Trash2, 
  Play, 
  Check, 
  ShoppingBag, 
  Trophy, 
  Timer, 
  RefreshCw, 
  Download, 
  BookOpen, 
  Lock, 
  ArrowLeft, 
  Copy, 
  Heart,
  Flame,
  HelpCircle,
  Code2,
  Terminal,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PYTHON_CODE_STRING } from './pythonCode';

// --- CUSTOMER PERSPECTIVES ---
interface Customer {
  name: string;
  avatar: string;
  dialogue: string;
}

const CUSTOMERS: Customer[] = [
  { name: "Chef Gordon", avatar: "👨‍🍳", dialogue: "Cook it fast and pile those layers correctly! I'm inspecting!" },
  { name: "Sassy Cat Oliver", avatar: "🐱", dialogue: "Meow! If my food is late, I am knocking all utensils off the table!" },
  { name: "Hungry Bear Emma", avatar: "🐻", dialogue: "Hello little chef! I'm starving after my long forest walk." },
  { name: "Foxy Sophia", avatar: "🦊", dialogue: "Surprise me with something crunchy! I love quick kitchen action!" },
  { name: "Student Billy", avatar: "👦", dialogue: "Wow, cooking class smells delicious today! Let me try that order." },
  { name: "Gold Medal Lion Leo", avatar: "🦁", dialogue: "I only accept dishes stacked with perfect ingredients. Show me your skill!" }
];

// --- RECIPES DATABASE ---
interface Recipe {
  name: string;
  ingredients: string[];
  emoji: string;
  cost: number;
  unlocked: boolean;
  desc: string;
}

const RECIPES_INIT: Record<string, Recipe> = {
  "Classic Burger": {
    name: "Classic Burger",
    ingredients: ["🍔 Bun", "🥩 Patty", "🧀 Cheese", "🥬 Lettuce"],
    emoji: "🍔",
    cost: 0,
    unlocked: true,
    desc: "A classic stack of bun, beef patty, cheese, and fresh lettuce."
  },
  "Pepperoni Pizza": {
    name: "Pepperoni Pizza",
    ingredients: ["🫓 Dough", "🍅 Sauce", "🧀 Cheese", "🍕 Pepperoni"],
    emoji: "🍕",
    cost: 0,
    unlocked: true,
    desc: "Fresh dough topped with custom tomato sauce, cheese, and pepperoni."
  },
  "Sushi Roll": {
    name: "Sushi Roll",
    ingredients: ["🍙 Seaweed", "🍚 Rice", "🐟 Salmon", "🥒 Cucumber"],
    emoji: "🍣",
    cost: 0,
    unlocked: true,
    desc: "Fresh salmon slices and cucumber rolled in premium rice and seaweed."
  },
  "Supreme Taco": {
    name: "Supreme Taco",
    ingredients: ["🌮 Shell", "🥩 Patty", "🥬 Lettuce", "🍅 Tomato"],
    emoji: "🌮",
    cost: 30,
    unlocked: false,
    desc: "Crispy corn shell packed with savory meat, shredded lettuce, and ripe tomatoes."
  },
  "Cozy Ramen": {
    name: "Cozy Ramen",
    ingredients: ["🍜 Noodles", "🍲 Broth", "🥚 Egg", "🍙 Seaweed"],
    emoji: "🍜",
    cost: 50,
    unlocked: false,
    desc: "Warm, comforting noodle broth topped with seaweed sheet and a soft egg."
  },
  "Pancake Stack": {
    name: "Pancake Stack",
    ingredients: ["🥞 Batter", "🧈 Butter", "🍯 Syrup", "🍓 Strawberry"],
    emoji: "🥞",
    cost: 80,
    unlocked: false,
    desc: "Fluffy golden cakes topped with fresh strawberries, butter, and rich syrup."
  }
};

const ALL_INGREDIENTS = [
  "🍔 Bun", "🥩 Patty", "🧀 Cheese", "🥬 Lettuce",
  "🫓 Dough", "🍅 Sauce", "🍕 Pepperoni", "🌮 Shell",
  "🍙 Seaweed", "🍚 Rice", "🐟 Salmon", "🥒 Cucumber",
  "🍜 Noodles", "🍲 Broth", "🥚 Egg", "🍅 Tomato",
  "🥞 Batter", "🧈 Butter", "🍯 Syrup", "🍓 Strawberry"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'code' | 'guide'>('game');
  
  // Game Setup States
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [recipes, setRecipes] = useState<Record<string, Recipe>>(RECIPES_INIT);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(15); // Start with 15 coins to let them explore shop early
  const [lives, setLives] = useState(3);
  
  // Active Round States & Client Details
  const [currentOrder, setCurrentOrder] = useState<string | null>(null);
  const [currentIngredients, setCurrentIngredients] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [maxTime, setMaxTime] = useState(20);
  const [customer, setCustomer] = useState<Customer>(CUSTOMERS[0]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'fail' | null; message: string }>({ type: null, message: '' });
  const [copied, setCopied] = useState(false);

  // Leaderboard entries
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number, difficulty: string}[]>(() => {
    const saved = localStorage.getItem('cooking_leaderboard');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { name: "MasterChef Gordon", score: 250, difficulty: "Hard" },
      { name: "Chef Auguste", score: 180, difficulty: "Medium" },
      { name: "Junior Cook Leo", score: 100, difficulty: "Easy" },
      { name: "Student Bobby", score: 60, difficulty: "Easy" },
      { name: "Amateur Pip", score: 30, difficulty: "Easy" }
    ];
  });

  const [playerName, setPlayerName] = useState('');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // --- AUDIO / TIMERS IN REACT ---
  const tickRef = useRef<number | null>(null);

  // Countdown clock tick
  useEffect(() => {
    if (gameState !== 'playing') {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    tickRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          handleOrderFailure("Time expired! Your customer left.");
          return maxTime;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [gameState, currentOrder, maxTime]);

  // Handle Order Failure
  const handleOrderFailure = (msg: string) => {
    setLives(prev => {
      const nextLives = prev - 1;
      setFeedback({ type: 'fail', message: `${msg} Lost 1 Heart! ❤️` });
      
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 2500);

      // Trigger next action
      if (nextLives <= 0) {
        setGameState('gameover');
        setHasSavedScore(false);
        setPlayerName('');
      } else {
        triggerNewOrder();
      }
      return nextLives;
    });
  };

  // Start the Cooking game
  const handleStartGame = () => {
    setScore(0);
    setLives(3);
    setCurrentIngredients([]);
    setGameState('playing');
    
    // Set time according to difficulty
    let seconds = 20;
    if (difficulty === 'Easy') seconds = 25;
    else if (difficulty === 'Medium') seconds = 18;
    else if (difficulty === 'Hard') seconds = 12;
    
    setMaxTime(seconds);
    setTimeLeft(seconds);
    
    // Pick first randomized order
    setTimeout(() => {
      triggerNewOrder();
    }, 100);
  };

  // Trigger next customer order
  const triggerNewOrder = () => {
    setCurrentIngredients([]);
    
    // Pick random customer
    const randomCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    setCustomer(randomCustomer);

    // Pick random unlocked recipe
    const unlockedOptions = (Object.values(recipes) as Recipe[]).filter(r => r.unlocked).map(r => r.name);
    const chosen = unlockedOptions[Math.floor(Math.random() * unlockedOptions.length)] || "Classic Burger";
    
    setCurrentOrder(chosen);
    
    let seconds = 20;
    if (difficulty === 'Easy') seconds = 25;
    else if (difficulty === 'Medium') seconds = 18;
    else if (difficulty === 'Hard') seconds = 12;
    
    setMaxTime(seconds);
    setTimeLeft(seconds);
  };

  // Add ingredient onto preparing platter
  const selectIngredient = (ing: string) => {
    if (currentIngredients.length >= 6) {
      // Limit to max 6 layers to keep interface pretty
      return;
    }
    setCurrentIngredients(prev => [...prev, ing]);
  };

  // Serving and verification
  const handleServe = () => {
    if (!currentOrder) return;
    
    const required = recipes[currentOrder].ingredients;
    
    // Verify lengths
    let isCorrect = true;
    if (currentIngredients.length !== required.length) {
      isCorrect = false;
    } else {
      // In python-recipe standard we verify all ingredients are stacked
      for (const ing of required) {
        if (!currentIngredients.includes(ing)) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      // Calculate score and coins
      let multiplier = 1.0;
      if (difficulty === 'Medium') multiplier = 1.5;
      else if (difficulty === 'Hard') multiplier = 2.0;

      let scoreGain = Math.round(10 * multiplier);
      // Fast service reward
      const isSuperFast = timeLeft > (maxTime / 2);
      if (isSuperFast) scoreGain += 5;
      
      const coinsEarned = isSuperFast ? Math.floor(Math.random() * 4) + 6 : Math.floor(Math.random() * 3) + 3;

      setScore(prev => prev + scoreGain);
      setCoins(prev => prev + coinsEarned);

      setFeedback({ 
        type: 'success', 
        message: `Delicious! served ${recipes[currentOrder].emoji} ${currentOrder}! +${scoreGain} Pts, +${coinsEarned} Coins! 🪙` 
      });

      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 2500);

      triggerNewOrder();
    } else {
      handleOrderFailure("Uh oh! Wrong ingredients stack!");
    }
  };

  // Unlock recipe from Coins shop
  const handleUnlockRecipe = (recipeName: string, cost: number) => {
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setRecipes(prev => ({
        ...prev,
        [recipeName]: {
          ...prev[recipeName],
          unlocked: true
        }
      }));
    }
  };

  // Save new High Score
  const handleSaveHighScore = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSavedScore) return;

    const newLeaderboard = [
      ...leaderboard,
      { name: playerName.trim(), score, difficulty }
    ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

    setLeaderboard(newLeaderboard);
    localStorage.setItem('cooking_leaderboard', JSON.stringify(newLeaderboard));
    setHasSavedScore(true);
  };

  const clearLeaderboard = () => {
    if (confirm("Are you sure you want to permanently clear the high score leaderboard records?")) {
      const defaultValue = [
        { name: "MasterChef Gordon", score: 250, difficulty: "Hard" },
        { name: "Chef Auguste", score: 180, difficulty: "Medium" },
        { name: "Junior Cook Leo", score: 100, difficulty: "Easy" }
      ];
      setLeaderboard(defaultValue);
      localStorage.setItem('cooking_leaderboard', JSON.stringify(defaultValue));
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_CODE_STRING);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([PYTHON_CODE_STRING], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = "cooking_game.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Qualifies for Leaderboard check
  const isHighScore = score > 0 && (leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1]?.score);

  return (
    <div className="min-h-screen bg-transparent text-vibrant-text flex flex-col selection:bg-vibrant-yellow selection:text-vibrant-text font-sans">
      
      {/* HEADER BREADCRUMB */}
      <header className="bg-white border-b-4 border-vibrant-text shadow-[0_4px_0_0_#4A3728] sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-vibrant-orange text-white p-2.5 rounded-2xl border-4 border-vibrant-text shadow-[4px_4px_0_0_#4A3728] shrink-0">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-black tracking-tight text-vibrant-text flex flex-wrap items-center gap-2">
                Chef's Cooking Laboratory 
                <span className="text-[11px] bg-vibrant-yellow text-vibrant-text border-2 border-vibrant-text px-2.5 py-0.5 rounded-full font-mono font-black shadow-[1.5px_1.5px_0_0_#4A3728]">
                  Python & React Sandbox
                </span>
              </h1>
              <p className="text-xs font-semibold text-vibrant-text/75 mt-0.5">
                A gorgeous interactive culinary training applet designed for classrooms, students and Python learners.
              </p>
            </div>
          </div>

          {/* APPLICATION DIRECTORY TABS */}
          <div className="flex flex-wrap items-center bg-vibrant-bg p-1.5 rounded-2xl border-[3px] border-vibrant-text shadow-[3px_3px_0_0_#4A3728] gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('game')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-150 ${
                activeTab === 'game' 
                  ? 'bg-vibrant-red text-white border-2 border-vibrant-text shadow-[2px_2px_0_0_#4A3728] translate-y-[-1px]' 
                  : 'text-vibrant-text/80 hover:text-vibrant-text hover:bg-white/40'
              }`}
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Web Simulator</span>
            </button>
            <button
              onClick={() => { setActiveTab('code'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-150 ${
                activeTab === 'code' 
                  ? 'bg-vibrant-blue text-white border-2 border-vibrant-text shadow-[2px_2px_0_0_#4A3728] translate-y-[-1px]' 
                  : 'text-vibrant-text/80 hover:text-vibrant-text hover:bg-white/40'
              }`}
            >
              <Code2 className="w-4 h-4 text-white" />
              <span>Python Code View</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-150 ${
                activeTab === 'guide' 
                  ? 'bg-vibrant-green text-white border-2 border-vibrant-text shadow-[2px_2px_0_0_#4A3728] translate-y-[-1px]' 
                  : 'text-vibrant-text/80 hover:text-vibrant-text hover:bg-white/40'
              }`}
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>Culinary Guide Syllabus</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-8">
        
        {/* TAB 1: WEB IMPLEMENTATION MATCHING THE PYTHON SPEC */}
        {activeTab === 'game' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: WALLET, RECIPES & LEADERBOARD STATS */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* CURRENT WALLET & IN-SESSION SHOP */}
              <div className="bg-white border-[3px] border-vibrant-text rounded-3xl shadow-[5px_5px_0_0_#4A3728] p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-vibrant-yellow/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-vibrant-yellow border-2 border-vibrant-text rounded-xl shadow-[2px_2px_0_0_#4A3728]">
                      <Coins className="w-5 h-5 text-vibrant-text" />
                    </div>
                    <h3 className="font-display font-black text-vibrant-text">Chef's Wallet & Shop</h3>
                  </div>
                  <span className="text-xs bg-vibrant-yellow text-vibrant-text border-2 border-vibrant-text font-mono font-black px-3.5 py-1 rounded-full flex items-center gap-1 shadow-[2px_2px_0_0_#4A3728]">
                    🪙 {coins} Coins
                  </span>
                </div>
                <p className="text-xs font-semibold text-vibrant-text/75 mb-4 leading-relaxed">
                  Spend your hard-earned coins below to unlock exciting, complex culinary recipes! Once unlocked, customers can order them immediately.
                </p>

                <div className="space-y-3">
                  {(Object.values(recipes) as Recipe[]).map(recipe => (
                    <div 
                      key={recipe.name}
                      className={`flex items-center justify-between p-3 rounded-2xl border-2 text-xs transition-colors ${
                        recipe.unlocked 
                          ? 'bg-vibrant-bg/30 border-vibrant-text/40 text-vibrant-text/80' 
                          : 'bg-white border-vibrant-text text-vibrant-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl" role="img" aria-label={recipe.name}>{recipe.emoji}</span>
                        <div>
                          <p className="font-extrabold text-vibrant-text flex items-center gap-1">
                            {recipe.name}
                            {recipe.unlocked && (
                              <span className="text-[9px] bg-vibrant-green text-white border border-vibrant-text px-1.5 py-0.2 rounded font-black shadow-[1px_1px_0_0_#4A3728]">
                                Unlocked
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-vibrant-text/65 font-mono truncate max-w-[150px] md:max-w-xs">
                            {recipe.ingredients.map(i => i.split(' ').slice(1).join('')).join(', ')}
                          </p>
                        </div>
                      </div>

                      {!recipe.unlocked && (
                        <button
                          onClick={() => handleUnlockRecipe(recipe.name, recipe.cost)}
                          disabled={coins < recipe.cost}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all border-2 border-vibrant-text ${
                            coins >= recipe.cost
                              ? 'bg-vibrant-orange hover:bg-vibrant-orange/95 text-white shadow-[2px_2px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none'
                              : 'bg-zinc-150 text-zinc-400 border-zinc-300 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>🪙 {recipe.cost}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* LOCAL LEADERBOARD */}
              <div className="bg-white border-[3px] border-vibrant-text rounded-3xl shadow-[5px_5px_0_0_#4A3728] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-vibrant-yellow border-2 border-vibrant-text rounded-xl shadow-[2px_2px_0_0_#4A3728]">
                      <Trophy className="w-5 h-5 text-vibrant-text" />
                    </div>
                    <h3 className="font-display font-black text-vibrant-text">Hall of Master Chefs</h3>
                  </div>
                  <button 
                    onClick={clearLeaderboard}
                    className="text-xs font-black text-vibrant-red hover:text-vibrant-darkred transition-colors"
                  >
                    Clear Records
                  </button>
                </div>

                <div className="overflow-hidden rounded-2xl border-2 border-vibrant-text shadow-[2.5px_2.5px_0_0_#4A3728]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-vibrant-yellow/30 border-b-2 border-vibrant-text text-vibrant-text font-black">
                      <tr>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider">Rank</th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider">Name</th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider">Score</th>
                        <th className="px-3 py-3 text-[10px] font-black uppercase tracking-wider">Diff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-vibrant-text/20 bg-white">
                      {leaderboard.map((user, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-vibrant-yellow/10 transition-colors ${
                            idx === 0 ? 'bg-vibrant-yellow/5' : ''
                          }`}
                        >
                          <td className="px-3 py-3.5 font-extrabold text-vibrant-text">
                            {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `${idx + 1}th`}
                          </td>
                          <td className="px-3 py-3 font-extrabold text-vibrant-text/90 truncate max-w-[90px]">{user.name}</td>
                          <td className={`px-3 py-3 font-black ${idx === 0 ? 'text-vibrant-orange' : 'text-vibrant-text/80'}`}>
                            {user.score} pts
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 border border-vibrant-text rounded text-[9px] font-black shadow-[1.5px_1.5px_0_0_#4A3728] ${
                              user.difficulty === 'Easy' ? 'bg-vibrant-green text-white' :
                              user.difficulty === 'Medium' ? 'bg-vibrant-orange text-white' :
                              'bg-vibrant-red text-white'
                            }`}>
                              {user.difficulty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: MAIN INTERACTIVE GAME AREA */}
            <div className="lg:col-span-8">
              
              {/* FEEDBACK BANNER OVERLAY */}
              <AnimatePresence>
                {feedback.message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    style={{ position: 'relative', zIndex: 50 }}
                    className={`p-4 rounded-2xl mb-4 font-display font-black text-center text-sm border-[3px] border-vibrant-text shadow-[4px_4px_0_0_#4A3728] flex items-center justify-center gap-3 ${
                      feedback.type === 'success' 
                        ? 'bg-vibrant-green text-white shadow-[4px_4px_0_0_#10AC84]' 
                        : 'bg-vibrant-red text-white shadow-[4px_4px_0_0_#EE5253]'
                    }`}
                  >
                    <span className="text-xl">{feedback.type === 'success' ? '✨' : '💥'}</span>
                    <p>{feedback.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-[32px] border-4 border-vibrant-text shadow-[8px_8px_0_0_#4A3728] overflow-hidden min-h-[580px] flex flex-col justify-between">
                
                {/* 1. START MENU STATE */}
                {gameState === 'menu' && (
                  <div className="p-8 md:p-12 flex-1 flex flex-col justify-between items-center text-center">
                    
                    {/* Welcome Title */}
                    <div className="space-y-4 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-vibrant-yellow text-vibrant-text border-2 border-vibrant-text text-xs font-black uppercase tracking-wider font-mono shadow-[2px_2px_0_0_#4A3728]">
                        👨‍🍳 Simulation Active
                      </div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black tracking-tight text-vibrant-text leading-tight">
                        Gordon's Kitchen <br />Coding Challenge
                      </h2>
                      <p className="text-sm md:text-base font-semibold text-vibrant-text/75 leading-relaxed">
                        Satisfy hungry virtual customers by selecting, piling, and matching accurate ingredients before the timing bar ticks down to zero.
                      </p>
                    </div>
 
                    {/* Difficulty Selection */}
                    <div className="my-8 space-y-4 bg-vibrant-bg/40 p-6 rounded-3xl border-[3px] border-vibrant-text shadow-[4px_4px_0_0_#4A3728] w-full max-w-md">
                      <p className="text-sm font-black text-vibrant-text flex items-center justify-center gap-1.5">
                        <Timer className="w-4 h-4 text-vibrant-text" />
                        Select Difficulty (Adjusts Cooking Timers)
                      </p>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`p-3 rounded-2xl border-2 border-vibrant-text text-xs font-black transition-all ${
                              difficulty === d
                                ? d === 'Easy' ? 'bg-vibrant-green text-white shadow-[3px_3px_0_0_#4A3728] translate-y-[-1px]' :
                                  d === 'Medium' ? 'bg-vibrant-orange text-white shadow-[3px_3px_0_0_#4A3728] translate-y-[-1px]' :
                                  'bg-vibrant-red text-white shadow-[3px_3px_0_0_#4A3728] translate-y-[-1px]'
                                : 'bg-white text-vibrant-text/80 hover:bg-vibrant-bg hover:translate-y-[-1px]'
                            }`}
                          >
                            {d === 'Easy' && '🟢 '}
                            {d === 'Medium' && '🟡 '}
                            {d === 'Hard' && '🔴 '}
                            {d}
                          </button>
                        ))}
                      </div>
 
                      <div className="text-[11px] text-vibrant-text/75 font-bold pt-1 leading-normal">
                        {difficulty === 'Easy' && '⭐ 25 seconds per order — Relaxed pace for beginners.'}
                        {difficulty === 'Medium' && '⭐⭐ 18 seconds per order — 1.5x score bonus speed.'}
                        {difficulty === 'Hard' && '⭐⭐⭐ 12 seconds per order — 2.0x score multiplier thrill.'}
                      </div>
                    </div>
 
                    {/* Primary Trigger Buttons */}
                    <div className="w-full max-w-xs space-y-4">
                      <button
                        onClick={handleStartGame}
                        className="w-full bg-vibrant-red hover:bg-vibrant-red/95 text-white font-display font-black text-base px-6 py-4.5 rounded-2xl border-[3px] border-vibrant-text shadow-[4px_4px_0_0_#4A3728] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#4A3728] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5 fill-current text-white" />
                        <span>Start Cooking Simulator</span>
                      </button>
 
                      <p className="text-[10px] font-bold text-vibrant-text/60 leading-normal">
                        Created using pure Tkinter OOP widgets. Flip to the next tab to view the classroom Python files!
                      </p>
                    </div>
 
                  </div>
                )}

                {/* 2. PLAYING GAMEPLAY STATE */}
                {gameState === 'playing' && (
                  <div className="flex-1 flex flex-col justify-between">
                    
                    {/* HUD Status Header */}
                    <div className="bg-vibrant-text text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-vibrant-text">
                      <div className="flex items-center gap-6">
                        <div className="text-white font-black text-sm uppercase tracking-wider">
                          Score: <span className="text-vibrant-yellow font-black font-mono text-xl">{score}</span>
                        </div>
                        <div className="text-vibrant-yellow font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                          Wallet: <span className="font-mono text-xl text-white">🪙 {coins}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-black uppercase tracking-wider mr-1">Chef Lives:</span>
                        <div className="flex items-center gap-1.5 text-lg">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Heart 
                              key={i} 
                              className={`w-6 h-6 transition-transform ${
                                i < lives 
                                  ? 'text-vibrant-red fill-vibrant-red stroke-white stroke-2 scale-110 drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]' 
                                  : 'text-white/20 scale-90'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Customer Arena & Timer */}
                    <div className="p-6 bg-vibrant-bg/30 border-b-[3px] border-vibrant-text grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      
                      {/* Left: Customer Bubble */}
                      <div className="lg:col-span-8 flex items-start gap-4">
                        <div className="text-5xl bg-vibrant-yellow p-3 rounded-2xl border-[3px] border-vibrant-text shadow-[3px_3px_0_0_#4A3728] flex items-center justify-center aspect-square select-none shrink-0">
                          {customer.avatar}
                        </div>
                        <div className="flex-1 space-y-1 bg-white border-[3px] border-vibrant-text px-5 py-4 rounded-[22px] relative shadow-[3px_3px_0_0_#4A3728]">
                          <div className="text-[10px] font-black uppercase tracking-wider text-vibrant-text/50">
                            Customer: {customer.name}
                          </div>
                          
                          {currentOrder ? (
                            <div className="space-y-2">
                              <p className="text-sm font-extrabold text-vibrant-text italic leading-snug">
                                "{customer.dialogue}"
                              </p>
                              <div className="inline-flex flex-wrap items-center gap-2 text-xs text-vibrant-text bg-vibrant-yellow/30 border-2 border-vibrant-text px-3 py-1.5 rounded-xl shadow-[1.5px_1.5px_0_0_#4A3728]">
                                <span className="font-bold text-[10px] uppercase">Order:</span> 
                                <strong className="font-black text-sm">{recipes[currentOrder]?.emoji} {currentOrder}</strong>
                                <span className="text-vibrant-text/30">|</span>
                                <span className="text-vibrant-text/80 font-mono font-bold text-[10px]">
                                  {recipes[currentOrder]?.ingredients.map(ing => ing.split(' ').slice(1).join('')).join(' + ')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400">Waiting for kitchen order request...</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Dynamic Countdown timer progress */}
                      <div className="lg:col-span-4 bg-white border-[3px] border-vibrant-text p-4 rounded-[22px] space-y-3 text-center shadow-[3px_3px_0_0_#4A3728]">
                        <div className="flex justify-between items-center">
                          <span className="text-vibrant-text font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            <Timer className="w-4 h-4 text-vibrant-text" />
                            Patience Gauge
                          </span>
                          <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded border-2 border-vibrant-text ${timeLeft < (maxTime / 3) ? 'bg-vibrant-red text-white animate-bounce' : 'bg-vibrant-yellow text-vibrant-text'}`}>
                            {timeLeft}s
                          </span>
                        </div>

                        {/* Progress bar container */}
                        <div className="w-full bg-vibrant-bg border-2 border-vibrant-text h-5 rounded-full overflow-hidden p-0.5 shadow-inner">
                          <div 
                            className={`h-full rounded-full border-r-2 border-vibrant-text transition-all duration-100 ease-linear ${
                              timeLeft > (maxTime / 2) ? 'bg-vibrant-green' :
                              timeLeft > (maxTime / 4) ? 'bg-vibrant-orange' : 'bg-vibrant-red'
                            }`}
                            style={{ width: `${Math.max(0, (timeLeft / maxTime) * 100)}%` }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Middle Arena: Active Assembly board & Platter */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 bg-white">
                      
                      {/* Left Side: Cooking Plate stack visualization */}
                      <div className="lg:col-span-5 flex flex-col justify-between items-center text-center bg-vibrant-bg/30 rounded-3xl border-[3px] border-vibrant-text p-5 shadow-[4px_4px_0_0_#4A3728]">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-vibrant-text uppercase tracking-widest">Active Platter (Serving Plate)</p>
                          <p className="text-[10px] font-bold text-vibrant-text/65">Ingredients stack upward as you tap</p>
                        </div>

                        {/* Stacking graphics */}
                        <div className="relative w-full h-[180px] flex flex-col-reverse justify-start items-center pb-4 mt-4">
                          
                          {/* Serving plate element base */}
                          <div className="absolute bottom-1 w-4/5 h-4 bg-white rounded-full border-[3px] border-vibrant-text shadow-[0_3px_0_0_#4A3728]" />
                          <div className="absolute bottom-3.5 w-3/5 h-2 bg-vibrant-bg rounded-full border-2 border-vibrant-text" />

                          {/* Ingredient visual items */}
                          <div className="flex flex-col-reverse items-center justify-start z-10 w-full mb-4 space-y-reverse -space-y-2">
                            {currentIngredients.length > 0 ? (
                              currentIngredients.map((item, idx) => {
                                let itemStyle = "bg-vibrant-blue text-white";
                                if (item.includes("Bun") || item.includes("Dough") || item.includes("Shell") || item.includes("Batter")) {
                                  itemStyle = "bg-vibrant-orange text-white";
                                } else if (item.includes("Lettuce") || item.includes("Cucumber")) {
                                  itemStyle = "bg-vibrant-green text-white";
                                } else if (item.includes("Patty") || item.includes("Salmon") || item.includes("Pepperoni") || item.includes("Strawberry")) {
                                  itemStyle = "bg-vibrant-red text-white";
                                } else if (item.includes("Cheese") || item.includes("Syrup") || item.includes("Butter") || item.includes("Egg")) {
                                  itemStyle = "bg-vibrant-yellow text-vibrant-text";
                                }
                                return (
                                  <motion.div 
                                    key={idx}
                                    initial={{ scale: 0.75, y: -20, opacity: 0 }}
                                    animate={{ scale: 1, y: 0, opacity: 1 }}
                                    className={`px-3.5 py-1.5 rounded-full border-2 border-vibrant-text text-xs font-display font-black shadow-[2.5px_2.5px_0_0_#4A3728] flex items-center justify-center gap-1.5 tracking-wider w-5/6 hover:scale-[1.03] transition-transform ${itemStyle}`}
                                  >
                                    <span>{item}</span>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className="text-vibrant-text/40 text-xs font-black italic py-10 leading-normal">
                                Plate is empty.<br />Tap ingredients on the shelf!
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Serving Trigger Subsections */}
                        <div className="grid grid-cols-2 gap-4 w-full pt-3">
                          <button
                            onClick={() => setCurrentIngredients([])}
                            disabled={currentIngredients.length === 0}
                            className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-black transition-all border-2 border-vibrant-text ${
                              currentIngredients.length > 0 
                                ? 'bg-white hover:bg-vibrant-red/10 text-vibrant-text hover:text-vibrant-red shadow-[2.5px_2.5px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none' 
                                : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Empty Plate</span>
                          </button>

                          <button
                            onClick={handleServe}
                            disabled={currentIngredients.length === 0}
                            className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-black transition-all border-2 border-vibrant-text ${
                              currentIngredients.length > 0
                                ? 'bg-vibrant-green hover:bg-vibrant-green/95 text-white shadow-[2.5px_2.5px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none'
                                : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>Serve!</span>
                          </button>
                        </div>

                      </div>

                      {/* Right Side: Ingredient Shelf Grid of clicks */}
                      <div className="lg:col-span-7 flex flex-col justify-between">
                        <div className="space-y-1 mb-3">
                          <p className="text-xs font-black text-vibrant-text uppercase tracking-widest flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-vibrant-red border border-vibrant-text shadow-[1px_1px_0_0_#4A3728] animate-ping" />
                            Chef Ingredient Shelves
                          </p>
                          <p className="text-[10px] font-bold text-vibrant-text/60">Select standard active ingredients requested in customer cookbook diagrams</p>
                        </div>

                        {/* Standard 4x5 ingredients layout as defined in Python */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-1 max-h-[290px] overflow-y-auto">
                          {ALL_INGREDIENTS.map(ing => {
                            const isSelected = currentIngredients.includes(ing);
                            return (
                              <button
                                key={ing}
                                onClick={() => selectIngredient(ing)}
                                className={`p-2.5 rounded-2xl border-2 text-[11px] font-black transition-all flex items-center justify-between text-left ${
                                  isSelected 
                                    ? 'bg-vibrant-yellow border-vibrant-text text-vibrant-text shadow-[2px_2px_0_0_#4A3728] translate-y-[-1px]' 
                                    : 'bg-white border-vibrant-text hover:bg-vibrant-bg/30 text-vibrant-text shadow-[2.5px_2.5px_0_0_#4A3728] hover:translate-y-[-1px]'
                                }`}
                              >
                                <span className="truncate">{ing}</span>
                                <span className="text-[9px] bg-vibrant-orange/15 text-vibrant-orange border border-vibrant-orange/30 font-black px-1.5 py-0.5 rounded">
                                  + Put
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-3 border-t-2 border-vibrant-text/10 flex items-center justify-between text-xs text-vibrant-text/70">
                          <span className="font-extrabold">Cooking Multiplier: {difficulty === 'Easy' ? '1.0x' : difficulty === 'Medium' ? '1.5x' : '2.0x'} score gain</span>
                          <button
                            onClick={() => {
                              if (confirm("Return back to game menu? Active chef round progress will be lost!")) {
                                setGameState('menu');
                              }
                            }}
                            className="text-vibrant-red hover:text-vibrant-darkred font-black flex items-center gap-1 transition-all"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {/* 3. GAME OVER SUMMARY STATE */}
                {gameState === 'gameover' && (
                  <div className="p-8 md:p-12 text-center flex-1 flex flex-col justify-center items-center">
                    <div className="bg-vibrant-red/10 border-[3px] border-vibrant-text text-vibrant-red p-4 rounded-full mb-4 shadow-[3px_3px_0_0_#4A3728]">
                      <ChefHat className="w-12 h-12 stroke-[2]" />
                    </div>
                    
                    <h2 className="text-4xl font-display font-black text-vibrant-text mb-2">Game Over Chef!</h2>
                    <p className="text-xs font-bold text-vibrant-text/60 max-w-sm mb-6 leading-relaxed">
                      All your hearts have been depleted! The customers had to leave. Excellent effort in the sandbox!
                    </p>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8 bg-vibrant-bg border-[3px] border-vibrant-text p-5 rounded-[22px] shadow-[4px_4px_0_0_#4A3728]">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-vibrant-text/50 uppercase tracking-widest">Final Score</p>
                        <p className="text-2xl font-mono font-black text-vibrant-text mt-1">{score} pts</p>
                      </div>
                      <div className="text-center border-l-2 border-vibrant-text/25">
                        <p className="text-[10px] font-black text-vibrant-text/50 uppercase tracking-widest">Difficulty</p>
                        <p className="text-lg font-black text-vibrant-orange mt-1.5">{difficulty} Mode</p>
                      </div>
                    </div>

                    {/* High Score Submission logic */}
                    {isHighScore && !hasSavedScore ? (
                      <form onSubmit={handleSaveHighScore} className="w-full max-w-md bg-white border-[3px] border-vibrant-text p-6 rounded-[22px] mb-6 space-y-4 shadow-[4px_4px_0_0_#4A3728]">
                        <div className="space-y-1">
                          <p className="font-display font-black text-vibrant-text text-sm flex items-center justify-center gap-1">
                            <Trophy className="w-4 h-4 text-vibrant-yellow fill-vibrant-yellow stroke-vibrant-text stroke-2" />
                            Congratulations! You entered Top Charts!
                          </p>
                          <p className="text-[11px] font-bold text-vibrant-text/60">Please enter your culinary master credentials below to persist:</p>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            maxLength={15}
                            placeholder="Your Chef Name..."
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            className="bg-vibrant-bg border-2 border-vibrant-text text-vibrant-text font-bold rounded-xl px-4 py-2.5 flex-grow text-sm focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="bg-vibrant-yellow hover:bg-vibrant-yellow/90 font-black text-vibrant-text border-2 border-vibrant-text px-5 py-2.5 rounded-xl text-xs transition-all shadow-[2px_2px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none"
                          >
                            Persist Entry
                          </button>
                        </div>
                      </form>
                    ) : hasSavedScore ? (
                      <div className="bg-vibrant-green border-2 border-vibrant-text text-white text-xs font-black py-3 px-5 rounded-xl mb-6 shadow-[2.5px_2.5px_0_0_#4A3728]">
                        ✓ High score saved properly! Look at the left leaderboard ladder.
                      </div>
                    ) : null}

                    {/* Action Triggers */}
                    <div className="flex gap-4 w-full max-w-sm">
                      <button
                        onClick={() => setGameState('menu')}
                        className="flex-1 border-2 border-vibrant-text bg-white hover:bg-vibrant-bg font-black py-3 px-4 rounded-xl text-sm transition-all text-vibrant-text shadow-[3px_3px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none"
                      >
                        Return to Menu
                      </button>
                      <button
                        onClick={handleStartGame}
                        className="flex-1 bg-vibrant-orange hover:bg-vibrant-orange/95 text-white font-black py-3 px-4 rounded-xl text-sm transition-all border-2 border-vibrant-text shadow-[3px_3px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none"
                      >
                        Try Again
                      </button>
                    </div>

                  </div>
                )}

              </div>
              
            </div>

          </div>
        )}

        {/* TAB 2: PYTHON CODE EXPLORER */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: SOURCE SPEC & DOWNLOAD */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* EXPORT OPTIONS */}
              <div className="bg-white rounded-3xl border-[3px] border-vibrant-text shadow-[5px_5px_0_0_#4A3728] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-5 h-5 text-vibrant-blue" />
                  <h3 className="font-display font-black text-vibrant-text">Python 3 Installer</h3>
                </div>
                <p className="text-xs font-bold text-vibrant-text/65 mb-5 leading-relaxed">
                  The Python script utilizes standard <strong>Tkinter</strong> object-oriented frames without requiring third-party library dependencies (databases, images, internet). Ready to execute out-of-the-box on regular systems!
                </p>

                <div className="space-y-3.5">
                  <button
                    onClick={handleDownloadCode}
                    className="w-full flex items-center justify-center gap-2 bg-vibrant-orange hover:bg-vibrant-orange/95 text-white font-black py-3 px-4 rounded-xl text-sm border-2 border-vibrant-text shadow-[2.5px_2.5px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download cooking_game.py</span>
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-vibrant-bg/30 text-vibrant-text font-black py-3 px-4 rounded-xl text-sm border-2 border-vibrant-text shadow-[2.5px_2.5px_0_0_#4A3728] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? 'Copied Successfully!' : 'Copy Code String'}</span>
                  </button>
                </div>
              </div>

              {/* QUICK RUN INSTRUCTIONS BANNER */}
              <div className="bg-white rounded-3xl border-[3px] border-vibrant-text p-6 space-y-4 shadow-[4px_4px_0_0_#4A3728]">
                <h4 className="font-black text-xs text-vibrant-text/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-vibrant-blue" />
                  How to Play on computer:
                </h4>
                
                <div className="space-y-3.5 text-xs text-vibrant-text">
                  <div className="flex gap-2.5 items-start">
                    <span className="font-mono bg-vibrant-yellow font-black border-2 border-vibrant-text text-vibrant-text px-1.5 py-0.5 rounded text-[10px] uppercase select-none">Step 1</span>
                    <p className="font-bold leading-normal">Install Python 3 from official <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer" className="text-vibrant-blue underline font-black">python.org</a>.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="font-mono bg-vibrant-yellow font-black border-2 border-vibrant-text text-vibrant-text px-1.5 py-0.5 rounded text-[10px] uppercase select-none">Step 2</span>
                    <p className="font-bold leading-normal">Download the single-file <code className="font-mono bg-vibrant-bg border border-vibrant-text/30 px-1 py-0.5 rounded font-black text-vibrant-orange">cooking_game.py</code> to your laptop desktop.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="font-mono bg-vibrant-yellow font-black border-2 border-vibrant-text text-vibrant-text px-1.5 py-0.5 rounded text-[10px] uppercase select-none">Step 3</span>
                    <p className="font-bold leading-normal">Open command terminal / prompt and run:</p>
                  </div>
                  <pre className="p-3 text-[11px] font-mono bg-zinc-950 text-vibrant-yellow rounded-xl overflow-x-auto border-2 border-vibrant-text shadow-inner">
                    python cooking_game.py
                  </pre>
                  <p className="text-[10px] font-bold text-vibrant-text/50 leading-relaxed pt-2 border-t border-vibrant-text/10">
                    *macOS Note:* If you receive missing widget errors, Tkinter package is separated in Homebrew. Install it with: <br />
                    <code className="bg-vibrant-bg font-mono text-vibrant-text border border-vibrant-text/30 p-0.5 rounded text-[9px] select-all font-black">brew install python-tk</code>
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: CODE VIEWER CODE */}
            <div className="lg:col-span-8 bg-zinc-900 rounded-3xl border-[3px] border-vibrant-text shadow-[6px_6px_0_0_#4A3728] overflow-hidden flex flex-col max-h-[660px]">
              
              {/* Code viewer header tab */}
              <div className="bg-zinc-950 px-6 py-4 flex items-center justify-between border-b-[3px] border-vibrant-text">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-vibrant-red border-2 border-vibrant-text" />
                  <div className="w-3.5 h-3.5 rounded-full bg-vibrant-yellow border-2 border-vibrant-text" />
                  <div className="w-3.5 h-3.5 rounded-full bg-vibrant-green border-2 border-vibrant-text" />
                  <span className="text-xs font-mono text-white font-black ml-1 uppercase.tracking-wider">cooking_game.py</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">≈ 800 lines of OOP code</span>
                  <button
                    onClick={handleCopyCode}
                    className="bg-vibrant-yellow hover:bg-vibrant-yellow/90 text-vibrant-text border-2 border-vibrant-text px-3 py-1.5 rounded-lg text-xs font-black transition shadow-[1.5px_1.5px_0_0_#4A3728] active:translate-y-px active:shadow-none"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Code text scrollable panel */}
              <div className="overflow-y-auto p-5 font-mono text-xs leading-relaxed text-zinc-350 bg-zinc-900 select-all whitespace-pre">
                {PYTHON_CODE_STRING}
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: LESSON GUIDE & SYLLABUS */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl border-[3px] border-vibrant-text shadow-[6px_6px_0_0_#4A3728] p-8 max-w-4xl mx-auto space-y-10">
            
            {/* Header intro */}
            <div className="border-b-2 border-vibrant-text/10 pb-6 space-y-2">
              <span className="bg-vibrant-bg text-vibrant-text border-2 border-vibrant-text text-[10px] font-mono font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block shadow-[1.5px_1.5px_0_0_#4A3728]">
                Academic Curriculum Guide
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-black text-vibrant-text">
                Culinary Python & Tkinter Architecture
              </h2>
              <p className="text-xs font-bold text-vibrant-text/60 leading-relaxed">
                Learn the core computer science concepts that power our single-file Python Cooking Game. This syllabus breaks down Object-Oriented layouts, non-blocking asynchronous intervals, and persistence.
              </p>
            </div>

            {/* Concept 1: Tkinter Windowing */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 bg-vibrant-green/10 p-5 rounded-2xl border-2 border-vibrant-text shadow-[3.5px_3.5px_0_0_#4A3728]">
                <h3 className="font-display font-black text-vibrant-text text-base flex items-center gap-1.5">
                  <span className="bg-vibrant-green text-white w-6 h-6 rounded-lg text-xs font-black inline-flex items-center justify-center border-2 border-vibrant-text">1</span>
                  Window Tkinter Core
                </h3>
                <p className="text-[11px] font-bold text-vibrant-text/75 mt-2 leading-relaxed">
                  Tkinter uses a structured grid geometry system. By overriding the basic root frames, students can craft complex sidebars and panels visually.
                </p>
              </div>
              <div className="md:col-span-8 space-y-2">
                <h4 className="font-black text-vibrant-text text-sm">Frames and Layout Managers</h4>
                <p className="text-xs font-bold text-vibrant-text/70 leading-normal">
                  In Python, everything is a widget. The main application is a subclass of <code className="bg-vibrant-bg text-vibrant-orange font-mono font-bold px-1 rounded border border-vibrant-text/25">tk.Tk</code>, and different views represent subclasses of <code className="bg-vibrant-bg text-vibrant-orange font-mono font-bold px-1 rounded border border-vibrant-text/25">tk.Frame</code>. 
                </p>
                <p className="text-xs font-bold text-vibrant-text/70 leading-normal">
                  Our application registers multiple screens (e.g. <code className="font-mono">StartMenuFrame</code>, <code className="font-mono">GameFrame</code>) recursively inside a grid container stack:
                </p>
                <pre className="p-3.5 bg-zinc-950 text-vibrant-yellow font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border-2 border-vibrant-text shadow-inner">
{`# Multi-frame registration inside CookingGameApp init
for F in (StartMenuFrame, GameFrame, ShopFrame, LeaderboardFrame):
    frame = F(parent=self.container, controller=self)
    self.frames[F.__name__] = frame
    frame.grid(row=0, column=0, sticky="nsew")`}
                </pre>
              </div>
            </div>

            {/* Concept 2: Non-blocking Tick Loop */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-6 border-t-2 border-vibrant-text/10">
              <div className="md:col-span-4 bg-vibrant-yellow/10 p-5 rounded-2xl border-2 border-vibrant-text shadow-[3.5px_3.5px_0_0_#4A3728]">
                <h3 className="font-display font-black text-vibrant-text text-base flex items-center gap-1.5">
                  <span className="bg-vibrant-yellow text-vibrant-text w-6 h-6 rounded-lg text-xs font-black inline-flex items-center justify-center border-2 border-vibrant-text">2</span>
                  The Event Timeloop
                </h3>
                <p className="text-[11px] font-bold text-vibrant-text/75 mt-2 leading-relaxed">
                  Using traditional thread sleep freezes the main GUI loop. Tkinter provides a built-in event scheduler using recursive tick calls.
                </p>
              </div>
              <div className="md:col-span-8 space-y-2">
                <h4 className="font-black text-vibrant-text text-sm">Using tkinter.Tk.after()</h4>
                <p className="text-xs font-bold text-vibrant-text/70 leading-normal">
                  The countdown timer decreases every 1000 milliseconds (1 second) without blocking button clicks or dragging from players:
                </p>
                <pre className="p-3.5 bg-zinc-950 text-vibrant-yellow font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border-2 border-vibrant-text shadow-inner">
{`def run_timer_tick(self):
    if not self.game_active:
        return
    self.update_timer(self.timer_seconds)
    if self.timer_seconds <= 0:
        self.handle_order_failure("Time expired!")
    else:
        self.timer_seconds -= 1
        # Recursive schedule call
        self.timer_job = self.after(1000, self.run_timer_tick)`}
                </pre>
              </div>
            </div>

            {/* Concept 3: Database & Local JSON */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-6 border-t-2 border-vibrant-text/10">
              <div className="md:col-span-4 bg-vibrant-blue/10 p-5 rounded-2xl border-2 border-vibrant-text shadow-[3.5px_3.5px_0_0_#4A3728]">
                <h3 className="font-display font-black text-vibrant-text text-base flex items-center gap-1.5">
                  <span className="bg-vibrant-blue text-white w-6 h-6 rounded-lg text-xs font-black inline-flex items-center justify-center border-2 border-vibrant-text">3</span>
                  JSON Serialization
                </h3>
                <p className="text-[11px] font-bold text-vibrant-text/75 mt-2 leading-relaxed">
                  JSON files satisfy file persistence tasks cleanly on Python, making database drivers unnecessary for lightweight desktop projects.
                </p>
              </div>
              <div className="md:col-span-8 space-y-2">
                <h4 className="font-black text-vibrant-text text-sm">Persisting High Score Tables Safely</h4>
                <p className="text-xs font-bold text-vibrant-text/70 leading-normal">
                  High scores are stored on the disk inside a <code className="bg-vibrant-bg text-vibrant-orange font-mono font-bold px-1 rounded border border-vibrant-text/25 font-mono">cooking_leaderboard.json</code> file using standard dictionary dumps:
                </p>
                <pre className="p-3.5 bg-zinc-950 text-vibrant-yellow font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border-2 border-vibrant-text shadow-inner">
{`def save_leaderboard(self):
    try:
        with open("cooking_leaderboard.json", "w") as f:
            json.dump(self.leaderboard, f, indent=4)
    except Exception as e:
        messagebox.showerror("Error", f"Could not save: {e}")`}
                </pre>
              </div>
            </div>

            {/* Concept 4: Lesson Tasks and Assignments */}
            <div className="bg-white border-[3px] border-vibrant-text shadow-[4px_4px_0_0_#4A3728] rounded-[22px] p-6 mt-6">
              <h4 className="font-display font-black text-vibrant-text text-sm mb-3 flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-vibrant-orange" />
                Student Activity Assignments & Exercises:
              </h4>
              <ul className="space-y-4 text-xs text-vibrant-text font-bold">
                <li className="flex items-start gap-2 border-t-2 border-vibrant-text/5 pt-3">
                  <span className="text-vibrant-orange font-black text-sm">1.</span>
                  <div>
                    <strong>Easy Modification (Culinary additions):</strong> Add a new custom locked recipe inside the Python RECIPES_DATABASE (e.g. 🍨 "Icecream Sundae": ["🍨 Bowl", "🍦 Cream", "🍯 Syrup", "🍓 Strawberry"]) and set its coin cost to 40.
                  </div>
                </li>
                <li className="flex items-start gap-2 border-t-2 border-vibrant-text/5 pt-3">
                  <span className="text-vibrant-orange font-black text-sm">2.</span>
                  <div>
                    <strong>Medium Difficulty (Streak multiplier):</strong> Create a streak counter variable <code className="font-mono text-vibrant-orange font-black bg-vibrant-bg rounded px-1 border border-vibrant-text/10">self.streak = 0</code>. Increment it on successful orders and award double coins if the streak reaches 4 or higher! Reset streak on incorrect serves.
                  </div>
                </li>
                <li className="flex items-start gap-2 border-t-2 border-vibrant-text/5 pt-3">
                  <span className="text-vibrant-orange font-black text-sm">3.</span>
                  <div>
                    <strong>Hard Challenge (Customer Patience / Speed-run):</strong> Introduce dynamic timers that depend on recipes complexity. Basic burgers start with standard timer, which drops by 2 seconds if the dish contains 4 or more ingredients.
                  </div>
                </li>
              </ul>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-vibrant-text text-white py-8 px-6 text-center border-t-4 border-vibrant-text">
        <div className="max-w-7xl mx-auto space-y-2.5">
          <p className="font-sans font-black uppercase tracking-widest text-xs text-vibrant-yellow">
            🍳 Perfect for Python classes, AP computer science camps, and tkinter classroom demonstrations.
          </p>
          <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase tracking-wider">
            Chef's Cooking Laboratory © {new Date().getFullYear()}. All simulation states executed client-side via standard HTML5. Downloadable code is 100% compliant with Python 3.9+ standards.
          </p>
        </div>
      </footer>

    </div>
  );
}
