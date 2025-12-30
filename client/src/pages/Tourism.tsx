import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Users, ArrowRight, Star, ShieldAlert, CloudRain, Phone, Layers, Map as MapIcon } from "lucide-react";
import { MapView } from "@/components/Map";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";

export default function Tourism() {
  const [activeTab, setActiveTab] = useState("routes");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  // Fetch routes from API
  const { data: routesData } = trpc.routes.list.useQuery();
  const routes = routesData || [];

  // Fetch attractions for map
  const { data: attractionsData } = trpc.attractions.list.useQuery();
  const attractions = attractionsData || [];

  // Function to update markers
  const updateMarkers = () => {
    if (!mapRef.current || !window.L || !layerGroupRef.current) return;

    // Clear existing markers
    layerGroupRef.current.clearLayers();

    // Add new markers
    attractions.forEach(attr => {
      if (attr.latitude && attr.longitude) {
        const lat = parseFloat(attr.latitude);
        const lng = parseFloat(attr.longitude);
        
        window.L.marker([lat, lng])
          .addTo(layerGroupRef.current)
          .bindPopup(`
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${attr.name}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${attr.location}</p>
              <a href="/attractions/${attr.id}" style="color: #c0392b; font-size: 12px; text-decoration: none;">查看详情 ></a>
            </div>
          `);
      }
    });
  };

  // Update markers when attractions data changes
  useEffect(() => {
    updateMarkers();
  }, [attractions]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title="红色足迹" 
        description="探索河北经典红色旅游线路，重温峥嵘岁月"
        image="/images/langyashan.jpg"
      />

      <div className="container -mt-10 relative z-20">
        <Card className="border-none shadow-lg bg-background/80 backdrop-blur-md p-2 mb-8">
          <Tabs defaultValue="routes" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="routes" className="text-base">精品线路</TabsTrigger>
              <TabsTrigger value="map" className="text-base">景区导览</TabsTrigger>
              <TabsTrigger value="safety" className="text-base">安全保障</TabsTrigger>
            </TabsList>

            <div className="mt-8 bg-background rounded-lg p-4 md:p-8 min-h-[500px]">
              <TabsContent value="routes" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {routes.map((route) => (
                    <Card key={route.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col md:flex-row h-full md:h-72">
                      <div className="w-full md:w-2/5 relative overflow-hidden h-48 md:h-full">
                        <img 
                          src={route.coverImage} 
                          alt={route.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {route.tags?.map(tag => (
                            <Badge key={tag} className="bg-black/50 text-white border-none text-xs backdrop-blur-sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold font-serif group-hover:text-primary transition-colors line-clamp-1">{route.title}</h3>
                          <div className="flex items-center text-amber-500 text-sm font-medium shrink-0 ml-2">
                            <Star className="w-3.5 h-3.5 fill-current mr-1" />
                            {route.rating}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
                          {route.description}
                        </p>
                        
                        <div className="space-y-3 mt-auto">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                            <span className="truncate">{route.location}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {route.days}</span>
                              <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> 2人起订</span>
                            </div>
                            <span className="text-lg font-bold text-primary">¥ {route.price}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-border flex justify-end">
                          <Button size="sm" className="group/btn">
                            预订行程 <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="map" className="h-[600px] rounded-xl overflow-hidden border border-border shadow-inner animate-in fade-in zoom-in-95 duration-500 m-0">
                <div className="w-full h-full relative">
                  <MapView 
                    onMapReady={(map: any) => {
                      mapRef.current = map;
                      // Initialize layer group if not exists
                      if (!layerGroupRef.current) {
                        layerGroupRef.current = window.L.layerGroup().addTo(map);
                      }
                      // Update markers immediately
                      updateMarkers();
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-lg shadow-lg max-w-xs z-10 space-y-4">
                    <div>
                      <h3 className="font-bold mb-2 text-primary">景区分布图</h3>
                      <p className="text-xs text-muted-foreground">
                        点击地图上的标记查看景区详情。支持缩放和拖动浏览全省红色资源分布。
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-medium flex items-center"><Layers className="w-4 h-4 mr-2"/> 人流热力图</span>
                      <Button 
                        size="sm" 
                        variant={showHeatmap ? "default" : "outline"} 
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className="h-7 text-xs"
                      >
                        {showHeatmap ? "已开启" : "开启"}
                      </Button>
                    </div>
                    {showHeatmap && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        <span className="font-bold">提示：</span> 西柏坡景区当前人流量较大，建议错峰出行。
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="safety" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="bg-red-50 border-red-100">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2 text-red-600">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-red-700">一键紧急求助</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-red-600/80 mb-6">
                        遇到紧急情况？点击下方按钮立即连接景区管理方和当地应急部门。
                      </p>
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" size="lg">
                        <Phone className="w-4 h-4 mr-2" /> 立即呼救
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2 text-blue-600">
                        <CloudRain className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">安全预警中心</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-sm">
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded shrink-0 mt-0.5">天气</span>
                        <span className="text-amber-800">狼牙山景区明日有中雨，山路湿滑，请游客注意防滑保暖。</span>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded shrink-0 mt-0.5">交通</span>
                        <span className="text-blue-800">通往西柏坡的主干道正在施工，请绕行G207国道。</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-2 text-green-600">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold">保险与理赔</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-6">
                        为您的红色之旅保驾护航。提供专属旅游意外险购买和快速理赔咨询服务。
                      </p>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">购买保险</Button>
                        <Button variant="outline" className="flex-1">理赔咨询</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* M4: 行程定制入口 */}
        <div className="mt-16 bg-primary/5 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary/10">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-3xl font-serif font-bold">想定制您的专属红色之旅？</h2>
            <p className="text-muted-foreground text-lg">
              基于AI的智慧旅游服务引擎，为您量身打造个性化行程。无论是亲子研学、党建活动还是深度游览，我们都能满足。
            </p>
          </div>
          <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/10">
            <MapIcon className="w-5 h-5 mr-2" /> 开始定制行程
          </Button>
        </div>
      </div>
    </div>
  );
}
