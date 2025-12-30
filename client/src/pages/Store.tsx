import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Filter, Heart, Palette, Rocket, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
        toast.success(`购买成功！订单号: ${data.orderNumber}`);
        setLocation("/profile");
    },
    onError: (err) => {
        toast.error(err.message);
    }
  });

  const handleBuy = (product: any) => {
    if (!user) {
        toast.error("请先登录");
        setLocation("/auth");
        return;
    }
    
    // Simple confirmation
    if (confirm(`确认购买 ${product.name} 吗？价格: ¥${product.price}`)) {
        createOrder.mutate({
            orderType: 'product',
            itemId: product.id,
            itemName: product.name,
            quantity: 1,
            unitPrice: Number(product.price),
            totalAmount: Number(product.price),
            paymentMethod: 'wechat', // Mock
        });
    }
  };

  const categories = ["全部", "家居生活", "办公文具", "工艺摆件", "收藏纪念", "服饰配饰"];

  const filteredProducts = !products ? [] : selectedCategory === "全部" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary">文创商城</Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">红色文创精品</h1>
            <p className="text-muted-foreground max-w-lg">
              精选具有河北红色文化特色的创意产品，让历史更有温度。
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索商品..." className="pl-9 rounded-full bg-secondary/50 border-transparent focus:bg-background transition-colors" />
            </div>
            <Button variant="outline" size="icon" className="rounded-full shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border/50">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Crowdfunding & Designers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="lg:col-span-2 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <Badge className="bg-primary text-white border-none">设计众筹</Badge>
                <h3 className="text-2xl font-bold font-serif">“太行印象”系列文创众筹计划</h3>
                <p className="text-zinc-300">
                  汇聚民间创意，将太行山的雄奇与红色精神融入日常生活。支持原创设计，参与产品孵化，获得首发纪念版。
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>已筹金额: ¥128,000</span>
                    <span>目标: ¥200,000</span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[64%]"></div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>支持人数: 1,240</span>
                    <span>剩余时间: 15天</span>
                  </div>
                </div>
                <Button className="bg-white text-black hover:bg-zinc-200 mt-4">
                  <Rocket className="w-4 h-4 mr-2" /> 立即支持
                </Button>
              </div>
              <div className="w-full md:w-1/3 aspect-square bg-zinc-700/50 rounded-xl flex items-center justify-center border border-zinc-600">
                <Palette className="w-16 h-16 text-zinc-500" />
                <span className="sr-only">众筹产品预览</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-none">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">设计师专区</h3>
              </div>
              <div className="space-y-6 flex-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 overflow-hidden">
                      <img src={`https://github.com/shadcn.png`} alt="Designer" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">独立设计师 {i}号</h4>
                      <p className="text-xs text-muted-foreground">擅长：传统纹样提取与再设计</p>
                    </div>
                    <Button size="sm" variant="ghost" className="ml-auto text-xs">关注</Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-6">入驻成为设计师</Button>
            </CardContent>
          </Card>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-card">
                <div className="relative aspect-square overflow-hidden bg-secondary/30">
                  <img 
                    src={product.coverImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
                    <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 shadow-md hover:text-red-500">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="icon" className="rounded-full h-8 w-8 shadow-md" onClick={() => handleBuy(product)}>
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                  {product.sales > 2000 && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white border-none shadow-sm">
                      热销
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">{product.category}</div>
                  <h3 className="font-medium text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-primary">¥ {product.price}</span>
                    <span className="text-xs text-muted-foreground">{product.sales}人付款</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
