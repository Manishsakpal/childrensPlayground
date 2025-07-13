
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
  saveCreation: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
}: ToolboxProps) {
  return (
    <Card className="mt-4 w-full max-w-[800px]">
      <CardContent className="p-2">
        <TooltipProvider>
          <div className="flex flex-wrap items-center justify-center gap-2">
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

            <div className="h-8 w-px bg-border mx-2" />

            <div className="flex items-center gap-2">
              <label htmlFor="color-picker" className="sr-only">Color Picker</label>
              <input
                id="color-picker"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 p-1 bg-card border rounded-md cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-2 w-48">
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

            <div className="h-8 w-px bg-border mx-2" />
            
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

            <div className="h-8 w-px bg-border mx-2" />

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
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
