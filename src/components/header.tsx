
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSceneContext } from "@/contexts/SceneContext";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";

export function Header() {
  const pathname = usePathname();
  const { isMovementEnabled, setIsMovementEnabled, movementMultiplier, setMovementMultiplier } = useSceneContext();

  const navItems: { href: string; label: string }[] = [
    { href: "/", label: "Draw" },
    { href: "/scene", label: "Scene" },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-full items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Paintbrush className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">Layered Canvas</span>
        </Link>
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => (
            <Button asChild key={item.href} variant="ghost">
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {pathname === '/scene' && (
            <>
              <div className="flex items-center gap-2">
                  <Label htmlFor="movement-switch" className="text-sm whitespace-nowrap">Move</Label>
                  <Switch 
                  id="movement-switch"
                  checked={isMovementEnabled}
                  onCheckedChange={setIsMovementEnabled}
                  />
              </div>
              <div className="flex items-center gap-2">
                  <Label htmlFor="multiplier" className="text-sm whitespace-nowrap">Speed:</Label>
                  <Input 
                      id="multiplier"
                      type="number"
                      value={movementMultiplier}
                      onChange={(e) => setMovementMultiplier(Number(e.target.value))}
                      className="w-20 h-8"
                      min="0.1"
                      step="0.1"
                  />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
