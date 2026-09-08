import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function MotionCard({ children, className = '', glowColor = 'rgba(245, 158, 11, 0.15)', depth = 12 }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -depth;
    const rY = ((x - centerX) / centerX) * depth;

    setRotateX(rX);
    setRotateY(rY);
    setMousePos({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={`relative group overflow-hidden transition-shadow duration-300 ${className}`}
    >
      {/* Dynamic 3D Cursor Spotlight Overlay */}
      {mousePos.active && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 70%)`
          }}
        />
      )}

      {/* Cybernetic 3D Corner Bracket Accents */}
      <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/50 rounded-tl pointer-events-none group-hover:scale-125 transition-transform" />
      <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/50 rounded-tr pointer-events-none group-hover:scale-125 transition-transform" />
      <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/50 rounded-bl pointer-events-none group-hover:scale-125 transition-transform" />
      <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/50 rounded-br pointer-events-none group-hover:scale-125 transition-transform" />

      <div style={{ transform: 'translateZ(18px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
