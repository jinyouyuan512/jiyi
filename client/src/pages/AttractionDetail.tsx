import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Ticket, Phone, ArrowLeft, Navigation, Headphones, Scan, StopCircle, Volume2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AttractionDetail() {
  const [match, params] = useRoute("/attractions/:id");
  const id = match ? parseInt(params.id) : -1;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAROpen, setIsAROpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: attraction, isLoading } = trpc.attractions.getById.useQuery(
    { id },
    { enabled: id !== -1 }
  );

  // Voice Guide Implementation
  const handleVoiceGuide = () => {
    if (!window.speechSynthesis) {
      toast.error("您的浏览器不支持语音合成功能");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!attraction?.description) return;
      
      const utterance = new SpeechSynthesisUtterance(attraction.description);
      utterance.lang = "zh-CN";
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      toast.success("开始语音讲解");
    }
  };

  // AR Camera Implementation
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  useEffect(() => {
    if (isAROpen) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (err) {
          console.error("Camera access denied:", err);
          setHasCameraPermission(false);
          toast.error("无法访问摄像头，已切换至演示模式");
        }
      };
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAROpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="min-h-screen bg-background pt-20 text-center">
        <h1 className="text-2xl font-bold mb-4">景点未找到</h1>
        <Link href="/tourism">
          <Button>返回列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title={attraction.name}
        description={attraction.category === 'memorial' ? '缅怀革命先烈，传承红色基因' : '重温峥嵘岁月，感悟历史沧桑'}
        image={attraction.coverImage}
      />

      <div className="container relative z-20 -mt-10">
        <Card className="border-none shadow-xl bg-background/95 backdrop-blur-md p-6 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-primary bg-primary/10">
                  {attraction.category === 'memorial' ? '纪念馆' : 
                   attraction.category === 'site' ? '遗址' : 
                   attraction.category === 'museum' ? '博物馆' : '红色景点'}
                </Badge>
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="w-4 h-4 mr-1" /> {attraction.location}
                </div>
              </div>

              {/* Action Buttons: Voice & AR */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant={isPlaying ? "destructive" : "default"} 
                  onClick={handleVoiceGuide}
                  className="gap-2 shadow-md transition-all hover:scale-105"
                >
                  {isPlaying ? <StopCircle className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                  {isPlaying ? "停止讲解" : "语音讲解"}
                </Button>

                <Dialog open={isAROpen} onOpenChange={setIsAROpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 shadow-md border-primary/20 text-primary hover:bg-primary/5 transition-all hover:scale-105">
                      <Scan className="w-4 h-4" /> AR 沉浸式导览
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden bg-black border-zinc-800">
                    <DialogHeader className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
                      <DialogTitle className="text-white flex items-center gap-2">
                        <Scan className="w-5 h-5 text-primary" /> AR 实景导览
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="relative flex-1 bg-zinc-900 w-full overflow-hidden">
                      {hasCameraPermission ? (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          <img 
                            src={attraction.coverImage} 
                            alt="AR Demo Background" 
                            className="w-full h-full object-cover opacity-50 blur-sm"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Badge variant="destructive" className="text-lg py-2 px-4 shadow-xl">演示模式 (未检测到摄像头)</Badge>
                          </div>
                        </div>
                      )}
                      
                      {/* AR HUD Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Center Reticle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/50 rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>

                        {/* Floating Info Card (Mock) */}
                        <div className="absolute top-1/4 left-1/4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/20 animate-bounce delay-700">
                          <div className="text-xs text-primary font-bold">距离 50m</div>
                          <div className="text-white text-sm font-bold">{attraction.name}</div>
                        </div>

                        {/* Bottom Info */}
                        <div className="absolute bottom-8 left-4 right-4 bg-black/70 backdrop-blur-lg p-4 rounded-xl border border-white/10 text-white">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Volume2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm mb-1">正在为您导航</h4>
                              <p className="text-xs text-white/70 line-clamp-2">{attraction.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">开放时间</p>
                    <p className="font-medium">{attraction.openingHours || "暂无信息"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">门票价格</p>
                    <p className="font-medium">{attraction.ticketPrice || "免费"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">联系电话</p>
                    <p className="font-medium">{attraction.contact || "暂无信息"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-serif font-bold">景点介绍</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {attraction.description}
                </p>
              </div>

              {attraction.history && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-serif font-bold">历史背景</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {attraction.history}
                  </p>
                </div>
              )}

              <div className="pt-6">
                <Link href="/tourism">
                  <Button variant="outline" className="mr-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> 返回导览
                  </Button>
                </Link>
                <Button>
                  <Navigation className="w-4 h-4 mr-2" /> 导航前往
                </Button>
              </div>
            </div>

            <div className="w-full md:w-1/3 space-y-6">
              <div className="rounded-xl overflow-hidden shadow-lg aspect-[4/3]">
                <img 
                  src={attraction.coverImage} 
                  alt={attraction.name}
                  className="w-full h-full object-cover" 
                />
              </div>
              {/* Additional images could go here */}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
