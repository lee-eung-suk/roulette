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
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
};

const playChime = () => {
  if (!audioCtx) return;
  const freqs = [261.63, 329.63, 392.00, 523.25, 587.33]; 
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1 + (i * 0.05));
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    
    osc.start(now);
    osc.stop(now + 3);
  });
};

const MACARON_COLORS = [
  '#E0BBE4',
  '#BFFCC6',
  '#FFCCBB',
  '#AFCBFF',
  '#FFFFD1',
  '#D4F1F4',
  '#FFD1DC',
  '#E2F0CB',
  '#B5EAD7',
  '#C7CEEA'
];

export default function App() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const rotateValue = useMotionValue(0);
  const lastTickRef = useRef(0);

  const generateConicGradient = () => {
    const parts = [];
    for (let i = 0; i < 30; i++) {
      const color = MACARON_COLORS[i % MACARON_COLORS.length];
      const startAngle = i * 12;
      const endAngle = (i + 1) * 12;
      parts.push(`${color} ${startAngle}deg ${endAngle}deg`);
    }
    return `conic-gradient(from -6deg, ${parts.join(', ')})`;
  };

  const spin = () => {
    if (isSpinning) return;
    initAudio();
    setIsSpinning(true);
    setWinningNumber(null);
    
    const winnerIdx = Math.floor(Math.random() * 30);
    const winner = winnerIdx + 1;
    
    const startRotation = rotateValue.get();
    const spins = 10 * 360;
    const baseRotation = Math.floor(startRotation / 360) * 360; 
    
    let targetRotation = baseRotation + spins + (360 - (winnerIdx * 12));
    
    if (targetRotation - startRotation < spins) {
      targetRotation += 360;
    }
    
    const randomOffset = (Math.random() * 8) - 4;
    targetRotation += randomOffset;
    
    lastTickRef.current = Math.floor(startRotation / 12);
    
    animate(rotateValue, targetRotation, {
      duration: 8,
      ease: [0.15, 0.0, 0.05, 1],
      onUpdate: (latest) => {
        const currentTick = Math.floor(latest / 12);
        if (currentTick > lastTickRef.current) {
          playTick();
          lastTickRef.current = currentTick;
        }
      },
      onComplete: () => {
        setIsSpinning(false);
        setWinningNumber(winner);
        playChime();
        shootConfetti();
      }
    });
  };

  const shootConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: MACARON_COLORS,
        zIndex: 100
      });
      confetti({
        particleCount: 8,
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor (Glassmorphic Orbs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-[#E0BBE4] to-transparent opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tl from-[#AFCBFF] to-transparent opacity-30 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 md:mb-10 z-10">
        <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-sm text-sm font-semibold text-[#86868B]">
          1~30번 럭키 드로우
        </div>
        <h1 className="text-4xl md:text-[36px] font-bold tracking-tight text-[#1D1D1F] mb-2 drop-shadow-sm leading-tight">
          초등SW·AI 교육관리자
          <br className="md:block hidden" />
          <span className="md:hidden"> </span>역량강화 직무연수 1기
        </h1>
        <p className="text-[#86868B] text-[18px] font-normal tracking-tight">행운의 주인공은 누구일까요?</p>
      </div>

      {/* Roulette Section */}
      <div className="relative w-full max-w-[320px] md:max-w-[480px] aspect-square flex items-center justify-center z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
        
        {/* Soft shadow under the wheel */}
        <div className="absolute inset-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-black/5" />
        
        {/* The Pin - Top Center */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
          {/* Apple-like sleek pin design */}
          <div className="w-10 h-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22L19.5 8.5C21.5 5 19 2 15 2H9C5 2 2.5 5 4.5 8.5L12 22Z" fill="#FF3B30" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* The Wheel */}
        <motion.div
          className="relative w-full h-full rounded-full border-[6px] md:border-8 border-white/80 overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.05)] backdrop-blur-[15px]"
          style={{ rotate: rotateValue, backgroundImage: generateConicGradient() }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full select-none"
              style={{ transform: `rotate(${i * 12}deg)` }}
            >
              {/* Divider Line */}
              <div 
                className="absolute top-0 left-[calc(50%-0.5px)] w-[1px] h-[50%] bg-white/70 origin-bottom"
                style={{ transform: 'rotate(6deg)' }}
              />
              {/* Number Label */}
              <div className="absolute top-[6%] md:top-[8%] left-1/2 -translate-x-1/2 text-black/50 font-semibold text-[14px] md:text-[16px]">
                {i + 1}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Center Cap */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border-[3px] border-[#F5F5F7] z-10 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#F5F5F7] rounded-full inner-shadow shadow-inner" />
        </div>
      </div>

      {/* Spin Button */}
      <motion.button
        onClick={spin}
        disabled={isSpinning}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="mt-10 md:mt-12 bg-[#007AFF] text-white rounded-full px-12 py-4 text-xl font-semibold shadow-[0_8px_20px_rgba(0,122,255,0.3)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center z-10"
      >
        {isSpinning ? '추첨 중...' : '추첨하기'}
      </motion.button>

      {/* Winner Result Modal */}
      <AnimatePresence>
        {winningNumber && !isSpinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F5F5F7]/40 backdrop-blur-[8px]"
            onClick={() => setWinningNumber(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-white/70 backdrop-blur-[20px] p-[50px] rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] flex flex-col items-center border border-white/80 min-w-[300px]"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 0.2, type: 'spring' }}
                 className="mb-2 text-4xl"
              >
                  ✨
              </motion.div>
              <h2 className="text-[#86868B] font-semibold text-[24px] m-0 tracking-tight">오늘의 행운아!</h2>
              <div className="text-[100px] md:text-[120px] font-[800] text-[#007AFF] tabular-nums my-[10px] leading-none drop-shadow-sm tracking-tighter">
                {winningNumber}
              </div>
              <p className="text-[#1D1D1F]/80 font-medium text-lg text-center leading-relaxed mb-4">
                행운의 주인공으로
                <br />
                선정되셨습니다 🎉
              </p>

              <button
                onClick={() => setWinningNumber(null)}
                className="mt-5 bg-[#F2F2F7] text-[#1D1D1F] px-[30px] py-[12px] rounded-[20px] font-semibold text-lg hover:bg-[#E5E5EA] transition-all w-full"
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

