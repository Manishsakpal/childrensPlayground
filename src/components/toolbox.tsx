"use client";

import {
  Pen,
  PaintBucket,
  Undo,
  Redo,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

type Tool = "pen" | "fill";

interface ToolboxProps {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  tool: Tool;
  setTool: (tool: Tool) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  save: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const colors = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
  "#808080", "#ff4500", "#2e8b57", "#4682b4", "#d2691e", "#9acd32", "#4b0082", "#ff8c00"
];

export function Toolbox({
  color,
  setColor,
  brushSize,
  setBrushSize,
  tool,
  setTool,
  undo,
  redo,
  clear,
  save,
  canUndo,
  canRedo,
}: ToolboxProps) {
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Tool</Label>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={tool === 'pen' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('pen')}>
                  <Pen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pen</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={tool === 'fill' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTool('fill')}>
                  <PaintBucket className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fill</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 w-8 p-0" style={{ backgroundColor: color }} />
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((c) => (
                    <Button key={c} style={{ backgroundColor: c }} className="h-8 w-8 p-0 border" onClick={() => setColor(c)} />
                  ))}
                </div>
                <Separator className="my-2"/>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-8 p-0 border-none cursor-pointer" />
              </PopoverContent>
            </Popover>
            <span className="font-mono text-sm">{color}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Brush Size</Label>
            <span className="font-mono text-sm">{brushSize}px</span>
          </div>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={undo} disabled={!canUndo}><Undo className="mr-2 h-4 w-4" /> Undo</Button>
              </TooltipTrigger>
              <TooltipContent>Undo last action</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={redo} disabled={!canRedo}><Redo className="mr-2 h-4 w-4" /> Redo</Button>
              </TooltipTrigger>
              <TooltipContent>Redo last action</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" onClick={clear} className="col-span-2"><Trash2 className="mr-2 h-4 w-4"/> Clear</Button>
              </TooltipTrigger>
              <TooltipContent>Clear the entire canvas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={save} className="col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground"><Save className="mr-2 h-4 w-4"/> Save</Button>
              </TooltipTrigger>
              <TooltipContent>Save drawing to gallery</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
