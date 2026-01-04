import { useCallback, useState, forwardRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onImageLoad: (image: HTMLImageElement) => void;
  disabled?: boolean;
}

export const ImageDropzone = forwardRef<HTMLDivElement, ImageDropzoneProps>(
  function ImageDropzone({ onImageLoad, disabled }, ref) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      
      const img = new Image();
      img.onload = () => onImageLoad(img);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile, disabled]);

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative w-full aspect-video rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group",
        isDragging 
          ? "border-primary bg-primary/10 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed",
        preview && "border-solid border-primary/30"
      )}
    >
      {preview ? (
        <>
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Değiştirmek için tıkla</p>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          <div className={cn(
            "w-16 h-16 rounded-full bg-muted flex items-center justify-center transition-all duration-300",
            isDragging && "bg-primary/20 scale-110"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              Görüntü yükle
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Sürükle & bırak veya tıkla
            </p>
          </div>
        </div>
      )}
      
      {/* Glow effect on drag */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 animate-pulse" />
        </div>
      )}
    </div>
  );
});
