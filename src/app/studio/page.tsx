"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import useLocalStorage from "@/hooks/use-local-storage";
import { Toolbox } from "@/components/toolbox";
import { cn } from "@/lib/utils";
import { Layers, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tool = "pen" | "fill";
const NUM_LAYERS = 4;

export default function StudioPage() {
  const [drawings] = useLocalStorage<string[]>("drawings", []);
  const [activeLayer, setActiveLayer] = useState(0);

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<Tool>("pen");
  const { toast } = useToast();

  const [history, setHistory] = useState<ImageData[][]>(Array(NUM_LAYERS).fill([]));
  const [historyIndex, setHistoryIndex] = useState<number[]>(Array(NUM_LAYERS).fill(-1));
  
  const [isDrawing, setIsDrawing] = useState(false);

  const getActiveCanvasContext = useCallback(() => {
    const canvas = canvasRefs.current[activeLayer];
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, [activeLayer]);
  
  const saveToHistory = useCallback(() => {
    const ctx = getActiveCanvasContext();
    if (!ctx) return;
    const canvas = ctx.canvas;
    
    const newHistoryForLayer = history[activeLayer].slice(0, historyIndex[activeLayer] + 1);
    newHistoryForLayer.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    const newHistory = [...history];
    newHistory[activeLayer] = newHistoryForLayer;
    setHistory(newHistory);
    
    const newHistoryIndex = [...historyIndex];
    newHistoryIndex[activeLayer] = newHistoryForLayer.length - 1;
    setHistoryIndex(newHistoryIndex);

  }, [getActiveCanvasContext, history, historyIndex, activeLayer]);
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const imgSrc = e.dataTransfer.getData("imageSrc");
    if (!imgSrc || !containerRef.current) return;

    const ctx = getActiveCanvasContext();
    if (!ctx) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const img = document.createElement("img");
    img.src = imgSrc;
    img.onload = () => {
      ctx.drawImage(img, x - img.width / 2, y - img.height / 2);
      saveToHistory();
    };
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLImageElement>, src: string) => {
    e.dataTransfer.setData("imageSrc", src);
  };
  
  const clearLayer = () => {
    const ctx = getActiveCanvasContext();
    if(!ctx) return;
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    saveToHistory();
    toast({ title: `Layer ${activeLayer + 1} cleared.` });
  }

  const undo = () => {
    const layerHistoryIndex = historyIndex[activeLayer];
    if (layerHistoryIndex > 0) {
      const newIndex = layerHistoryIndex - 1;
      const ctx = getActiveCanvasContext();
      if (ctx) {
        ctx.putImageData(history[activeLayer][newIndex], 0, 0);
        const newHistoryIndex = [...historyIndex];
        newHistoryIndex[activeLayer] = newIndex;
        setHistoryIndex(newHistoryIndex);
      }
    }
  };

  const redo = () => {
    const layerHistoryIndex = historyIndex[activeLayer];
    const layerHistory = history[activeLayer];
    if (layerHistoryIndex < layerHistory.length - 1) {
      const newIndex = layerHistoryIndex + 1;
      const ctx = getActiveCanvasContext();
      if (ctx) {
        ctx.putImageData(history[activeLayer][newIndex], 0, 0);
        const newHistoryIndex = [...historyIndex];
        newHistoryIndex[activeLayer] = newIndex;
        setHistoryIndex(newHistoryIndex);
      }
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRefs.current[activeLayer];
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e.nativeEvent) {
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = getActiveCanvasContext();
    if (!ctx) return;
    const pos = getPos(e);
    if (!pos) return;

    if (tool === "pen") {
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool !== "pen") return;
    const ctx = getActiveCanvasContext();
    if (!ctx) return;
    const pos = getPos(e);
    if (!pos) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getActiveCanvasContext();
    if (!ctx) return;
    if (isDrawing) {
      ctx.closePath();
      saveToHistory();
    }
    setIsDrawing(false);
  };
  
  useEffect(() => {
    const resizeCanvases = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRefs.current.forEach((canvas) => {
          if (canvas) {
            canvas.width = width;
            canvas.height = height;
          }
        });
      }
    };
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, []);

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-80px)]">
      <Card className="w-full md:w-80 order-2 md:order-1">
        <CardHeader>
          <CardTitle>Studio Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Layers</Label>
                <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: NUM_LAYERS }).map((_, i) => (
                    <Button
                    key={i}
                    variant={activeLayer === i ? "secondary" : "outline"}
                    onClick={() => setActiveLayer(i)}
                    >
                    <Layers className="mr-2 h-4 w-4" /> Layer {i + 1}
                    </Button>
                ))}
                </div>
            </div>
            <Toolbox
                color={color}
                setColor={setColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                tool={tool}
                setTool={() => { /* Studio only supports pen for now */ setTool("pen") }}
                undo={undo}
                redo={redo}
                clear={clearLayer}
                save={() => toast({ title: "Use the main 'Draw' page to save new creations.", variant: "default" })}
                canUndo={historyIndex[activeLayer] > 0}
                canRedo={historyIndex[activeLayer] < history[activeLayer].length - 1}
            />
        </CardContent>
      </Card>
      
      <div className="flex-grow flex flex-col gap-4 order-1 md:order-2">
        <Card className="flex-grow flex flex-col" ref={containerRef}>
          <div className="relative w-full h-full" onDrop={handleDrop} onDragOver={handleDragOver}>
            <Image
              src="https://placehold.co/1200x800.png"
              data-ai-hint="abstract landscape"
              alt="Background"
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
            {Array.from({ length: NUM_LAYERS }).map((_, i) => (
              <canvas
                key={i}
                ref={(el) => (canvasRefs.current[i] = el)}
                className={cn(
                  "absolute top-0 left-0 w-full h-full cursor-crosshair",
                  activeLayer === i ? "z-10 ring-2 ring-primary ring-offset-2 rounded-md" : "z-0 pointer-events-none"
                )}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            ))}
          </div>
        </Card>
      </div>

      <Card className="w-full md:w-64 order-3">
        <CardHeader>
          <CardTitle>Creations</CardTitle>
        </CardHeader>
        <CardContent>
          {drawings.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">No saved drawings found.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {drawings.map((src, index) => (
                  <div key={index} className="flex justify-center">
                    <img
                      src={src}
                      alt={`Drawing ${index + 1}`}
                      className="w-48 h-48 object-contain border bg-white rounded-md shadow-sm cursor-grab"
                      draggable
                      onDragStart={(e) => handleDragStart(e, src)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
