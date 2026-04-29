/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import confetti from 'canvas-confetti';

let audioCtx: AudioContext | null = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playTick = () => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.04);
  
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
  
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
};

const playChime = () => {
  if (!audioCtx) return;
  // A majestic, apple-like positive chime (maj9 chord)
  const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    const now = audioCtx.currentTime;
    const delay = i * 0.06;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.5);
    
    osc.start(now + delay);
    osc.stop(now + delay + 3);
  });
};

const MACARON_COLORS = [
  '#E0BBE4', // Lavender
  '#BFFCC6', // Mint
  '#FFCCBB', // Peach
  '#AFCBFF', // Baby Blue
  '#FFFFD1', // Butter
  '#D4F1F4', // Ice Blue
  '#FFD1DC', // Pastel Pink
  '#E2F0CB', // Matcha
  '#B5EAD7', // Seafoam
  '#C7CEEA'  // Periwinkle
];

const TOTAL_NUMBERS = 30;

export default function App() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const rotateValue = useMotionValue(0);
  const lastTickRef = useRef(0);

  const generateConicGradient = () => {
    const parts = [];
    const segmentAngle = 360 / TOTAL_NUMBERS;
    for (let i = 0; i < TOTAL_NUMBERS; i++) {
      const color = MACARON_COLORS[i % MACARON_COLORS.length];
      const startAngle = i * segmentAngle;
      const endAngle = (i + 1) * segmentAngle;
      parts.push(`${color} ${startAngle}deg ${endAngle}deg`);
    }
    return `conic-gradient(from -${segmentAngle / 2}deg, ${parts.join(', ')})`;
  };

  const spin = () => {
    if (isSpinning) return;

    const availableNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1)
      .filter((n) => !drawnNumbers.includes(n));
    
    if (availableNumbers.length === 0) {
      alert('모든 번호가 추첨되었습니다!');
      return;
    }

    initAudio();
    setIsSpinning(true);
    setWinningNumber(null);
    
    const targetNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    const winnerIdx = targetNumber - 1;
    
    const startRotation = rotateValue.get();
    const spins = 10 * 360;
    const baseRotation = Math.floor(startRotation / 360) * 360; 
    
    const segmentAngle = 360 / TOTAL_NUMBERS;
    let targetRotation = baseRotation + spins + (360 - (winnerIdx * segmentAngle));
    
    if (targetRotation - startRotation < spins) {
      targetRotation += 360;
    }
    
    const randomOffset = (Math.random() * (segmentAngle * 0.7)) - (segmentAngle * 0.35);
    targetRotation += randomOffset;
    
    lastTickRef.current = Math.floor(startRotation / segmentAngle);
    
    animate(rotateValue, targetRotation, {
      duration: 8,
      ease: [0.15, 0.0, 0.05, 1], // Very smooth, natural deceleration
      onUpdate: (latest) => {
        const currentTick = Math.floor(latest / segmentAngle);
        if (currentTick > lastTickRef.current) {
          playTick();
          lastTickRef.current = currentTick;
        }
      },
      onComplete: () => {
        setIsSpinning(false);
        setWinningNumber(targetNumber);
        setDrawnNumbers(prev => [...prev, targetNumber]);
        playChime();
        shootConfetti();
      }
    });
  };

  const shootConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: MACARON_COLORS,
        zIndex: 100
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: MACARON_COLORS,
        zIndex: 100
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const resetGame = () => {
    if (window.confirm('추첨 기록을 초기화하시겠습니까?')) {
      setDrawnNumbers([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] relative overflow-hidden flex items-center justify-center p-4 md:p-8">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#E0BBE4] to-transparent opacity-40 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tl from-[#AFCBFF] to-transparent opacity-40 blur-3xl pointer-events-none" />

      {/* Main Layout Container */}
      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-stretch z-10">
        
        {/* Left Column: Roulette area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[600px] py-4">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold tracking-tight text-[#1D1D1F] mb-3 leading-[1.2]">
              초등SW·AI 교육관리자
              <br />
              역량강화 직무연수 1기
            </h1>
            <p className="text-[#86868B] text-lg font-medium tracking-tight">
              행운의 주인공은 누구일까요?
            </p>
          </div>

          {/* Roulette Area */}
          <div className="relative w-[85vmin] max-w-[400px] md:max-w-[480px] aspect-square flex items-center justify-center drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
            {/* The Pin */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
              <div className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22L19.5 8.5C21.5 5 19 2 15 2H9C5 2 2.5 5 4.5 8.5L12 22Z" fill="#FF3B30" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* The Wheel */}
            <motion.div
              className="relative w-full h-full rounded-full border-[6px] md:border-8 border-white/90 overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[15px]"
              style={{ rotate: rotateValue, backgroundImage: generateConicGradient() }}
            >
              {Array.from({ length: TOTAL_NUMBERS }).map((_, i) => {
                const isDrawn = drawnNumbers.includes(i + 1);
                return (
                  <div
                    key={i}
                    className="absolute w-full h-full select-none"
                    style={{ transform: `rotate(${i * (360 / TOTAL_NUMBERS)}deg)` }}
                  >
                    {/* Divider Line */}
                    <div 
                      className="absolute top-0 left-[calc(50%-0.5px)] w-[1px] h-[50%] bg-white/70 origin-bottom"
                      style={{ transform: `rotate(${360 / TOTAL_NUMBERS / 2}deg)` }}
                    />
                    {/* Number Label */}
                    <div 
                      className={`absolute top-[4%] md:top-[6%] left-1/2 -translate-x-1/2 font-semibold transition-opacity duration-300 ${
                        isDrawn ? 'text-black/20 text-[12px] md:text-[14px]' : 'text-black/60 text-[14px] md:text-[16px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]'
                      }`}
                    >
                      {i + 1}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-20 md:h-20 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-[4px] border-[#F5F5F7] z-10 flex items-center justify-center">
                <div className="w-4 h-4 md:w-6 md:h-6 bg-[#E5E5EA] rounded-full shadow-inner" />
            </div>
          </div>

          {/* Spin Button */}
          <motion.button
            onClick={spin}
            disabled={isSpinning || drawnNumbers.length === TOTAL_NUMBERS}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="mt-10 md:mt-12 bg-white text-[#1D1D1F] border border-[#E5E5EA] rounded-full px-12 py-4 md:px-16 md:py-5 text-xl font-bold tracking-tight shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center z-10"
          >
            {isSpinning ? '추첨 중...' : '추첨하기'}
          </motion.button>
        </div>

        {/* Right Column: Drawn History */}
        <div className="w-full lg:w-[320px] xl:w-[380px] h-[300px] lg:h-auto max-h-[600px] glass-panel rounded-[24px] p-6 md:p-8 flex flex-col z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1D1D1F]">당첨자 목록</h2>
            <span className="text-sm font-semibold text-[#86868B] bg-[#E5E5EA] px-3 py-1 rounded-full">
              {drawnNumbers.length} / {TOTAL_NUMBERS}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 pr-1">
            {drawnNumbers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#86868B] text-sm">
                아직 당첨된 번호가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-4 gap-2">
                {drawnNumbers.map((num, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="aspect-square bg-white border border-[#E5E5EA] rounded-xl flex items-center justify-center text-[#1D1D1F] font-bold text-lg shadow-sm"
                  >
                    {num}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={resetGame}
            disabled={drawnNumbers.length === 0 || isSpinning}
            className="w-full py-3 rounded-xl bg-black/5 hover:bg-black/10 text-[#1D1D1F] font-semibold text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            기록 초기화
          </button>
        </div>

      </div>

      {/* Winner Result Modal */}
      <AnimatePresence>
        {winningNumber && !isSpinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F5F5F7]/60 backdrop-blur-[12px]"
            onClick={() => setWinningNumber(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="glass-panel p-[40px] md:p-[60px] rounded-[40px] flex flex-col items-center min-w-[320px] md:min-w-[400px]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-[#86868B] font-semibold text-lg md:text-xl m-0 tracking-tight">오늘의 행운아!</h2>
              <div className="text-[100px] md:text-[140px] font-black text-[#1D1D1F] tabular-nums my-4 leading-none tracking-tighter">
                {winningNumber}
              </div>
              <p className="text-[#1D1D1F]/80 font-medium text-lg md:text-xl text-center leading-relaxed mb-8">
                행운의 주인공으로
                <br />
                선정되셨습니다 🎉
              </p>

              <button
                onClick={() => setWinningNumber(null)}
                className="w-full bg-[#1D1D1F] text-white px-8 py-4 rounded-[20px] font-semibold text-lg hover:bg-[#333] active:scale-95 transition-all"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

