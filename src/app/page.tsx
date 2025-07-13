
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
type Stroke = { type: 'stroke'; points: Point[]; tool: Tool; color: string; penSize: number, smoothed?: boolean };
type Fill = { type: 'fill'; x: number; y: number; color: string };
type HistoryItem = Stroke | Fill;

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(5);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedCreations, setSavedCreations] = useLocalStorage<string[]>("saved-creations", []);
  const [isMounted, setIsMounted] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<Point[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const saveToHistory = useCallback((item: HistoryItem) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...newHistory, item];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  }, [history, historyIndex]);

  const restoreFromHistory = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const historyToDraw = history.slice(0, historyIndex + 1);

    historyToDraw.forEach(item => {
      if (item.type === 'stroke') {
        drawStroke(ctx, item, item.smoothed);
      } else if (item.type === 'fill') {
        // Redrawing fill is complex; for this optimization, we will rely on stroke history.
        // A full implementation would require re-calculating fill which is slow.
        // The current implementation will re-draw strokes on top of fills.
        // For a truely robust solution, we'd snapshot canvas state *before* a fill.
        // But for performance, this is a good trade-off.
        // To re-implement fill on restore:
        const { x, y, color } = item;
        floodFill(x, y, hexToRgba(color), false); // don't save to history again
      }
    });

  }, [getCanvasContext, history, historyIndex]);

  useEffect(() => {
    restoreFromHistory();
  }, [historyIndex, history, restoreFromHistory]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };

    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);
      setCurrentStrokePoints([point]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || (tool !== "pen" && tool !== "eraser")) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const point = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    const newPoints = [...currentStrokePoints, point];
    setCurrentStrokePoints(newPoints);
    
    // Draw the line dynamically
    ctx.beginPath();
    ctx.moveTo(newPoints[newPoints.length - 2].x, newPoints[newPoints.length - 2].y);
    ctx.lineTo(point.x, point.y);
    
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
    } else { // Eraser
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)"; // Must be solid for destination-out
    }
    ctx.stroke();
    ctx.closePath();
  };

  const stopDrawing = () => {
    if (isDrawing && currentStrokePoints.length > 0) {
       const newStroke: Stroke = { type: 'stroke', points: currentStrokePoints, tool, color, penSize };
       saveToHistory(newStroke);
    }
    setIsDrawing(false);
    setCurrentStrokePoints([]);
    
    const ctx = getCanvasContext();
    if (ctx) {
        ctx.globalCompositeOperation = "source-over";
    }
  };
  
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, smoothed = false) => {
    if (stroke.points.length === 0) return;

    ctx.beginPath();
    ctx.lineWidth = stroke.penSize;
    ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    if (smoothed && stroke.points.length > 2) {
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
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
    }

    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
};

const floodFill = (x: number, y: number, fillColor: number[], shouldSaveToHistory = true) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    // For performance, we get image data once
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const canvasWidth = ctx.canvas.width;

    const getPixelIndex = (x: number, y: number) => (y * canvasWidth + x) * 4;

    const targetColor = [
      data[getPixelIndex(x,y)],
      data[getPixelIndex(x,y) + 1],
      data[getPixelIndex(x,y) + 2],
      data[getPixelIndex(x,y) + 3],
    ];

    if (colorsMatch(targetColor, fillColor)) {
      return;
    }

    const stack: [number, number][] = [[x, y]];

    while (stack.length > 0) {
      const [px, py] = stack.pop()!;
      if (px < 0 || px >= canvasWidth || py < 0 || py >= ctx.canvas.height) {
        continue;
      }
      
      const index = getPixelIndex(px, py);
      const currentColor = [data[index], data[index + 1], data[index + 2], data[index + 3]];

      if (colorsMatch(currentColor, targetColor)) {
        data[index] = fillColor[0];
        data[index+1] = fillColor[1];
        data[index+2] = fillColor[2];
        data[index+3] = fillColor[3];

        stack.push([px + 1, py]);
        stack.push([px - 1, py]);
        stack.push([px, py + 1]);
        stack.push([px, py - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    if(shouldSaveToHistory) {
        saveToHistory({ type: 'fill', x, y, color });
    }
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
    setHistory([]);
    setHistoryIndex(-1);
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const saveCreation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    restoreFromHistory(); // Make sure canvas is up to date
    const dataUrl = canvas.toDataURL("image/png");
    setSavedCreations(prevCreations => [dataUrl, ...prevCreations]);
  };
  
  const loadCreation = (dataUrl: string) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const img = new window.Image();
    img.src = dataUrl;
    img.onload = () => {
      clearCanvas();
      ctx.drawImage(img, 0, 0);
      // We lose history when loading an image, this is a design trade-off.
    }
  };

  const deleteCreation = (index: number) => {
    const newCreations = [...savedCreations];
    newCreations.splice(index, 1);
    setSavedCreations(newCreations);
  };

  const undo = () => {
    if (historyIndex >= 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const smoothLastStroke = () => {
      if (historyIndex < 0) return;

      const lastItem = history[historyIndex];
      if (!lastItem || lastItem.type !== 'stroke' || lastItem.points.length < 3) return;

      const newHistory = [...history];
      const smoothedStroke: Stroke = { ...lastItem, smoothed: true };
      newHistory[historyIndex] = smoothedStroke;
      
      setHistory(newHistory);
      // The useEffect watching history will trigger a redraw
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
          canUndo={historyIndex >= 0}
          canRedo={historyIndex < history.length - 1}
          canSmooth={historyIndex > -1 && history[historyIndex]?.type === 'stroke'}
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
