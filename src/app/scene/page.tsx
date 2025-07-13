
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Plus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type LayerName = 'sky' | 'trees' | 'land' | 'water';

interface DroppedImage {
  id: string;
  src: string;
  x: number;
  y: number;
}

interface Layers {
  sky: DroppedImage[];
  trees: DroppedImage[];
  land: DroppedImage[];
  water: DroppedImage[];
}

export default function ScenePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [savedCreations] = useLocalStorage<string[]>("saved-creations", []);
  const [layers, setLayers] = useLocalStorage<Layers>("scene-layers", {
    sky: [],
    trees: [],
    land: [],
    water: [],
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, src: string) => {
    e.dataTransfer.setData("imageSrc", src);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, layer: LayerName) => {
    e.preventDefault();
    const src = e.dataTransfer.getData("imageSrc");
    if (!src) return;

    const targetRect = e.currentTarget.getBoundingClientRect();
    
    // The image size is fixed for now, we can make this dynamic if needed
    const imageWidth = 150; 
    const imageHeight = 112;
    
    // Calculate position relative to the drop target (the layer div)
    const x = e.clientX - targetRect.left - (imageWidth / 2);
    const y = e.clientY - targetRect.top - (imageHeight / 2);

    const newImage: DroppedImage = {
      id: `${layer}-${Date.now()}`,
      src,
      x,
      y,
    };

    setLayers(prevLayers => ({
      ...prevLayers,
      [layer]: [...prevLayers[layer], newImage],
    }));
    
    setIsPanelOpen(false); // Auto-close panel after drop
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is necessary to allow dropping
  };
  
  const deleteDroppedImage = (layerName: LayerName, imageId: string) => {
    setLayers(prevLayers => ({
      ...prevLayers,
      [layerName]: prevLayers[layerName].filter(image => image.id !== imageId),
    }));
  };

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
      <div 
        className={cn(
          "bg-card border-r transition-all duration-300 ease-in-out",
          isPanelOpen ? "w-80 p-4" : "w-0 p-0"
        )}
      >
        {isPanelOpen && (
          <Card className="h-full w-full rounded-none border-0 mt-4">
            <CardHeader>
              <CardTitle>Your Creations</CardTitle>
              <CardDescription>Drag a drawing onto a layer.</CardDescription>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-120px)]">
              <CardContent>
                <div className="py-4 grid grid-cols-2 gap-4">
                  {savedCreations.length > 0 ? (
                    savedCreations.map((src, index) => (
                      <div key={`${src.slice(-10)}-${index}`} className="cursor-grab active:cursor-grabbing group relative">
                        <Image
                          src={src}
                          alt={`Saved creation ${index + 1}`}
                          width={150}
                          height={112}
                          className="object-cover w-full h-full rounded-md border"
                          draggable
                          onDragStart={(e) => handleDragStart(e, src)}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground col-span-2 text-center">No saved drawings found. Go to the "Draw" page to create some!</p>
                  )}
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        )}
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0 w-[200%] h-full flex">
          <Image
            src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
            alt="Scene background"
            width={3840}
            height={1080}
            className="w-full h-full object-cover animate-scroll-left"
            priority
          />
        </div>

        <div className="absolute inset-0">
          {layerConfigs.map(config => (
            <div
              key={config.name}
              onDrop={(e) => handleDrop(e, config.name)}
              onDragOver={handleDragOver}
              className={cn(
                "absolute left-0 w-full border-2 border-transparent transition-all duration-300",
                config.hoverClass
              )}
              style={config.style}
              title={config.title}
            >
              {layers[config.name].map(image => (
                <div 
                  key={image.id}
                  className="absolute group"
                  style={{ left: `${image.x}px`, top: `${image.y}px`, width: 150, height: 112 }}
                >
                  <Image
                    src={image.src}
                    alt="Dropped drawing"
                    width={150} 
                    height={112}
                    className="pointer-events-none rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10"
                    onClick={() => deleteDroppedImage(config.name, image.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <Button
          variant="default"
          className="absolute bottom-6 right-6 z-20 rounded-full h-14 w-14 shadow-lg"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Drawing</span>
        </Button>
      </div>
    </div>
  );
}
