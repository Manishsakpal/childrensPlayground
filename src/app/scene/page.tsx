
"use client";

import React, { useState, useEffect, DragEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type LayerName = 'sky' | 'trees' | 'land' | 'water';

interface DroppedImage {
  id: string;
  src: string;
  layer: LayerName;
  x: number;
  y: number;
}

export default function ScenePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [savedCreations] = useLocalStorage<string[]>("saved-creations", []);
  const [droppedImages, setDroppedImages] = useState<DroppedImage[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ src: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const layerConfigs: { name: LayerName; style: React.CSSProperties; title: string; hoverClass: string }[] = [
    { name: 'sky', style: { top: '0%', height: '25%' }, title: 'Sky Layer (25%)', hoverClass: 'hover:border-blue-300 hover:bg-blue-300/10' },
    { name: 'trees', style: { top: '25%', height: '30%' }, title: 'Trees Layer (30%)', hoverClass: 'hover:border-green-400 hover:bg-green-400/10' },
    { name: 'land', style: { top: '55%', height: '27%' }, title: 'Green Land Layer (27%)', hoverClass: 'hover:border-yellow-400 hover:bg-yellow-400/10' },
    { name: 'water', style: { top: '82%', height: '18%' }, title: 'Water Layer (18%)', hoverClass: 'hover:border-cyan-400 hover:bg-cyan-400/10' },
  ];
  
  const handleDragStart = (e: DragEvent<HTMLImageElement>, src: string) => {
    setDraggedItem({ src });
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, layer: LayerName) => {
    e.preventDefault();
    if (!draggedItem) return;

    const layerRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - layerRect.left;
    const y = e.clientY - layerRect.top;

    setDroppedImages(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, src: draggedItem.src, layer, x, y }
    ]);

    setDraggedItem(null);
    setIsPanelOpen(false); // Close panel after drop
  };
  
  const handleDeleteImage = (id: string) => {
    setDroppedImages(prev => prev.filter(img => img.id !== id));
  };


  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl text-muted-foreground">Loading Scene...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
        
      {isPanelOpen && (
        <Card className="w-80 h-full rounded-none border-0 border-r-2 z-20">
          <CardHeader>
            <CardTitle>Your Creations</CardTitle>
            <CardDescription>Drag a drawing onto a layer.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="grid grid-cols-2 gap-4 pr-4">
                {savedCreations.map((src, index) => (
                  <div key={`${src.slice(0, 20)}-${index}`} className="group cursor-grab">
                    <Image
                      src={src}
                      alt={`Saved creation ${index + 1}`}
                      width={150}
                      height={112}
                      className="object-cover w-full h-full rounded-md border-2 border-transparent group-hover:border-primary"
                      draggable
                      onDragStart={(e) => handleDragStart(e, src)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 flex w-[200%] animate-marquee">
          <div className="w-1/2 h-full flex-shrink-0">
            <Image
              src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
              alt="Scene background"
              layout="fill"
              objectFit="cover"
              className="w-full h-full"
              priority
            />
          </div>
          <div className="w-1/2 h-full flex-shrink-0">
            <Image
              src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
              alt="Scene background"
              layout="fill"
              objectFit="cover"
              className="w-full h-full"
              priority
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="absolute inset-0 z-10">
          {layerConfigs.map(config => (
            <div
              key={config.name}
              className={cn(
                "absolute left-0 w-full border-2 border-transparent transition-all duration-300",
                config.hoverClass
              )}
              style={config.style}
              title={config.title}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, config.name)}
            >
              {droppedImages
                .filter(img => img.layer === config.name)
                .map(img => (
                  <div 
                    key={img.id} 
                    className="absolute group"
                    style={{ left: img.x, top: img.y, transform: 'translate(-50%, -50%)' }}
                  >
                    <Image
                      src={img.src}
                      alt="Dropped creation"
                      width={100}
                      height={75}
                      className="object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      onClick={() => handleDeleteImage(img.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
      
      <Button 
        size="icon" 
        className="absolute bottom-6 right-6 z-20 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      >
        <Plus className={cn("h-8 w-8 transition-transform duration-300", isPanelOpen && "rotate-45")} />
      </Button>
    </div>
  );
}
