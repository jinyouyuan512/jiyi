import { useState, useRef, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  labelBefore?: string;
  labelAfter?: string;
}

export default function ImageComparisonSlider({
  beforeImage,
  afterImage,
  className = "",
  labelBefore = "修复前",
  labelAfter = "修复后",
}: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  };

  const startDragging = () => isDragging.current = true;
  const stopDragging = () => isDragging.current = false;

  useEffect(() => {
    document.addEventListener("mouseup", stopDragging);
    document.addEventListener("touchend", stopDragging);
    return () => {
      document.removeEventListener("mouseup", stopDragging);
      document.removeEventListener("touchend", stopDragging);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none cursor-ew-resize group ${className}`}
      onMouseDown={(e) => { startDragging(); handleMove(e.clientX); }}
      onTouchStart={(e) => { startDragging(); handleMove(e.touches[0].clientX); }}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* After Image (Background) */}
      <img 
        src={afterImage} 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover" 
        draggable={false}
      />
      
      {/* Before Image (Foreground - Clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Before" 
          className="absolute inset-0 w-[100vw] max-w-none h-full object-cover" 
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-primary">
          <MoveHorizontal className="w-5 h-5" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs pointer-events-none">
        {labelBefore}
      </div>
      <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs pointer-events-none">
        {labelAfter}
      </div>
    </div>
  );
}
