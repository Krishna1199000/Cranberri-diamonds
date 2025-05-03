"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from 'next/image';

interface MediaPreviewProps {
  type: string;
  url: string;
  onClose: () => void;
}

export function MediaPreview({ type, url, onClose }: MediaPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose();
  }, [onClose]);
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-screen-lg p-0 overflow-hidden bg-black">
        <div className="absolute top-2 right-2 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleClose}
            className="rounded-full bg-black/50 hover:bg-black/70 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="max-h-[80vh] overflow-auto relative aspect-video">
          {type === 'image' && (
            <Image 
              src={url} 
              alt="Diamond Preview" 
              fill
              className="object-contain"
              sizes="(max-width: 1280px) 90vw, 1024px"
            />
          )}
          
          {type === 'video' && (
            <video 
              src={url} 
              controls 
              autoPlay 
              className="w-full max-h-[80vh]"
            />
          )}
          
          {type === 'certificate' && (
            <iframe 
              src={url} 
              className="w-full h-[80vh]" 
              title="Certificate"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}