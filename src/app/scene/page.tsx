"use client";

import Image from "next/image";

export default function ScenePage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex w-max animate-scroll-left">
        <div className="flex-shrink-0">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Scrolling scene background"
            width={1920}
            height={1080}
            className="h-[calc(100vh-64px)] w-auto"
            data-ai-hint="forest landscape"
            priority
          />
        </div>
        <div className="flex-shrink-0">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Scrolling scene background"
            width={1920}
            height={1080}
            className="h-[calc(100vh-64px)] w-auto"
            data-ai-hint="forest landscape"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
