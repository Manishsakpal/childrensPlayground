
"use client";

import {
  Paintbrush,
  PaintBucket,
  Undo,
  Redo,
  Trash2,
  Save,
  Minus,
  Plus,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tool = "pen" | "fill" | "eraser";

interface ToolboxProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  saveCreation?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isStudio?: boolean;
}

export function Toolbox({
  tool,
  setTool,
  color,
  setColor,
  penSize,
  setPenSize,
  undo,
  redo,
  clearCanvas,
  saveCreation,
  canUndo,
  canRedo,
  isStudio = false,
}: ToolboxProps) {
  return (
    <Card className={cn("w-full", isStudio ? "w-64 bg-background/80 backdrop-blur-sm" : "max-w-[800px] mt-4")}>
      <CardContent className="p-2">
        <TooltipProvider>
          <div className={cn("flex items-center justify-center gap-2", isStudio ? "flex-col" : "flex-wrap")}>
            <div className={cn("flex items-center gap-2", isStudio ? "w-full justify-around" : "")}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant={tool === "pen" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setTool("pen")}
                    >
                    <Paintbrush className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Pen</p>
                </TooltipContent>
                </Tooltip>

                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant={tool === "fill" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setTool("fill")}
                    >
                    <PaintBucket className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Fill</p>
                </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant={tool === "eraser" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setTool("eraser")}
                    >
                    <Eraser className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Eraser</p>
                </TooltipContent>
                </Tooltip>
            </div>


            <div className={cn("bg-border", isStudio ? "h-px w-full my-2" : "h-8 w-px mx-2")} />

            <div className={cn("flex items-center gap-2", isStudio ? "flex-col w-full" : "")}>
                <label htmlFor="color-picker" className="sr-only">Color Picker</label>
                <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 p-1 bg-card border rounded-md cursor-pointer"
                />
                <div className={cn("flex items-center gap-2", isStudio ? "w-full" : "w-48")}>
                    <Minus className="h-4 w-4" />
                    <Slider
                        min={1}
                        max={50}
                        step={1}
                        value={[penSize]}
                        onValueChange={(value) => setPenSize(value[0])}
                    />
                    <Plus className="h-4 w-4" />
                </div>
            </div>

            <div className={cn("bg-border", isStudio ? "h-px w-full my-2" : "h-8 w-px mx-2")} />
            
            <div className={cn("flex items-center gap-2", isStudio ? "w-full justify-around" : "")}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo}>
                    <Undo className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Undo</p>
                </TooltipContent>
                </Tooltip>

                <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo}>
                    <Redo className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Redo</p>
                </TooltipContent>
                </Tooltip>
            </div>
            
            <div className={cn("bg-border", isStudio ? "h-px w-full my-2" : "h-8 w-px mx-2")} />

            <div className={cn("flex items-center gap-2", isStudio ? "w-full justify-around" : "")}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={clearCanvas}>
                    <Trash2 className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Clear</p>
                </TooltipContent>
                </Tooltip>

                {!isStudio && saveCreation && (
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={saveCreation}>
                            <Save className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Save</p>
                    </TooltipContent>
                    </Tooltip>
                )}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
