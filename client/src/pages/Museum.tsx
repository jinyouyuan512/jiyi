import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Headphones, Clock, ArrowRight, Search, Wrench, AlertCircle, Video, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ImmersivePlayer from "@/components/ImmersivePlayer";
import CertificateModal from "@/components/CertificateModal";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Museum() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  
  // Immersive Experience State
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [currentExhibit, setCurrentExhibit] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [experienceRecordId, setExperienceRecordId] = useState<number | null>(null);

  // Restoration Demo State
  const [showRestoration, setShowRestoration] = useState(false);

  // Mutations
  const startExperience = trpc.experience.start.useMutation();
  const completeExperience = trpc.experience.complete.useMutation();
  
  // Fetch attractions (for VR exhibition)
  const { 
    data: allAttractions, 
    isLoading: isLoadingAttractions,
    error: attractionsError,
    isError: isAttractionsError 
  } = trpc.attractions.list.useQuery();
  
  // Filter for museums/memorials and format for display
  const exhibits = allAttractions
    ?.filter(a => ['museum', 'memorial'].includes(a.category))
    .map(a => ({
      id: a.id,
      title: a.name,
      type: a.category === 'memorial' ? '纪念馆' : '博物馆',
      image: a.coverImage,
      desc: a.description,
      era: a.era || '近现代',
      duration: a.duration || '30分钟',
      streamUrl: a.streamUrl,
      modelUrl: a.modelUrl
    })) || [];

  // Fetch artifacts
  const { 
    data: allArtifacts, 
    isLoading: isLoadingArtifacts,
    error: artifactsError,
    isError: isArtifactsError
  } = trpc.artifacts.list.useQuery();

  // Filter artifacts
  const filteredArtifacts = allArtifacts?.filter(a => {
    if (!searchQuery) return true;
    return a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           a.description.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const displayArtifacts = filteredArtifacts.slice(0, 4);

  // Fetch Oral Histories
  const {
    data: oralHistories,
    isLoading: isLoadingOralHistories
  } = trpc.oralHistory.list.useQuery();

  useEffect(() => {
    if (isAttractionsError) {
      console.error("Attractions fetch error:", attractionsError);
    }
    if (isArtifactsError) {
      console.error("Artifacts fetch error:", artifactsError);
    }
  }, [isAttractionsError, attractionsError, isArtifactsError, artifactsError]);

  const handleStartExperience = async (exhibit: any) => {
    if (!user) {
        toast.error("请先登录以体验完整功能");
    }

    try {
        if (user) {
            const result = await startExperience.mutateAsync({ attractionId: exhibit.id });
            setExperienceRecordId(Date.now()); 
        }
        setCurrentExhibit(exhibit);
        setImmersiveMode(true);
    } catch (error) {
        toast.error("启动体验失败");
        console.error(error);
    }
  };

  const handleCompleteExperience = async () => {
    if (experienceRecordId && user) {
        try {
            await completeExperience.mutateAsync({ 
                recordId: experienceRecordId,
                certificateUrl: "generated" 
            });
            setShowCertificate(true);
        } catch (error) {
            console.error("Failed to save progress", error);
            setShowCertificate(true);
        }
    } else {
        setShowCertificate(true);
    }
  };

  if (immersiveMode && currentExhibit) {
    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="absolute top-4 left-4 z-20">
                <Button variant="outline" className="bg-black/50 text-white border-white/20" onClick={() => setImmersiveMode(false)}>
                    退出体验
                </Button>
            </div>
            <ImmersivePlayer 
                title={currentExhibit.title}
                imageUrl={currentExhibit.image} // Pass image URL
                streamUrl={currentExhibit.streamUrl}
                modelUrl={currentExhibit.modelUrl}
                attractionId={currentExhibit.id}
                onComplete={handleCompleteExperience}
                isCompleted={showCertificate}
            />
            {showCertificate && (
                <CertificateModal 
                    open={showCertificate}
                    onOpenChange={(open) => {
                        setShowCertificate(open);
                        if (!open) setImmersiveMode(false);
                    }}
                    userName={user?.name || "体验者"}
                    sceneName={currentExhibit.title}
                    date={new Date().toLocaleDateString()}
                    certificateId={`CERT-${Date.now().toString().slice(-6)}`}
                />
            )}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title="数字展馆" 
        description="利用VR/AR技术，打破时空限制，让您随时随地走进历史现场，触摸红色记忆"
        image="/images/product-ceramic.jpg"
      />

      <div className="container relative z-20 -mt-10">
        {/* VR Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {isAttractionsError ? (
            <div className="col-span-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>无法加载展览数据，请稍后重试。</AlertDescription>
              </Alert>
            </div>
          ) : isLoadingAttractions ? (
             Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className={`h-96 rounded-2xl ${i === 0 ? 'lg:col-span-2' : ''}`} />
             ))
          ) : exhibits.length > 0 ? (
            exhibits.map((exhibit, index) => (
            <div 
              key={exhibit.id} 
              className={`group relative overflow-hidden rounded-2xl h-96 shadow-lg ${index === 0 ? 'lg:col-span-2' : ''} cursor-pointer`}
              onClick={() => handleStartExperience(exhibit)}
            >
              <img 
                src={exhibit.image} 
                alt={exhibit.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                <div className="flex gap-2 mb-3">
                    <Badge className="bg-primary text-white border-none">{exhibit.type}</Badge>
                    <Badge variant="outline" className="text-white border-white/50">{exhibit.era}</Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border-none flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {exhibit.duration}
                    </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-serif">{exhibit.title}</h3>
                <p className="text-white/80 mb-6 line-clamp-2">{exhibit.desc}</p>
                <Button variant="outline" className="self-start border-white/30 text-white hover:bg-white hover:text-black transition-colors rounded-full">
                  <Play className="w-4 h-4 mr-2 fill-current" /> 开始沉浸体验
                </Button>
              </div>
            </div>
          ))
          ) : (
            <div className="col-span-3 text-center py-20 bg-secondary/20 rounded-2xl flex flex-col items-center justify-center">
                <p className="text-muted-foreground text-lg">暂无展览内容</p>
            </div>
          )}
        </div>

        {/* Oral History & Artifacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Oral History */}
          <div>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-serif font-bold">口述历史档案</h2>
                <Button variant="link" className="text-primary">查看更多 <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="按人物、事件或时间线检索..." className="pl-9 bg-secondary/30 border-transparent focus:bg-background" />
              </div>
            </div>
            <div className="space-y-6">
              {isLoadingOralHistories ? (
                 Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                 ))
              ) : oralHistories && oralHistories.length > 0 ? (
                oralHistories.map((item: any) => (
                    <Card key={item.id} className="border-none bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex gap-4">
                        <div className="w-24 h-24 rounded-lg bg-zinc-200 shrink-0 overflow-hidden relative group">
                        <img 
                            src={item.coverImage} 
                            alt={item.interviewee} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.mediaType === 'video' ? <Video className="w-8 h-8 text-white fill-white" /> : <Play className="w-8 h-8 text-white fill-white" />}
                        </div>
                        </div>
                        <div className="flex flex-col justify-center">
                        <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {item.description}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center"><Mic className="w-3 h-3 mr-1" /> 受访者：{item.interviewee}</span>
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</span>
                            <span className="flex items-center"><Headphones className="w-3 h-3 mr-1" /> {item.viewCount} 收听</span>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">暂无口述历史档案</div>
              )}
            </div>
          </div>

          {/* Digital Artifacts */}
          <div>
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-serif font-bold">文物档案</h2>
              <Button variant="link" className="text-primary">进入库房 <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </div>
            
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索文物..." 
                  className="pl-9 bg-secondary/30 border-transparent focus:bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Restoration Feature */}
            <Card className="mb-8 bg-primary/5 border-primary/10 overflow-hidden cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setShowRestoration(true)}>
              <CardContent className="p-0 flex">
                <div className="w-1/3 bg-zinc-200 relative">
                  <img src="/images/artifact-currency.jpg" className="w-full h-full object-cover grayscale opacity-70" alt="Before" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">修复前</span>
                  </div>
                </div>
                <div className="w-2/3 p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                    <Wrench className="w-4 h-4" /> 文物数字化修复体验
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    利用AI技术还原历史文物的真实面貌，点击体验交互式修复过程。
                  </p>
                  <Button size="sm" variant="outline" className="self-start text-xs h-7">立即体验</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              {isLoadingArtifacts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                ))
              ) : displayArtifacts.length > 0 ? (
                <>
                {displayArtifacts.map((artifact) => (
                  <div 
                    key={artifact.id} 
                    className="group cursor-pointer"
                    onClick={() => setSelectedArtifact(artifact)}
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 mb-3 relative">
                      <img 
                        src={artifact.coverImage} 
                        alt={artifact.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                    <h4 className="font-bold group-hover:text-primary transition-colors">{artifact.name}</h4>
                    <p className="text-xs text-muted-foreground">{artifact.era}</p>
                  </div>
                ))}
                </>
              ) : (
                <div className="col-span-2 text-center text-muted-foreground py-10">未找到相关文物</div>
              )}
              
              {!isLoadingArtifacts && (
                <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer">
                  <span className="text-sm font-medium">查看全部</span>
                  <span className="text-xs mt-1">{allArtifacts?.length || 0}+ 件文物</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedArtifact} onOpenChange={(open) => !open && setSelectedArtifact(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold">{selectedArtifact?.name}</DialogTitle>
            </DialogHeader>
            {selectedArtifact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100">
                <img 
                    src={selectedArtifact.coverImage} 
                    alt={selectedArtifact.name} 
                    className="w-full h-full object-cover"
                />
                </div>
                <div className="space-y-6">
                <div>
                    <h4 className="font-bold mb-2 text-primary">基本信息</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">年代：</span>
                        <span>{selectedArtifact.era}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">类别：</span>
                        <span>{selectedArtifact.category}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">出土地：</span>
                        <span>{selectedArtifact.origin || '未知'}</span>
                    </div>
                     <div>
                        <span className="text-muted-foreground">现存地：</span>
                        <span>{selectedArtifact.currentLocation || '未知'}</span>
                    </div>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold mb-2 text-primary">文物描述</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                    {selectedArtifact.description}
                    </p>
                </div>

                {selectedArtifact.historicalContext && (
                    <div>
                    <h4 className="font-bold mb-2 text-primary">历史背景</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {selectedArtifact.historicalContext}
                    </p>
                    </div>
                )}

                {(selectedArtifact.vrUrl || selectedArtifact.model3dUrl) && (
                    <div className="pt-4">
                    <Button className="w-full" onClick={() => {
                        // Start immersive experience with this artifact's context
                        setSelectedArtifact(null); // Close dialog
                        handleStartExperience({
                            ...selectedArtifact,
                            title: selectedArtifact.name,
                            desc: selectedArtifact.description,
                            type: "文物",
                            image: selectedArtifact.coverImage
                        });
                    }}>
                        <Play className="w-4 h-4 mr-2" /> 查看3D模型/VR
                    </Button>
                    </div>
                )}
                </div>
            </div>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRestoration} onOpenChange={setShowRestoration}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">文物数字化修复体验</DialogTitle>
            </DialogHeader>
            <div className="py-6">
                <p className="text-sm text-muted-foreground mb-4">
                    通过拖动滑块，对比查看文物在经过数字化AI修复前后的细节差异。
                </p>
                <div className="h-[400px] rounded-lg overflow-hidden border">
                    <ImageComparisonSlider 
                        beforeImage="/images/artifact-currency.jpg" // 假设这是一张残损的图
                        afterImage="https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=2070&auto=format&fit=crop" // 假设这是一张修复完好的图
                    />
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}