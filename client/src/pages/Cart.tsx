import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, Minus, Plus, ShoppingBag, Loader2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import PageHeader from "@/components/PageHeader";

export default function Cart() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.list.useQuery(undefined, {
    enabled: !!user,
  });

  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      toast.success("已从购物车移除");
      utils.cart.list.invalidate();
    },
  });

  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      toast.success("购物车已清空");
      utils.cart.list.invalidate();
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20">
        <div className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">请先登录</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">登录后即可查看购物车</p>
              <Link href="/auth">
                <Button>去登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalAmount = cartItems?.reduce((sum, item) => {
    return sum + Number(item.product?.price || 0) * item.quantity;
  }, 0) || 0;

  const handleQuantityChange = (id: number, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeMutation.mutate({ id });
    } else {
      updateQuantityMutation.mutate({ id, quantity: newQty });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="购物车"
        description="您的心愿清单"
        image="https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=2070&auto=format&fit=crop"
      />

      <div className="container py-12">
        <div className="mb-6">
          <Link href="/store">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              继续购物
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">购物车是空的</h3>
              <p className="text-muted-foreground mb-4">快去挑选心仪的红色文创商品吧</p>
              <Link href="/store">
                <Button>去逛逛</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.product?.coverImage || "/placeholder.jpg"}
                        alt={item.product?.name || "商品"}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{item.product?.name}</h3>
                        <p className="text-primary font-bold">¥{item.product?.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                            disabled={updateQuantityMutation.isPending}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                            disabled={updateQuantityMutation.isPending || item.quantity >= (item.product?.stock || 99)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeMutation.mutate({ id: item.id })}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <p className="font-bold">
                          ¥{(Number(item.product?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                >
                  清空购物车
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>订单摘要</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品数量</span>
                    <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品总价</span>
                    <span>¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运费</span>
                    <span className="text-green-600">免运费</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>合计</span>
                    <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" size="lg">
                    去结算
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
