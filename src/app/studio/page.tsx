
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Toolbox } from "@/components/toolbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Layers, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

type Tool = "pen" | "fill" | "eraser";
type Layer = {
  id: number;
  name: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  history: ImageData[];
  historyIndex: number;
  isVisible: boolean;
};

export default function StudioPage() {
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(5);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const addLayer = () => {
    const newId = layers.length > 0 ? Math.max(...layers.map(l => l.id)) + 1 : 1;
    const newLayer: Layer = {
      id: newId,
      name: `Layer ${newId}`,
      canvasRef: React.createRef<HTMLCanvasElement>(),
      history: [],
      historyIndex: -1,
      isVisible: true,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newId);
  };
  
  useEffect(() => {
    if (layers.length === 0) {
        addLayer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.length]);

  const getActiveLayer = useCallback(() => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);

  const updateLayerHistory = useCallback((layer: Layer, newHistory: ImageData[], newIndex: number) => {
    setLayers(currentLayers => currentLayers.map(l => 
        l.id === layer.id ? { ...l, history: newHistory, historyIndex: newIndex } : l
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
    updateLayerHistory(activeLayer, updatedHistory, updatedHistory.length - 1);
  }, [getActiveLayer, updateLayerHistory]);

  const restoreFromHistory = useCallback(() => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.canvasRef.current || activeLayer.history.length === 0 || activeLayer.historyIndex < 0) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.putImageData(activeLayer.history[activeLayer.historyIndex], 0, 0);
  }, [getActiveLayer]);

  useEffect(() => {
    restoreFromHistory();
  }, [getActiveLayer, restoreFromHistory]);
  
  const startDrawing = (e: React.MouseEvent<HTMLDivElement>) => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.canvasRef.current || !activeLayer.isVisible) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;
    
    const rect = activeLayer.canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen" || tool === "eraser") {
      setIsDrawing(true);
      context.beginPath();
      context.moveTo(x, y);
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

  const draw = (e: React.MouseEvent<HTMLDivElement>) => {
    const activeLayer = getActiveLayer();
    if (!isDrawing || !activeLayer || !activeLayer.canvasRef.current || !activeLayer.isVisible || (tool !== "pen" && tool !== "eraser")) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;

    const rect = activeLayer.canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.canvasRef.current) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;

    if (isDrawing) {
       context.closePath();
       setIsDrawing(false);
       saveToHistory();
    }
    context.globalCompositeOperation = "source-over";
  };
  
  const clearCanvas = () => {
    const activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.canvasRef.current) return;
    const context = activeLayer.canvasRef.current.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    saveToHistory();
  };

  const undo = () => {
    const activeLayer = getActiveLayer();
    if (activeLayer && activeLayer.historyIndex > 0) {
      updateLayerHistory(activeLayer, activeLayer.history, activeLayer.historyIndex - 1);
    }
  };

  const redo = () => {
    const activeLayer = getActiveLayer();
    if (activeLayer && activeLayer.historyIndex < activeLayer.history.length - 1) {
      updateLayerHistory(activeLayer, activeLayer.history, activeLayer.historyIndex + 1);
    }
  };

  const deleteLayer = (id: number) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) {
        const remainingLayers = layers.filter(l => l.id !== id);
        setActiveLayerId(remainingLayers.length > 0 ? remainingLayers[remainingLayers.length - 1].id : null);
    }
  }

  const toggleLayerVisibility = (id: number) => {
    setLayers(prev => prev.map(l => l.id === id ? {...l, isVisible: !l.isVisible} : l));
  }

  const activeLayer = getActiveLayer();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-800">
      <div className="flex-grow flex relative">
        <div className="flex-grow flex items-center justify-center overflow-hidden">
          <div 
            className="relative" 
            style={{ width: '100vw', height: `calc(100vw * ${CANVAS_HEIGHT} / ${CANVAS_WIDTH})`, maxWidth: `calc(100vh * ${CANVAS_WIDTH} / ${CANVAS_HEIGHT})`, maxHeight: '100vh'}}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          >
            <div className="absolute inset-0 w-full h-full">
              <div className="w-full h-full animate-scroll-left flex">
                <Image
                  src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
                  alt="Scrolling scene background"
                  layout="fill"
                  objectFit="cover"
                  className="flex-shrink-0 min-w-full"
                />
                <Image
                  src="https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg"
                  alt="Scrolling scene background"
                  layout="fill"
                  objectFit="cover"
                  className="flex-shrink-0 min-w-full"
                  aria-hidden="true"
                />
              </div>
            </div>

            {layers.map(layer => (
              <canvas
                key={layer.id}
                ref={layer.canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className={cn("absolute inset-0 w-full h-full pointer-events-none", {
                    'opacity-0': !layer.isVisible,
                })}
              />
            ))}
          </div>
        </div>
        
        <div className="absolute right-4 top-4 bottom-4 flex flex-col gap-4">
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
                canUndo={activeLayer ? activeLayer.historyIndex > 0 : false}
                canRedo={activeLayer ? activeLayer.historyIndex < activeLayer.history.length - 1 : false}
                isStudio
            />
            <Card className="w-64 bg-background/80 backdrop-blur-sm">
                <CardContent className="p-2">
                    <div className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            <h3 className="font-semibold">Layers</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={addLayer}>
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2 mt-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {layers.slice().reverse().map(layer => (
                            <div 
                                key={layer.id} 
                                className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer", {
                                    "bg-primary/20 ring-2 ring-primary": activeLayerId === layer.id
                                })}
                                onClick={() => setActiveLayerId(layer.id)}
                            >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                <span className="flex-grow">{layer.name}</span>
                                <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); toggleLayerVisibility(layer.id);}}>
                                    {layer.isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); deleteLayer(layer.id);}}>
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
