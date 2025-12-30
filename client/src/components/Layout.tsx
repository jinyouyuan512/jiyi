import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ShoppingCart, User, LogOut, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { name: "首页", path: "/" },
    { name: "红色足迹", path: "/tourism" },
    { name: "数字展馆", path: "/museum" },
    { name: "红色学堂", path: "/academy" },
    { name: "文创商城", path: "/store" },
    { name: "合作社区", path: "/community" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled
            ? "bg-background/80 backdrop-blur-md border-border/40 shadow-sm py-3"
            : "bg-transparent py-5"
        )}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer group">
              <img 
                src="/images/logo-final-color.png" 
                alt="冀忆红途" 
                className="h-12 w-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform" 
              />
              <div className="flex flex-col">
                <span className={cn(
                  "font-serif font-bold text-lg leading-none transition-colors",
                  isScrolled ? "text-foreground" : "text-white drop-shadow-md"
                )}>
                  冀忆红途
                </span>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest opacity-80 transition-colors",
                  isScrolled ? "text-muted-foreground" : "text-white/80 drop-shadow-md"
                )}>
                  Jiyi Hongtu
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={cn(
                    "text-sm font-medium transition-all hover:text-primary relative py-1 cursor-pointer",
                    location === item.path
                      ? "text-primary font-bold"
                      : isScrolled ? "text-foreground/80" : "text-white/90 hover:text-white drop-shadow-sm",
                    "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full",
                    location === item.path && "after:w-full"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full hover:bg-primary/10 hover:text-primary transition-colors",
                !isScrolled && "text-white hover:text-white hover:bg-white/20"
              )}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>

            {loading ? (
               <Loader2 className={cn("animate-spin w-5 h-5", isScrolled ? "text-foreground" : "text-white")} />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border border-white/20">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name || "User"} />
                      <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email || user.openId}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>个人中心</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button
                  variant={isScrolled ? "default" : "secondary"}
                  size="sm"
                  className="rounded-full px-6 font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  登录
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={cn(
              "md:hidden p-2 rounded-md transition-colors",
              isScrolled ? "text-foreground" : "text-white"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 md:hidden animate-in fade-in slide-in-from-top-5">
          <nav className="flex flex-col gap-6 text-center">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={cn(
                    "text-2xl font-serif font-medium block py-2 cursor-pointer",
                    location === item.path ? "text-primary" : "text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </span>
              </Link>
            ))}
            <div className="flex flex-col gap-4 mt-8">
              {user ? (
                 <>
                   <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" /> {user.name}
                   </div>
                   <Button className="w-full rounded-full py-6 text-lg" onClick={() => { setLocation("/profile"); setIsMobileMenuOpen(false); }}>
                      个人中心
                   </Button>
                   <Button variant="outline" className="w-full rounded-full py-6 text-lg" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
                      退出登录
                   </Button>
                 </>
              ) : (
                <Link href="/auth">
                  <Button className="w-full rounded-full py-6 text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                    登录 / 注册
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-16 border-t border-zinc-800">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-serif font-bold shadow-lg">
                冀
              </div>
              <span className="font-serif font-bold text-xl text-zinc-100">冀忆红途</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              在河北的红色旅途中，铭记历史，开创未来。打造集文化传播、旅游服务与文创运营于一体的综合性数字平台。
            </p>
          </div>

          <div>
            <h4 className="text-zinc-100 font-bold mb-6">平台导航</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/tourism"><span className="hover:text-primary transition-colors cursor-pointer">红色旅游</span></Link></li>
              <li><Link href="/museum"><span className="hover:text-primary transition-colors cursor-pointer">数字展馆</span></Link></li>
              <li><Link href="/store"><span className="hover:text-primary transition-colors cursor-pointer">文创商城</span></Link></li>
              <li><Link href="/academy"><span className="hover:text-primary transition-colors cursor-pointer">红色学堂</span></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-100 font-bold mb-6">联系我们</h4>
            <ul className="space-y-3 text-sm">
              <li>河北省石家庄市长安区</li>
              <li>contact@jiyihongtu.com</li>
              <li>+86 311 1234 5678</li>
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-100 font-bold mb-6">订阅动态</h4>
            <p className="text-xs mb-4">获取最新的红色旅游资讯和文创产品优惠。</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="您的邮箱" 
                className="bg-zinc-800 border-none rounded-md px-3 py-2 text-sm w-full focus:ring-1 focus:ring-primary"
              />
              <Button size="sm">订阅</Button>
            </div>
          </div>
        </div>
        <div className="container mt-16 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
          <p>© 2025 冀忆红途 Jiyi Hongtu. All rights reserved. Powered by Manus AI.</p>
        </div>
      </footer>
    </div>
  );
}
