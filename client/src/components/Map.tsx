import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Locate } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

// Leaflet types are global when loaded via script tag
declare global {
  interface Window {
    L: any;
  }
}

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: any) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 38.0428, lng: 114.5149 }, // Default to Shijiazhuang
  initialZoom = 7,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    if (!window.L) {
      console.error("Leaflet not loaded");
      return;
    }

    // Initialize map
    const map = window.L.map(mapContainer.current).setView(
      [initialCenter.lat, initialCenter.lng],
      initialZoom
    );

    // Add OpenStreetMap tile layer
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstance.current = map;

    if (onMapReady) {
      onMapReady(map);
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initialCenter.lat, initialCenter.lng, initialZoom, onMapReady]);

  const handleLocateMe = () => {
    if (!mapInstance.current) return;

    // Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      toast.error("定位功能需要 HTTPS 安全连接");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("您的浏览器不支持地理定位");
      return;
    }

    toast.loading("正在获取您的位置...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstance.current;

        // Center map
        map.setView([latitude, longitude], 13);

        // Add or update marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          // Create a custom icon for user location
          const userIcon = window.L.divIcon({
            className: "bg-transparent",
            html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          userMarkerRef.current = window.L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("您的当前位置")
            .openPopup();
        }
        
        toast.dismiss();
        toast.success("已定位到当前位置");
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.dismiss();
        toast.error("无法获取位置信息，请检查权限设置");
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 z-[400] shadow-md bg-white hover:bg-gray-100"
        onClick={handleLocateMe}
        title="定位我的位置"
      >
        <Locate className="h-5 w-5 text-gray-700" />
      </Button>
    </div>
  );
}
