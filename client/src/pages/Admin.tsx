import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Users, Package, ShoppingCart, MessageSquare, Flag, BarChart3, 
  Search, Edit, Trash2, Ban, CheckCircle, XCircle, Star, Pin, 
  Loader2, TrendingUp, DollarSign, FileText, AlertTriangle
} from "lucide-react";

export default function Admin() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-500">访问被拒绝</CardTitle>
            <CardDescription className="text-center">
              您没有权限访问管理后台，请使用管理员账号登录。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">管理后台</h1>
          <p className="text-muted-foreground">欢迎回来，{user.name}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-3xl mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              概览
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              用户
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              商品
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              订单
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              社区
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              举报
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </TabsContent>

          <TabsContent value="posts">
            <PostsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = trpc.admin.dashboard.useQuery();

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">无法加载统计数据</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总订单数</CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orderCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{Number(stats.revenue).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">在售商品</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理订单</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待审核评价</CardTitle>
            <Star className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.pendingReviews}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理举报</CardTitle>
            <Flag className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.pendingReports}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>社区动态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.postCount}</div>
          <p className="text-muted-foreground">活跃帖子数</p>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (v: string) => void }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.users.list.useQuery({ search: searchTerm });
  const banMutation = trpc.admin.users.ban.useMutation({
    onSuccess: () => {
      toast.success("用户已封禁");
      utils.admin.users.list.invalidate();
    }
  });
  const unbanMutation = trpc.admin.users.unban.useMutation({
    onSuccess: () => {
      toast.success("用户已解封");
      utils.admin.users.list.invalidate();
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索用户..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱/手机</TableHead>
              <TableHead>身份</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>{user.email || user.phone || "-"}</TableCell>
                <TableCell>{user.identity || "普通游客"}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "管理员" : "用户"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(user as any).status === "banned" ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => unbanMutation.mutate({ id: user.id })}
                        disabled={unbanMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        解封
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => banMutation.mutate({ id: user.id })}
                        disabled={banMutation.isPending}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        封禁
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ProductsTab({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (v: string) => void }) {
  const utils = trpc.useUtils();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
    coverImage: "",
    stock: 0,
  });

  const { data, isLoading } = trpc.admin.products.list.useQuery({});
  const createMutation = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("商品创建成功");
      setIsCreateOpen(false);
      setNewProduct({ name: "", category: "", price: 0, description: "", coverImage: "", stock: 0 });
      utils.admin.products.list.invalidate();
    },
    onError: (err) => toast.error(err.message)
  });
  const deleteMutation = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      toast.success("商品已删除");
      utils.admin.products.list.invalidate();
    }
  });

  const handleCreate = () => {
    if (!newProduct.name || !newProduct.category || !newProduct.description || !newProduct.coverImage) {
      toast.error("请填写完整信息");
      return;
    }
    createMutation.mutate(newProduct);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索商品..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>添加商品</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>添加新商品</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>商品名称</Label>
                <Input 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div>
                <Label>分类</Label>
                <Input 
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="如：家居生活、办公文具"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>价格</Label>
                  <Input 
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>库存</Label>
                  <Input 
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>封面图片URL</Label>
                <Input 
                  value={newProduct.coverImage}
                  onChange={(e) => setNewProduct({ ...newProduct, coverImage: e.target.value })}
                />
              </div>
              <div>
                <Label>商品描述</Label>
                <Textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>库存</TableHead>
              <TableHead>销量</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell className="max-w-[200px] truncate">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>¥{product.price}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.sales}</TableCell>
                <TableCell>
                  <Badge variant={product.status === "active" ? "default" : "secondary"}>
                    {product.status === "active" ? "在售" : product.status === "soldout" ? "售罄" : "下架"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteMutation.mutate({ id: product.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function OrdersTab({ searchTerm, setSearchTerm }: { searchTerm: string; setSearchTerm: (v: string) => void }) {
  const utils = trpc.useUtils();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [shipInfo, setShipInfo] = useState({ trackingNumber: "", trackingCompany: "" });

  const { data, isLoading } = trpc.admin.orders.list.useQuery({ search: searchTerm });
  const updateStatusMutation = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("订单状态已更新");
      setSelectedOrder(null);
      utils.admin.orders.list.invalidate();
    }
  });

  const handleShip = (orderId: number) => {
    if (!shipInfo.trackingNumber) {
      toast.error("请输入物流单号");
      return;
    }
    updateStatusMutation.mutate({
      id: orderId,
      status: "shipped",
      ...shipInfo
    });
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待支付", variant: "outline" },
    paid: { label: "已支付", variant: "default" },
    shipped: { label: "已发货", variant: "secondary" },
    completed: { label: "已完成", variant: "default" },
    cancelled: { label: "已取消", variant: "destructive" },
    refunded: { label: "已退款", variant: "destructive" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索订单号..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>商品</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>下单时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                <TableCell className="max-w-[150px] truncate">{order.itemName}</TableCell>
                <TableCell>{order.user?.name || "-"}</TableCell>
                <TableCell>¥{order.totalAmount}</TableCell>
                <TableCell>
                  <Badge variant={statusMap[order.status]?.variant || "secondary"}>
                    {statusMap[order.status]?.label || order.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {order.status === "paid" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedOrder(order.id)}>发货</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>发货信息</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>物流公司</Label>
                            <Input 
                              value={shipInfo.trackingCompany}
                              onChange={(e) => setShipInfo({ ...shipInfo, trackingCompany: e.target.value })}
                              placeholder="如：顺丰速运"
                            />
                          </div>
                          <div>
                            <Label>物流单号</Label>
                            <Input 
                              value={shipInfo.trackingNumber}
                              onChange={(e) => setShipInfo({ ...shipInfo, trackingNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleShip(order.id)} disabled={updateStatusMutation.isPending}>
                            确认发货
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  {order.status === "shipped" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed" })}
                    >
                      确认收货
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PostsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.posts.list.useQuery({});
  
  const updateMutation = trpc.admin.posts.update.useMutation({
    onSuccess: () => {
      toast.success("操作成功");
      utils.admin.posts.list.invalidate();
    }
  });
  const deleteMutation = trpc.admin.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("帖子已删除");
      utils.admin.posts.list.invalidate();
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>浏览</TableHead>
              <TableHead>点赞</TableHead>
              <TableHead>评论</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.id}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  <div className="flex items-center gap-2">
                    {post.isTop && <Pin className="w-4 h-4 text-primary" />}
                    {post.isFeatured && <Star className="w-4 h-4 text-yellow-500" />}
                    {post.title}
                  </div>
                </TableCell>
                <TableCell>{post.user?.name || "-"}</TableCell>
                <TableCell>{post.viewCount}</TableCell>
                <TableCell>{post.likeCount}</TableCell>
                <TableCell>{post.commentCount}</TableCell>
                <TableCell>
                  <Badge variant={post.status === "active" ? "default" : "secondary"}>
                    {post.status === "active" ? "正常" : post.status === "pending" ? "待审" : "已删除"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant={post.isTop ? "default" : "outline"}
                      onClick={() => updateMutation.mutate({ id: post.id, isTop: !post.isTop })}
                    >
                      <Pin className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={post.isFeatured ? "default" : "outline"}
                      onClick={() => updateMutation.mutate({ id: post.id, isFeatured: !post.isFeatured })}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ id: post.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ReportsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.reports.list.useQuery({ status: "pending" });
  
  const resolveMutation = trpc.admin.reports.resolve.useMutation({
    onSuccess: () => {
      toast.success("举报已处理");
      utils.admin.reports.list.invalidate();
    }
  });

  const reasonMap: Record<string, string> = {
    spam: "垃圾信息",
    inappropriate: "不当内容",
    harassment: "骚扰",
    misinformation: "虚假信息",
    other: "其他",
  };

  const targetTypeMap: Record<string, string> = {
    post: "帖子",
    comment: "评论",
    user: "用户",
    review: "评价",
  };

  return (
    <div className="space-y-4">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>举报类型</TableHead>
              <TableHead>目标ID</TableHead>
              <TableHead>原因</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>举报人</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : data?.reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无待处理的举报
                </TableCell>
              </TableRow>
            ) : data?.reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.id}</TableCell>
                <TableCell>{targetTypeMap[report.targetType] || report.targetType}</TableCell>
                <TableCell>{report.targetId}</TableCell>
                <TableCell>
                  <Badge variant="outline">{reasonMap[report.reason] || report.reason}</Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate">{report.description || "-"}</TableCell>
                <TableCell>{report.user?.name || "-"}</TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => resolveMutation.mutate({ id: report.id, status: "resolved" })}
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => resolveMutation.mutate({ id: report.id, status: "dismissed" })}
                      disabled={resolveMutation.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
