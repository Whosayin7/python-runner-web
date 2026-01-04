import { forwardRef } from "react";
import { Download } from "lucide-react";
import { Button } from "./ui/button";

interface ImageResultProps {
  imageUrl: string | null;
  label: string;
  onDownload?: () => void;
}

export const ImageResult = forwardRef<HTMLDivElement, ImageResultProps>(
  function ImageResult({ imageUrl, label, onDownload }, ref) {
  if (!imageUrl) {
    return (
      <div className="w-full aspect-video rounded-xl border border-border/50 bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl border border-primary/30 overflow-hidden group cyber-border">
      <img 
        src={imageUrl} 
        alt={label} 
        className="w-full h-full object-contain bg-background"
      />
      
      {/* Overlay with download button */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {onDownload && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              İndir
            </Button>
          )}
        </div>
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 scanline opacity-50 pointer-events-none" />
    </div>
  );
});
