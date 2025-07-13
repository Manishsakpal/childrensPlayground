
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
type Point = { x: number; y: number };
type Stroke = { points: Point[]; tool: Tool; color: string; penSize: number };

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(5);
  const [history, setHistory] = useState<(ImageData | Stroke)[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedCreations, setSavedCreations] = useLocalStorage<string[]>("saved-creations", []);
  const [isMounted, setIsMounted] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { willReadFrequently: true });
  }, []);

  const saveToHistory = useCallback((item: ImageData | Stroke) => {
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Check for duplicate ImageData to avoid saving same state
    if (item instanceof ImageData && historyIndex > -1) {
        const lastItem = newHistory[historyIndex];
        if (lastItem instanceof ImageData && item.data.toString() === lastItem.data.toString()) {
            return;
        }
    }

    const updatedHistory = [...newHistory, item];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  }, [history, historyIndex]);


  const restoreFromHistory = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx || history.length === 0 || historyIndex < 0) return;

    const lastValidImageDataIndex = history.slice(0, historyIndex + 1).findLastIndex(item => item instanceof ImageData);

    if (lastValidImageDataIndex === -1) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    ctx.putImageData(history[lastValidImageDataIndex] as ImageData, 0, 0);

    for (let i = lastValidImageDataIndex + 1; i <= historyIndex; i++) {
        const item = history[i];
        if (item instanceof ImageData) {
             ctx.putImageData(item, 0, 0);
        } else if ('points' in item) {
            drawStroke(ctx, item as Stroke);
        }
    }
  }, [getCanvasContext, history, historyIndex]);

  useEffect(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (history.length === 0) {
        const initialImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        setHistory([initialImageData]);
        setHistoryIndex(0);
    } else {
        restoreFromHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); // Only on mount

  useEffect(() => {
    restoreFromHistory();
  }, [historyIndex, restoreFromHistory]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };

    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);
      setCurrentStroke([point]);

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineWidth = penSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      if (tool === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
      } else { // Eraser
        ctx.globalCompositeOperation = "destination-out";
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (tool !== "pen" && tool !== "eraser")) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    setCurrentStroke(prev => [...prev, point]);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    if (isDrawing) {
       ctx.closePath();
       setIsDrawing(false);
       if (currentStroke.length > 0) {
           const newStroke: Stroke = { points: currentStroke, tool, color, penSize };
           saveToHistory(newStroke);
       }
       setCurrentStroke([]);
    }
    ctx.globalCompositeOperation = "source-over";
  };
  
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, smoothed = false) => {
    ctx.beginPath();
    ctx.lineWidth = stroke.penSize;
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
    }

    if (smoothed && stroke.points.length > 2) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length - 2; i++) {
            const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
            const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }
        // curve to the last point
        ctx.quadraticCurveTo(
            stroke.points[stroke.points.length - 2].x,
            stroke.points[stroke.points.length - 2].y,
            stroke.points[stroke.points.length - 1].x,
            stroke.points[stroke.points.length - 1].y
        );
    } else {
        if(stroke.points.length > 0) {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
        }
    }

    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
};

  const floodFill = (x: number, y: number, fillColor: number[]) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const targetColor = getColorAtPixel(data, x, y, ctx.canvas.width);

    if (colorsMatch(targetColor, fillColor)) {
      return;
    }

    const stack: [number, number][] = [[x, y]];

    while (stack.length > 0) {
      const [px, py] = stack.pop()!;
      if (px < 0 || px >= ctx.canvas.width || py < 0 || py >= ctx.canvas.height) {
        continue;
      }

      const currentColor = getColorAtPixel(data, px, py, ctx.canvas.width);

      if (colorsMatch(currentColor, targetColor)) {
        setColorAtPixel(data, px, py, ctx.canvas.width, fillColor);
        stack.push([px + 1, py]);
        stack.push([px - 1, py]);
        stack.push([px, py + 1]);
        stack.push([px, py - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    saveToHistory(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
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
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    saveToHistory(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
  };

  const saveCreation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSavedCreations(prevCreations => [dataUrl, ...prevCreations]);
  };
  
  const loadCreation = (dataUrl: string) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, 0, 0);
      saveToHistory(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
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

  const smoothLastStroke = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const lastStrokeIndex = history.slice(0, historyIndex + 1).findLastIndex(item => 'points' in item);
    if (lastStrokeIndex === -1) return;

    const lastStroke = history[lastStrokeIndex] as Stroke;
    if (lastStroke.points.length < 3) return; // Not enough points to smooth

    // Temporarily go back in history to draw on canvas state before last stroke
    const tempHistoryIndex = historyIndex;
    setHistoryIndex(lastStrokeIndex - 1);

    // This is a bit of a hack to wait for the restoreFromHistory to complete
    setTimeout(() => {
      drawStroke(ctx, lastStroke, true);
      
      const newImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      const newHistory = history.slice(0, lastStrokeIndex); // Remove old stroke
      setHistory([...newHistory, newImageData]); // Add smoothed image data
      setHistoryIndex(newHistory.length); // Point to the new smoothed state
    }, 50);
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
          smoothLastStroke={smoothLastStroke}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          canSmooth={history.length > 0 && historyIndex > -1 && 'points' in history[historyIndex]}
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
