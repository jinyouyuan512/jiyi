import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, User, Edit2, Save, MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const IDENTITIES = [
  "普通游客",
  "研学学生",
  "历史研究员",
  "红色文化传播者",
  "退役军人",
  "党员干部"
];

export default function Profile() {
  const { user, loading, refresh } = useAuth();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery(undefined, {
      enabled: !!user
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    identity: "",
    email: "",
    phone: ""
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("个人信息更新成功");
      setIsEditing(false);
      await refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        identity: user.identity || "普通游客",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  const handleSave = () => {
    updateProfileMutation.mutate({
      name: formData.name,
      identity: formData.identity,
      // email and phone are read-only for now in this simple edit form to avoid auth issues
    });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    return <div className="text-center py-20">请先登录</div>;
  }

  return (
    <div className="container py-12 min-h-screen">
      <h1 className="text-3xl font-serif font-bold mb-8">个人中心</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <User className="h-5 w-5 text-primary" />
                        个人信息
                    </CardTitle>
                    {!isEditing ? (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={handleSave} disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 pt-4">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl border-4 border-background shadow-xl overflow-hidden">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <Badge className="absolute -bottom-2 -right-2 px-3 py-1 bg-primary text-white border-2 border-background">
                                    {user.identity || "普通游客"}
                                </Badge>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>昵称</Label>
                                    <Input 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>身份定位</Label>
                                    <Select 
                                        value={formData.identity} 
                                        onValueChange={(val) => setFormData({...formData, identity: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择身份" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {IDENTITIES.map(id => (
                                                <SelectItem key={id} value={id}>{id}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">账号 (不可修改)</Label>
                                    <Input value={user.email || user.phone || user.openId} disabled className="bg-muted" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button className="flex-1" onClick={handleSave} disabled={updateProfileMutation.isPending}>
                                        保存
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                        取消
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">用户名</div>
                                    <div className="font-medium text-lg">{user.name || "未设置"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">身份定位</div>
                                    <div className="font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        {user.identity || "普通游客"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">账号/邮箱</div>
                                    <div className="font-medium">{user.email || user.phone || user.openId}</div>
                                </div>
                                <div>
                                     <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">注册时间</div>
                                     <div className="font-medium text-sm text-muted-foreground">
                                        {user.createdAt ? format(new Date(user.createdAt), "yyyy-MM-dd") : "-"}
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        我的订单
                    </CardTitle>
                    <CardDescription>查看您的文创商品和旅游线路订单历史</CardDescription>
                </CardHeader>
                <CardContent>
                    {ordersLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : orders && orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-secondary/20 transition-colors">
                                    <div>
                                        <div className="font-bold text-lg">{order.itemName}</div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>订单号: <span className="font-mono">{order.orderNumber}</span></div>
                                            <div>
                                                数量: {order.quantity} | 单价: ¥{order.unitPrice} | <span className="text-primary font-medium">总价: ¥{order.totalAmount}</span>
                                            </div>
                                            <div className="text-xs opacity-70">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                                        {order.status === 'paid' ? '已支付' : 
                                         order.status === 'pending' ? '待支付' : order.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-2">
                            <Package className="h-12 w-12 opacity-20" />
                            <p>暂无订单记录</p>
                            <Button variant="link" className="text-primary" onClick={() => window.location.href = '/store'}>
                                去商城逛逛
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
