import { useState, useCallback } from "react";
import { Lock, Unlock, Key, Shield, Zap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ImageResult } from "@/components/ImageResult";
import { ProgressBar } from "@/components/ProgressBar";
import { 
  encryptImage, 
  decryptImage, 
  getImageData, 
  createImageFromData,
  type ImageData 
} from "@/lib/imageEncryption";
import { toast } from "sonner";

const Index = () => {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operation, setOperation] = useState<"encrypt" | "decrypt" | null>(null);

  const handleImageLoad = useCallback((image: HTMLImageElement) => {
    setSourceImage(image);
    setSourceImageData(getImageData(image));
    setResultImage(null);
  }, []);

  const handleEncrypt = async () => {
    if (!sourceImageData || !secretKey) {
      toast.error("Lütfen bir görüntü yükleyin ve anahtar girin");
      return;
    }

    setIsProcessing(true);
    setOperation("encrypt");
    setProgress(0);

    try {
      const encrypted = await encryptImage(sourceImageData, secretKey, setProgress);
      const dataUrl = createImageFromData(encrypted.data, encrypted.width, encrypted.height);
      setResultImage(dataUrl);
      toast.success("Görüntü başarıyla şifrelendi!");
    } catch (error) {
      console.error(error);
      toast.error("Şifreleme sırasında hata oluştu");
    } finally {
      setIsProcessing(false);
      setOperation(null);
    }
  };

  const handleDecrypt = async () => {
    if (!sourceImageData || !secretKey) {
      toast.error("Lütfen bir görüntü yükleyin ve anahtar girin");
      return;
    }

    setIsProcessing(true);
    setOperation("decrypt");
    setProgress(0);

    try {
      const decrypted = await decryptImage(sourceImageData, secretKey, setProgress);
      const dataUrl = createImageFromData(decrypted.data, decrypted.width, decrypted.height);
      setResultImage(dataUrl);
      toast.success("Görüntü başarıyla çözüldü!");
    } catch (error) {
      console.error(error);
      toast.error("Çözme sırasında hata oluştu");
    } finally {
      setIsProcessing(false);
      setOperation(null);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = operation === "encrypt" ? "sifreli.png" : "cozulmus.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-background grid-pattern relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center cyber-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              Kaotik Şifreleme
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Logistik harita tabanlı kaotik keystream, permütasyon ve CBC benzeri difüzyon kullanarak 
            görüntülerinizi güvenle şifreleyin
          </p>
        </header>

        {/* Main content */}
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Key input */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Şifreleme Anahtarı</h2>
            </div>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Gizli anahtarınızı girin..."
                className="pr-12 h-12 bg-input border-border/50 focus:border-primary font-mono"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
        
          </div>

          {/* Images grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source image */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-secondary" />
                <h2 className="text-lg font-semibold">Kaynak Görüntü</h2>
              </div>
              <ImageDropzone 
                onImageLoad={handleImageLoad} 
                disabled={isProcessing}
              />
              {sourceImage && (
                <p className="text-sm text-muted-foreground mt-3 font-mono">
                  {sourceImage.width} × {sourceImage.height} piksel
                </p>
              )}
            </div>

            {/* Result image */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold">Sonuç</h2>
              </div>
              <ImageResult 
                imageUrl={resultImage} 
                label={resultImage ? "İşlenmiş görüntü" : "Sonuç burada görünecek"}
                onDownload={resultImage ? handleDownload : undefined}
              />
            </div>
          </div>

          {/* Progress bar */}
          {isProcessing && (
            <div className="glass-card rounded-2xl p-6 animate-scale-in">
              <ProgressBar 
                progress={progress} 
                label={operation === "encrypt" ? "Şifreleniyor..." : "Çözülüyor..."}
                variant={operation || "encrypt"}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button
              variant="encrypt"
              size="xl"
              onClick={handleEncrypt}
              disabled={isProcessing || !sourceImage || !secretKey}
              className="gap-3"
            >
              <Lock className="w-5 h-5" />
              Şifrele
            </Button>
            <Button
              variant="decrypt"
              size="xl"
              onClick={handleDecrypt}
              disabled={isProcessing || !sourceImage || !secretKey}
              className="gap-3"
            >
              <Unlock className="w-5 h-5" />
              Çöz
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
