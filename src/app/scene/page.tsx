"use client";

import Image from "next/image";

export default function ScenePage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex w-max animate-scroll-left">
        <div className="flex-shrink-0">
          <Image
            src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
            alt="Scrolling scene background"
            width={1920}
            height={1080}
            className="h-[calc(100vh-64px)] w-auto"
            priority
          />
        </div>
        <div className="flex-shrink-0">
          <Image
            src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
            alt="Scrolling scene background"
            width={1920}
            height={1080}
            className="h-[calc(100vh-64px)] w-auto"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
