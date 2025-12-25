
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shield, ArrowRight, Sparkles, Zap, Cpu, Activity, Globe } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [prompt, setPrompt] = useState('Analyze my fleet for latency spikes and cost drift...');
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let globe: THREE.Mesh, dots: THREE.Points;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const container = canvasContainerRef.current;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 11;
      camera.position.y = -3; // Positioned low for "half-globe" look

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Create Globe Geometry
      const geometry = new THREE.SphereGeometry(8, 64, 64);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x818cf8, // indigo-400 for slightly more brilliance
        wireframe: true,
        transparent: true,
        opacity: 0.20 // Increased from 0.12
      });
      
      globe = new THREE.Mesh(geometry, wireframeMaterial);
      scene.add(globe);

      // Create Dots (Particles on surface)
      const dotGeometry = new THREE.BufferGeometry();
      const dotPositions = [];
      const dotCount = 2000;
      
      for (let i = 0; i < dotCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / dotCount);
        const theta = Math.sqrt(dotCount * Math.PI) * phi;
        const r = 8.05;
        const x = r * Math.cos(theta) * Math.sin(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(phi);
        dotPositions.push(x, y, z);
      }
      
      dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
      const dotMaterial = new THREE.PointsMaterial({
        color: 0x818cf8, // indigo-400
        size: 0.05, // Slightly larger from 0.04
        transparent: true,
        opacity: 0.8, // Increased from 0.6
        sizeAttenuation: true
      });
      
      dots = new THREE.Points(dotGeometry, dotMaterial);
      scene.add(dots);

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const handleMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX - window.innerWidth / 2) / 100;
        mouseY = (event.clientY - window.innerHeight / 2) / 100;
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('mousemove', handleMouseMove);

      const animate = () => {
        requestAnimationFrame(animate);

        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        globe.rotation.y += 0.0012; // Slightly faster rotation
        dots.rotation.y += 0.0012;

        // Apply parallax tilt
        globe.rotation.z = targetX * 0.05;
        globe.rotation.x = 0.5 + (targetY * 0.05); 
        
        dots.rotation.z = targetX * 0.05;
        dots.rotation.x = 0.5 + (targetY * 0.05);

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    return init();
  }, []);

  return (
    <div className="h-screen bg-[#06070a] text-white overflow-hidden relative font-sans selection:bg-indigo-500/30 flex flex-col">
      
      {/* 3D Half-Globe Background Container */}
      <div 
        ref={canvasContainerRef} 
        className="absolute inset-0 pointer-events-none z-0"
      />
      
      {/* Gradient mask to fade the globe bottom into the UI */}
      <div className="absolute inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_50%_120%,transparent_0%,#06070a_85%)]" />

      {/* Atmospheric Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[120%] h-[70%] bg-[radial-gradient(circle_at_center,rgba(67,56,202,0.15)_0%,transparent_70%)] rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-12 py-8 w-full max-w-7xl mx-auto shrink-0">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10 transition-transform group-hover:scale-110">
            <Shield size={22} className="text-indigo-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">sentinel</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {['Datadog', 'Google Gemini', 'GCP'].map((item) => (
            <span key={item} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 cursor-default select-none hover:text-gray-400 transition-colors">
              {item}
            </span>
          ))}
        </div>

        <button 
          onClick={onStart}
          className="group relative px-6 py-2.5 bg-white text-black font-bold text-sm rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10 group-hover:text-white transition-colors">Get Started</span>
          <ArrowRight size={16} className="relative z-10 group-hover:text-white transition-colors" />
        </button>
      </nav>

      {/* Hero Content - Centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated Badge */}
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="relative">
               <Globe size={16} className="text-indigo-400 animate-spin-slow" style={{ animationDuration: '20s' }} />
               <div className="absolute inset-0 bg-indigo-400 blur-md opacity-50 animate-pulse" />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Sentinel Kernel</span>
            <div className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-tighter border border-indigo-500/30">Stable v3.0</div>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl space-y-4 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30 drop-shadow-2xl">
            Observability beyond <br className="hidden md:block" />
            imagination.
          </h1>
          <p className="text-sm md:text-lg text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
            Autonomous intelligence for your AI stack. <br/>
            Real-time latency, cost, and hallucination monitoring via Gemini & Datadog.
          </p>
        </div>

        {/* The Prompt Bar */}
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative flex items-center bg-[#111218]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-1.5 pl-8 pr-1.5 shadow-2xl overflow-hidden">
               <Sparkles size={20} className="text-indigo-400 mr-4 shrink-0" />
               <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1 text-sm md:text-base font-medium text-gray-200 placeholder-gray-600"
               />
               <button 
                  onClick={onStart}
                  className="bg-white text-black px-8 py-3 rounded-[1.5rem] font-bold text-sm transition-all hover:bg-gray-100 flex items-center gap-3 group/btn"
               >
                  Generate
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Footer / Partners */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-12 py-10 border-t border-white/5 shrink-0 animate-in fade-in duration-1000 delay-700">
        <div className="flex items-center justify-center gap-12 md:gap-24 grayscale opacity-30 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 font-black text-[10px] tracking-[0.3em] text-gray-400 cursor-default select-none"><Zap size={14} /> DATADOG</div>
           <div className="flex items-center gap-2 font-black text-[10px] tracking-[0.3em] text-gray-400 cursor-default select-none"><Cpu size={14} /> GOOGLE GEMINI</div>
           <div className="flex items-center gap-2 font-black text-[10px] tracking-[0.3em] text-gray-400 cursor-default select-none"><Activity size={14} /> GOOGLE CLOUD</div>
        </div>
      </footer>

      {/* Sub-grid Overlay for texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
};

export default LandingPage;
