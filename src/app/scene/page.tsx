import Image from "next/image";

export default function ScenePage() {
  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <div className="absolute top-0 left-0 flex w-[200%] h-full">
        <div className="relative w-1/2 h-full animate-scroll-left">
          <Image
            src="/background-scene.jpg"
            alt="Forest scene"
            layout="fill"
            objectFit="cover"
            className="w-full h-full"
            data-ai-hint="forest landscape"
          />
        </div>
        <div className="relative w-1/2 h-full animate-scroll-left">
          <Image
            src="/background-scene.jpg"
            alt="Forest scene"
            layout="fill"
            objectFit="cover"
            className="w-full h-full"
            data-ai-hint="forest landscape"
          />
        </div>
      </div>
    </div>
  );
}
