"use client";

import Image from "next/image";

export default function ScenePage() {
  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute top-0 left-0 flex w-[200%] h-full animate-scroll-left">
        <div className="relative w-full h-full">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Forest scene"
            fill
            sizes="200vw"
            style={{ objectFit: 'cover' }}
            data-ai-hint="forest landscape"
            priority
          />
        </div>
        <div className="relative w-full h-full">
          <Image
            src="https://placehold.co/1920x1080.png"
            alt="Forest scene"
            fill
            sizes="200vw"
            style={{ objectFit: 'cover' }}
            data-ai-hint="forest landscape"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
