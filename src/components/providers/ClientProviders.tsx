'use client';

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner"; // Renomeado para evitar conflito se Toaster também for usado diretamente
import React from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
      <SonnerToaster />
    </TooltipProvider>
  );
}
