
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

type Tool = "pen" | "fill" | "eraser" | "move";
type Layer = {
  id: number;
  name: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  history: ImageData[];
  historyIndex: number;
  isVisible: boolean;
  transform: {
    x: number;
    y: number;
    scale: number;
  };
};

export default function ScenePage() {
  const [tool, setTool] = useState<Tool>("pen");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);


  const [savedCreations] = useLocalStorage<string[]>("saved-creations", []);
  
  const addLayer = useCallback((imageDataUrl?: string) => {
    const newId = layers.length > 0 ? Math.max(...layers.map(l => l.id)) + 1 : 1;
    
    const newLayer: Layer = {
      id: newId,
      name: `Layer ${newId}`,
      canvasRef: React.createRef<HTMLCanvasElement>(),
      history: [],
      historyIndex: -1,
      isVisible: true,
      transform: { x: 0, y: 0, scale: 1 },
    };

    const initializeLayer = (img?: HTMLImageElement) => {
      const canvas = newLayer.canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            let initialImageData;
            if (img) {
              ctx.drawImage(img, 0, 0);
              initialImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } else {
              initialImageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            newLayer.history = [initialImageData];
            newLayer.historyIndex = 0;

            setLayers(prev => [...prev, newLayer]);
            setActiveLayerId(newId);

            if (imageDataUrl) {
                setTool("move");
            }
        }
      }
    };
    
    if (imageDataUrl) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          initializeLayer(img);
        };
        img.src = imageDataUrl;
    } else {
        setTimeout(() => initializeLayer(), 0);
    }
  }, [layers]);
  
  useEffect(() => {
    if (layers.length === 0) {
        addLayer();
    }
  }, [layers.length, addLayer]);

  const getActiveLayer = useCallback(() => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  const updateLayerHistory = useCallback((layerId: number, newHistory: ImageData[], newIndex: number) => {
    setLayers(currentLayers => currentLayers.map(l => 
        l.id === layerId ? { ...l, history: newHistory, historyIndex: newIndex } : l
    ));
  }, []);

  const saveToHistory = useCallback(() => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.canvasRef.current) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;
    
    const newHistory = activeLayer.history.slice(0, activeLayer.historyIndex + 1);
    const newImageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (activeLayer.historyIndex > -1) {
        const lastImageData = newHistory[activeLayer.historyIndex];
        if (lastImageData && newImageData.data.toString() === lastImageData.data.toString()) {
            return;
        }
    }
    
    const updatedHistory = [...newHistory, newImageData];
    updateLayerHistory(activeLayer.id, updatedHistory, updatedHistory.length - 1);
  }, [getActiveLayer, updateLayerHistory]);

  const restoreFromHistory = useCallback((layer: Layer) => {
    if (!layer.canvasRef.current || layer.history.length === 0 || layer.historyIndex < 0) return;
    const context = layer.canvasRef.current.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.putImageData(layer.history[layer.historyIndex], 0, 0);
  }, []);

  useEffect(() => {
    layers.forEach(layer => {
      if(layer.historyIndex >= 0) {
        restoreFromHistory(layer);
      }
    })
  }, [layers, restoreFromHistory]);

  const startInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.isVisible) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    
    const rect = viewport.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    
    if (tool === 'move') {
      setIsDragging(true);
      dragStartPos.current = { 
        x: x - activeLayer.transform.x, 
        y: y - activeLayer.transform.y 
      };
      return;
    }
    
    if (!activeLayer.canvasRef.current) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;

    const layerX = (x - activeLayer.transform.x) / activeLayer.transform.scale;
    const layerY = (y - activeLayer.transform.y) / activeLayer.transform.scale;

    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);
      context.beginPath();
      context.moveTo(layerX, layerY);
      context.lineWidth = 5 / activeLayer.transform.scale;
      context.lineCap = "round";
      context.lineJoin = "round";
      
      if (tool === "pen") {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = "#000000";
      } else { // Eraser
        context.globalCompositeOperation = "destination-out";
      }
    }
  };

  const onInteract = (e: React.MouseEvent<HTMLDivElement>) => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.isVisible) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    if (isDragging && tool === 'move') {
      setLayers(layers => layers.map(l => 
        l.id === activeLayerId 
          ? { ...l, transform: { ...l.transform, x: x - dragStartPos.current.x, y: y - dragStartPos.current.y } } 
          : l
      ));
      return;
    }
    
    if (isDrawing && (tool === "pen" || tool === "eraser")) {
      if (!activeLayer.canvasRef.current) return;
      const context = activeLayer.canvasRef.current.getContext("2d");
      if (!context) return;
      const layerX = (x - activeLayer.transform.x) / activeLayer.transform.scale;
      const layerY = (y - activeLayer.transform.y) / activeLayer.transform.scale;
      context.lineTo(layerX, layerY);
      context.stroke();
    }
  };

  const stopInteraction = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    
    if (isDrawing) {
      const activeLayer = getActiveLayer();
      if (!activeLayer || !activeLayer.canvasRef.current) return;
      const context = activeLayer.canvasRef.current.getContext("2d");
      if (!context) return;
      context.closePath();
      setIsDrawing(false);
      saveToHistory();
      context.globalCompositeOperation = "source-over";
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-800">
      <div className="flex-grow flex relative">
        <div className="absolute left-4 top-4 z-20">
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Plus className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle>Add Drawing</SheetTitle>
                </SheetHeader>
                    <div className="grid grid-cols-2 gap-2 p-4 max-h-[calc(100vh-80px)] overflow-y-auto">
                    {savedCreations.map((src, index) => (
                    <div key={`${src.slice(0, 20)}-${index}`} className="relative group">
                        <button
                        onClick={() => addLayer(src)}
                        className="block w-full h-full rounded-md overflow-hidden border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none"
                        >
                        <Image
                            src={src}
                            alt={`Saved creation ${index + 1}`}
                            width={150}
                            height={112}
                            className="object-cover w-full h-full"
                        />
                        </button>
                    </div>
                    ))}
                </div>
            </SheetContent>
            </Sheet>
        </div>
        <div 
            ref={viewportRef}
            className="relative w-full h-full bg-gray-700"
            style={{ 
              cursor: tool === 'move' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair'
            }}
            onMouseDown={startInteraction}
            onMouseMove={onInteract}
            onMouseUp={stopInteraction}
            onMouseLeave={stopInteraction}
        >
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

            {layers.map(layer => (
              <canvas
                key={layer.id}
                ref={layer.canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className={cn("absolute top-0 left-0 pointer-events-none origin-top-left", {
                    'opacity-0': !layer.isVisible,
                    'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800': activeLayerId === layer.id && tool === 'move'
                })}
                style={{
                  transform: `translate(${layer.transform.x}px, ${layer.transform.y}px) scale(${layer.transform.scale})`,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
