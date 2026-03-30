"use client";

import dynamic from "next/dynamic";

const StepperScene = dynamic(() => import("@/components/StepperScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border border-[#C8A96E]/30 rounded-full mx-auto mb-6 relative">
          <div className="absolute inset-2 border border-[#C8A96E]/60 rounded-full animate-ping" />
          <div className="absolute inset-4 bg-[#C8A96E]/20 rounded-full" />
        </div>
        <p className="text-[#C8A96E]/60 text-xs tracking-[0.3em] uppercase font-mono">
          Initializing Engine
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen bg-[#050505] overflow-hidden">
      <StepperScene />
    </main>
  );
}
