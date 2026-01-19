import React, { useState, useEffect, useRef } from 'react';
import { Timer, AlertTriangle, History, Play, Square, Activity } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [switchCount, setSwitchCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastSession, setLastSession] = useState(null);
  
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playBeep = () => {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Beep settings
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // Drop pitch
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Load last session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastSession');
    if (saved) {
      setLastSession(JSON.parse(saved));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]);

  // Visibility change logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        setSwitchCount(prev => prev + 1);
        playBeep();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    setSwitchCount(0);
    setElapsedSeconds(0);
    // Initialize audio context on user interaction
    getAudioContext();
  };

  const handleStop = () => {
    setIsActive(false);
    
    const sessionData = {
      date: new Date().toLocaleString(),
      duration: elapsedSeconds,
      switches: switchCount
    };
    
    setLastSession(sessionData);
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-gradient-to-br from-sunset-50 to-orange-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-sunset-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sunset-500 to-orange-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">Context Switch Tracker</h1>
          </div>
          <p className="text-orange-100 text-sm opacity-90">
            Measures how often you switch away from this tab during a focus session.
          </p>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-8">
          
          {/* Stats Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border-2 transition-colors ${isActive ? 'border-sunset-400 bg-sunset-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Switches</span>
              </div>
              <div className="text-4xl font-mono font-bold text-gray-800">
                {switchCount}
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 transition-colors ${isActive ? 'border-sunset-400 bg-sunset-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Timer className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Duration</span>
              </div>
              <div className="text-4xl font-mono font-bold text-gray-800">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <button
              onClick={handleStart}
              disabled={isActive}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isActive 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-sunset-600 hover:bg-sunset-700 text-white shadow-lg shadow-sunset-200'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              Start Session
            </button>

            <button
              onClick={handleStop}
              disabled={!isActive}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                !isActive 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
              }`}
            >
              <Square className="w-5 h-5 fill-current" />
              Stop
            </button>
          </div>

          {/* Last Session Summary */}
          {lastSession && !isActive && (
            <div className="border-t border-gray-100 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <History className="w-4 h-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Last Session Summary</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-700 text-lg leading-relaxed">
                  You had <span className="font-bold text-sunset-600">{lastSession.switches}</span> context switches 
                  over <span className="font-bold text-gray-900">{formatTime(lastSession.duration)}</span> minutes.
                </p>
                <p className="text-xs text-gray-400 mt-2 text-right">
                  {lastSession.date}
                </p>
              </div>
            </div>
          )}
          
          {/* Active State Indicator */}
          {isActive && (
            <div className="flex items-center justify-center gap-2 text-sunset-600 animate-pulse pt-2">
              <div className="w-2 h-2 rounded-full bg-sunset-600"></div>
              <span className="text-sm font-medium">Tracking active... focus on this tab!</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}