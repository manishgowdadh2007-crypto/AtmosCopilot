import React, { useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';

export default function RainbowGlobe() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 95;

      // Rainbow Weather Thermal Gradient Simulation
      const grad = ctx.createRadialGradient(centerX - 20, centerY - 20, 10, centerX, centerY, radius);
      grad.addColorStop(0, '#38bdf8');   // Polar cold
      grad.addColorStop(0.35, '#4ade80'); // Temperate green
      grad.addColorStop(0.65, '#facc15'); // Warm yellow
      grad.addColorStop(1, '#ef4444');   // Thermal heat core

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Atmospheric latitude rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.5;

      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        const yOffset = i * 26;
        const rSub = Math.sqrt(Math.max(0, radius * radius - yOffset * yOffset));
        ctx.ellipse(centerX, centerY + yOffset, rSub, rSub * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Continuous 360-degree rotating longitude track
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.abs(radius * Math.cos(angle)), radius, 0, 0, Math.PI * 2);
      ctx.stroke();

      angle += 0.015;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="h-[420px] rounded-3xl bg-slate-950/60 border border-slate-800/80 p-6 flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between z-10">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2 text-white">
            <Layers className="w-4 h-4 text-blue-400" />
            Rainbow Atmospheric Globe
          </h3>
          <p className="text-xs text-slate-400">Dynamic spectral temperature bands</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">3D Kinetic Mesh</span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} width={280} height={280} className="rounded-full shadow-[0_0_45px_rgba(56,189,248,0.35)]" />
      </div>

      <div className="z-10 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-red-500"></span>
          <span>Spectrum: -10°C to +45°C</span>
        </div>
        <span>Continuous 360° Telemetry</span>
      </div>
    </div>
  );
}