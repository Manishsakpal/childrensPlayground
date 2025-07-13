
"use client";

import React, { useState, useEffect, DragEvent, MouseEvent as ReactMouseEvent, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, XCircle, MinusCircle, PlusCircle, Play, Pause } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSceneContext } from "@/contexts/SceneContext";

type LayerName = 'sky' | 'trees' | 'land' | 'water';

interface DroppedImage {
  id: string;
  src: string;
  layer: LayerName;
  x: number;
  y: number;
  width: number;
  height: number;
  isPaused: boolean;
}

interface MovedImageState {
  id: string;
  offsetX: number;
  offsetY: number;
}

interface DraggedItem {
  src: string;
  offsetX: number;
  offsetY: number;
}

export default function ScenePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [savedCreations] = useLocalStorage<string[]>("saved-creations", []);
  const [droppedImages, setDroppedImages] = useState<DroppedImage[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [movedImage, setMovedImage] = useState<MovedImageState | null>(null);
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  
  const { movementMultiplier, isMovementEnabled } = useSceneContext();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const layerConfigs: { name: LayerName; style: React.CSSProperties; }[] = [
    { name: 'sky', style: { top: '0%', height: '25%' } },
    { name: 'trees', style: { top: '25%', height: '30%' } },
    { name: 'land', style: { top: '55%', height: '27%' } },
    { name: 'water', style: { top: '82%', height: '18%' } },
  ];
  
  const handleDragStart = (e: DragEvent<HTMLImageElement>, src: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedItem({ 
      src,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
    setIsPanelOpen(false);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, layer: LayerName) => {
    e.preventDefault();
    if (!draggedItem) return;

    const layerRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - layerRect.left - draggedItem.offsetX;
    const y = e.clientY - layerRect.top - draggedItem.offsetY;

    setDroppedImages(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, src: draggedItem.src, layer, x, y, width: 100, height: 75, isPaused: false }
    ]);

    setDraggedItem(null);
  };
  
  const handleDeleteImage = (id: string) => {
    setDroppedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleChangeSize = (id: string, factor: number) => {
    setDroppedImages(prev => prev.map(img => {
      if (img.id === id) {
        const aspectRatio = img.width / img.height;
        const newWidth = img.width + 10 * factor;
        const newHeight = newWidth / aspectRatio;
        return { ...img, width: newWidth, height: newHeight };
      }
      return img;
    }));
  };

  const handleTogglePause = (id: string) => {
    setDroppedImages(prev => prev.map(img => 
      img.id === id ? { ...img, isPaused: !img.isPaused } : img
    ));
  };
  
  const handleMouseDownOnImage = (e: ReactMouseEvent<HTMLDivElement>, img: DroppedImage) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    const layerElement = (e.currentTarget as HTMLElement).parentElement;
    if (!layerElement) return;

    const layerRect = layerElement.getBoundingClientRect();
    
    setMovedImage({
      id: img.id,
      offsetX: e.clientX - layerRect.left - img.x,
      offsetY: e.clientY - layerRect.top - img.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!movedImage) return;

    e.preventDefault();
    e.stopPropagation();

    setDroppedImages(prev => prev.map(img => {
      if (img.id === movedImage.id) {
        const parentLayer = document.querySelector(`[data-layer-name="${img.layer}"]`) as HTMLElement;
        if (!parentLayer) return img;

        const layerRect = parentLayer.getBoundingClientRect();
        
        let newX = e.clientX - layerRect.left - movedImage.offsetX;
        let newY = e.clientY - layerRect.top - movedImage.offsetY;

        newX = Math.max(0, Math.min(newX, layerRect.width - img.width));
        newY = Math.max(0, Math.min(newY, layerRect.height - img.height));

        return { ...img, x: newX, y: newY };
      }
      return img;
    }));
  }, [movedImage]);
  
  const handleMouseUp = useCallback(() => {
    setMovedImage(null);
  }, []);

  useEffect(() => {
    if (movedImage) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [movedImage, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!isMounted || movedImage || !isMovementEnabled) return;

    const effectiveMultiplier = Math.max(0.1, movementMultiplier);
    const intervalDuration = 1000 / effectiveMultiplier;

    const intervalId = setInterval(() => {
      setDroppedImages(currentImages => {
        if (currentImages.length === 0) return [];
        
        return currentImages.map(img => {
          if (img.isPaused || img.id === hoveredImageId || movedImage?.id === img.id) {
            return img; 
          }

          const parentLayer = document.querySelector(`[data-layer-name="${img.layer}"]`) as HTMLElement;
          if (!parentLayer) return img;
          
          const layerRect = parentLayer.getBoundingClientRect();
          const moveX = (Math.random() - 0.5) * 100;
          const moveY = (Math.random() - 0.5) * 100;

          let newX = img.x + moveX;
          let newY = img.y + moveY;
          
          newX = Math.max(0, Math.min(newX, layerRect.width - img.width));
          newY = Math.max(0, Math.min(newY, layerRect.height - img.height));

          return { ...img, x: newX, y: newY };
        });
      });
    }, intervalDuration);

    return () => clearInterval(intervalId);
  }, [isMounted, movedImage, movementMultiplier, isMovementEnabled, hoveredImageId]);


  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl text-muted-foreground">Loading Scene...</div>
      </div>
    );
  }

  return (
    <div className="bg-background overflow-hidden relative h-[calc(100vh-4rem)]">
      <div 
        className={cn(
          "absolute top-0 left-0 h-full w-80 bg-background/80 backdrop-blur-sm z-30 transition-transform duration-300 ease-in-out",
          isPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Card className="w-full h-full rounded-none border-0 border-r bg-transparent shadow-none">
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
      </div>

      <div className="absolute inset-0 flex w-[200%] animate-marquee">
          <div className="w-1/2 h-full flex-shrink-0 relative">
            <Image
              src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
              alt="Scene background"
              fill
              className="object-cover w-full h-full"
              priority
              data-ai-hint="fantasy landscape"
            />
          </div>
          <div className="w-1/2 h-full flex-shrink-0 relative">
            <Image
              src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
              alt="Scene background"
              fill
              className="object-cover w-full h-full"
              priority
              aria-hidden="true"
              data-ai-hint="fantasy landscape"
            />
          </div>
      </div>

      <div className="absolute inset-0 z-10">
        {layerConfigs.map(config => (
          <div
            key={config.name}
            data-layer-name={config.name}
            className="absolute left-0 w-full"
            style={config.style}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, config.name)}
          >
            {droppedImages
              .filter(img => img.layer === config.name)
              .map(img => (
                <div 
                  key={img.id} 
                  className={cn(
                    "absolute group",
                    movedImage?.id === img.id ? "cursor-grabbing z-30" : "cursor-grab z-20"
                  )}
                  style={{ 
                    left: img.x, 
                    top: img.y, 
                    width: img.width, 
                    height: img.height,
                    transition: isMovementEnabled && !movedImage && !img.isPaused ? `left ${1/movementMultiplier}s ease-in-out, top ${1/movementMultiplier}s ease-in-out` : 'none'
                  }}
                  onMouseDown={(e) => handleMouseDownOnImage(e, img)}
                  onMouseEnter={() => setHoveredImageId(img.id)}
                  onMouseLeave={() => setHoveredImageId(null)}
                >
                  <Image
                    src={img.src}
                    alt="Dropped creation"
                    width={img.width}
                    height={img.height}
                    className={cn(
                      "object-contain pointer-events-none w-full h-full",
                        movedImage?.id === img.id && "opacity-75"
                    )}
                  />
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                      <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-background hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePause(img.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      >
                        {img.isPaused ? <Play className="h-4 w-4"/> : <Pause className="h-4 w-4"/>}
                      </Button>
                      <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-background hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeSize(img.id, -1);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                      <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-background hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeSize(img.id, 1);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(img.id);
                        }
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ))}
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
