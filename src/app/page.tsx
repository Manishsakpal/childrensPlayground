"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import useLocalStorage from "@/hooks/use-local-storage";
import { Toolbox } from "@/components/toolbox";
import { Trash2 } from "lucide-react";
import Image from 'next/image';

type Tool = "pen" | "fill";

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<Tool>("pen");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [drawings, setDrawings] = useLocalStorage<string[]>("drawings", []);

  const { toast } = useToast();

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialImageData]);
      setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCanvasContext]);

  const saveToHistory = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx || !ctx.canvas) return;
    setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
    });
  }, [getCanvasContext, historyIndex]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCanvasContext();
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
    } else if (tool === "fill") {
      floodFill(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool !== "pen") return;
    e.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;

    const pos = getPos(e);
    if (!pos) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    if (isDrawing) {
      ctx.closePath();
      saveToHistory();
    }
    setIsDrawing(false);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };
  
  const floodFill = (startX: number, startY: number) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    const canvas = ctx.canvas;
  
    const fillColorRgb = hexToRgb(color);
    if (!fillColorRgb) return;
  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    const startPos = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
  
    if (
      fillColorRgb.r === startR &&
      fillColorRgb.g === startG &&
      fillColorRgb.b === startB
    ) {
      return;
    }
  
    const pixelStack = [[Math.floor(startX), Math.floor(startY)]];
  
    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;
      let currentPos = (y * canvas.width + x) * 4;
  
      if (
        x < 0 || x >= canvas.width ||
        y < 0 || y >= canvas.height ||
        data[currentPos] !== startR ||
        data[currentPos + 1] !== startG ||
        data[currentPos + 2] !== startB
      ) {
        continue;
      }
      
      data[currentPos] = fillColorRgb.r;
      data[currentPos + 1] = fillColorRgb.g;
      data[currentPos + 2] = fillColorRgb.b;
      data[currentPos + 3] = 255;
      
      pixelStack.push([x + 1, y]);
      pixelStack.push([x - 1, y]);
      pixelStack.push([x, y + 1]);
      pixelStack.push([x, y - 1]);
    }
  
    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.putImageData(history[newIndex], 0, 0);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.putImageData(history[newIndex], 0, 0);
      }
    }
  };

  const clearCanvas = () => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setDrawings([...drawings, dataUrl]);
      toast({
        title: "Drawing Saved!",
        description: "Your creation has been added to the gallery.",
      });
    }
  };

  const deleteDrawing = (index: number) => {
    setDrawings(drawings.filter((_, i) => i !== index));
    toast({
        title: "Drawing Deleted",
        variant: "destructive"
    })
  }

  return (
    <div className="container mx-auto p-4 flex flex-col gap-4 h-[calc(100vh-80px)]">
      <div className="flex flex-col md:flex-row gap-4 flex-grow min-h-0">
        <Card className="w-full md:w-auto">
          <CardHeader>
            <CardTitle>Toolbox</CardTitle>
          </CardHeader>
          <CardContent>
            <Toolbox
              color={color}
              setColor={setColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              tool={tool}
              setTool={setTool}
              undo={undo}
              redo={redo}
              clear={clearCanvas}
              save={saveDrawing}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
            />
          </CardContent>
        </Card>
        <Card className="flex-grow flex flex-col">
            <CardContent className="p-2 flex-grow">
                <div className="w-full h-full bg-white rounded-md overflow-hidden shadow-inner border">
                    <canvas
                        ref={canvasRef}
                        className="cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Saved Creations</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
            {drawings.length === 0 ? (
              <p className="text-muted-foreground text-center">No saved drawings yet. Create and save one!</p>
            ) : (
                <ScrollArea className="h-48">
                    <div className="flex flex-wrap gap-4 pb-4">
                    {drawings.map((src, index) => (
                        <div key={index} className="relative group shrink-0">
                        <Image
                            width={150}
                            height={150}
                            src={src}
                            alt={`Saved drawing ${index + 1}`}
                            className="w-36 h-36 object-contain border bg-white rounded-md shadow-md"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteDrawing(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
