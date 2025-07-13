
"use client";

import React from "react";
import Image from "next/image";

export default function ScenePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-800">
      <div className="flex-grow flex relative">
        <div className="relative w-full h-full bg-gray-700">
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="w-full h-full animate-scroll-left flex">
                    <div className="relative w-full h-full flex-shrink-0">
                        <Image
                        src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
                        alt="Scrolling scene background"
                        layout="fill"
                        objectFit="cover"
                        priority
                        />
                    </div>
                    <div className="relative w-full h-full flex-shrink-0">
                        <Image
                        src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
                        alt="Scrolling scene background"
                        layout="fill"
                        objectFit="cover"
                        aria-hidden="true"
                        />
                    </div>
                </div>
            </div>
            
            {/* Transparent Layers */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Sky Layer */}
                <div 
                    className="absolute top-0 left-0 w-full h-[25%] border-2 border-transparent hover:border-blue-300 hover:bg-blue-300/10 transition-all duration-300"
                    title="Sky Layer (25%)"
                ></div>

                {/* Trees Layer */}
                <div 
                    className="absolute top-[25%] left-0 w-full h-[30%] border-2 border-transparent hover:border-green-400 hover:bg-green-400/10 transition-all duration-300"
                    title="Trees Layer (30%)"
                ></div>

                {/* Green Land Layer */}
                <div 
                    className="absolute top-[55%] left-0 w-full h-[27%] border-2 border-transparent hover:border-yellow-400 hover:bg-yellow-400/10 transition-all duration-300"
                    title="Green Land Layer (27%)"
                ></div>

                {/* Water Layer */}
                <div 
                    className="absolute bottom-0 left-0 w-full h-[18%] border-2 border-transparent hover:border-cyan-400 hover:bg-cyan-400/10 transition-all duration-300"
                    title="Water Layer (18%)"
                ></div>
            </div>
        </div>
      </div>
    </div>
  );
}
