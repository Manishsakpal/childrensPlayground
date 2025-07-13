
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LayerName = 'sky' | 'trees' | 'land' | 'water';

export default function ScenePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const layerConfigs: { name: LayerName; style: React.CSSProperties; title: string; hoverClass: string }[] = [
    { name: 'sky', style: { top: '0%', height: '25%' }, title: 'Sky Layer (25%)', hoverClass: 'hover:border-blue-300 hover:bg-blue-300/10' },
    { name: 'trees', style: { top: '25%', height: '30%' }, title: 'Trees Layer (30%)', hoverClass: 'hover:border-green-400 hover:bg-green-400/10' },
    { name: 'land', style: { top: '55%', height: '27%' }, title: 'Green Land Layer (27%)', hoverClass: 'hover:border-yellow-400 hover:bg-yellow-400/10' },
    { name: 'water', style: { top: '82%', height: '18%' }, title: 'Water Layer (18%)', hoverClass: 'hover:border-cyan-400 hover:bg-cyan-400/10' },
  ];

  if (!isMounted) {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-2xl text-muted-foreground">Loading Scene...</div>
        </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 w-[200%] h-full flex">
          <Image
            src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
            alt="Scene background"
            width={3840}
            height={1080}
            className="w-full h-full object-contain animate-scroll-left"
            priority
          />
          <Image
            src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
            alt="Scene background"
            width={3840}
            height={1080}
            className="w-full h-full object-contain animate-scroll-left"
            priority
            aria-hidden="true"
          />
        </div>

        <div className="absolute inset-0">
          {layerConfigs.map(config => (
            <div
              key={config.name}
              className={cn(
                "absolute left-0 w-full border-2 border-transparent transition-all duration-300",
                config.hoverClass
              )}
              style={config.style}
              title={config.title}
            >
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
