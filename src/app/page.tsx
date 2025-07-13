
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Toolbox } from "@/components/toolbox";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

type Tool = "pen" | "fill" | "eraser";

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedCreations, setSavedCreations] = useLocalStorage<string[]>("saved-creations", []);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const newHistory = history.slice(0, historyIndex + 1);
    const newImageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    if (historyIndex > -1) {
        const lastImageData = newHistory[historyIndex];
        if (lastImageData && newImageData.data.toString() === lastImageData.data.toString()) {
            return;
        }
    }
    
    const updatedHistory = [...newHistory, newImageData];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  }, [history, historyIndex]);


  const restoreFromHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0 || historyIndex < 0) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.putImageData(history[historyIndex], 0, 0);
  }, [history, historyIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    if (history.length === 0) {
        const initialImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialImageData]);
        setHistoryIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    restoreFromHistory();
  }, [historyIndex, restoreFromHistory]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);
      context.beginPath();
      context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      context.lineWidth = penSize;
      context.lineCap = "round";
      context.lineJoin = "round";
      
      if (tool === "pen") {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = color;
      } else { // Eraser
        context.globalCompositeOperation = "destination-out";
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (tool !== "pen" && tool !== "eraser")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (isDrawing) {
       context.closePath();
       setIsDrawing(false);
       saveToHistory();
    }
    context.globalCompositeOperation = "source-over";
  };

  const floodFill = (x: number, y: number, fillColor: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetColor = getColorAtPixel(data, x, y, canvas.width);

    if (colorsMatch(targetColor, fillColor)) {
      return;
    }

    const stack: [number, number][] = [[x, y]];

    while (stack.length > 0) {
      const [px, py] = stack.pop()!;
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) {
        continue;
      }

      const currentColor = getColorAtPixel(data, px, py, canvas.width);

      if (colorsMatch(currentColor, targetColor)) {
        setColorAtPixel(data, px, py, canvas.width, fillColor);
        stack.push([px + 1, py]);
        stack.push([px - 1, py]);
        stack.push([px, py + 1]);
        stack.push([px, py - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  const getColorAtPixel = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const index = (y * width + x) * 4;
    return [data[index], data[index + 1], data[index + 2], data[index + 3]];
  };

  const setColorAtPixel = (data: Uint8ClampedArray, x: number, y: number, width: number, color: number[]) => {
    const index = (y * width + x) * 4;
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
  };

  const colorsMatch = (a: number[], b: number[]) => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  };
  
  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'fill') {
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      floodFill(x, y, hexToRgba(color));
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const saveCreation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSavedCreations(prevCreations => [dataUrl, ...prevCreations]);
  };
  
  const loadCreation = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
      saveToHistory();
    }
  };

  const deleteCreation = (index: number) => {
    const newCreations = [...savedCreations];
    newCreations.splice(index, 1);
    setSavedCreations(newCreations);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-8 items-start justify-center">
      <div className="flex-grow flex flex-col items-center">
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="border rounded-lg shadow-lg bg-white absolute top-0 left-0"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onClick={handleCanvasClick}
            />
        </div>
        <Toolbox
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          penSize={penSize}
          setPenSize={setPenSize}
          undo={undo}
          redo={redo}
          clearCanvas={clearCanvas}
          saveCreation={saveCreation}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
        {isMounted && savedCreations.length > 0 && (
          <Card className="mt-4 w-full" style={{ maxWidth: CANVAS_WIDTH }}>
            <CardHeader>
              <CardTitle>Saved Creations</CardTitle>
              <CardDescription>Click to load a drawing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {savedCreations.map((src, index) => (
                  <div key={`${src.slice(0, 20)}-${index}`} className="relative group">
                    <button
                      onClick={() => loadCreation(src)}
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
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteCreation(index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
