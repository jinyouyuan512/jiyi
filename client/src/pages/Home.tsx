import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Star, PlayCircle, BookOpen, ShoppingBag, Sparkles, RefreshCw, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "红色足迹",
      desc: "探索河北经典红色旅游线路",
      link: "/tourism",
      color: "bg-red-50 text-red-600"
    },
    {
      icon: <PlayCircle className="w-6 h-6" />,
      title: "数字展馆",
      desc: "VR沉浸式体验革命历史",
      link: "/museum",
      color: "bg-amber-50 text-amber-600"
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "文创商城",
      desc: "精选红色主题文创产品",
      link: "/store",
      color: "bg-rose-50 text-rose-600"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "红色学堂",
      desc: "在线学习党史与研学课程",
      link: "/academy",
      color: "bg-stone-50 text-stone-600"
    }
  ];

  // Fetch routes from API
  const { data: routesData } = trpc.routes.list.useQuery();
  const routes = routesData?.slice(0, 3) || [];

  // Fetch featured products from API
  const { data: productsData } = trpc.products.featured.useQuery();
  const products = productsData?.slice(0, 4) || [];

  // Fetch recommended items
  const { data: recommendedRoute } = trpc.routes.recommendation.useQuery();
  const { data: recommendedProduct } = trpc.products.recommendation.useQuery();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-banner.jpg" 
            alt="Taihang Mountains" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background/90"></div>
        </div>

        {/* Content */}
        <div className="container relative z-10 text-center text-white space-y-8 pt-20 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Badge variant="outline" className="text-white border-white/30 px-4 py-1 mb-4 backdrop-blur-sm">
              河北红色文化数字化平台
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight mb-4 drop-shadow-2xl">
              冀忆红途
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-90 max-w-2xl mx-auto tracking-wide">
              在河北的红色旅途中，铭记历史，开创未来
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 text-lg shadow-lg shadow-primary/20">
              开始探索
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 rounded-full px-8 h-12 text-lg">
              观看宣传片
              <PlayCircle className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator - Moved up to avoid overlap */}
        <motion.div 
          className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/50 to-white/0"></div>
        </motion.div>
      </section>

      {/* AI Recommendation Section */}
      <section className="py-20 bg-[#F9F8F6] mt-8 relative overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
          <span className="absolute -top-10 -left-10 text-[15rem] font-serif font-bold text-stone-200/40 leading-none select-none whitespace-nowrap">
            为你推荐
          </span>
          <img src="/images/recommend-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-30 mix-blend-multiply" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 mb-16 pl-4">
            <div className="w-28 h-28 rounded-[2rem] bg-white shadow-xl p-5 flex items-center justify-center shrink-0 animate-pulse-slow ring-1 ring-black/5">
              <img src="/images/ai-recommend-icon.png" alt="AI Icon" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col items-start text-left">
              <Badge className="bg-red-50 text-red-600 hover:bg-red-100 mb-3 border-red-100 px-3 py-1 text-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> 个性化定制
              </Badge>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-3 text-zinc-900 tracking-tight">AI 智游推荐</h2>
              <p className="text-muted-foreground max-w-2xl text-lg">
                基于您的浏览历史和兴趣偏好，为您量身打造的专属红色之旅与文创精选。
              </p>
            </div>
            <Button variant="outline" className="ml-auto gap-2 hidden md:flex bg-white/50 backdrop-blur-sm border-stone-200 hover:bg-white">
              <RefreshCw className="w-4 h-4" /> 刷新推荐
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recommended Route */}
            <Card className="lg:col-span-2 overflow-hidden border-none shadow-lg group">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={recommendedRoute?.coverImage || "/images/xibaipo.jpg"} 
                  alt="Recommended Route" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-600 text-white border-none shadow-lg">98% 匹配度</Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{recommendedRoute?.title || "西柏坡深度研学之旅"}</h3>
                  <p className="text-white/80 text-sm flex items-center gap-4">
                    <span><MapPin className="w-3 h-3 inline mr-1"/> {recommendedRoute?.location || "石家庄 · 平山县"}</span>
                    <span><Users className="w-3 h-3 inline mr-1"/> 适合团队/党建</span>
                  </p>
                </div>
              </div>
              <CardContent className="p-6 bg-white">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 bg-secondary/30 rounded-lg p-3 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">推荐理由</span>
                    <span className="font-bold text-sm text-primary">您近期关注了“党史教育”</span>
                  </div>
                  <div className="flex-1 bg-secondary/30 rounded-lg p-3 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">预计耗时</span>
                    <span className="font-bold text-sm">{recommendedRoute?.days || "2天1夜"}</span>
                  </div>
                  <div className="flex-1 bg-secondary/30 rounded-lg p-3 text-center">
                    <span className="block text-xs text-muted-foreground mb-1">人均预算</span>
                    <span className="font-bold text-sm">¥{recommendedRoute?.price || "580"}起</span>
                  </div>
                </div>
                <Link href={recommendedRoute ? `/tourism/${recommendedRoute.id}` : "/tourism"}>
                  <Button className="w-full">查看详细行程</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recommended Product */}
            <Card className="overflow-hidden border-none shadow-lg group flex flex-col">
              <div className="relative h-48 overflow-hidden bg-zinc-100">
                <img 
                  src={recommendedProduct?.coverImage || "/images/product-badge.jpg"} 
                  alt="Recommended Product" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-amber-500 text-white border-none shadow-lg">猜你喜欢</Badge>
                </div>
              </div>
              <CardContent className="p-6 bg-white flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{recommendedProduct?.name || "狼牙山五壮士纪念徽章"}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1">
                  {recommendedProduct?.description ? recommendedProduct.description.substring(0, 40) + "..." : "限量发行，纯铜打造。根据您对“抗战历史”内容的浏览记录推荐。"}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-red-700">¥{recommendedProduct?.price || "128.00"}</span>
                  <Link href={recommendedProduct ? `/store/${recommendedProduct.id}` : "/store"}>
                    <Button size="sm" variant="secondary">
                      <ShoppingBag className="w-4 h-4 mr-2" /> 详情
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.link}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-none shadow-sm bg-white/50 backdrop-blur-sm cursor-pointer overflow-hidden">
                  <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold font-serif">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Routes */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
                精品红色线路
              </h2>
              <p className="text-muted-foreground max-w-lg">
                精选河北省内最具代表性的红色旅游路线，带您重温峥嵘岁月，感受革命精神。
              </p>
            </div>
            <Link href="/tourism">
              <Button variant="ghost" className="group">
                查看全部 <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {routes.map((route) => (
              <Card key={route.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={route.coverImage} 
                    alt={route.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {route.tags?.map(tag => (
                      <Badge key={tag} className="bg-white/90 text-foreground hover:bg-white backdrop-blur-sm shadow-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold font-serif group-hover:text-primary transition-colors">{route.title}</h3>
                    <div className="flex items-center text-amber-500 text-sm font-medium">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      4.9
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1" />
                    {route.location}
                    <span className="mx-2">•</span>
                    {route.days}
                  </div>
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                    查看详情
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Products */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary">文创精品</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              把红色记忆带回家
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              融合传统工艺与现代设计，每一件文创产品都承载着一段独特的历史记忆。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative aspect-square bg-secondary/50 rounded-xl overflow-hidden mb-4">
                  <img 
                    src={product.coverImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <Button 
                    size="icon" 
                    className="absolute bottom-4 right-4 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <h3 className="font-medium text-lg group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="font-bold text-primary">¥ {product.price}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/store">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-primary/20 text-primary hover:bg-primary/5">
                进入文创商城
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1533240332313-0db49b459ad6?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="container relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
            传承红色基因，赓续精神血脉
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-10 text-lg">
            加入我们的红色文化传承计划，成为一名红色文化传播者。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg">
              注册会员
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-zinc-700 text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg">
              了解更多
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
