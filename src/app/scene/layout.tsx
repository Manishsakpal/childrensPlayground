
"use client";

import { SceneProvider } from "@/contexts/SceneContext";

export default function SceneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SceneProvider>{children}</SceneProvider>;
}
