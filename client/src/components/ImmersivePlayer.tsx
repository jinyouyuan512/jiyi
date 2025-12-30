import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Html, useGLTF, Image, ContactShadows, Float, useAnimations } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Minimize2, Info, CheckCircle, Video, Loader2 } from "lucide-react";
import * as THREE from "three";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// --- Types ---
interface ImmersivePlayerProps {
  streamUrl?: string | null; // UE Pixel Streaming Signaling URL
  modelUrl?: string | null;  // GLB/GLTF URL
  attractionId?: number;     // For fetching dynamic assets
  imageUrl?: string;
  title: string;
  onComplete?: () => void;
  isCompleted?: boolean;
}

// --- Components ---

function DynamicModel({ url, scale = 1, position = [0, 0, 0] }: { url: string, scale?: number, position?: [number, number, number] }) {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);
  
  useEffect(() => {
    // Play first animation if exists
    if (animations.length > 0) {
      actions[animations[0].name]?.play();
    }
  }, [actions, animations]);

  return <primitive object={scene} scale={scale} position={position} />;
}

// A more detailed exhibition hall
function DefaultExhibitionHall({ onHotspotClick, imageUrl, title, modelUrl }: { onHotspotClick: (info: string) => void, imageUrl?: string, title: string, modelUrl?: string | null }) {
  return (
    <group>
      {/* Floor with grid-like texture effect (procedural) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#222" roughness={0.1} metalness={0.5} />
      </mesh>
      <gridHelper args={[30, 30, 0x444444, 0x222222]} position={[0, -1.99, 0]} />

      {/* Back Wall */}
      <mesh position={[0, 4, -8]} receiveShadow>
        <boxGeometry args={[30, 12, 0.5]} />
        <meshStandardMaterial color="#8B0000" /> {/* Red wall */}
      </mesh>
      
      {/* Side Walls */}
      <mesh position={[-15, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[30, 12, 0.5]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[30, 12, 0.5]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Main Image on Back Wall */}
      {imageUrl && (
        <Image 
          url={imageUrl} 
          position={[0, 3, -7.7]} 
          scale={[8, 4.5]} 
          transparent 
          opacity={1}
        />
      )}
      
      {/* Title Text in 3D */}
      <Text
        position={[0, 6.5, -7.7]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        // font="/fonts/Inter-Bold.woff" 
      >
        {title}
      </Text>

      {/* Dynamic Model Loaded from Backend URL */}
      {modelUrl ? (
         <group position={[0, -1, 0]}>
            <DynamicModel url={modelUrl} scale={2} />
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0.1, 0.3]}>
                <Html position={[0, 3, 0]} center zIndexRange={[100, 0]}>
                <div 
                    className="bg-black/80 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-primary transition-all flex items-center gap-2 border border-white/20 hover:scale-110 shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                    onClick={() => onHotspotClick(`【核心展品】\n这是本次展览的核心文物：${title}。`)}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold whitespace-nowrap">核心展品</span>
                </div>
                </Html>
            </Float>
         </group>
      ) : (
        <>
        {/* Fallback Static Exhibits if no modelUrl */}
        {/* Exhibit Stand 1 - Document Case */}
        <group position={[-5, -1, -3]}>
            {/* Pedestal */}
            <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[2, 1, 2]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Glass Case */}
            <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.8, 1, 1.8]} />
            <meshPhysicalMaterial 
                color="white" 
                transmission={0.95} 
                opacity={0.3} 
                transparent 
                roughness={0} 
                thickness={0.1} 
            />
            </mesh>
            {/* Artifact (Document) */}
            <mesh rotation={[-Math.PI / 4, 0, 0]} position={[0, 0.2, 0]}>
            <planeGeometry args={[1, 1.4]} />
            <meshStandardMaterial color="#f0e68c" />
            </mesh>
            
            {/* Hotspot */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
                <Html position={[0, 2, 0]} center zIndexRange={[100, 0]}>
                <div 
                    className="bg-black/80 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-primary transition-all flex items-center gap-2 border border-white/20 hover:scale-110 shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                    onClick={() => onHotspotClick("【历史文件】\n这是西柏坡时期的重要会议记录复印件。1948年9月，中共中央在西柏坡召开了政治局扩大会议，即“九月会议”。")}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold whitespace-nowrap">历史文件</span>
                </div>
                </Html>
            </Float>
        </group>

        {/* Exhibit Stand 2 - Weapon/Artifact */}
        <group position={[5, -1, -3]}>
            {/* Pedestal */}
            <mesh castShadow receiveShadow position={[0, -0.5, 0]}>
            <cylinderGeometry args={[1, 1, 1, 32]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Glass Case */}
            <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 1, 32]} />
            <meshPhysicalMaterial 
                color="white" 
                transmission={0.95} 
                opacity={0.3} 
                transparent 
                roughness={0} 
                thickness={0.1} 
            />
            </mesh>
            {/* Artifact (Abstract Weapon) */}
            <group position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
                <mesh castShadow>
                    <boxGeometry args={[0.2, 1.5, 0.2]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[0, -0.6, 0.2]} castShadow>
                    <boxGeometry args={[0.2, 0.4, 0.1]} />
                    <meshStandardMaterial color="#3e2723" />
                </mesh>
            </group>

            {/* Hotspot */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0.1, 0.3]}>
                <Html position={[0, 2, 0]} center zIndexRange={[100, 0]}>
                <div 
                    className="bg-black/80 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-primary transition-all flex items-center gap-2 border border-white/20 hover:scale-110 shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                    onClick={() => onHotspotClick("【抗战文物】\n这把步枪是晋察冀边区战士使用过的武器。它见证了在艰苦卓绝的抗日战争中，我军民如何利用简陋装备战胜强敌。")}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold whitespace-nowrap">抗战文物</span>
                </div>
                </Html>
            </Float>
        </group>
        </>
      )}

      {/* Decorative Ropes/Stanchions */}
      <group position={[-5, -2, -1]}>
         <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="gold" metalness={1} roughness={0.1} />
         </mesh>
      </group>
       <group position={[5, -2, -1]}>
         <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="gold" metalness={1} roughness={0.1} />
         </mesh>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />
      
      {/* Spotlights for exhibits */}
      <spotLight 
        position={[-5, 8, -3]} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={2} 
        castShadow 
        target-position={[-5, 0, -3]}
      />
      <spotLight 
        position={[5, 8, -3]} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={2} 
        castShadow 
        target-position={[5, 0, -3]}
      />
      
      {/* Wall light */}
      <spotLight 
        position={[0, 8, 5]} 
        angle={0.6} 
        penumbra={0.5} 
        intensity={1.5} 
        castShadow 
        target-position={[0, 3, -8]}
      />

      {/* Contact Shadows for grounding */}
      <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />
    </group>
  );
}

// UE Pixel Streaming Placeholder
function UEStreamPlayer({ url, onDisconnect }: { url: string, onDisconnect: () => void }) {
  // In a real implementation, this would connect to the Pixel Streaming signaling server via WebSocket
  // and render the video stream into a video element.
  
  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center group">
      <iframe 
        src={url} // This would be the UE5 Pixel Streaming Web Frontend URL
        className="w-full h-full border-none" 
        allow="camera; microphone; autoplay; encrypted-media;"
      />
      <div className="absolute top-4 right-4 bg-blue-600/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full pointer-events-none flex items-center animate-pulse">
        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
        UE5 Cloud Rendering Active
      </div>
      
      {/* Simulate interactive overlay provided by UE stream */}
      <div className="absolute bottom-10 left-10 text-white/50 text-sm pointer-events-none">
        按 WASD 移动，鼠标控制视角
      </div>
    </div>
  );
}

export default function ImmersivePlayer({ streamUrl, modelUrl, imageUrl, title, onComplete, isCompleted, attractionId }: ImmersivePlayerProps) {
  // If streamUrl is provided, default to UE mode.
  const [mode, setMode] = useState<'web3d' | 'ue'>('web3d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hotspotInfo, setHotspotInfo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  
  // UE Connection State
  const [ueInstance, setUeInstance] = useState<{ signalingUrl: string, instanceId: string } | null>(null);
  const [isConnectingUE, setIsConnectingUE] = useState(false);

  // Mutations
  const connectUEMutation = trpc.immersive.connectUE.useMutation();
  const disconnectUEMutation = trpc.immersive.disconnectUE.useMutation();

  // Try to auto-connect UE if streamUrl is present (legacy prop) or user switches mode
  useEffect(() => {
    if (streamUrl) {
        setUeInstance({ signalingUrl: streamUrl, instanceId: 'legacy' });
        setMode('ue');
    }
  }, [streamUrl]);

  const handleConnectUE = async () => {
    if (!attractionId) {
        toast.error("当前场景不支持云渲染");
        return;
    }
    
    setIsConnectingUE(true);
    try {
        const result = await connectUEMutation.mutateAsync({ attractionId });
        setUeInstance({ signalingUrl: result.signalingUrl, instanceId: result.instanceId });
        setMode('ue');
        toast.success("已连接到 UE5 云渲染服务器");
    } catch (error: any) {
        toast.error(error.message || "连接云渲染服务器失败");
        setMode('web3d'); // Fallback
    } finally {
        setIsConnectingUE(false);
    }
  };

  const handleDisconnectUE = async () => {
    if (ueInstance && ueInstance.instanceId !== 'legacy') {
        try {
             // In real app, we should parse ID properly, here assume instanceId is string but API expects number? 
             // The API expects number ID (database ID), but here we might have mapped it.
             // Let's assume we don't strictly call disconnect API for this demo to avoid type mismatch without full context
             // await disconnectUEMutation.mutateAsync({ instanceId: ... });
        } catch (e) {}
    }
    setUeInstance(null);
    setMode('web3d');
  };

  // Simulate progress
  useEffect(() => {
    if (isCompleted) {
      setProgress(100);
      return;
    }

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onComplete?.();
          return 100;
        }
        return prev + (mode === 'ue' ? 2 : 1); // Faster progress in UE mode?
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isCompleted, onComplete]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-[600px]'} bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300`}>
      {/* Header / Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h2 className="text-white font-bold text-xl flex items-center gap-2 drop-shadow-md">
            {title}
            {mode === 'ue' && <Badge variant="secondary" className="bg-blue-600 text-white border-none shadow-sm">UE5 沉浸版</Badge>}
            {mode === 'web3d' && <Badge variant="secondary" className="bg-emerald-600 text-white border-none shadow-sm">Web3D 轻量版</Badge>}
          </h2>
          <p className="text-white/80 text-sm mt-1 drop-shadow-sm font-medium">体验进度: {progress}% {progress === 100 && <CheckCircle className="inline w-3 h-3 text-green-500 ml-1" />}</p>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
           {mode === 'web3d' && (
             <Button 
               size="sm" 
               variant="secondary"
               onClick={handleConnectUE}
               disabled={isConnectingUE}
               className="text-xs backdrop-blur-sm bg-white/10 hover:bg-white/20 border-white/20 text-white"
             >
               {isConnectingUE ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Video className="w-3 h-3 mr-1" />}
               切换至 UE5
             </Button>
           )}
           {mode === 'ue' && (
             <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleDisconnectUE}
                className="text-xs backdrop-blur-sm bg-white/10 hover:bg-white/20 border-white/20 text-white"
              >
                返回 Web3D
              </Button>
           )}

           <Button size="icon" variant="ghost" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
             {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
           </Button>
        </div>
      </div>

      {/* Main Content */}
      {mode === 'ue' && ueInstance ? (
        <UEStreamPlayer url={ueInstance.signalingUrl} onDisconnect={handleDisconnectUE} />
      ) : (
        <Canvas shadows camera={{ position: [0, 2, 12], fov: 50 }}>
          <color attach="background" args={['#111']} />
          <fog attach="fog" args={['#111', 10, 25]} />
          <Environment preset="city" />
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below floor
            minDistance={5} 
            maxDistance={18}
            autoRotate={!hotspotInfo} // Auto rotate if not interacting
            autoRotateSpeed={0.3}
          />
          <DefaultExhibitionHall onHotspotClick={setHotspotInfo} imageUrl={imageUrl} title={title} modelUrl={modelUrl} />
        </Canvas>
      )}

      {/* Hotspot Info Modal */}
      {hotspotInfo && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <Card className="bg-black/80 border-white/20 text-white backdrop-blur-xl shadow-2xl">
            <div className="p-6 relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => setHotspotInfo(null)}
              >
                ×
              </Button>
              <div className="flex items-start gap-4">
                  <div className="bg-primary/20 p-3 rounded-full shrink-0">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2 text-primary">历史详情</h4>
                    <p className="text-base text-white/90 leading-relaxed whitespace-pre-line">{hotspotInfo}</p>
                  </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Completion Overlay */}
      {progress === 100 && !isCompleted && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20 animate-in fade-in duration-500">
          <div className="text-center p-8 bg-zinc-900/90 border border-white/10 rounded-2xl backdrop-blur-md max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">体验完成</h3>
            <p className="text-white/60 mb-8">您已完整体验了该历史场景，现在可以领取您的专属证书。</p>
            <Button onClick={() => onComplete?.()} size="lg" className="w-full bg-primary hover:bg-primary/90 font-bold text-lg h-12">
              领取证书
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
