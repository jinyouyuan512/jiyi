import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Heart, Share2, Briefcase, Building, ArrowUpRight, HelpCircle, FileText, Download, Plus, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function Community() {
  const utils = trpc.useContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", tags: "" });

  const { data: postsData } = trpc.community.list.useQuery();
  const { data: projectsData } = trpc.projects.list.useQuery();
  
  const posts = postsData || [];
  const projects = projectsData || [];

  const createPostMutation = trpc.community.create.useMutation({
    onSuccess: () => {
      toast.success("发布成功", { description: "您的动态已发布" });
      setIsDialogOpen(false);
      setNewPost({ title: "", content: "", tags: "" });
      utils.community.list.invalidate();
    },
    onError: (error) => {
      toast.error("发布失败", { description: error.message });
    }
  });

  const handlePublish = () => {
    if (!newPost.title || !newPost.content) {
      toast.error("请填写完整");
      return;
    }
    createPostMutation.mutate({
      title: newPost.title,
      content: newPost.content,
      tags: newPost.tags.split(/[,， ]+/).filter(Boolean),
      images: [] // TODO: Image upload
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader 
        title="合作与社区" 
        description="分享您的红色足迹，参与产业合作，共同推动红色文化的创新发展"
        image="https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop"
        overlayColor="from-red-900/60 to-background"
      />

      <div className="container relative z-20 -mt-10">
        <Card className="border-none shadow-xl bg-background/80 backdrop-blur-md p-2 mb-8">
          <Tabs defaultValue="community" className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b border-border/50">
              <TabsList className="grid w-full md:w-auto grid-cols-3 h-10">
                <TabsTrigger value="community">足迹社区</TabsTrigger>
                <TabsTrigger value="cooperation">产业合作</TabsTrigger>
                <TabsTrigger value="knowledge">知识报告</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="搜索话题、项目..." className="pl-9 h-10 bg-secondary/50 border-transparent focus:bg-background" />
              </div>
            </div>

            <div className="p-4 md:p-8 min-h-[500px]">
              <TabsContent value="community" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {/* Create Post Card */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Card className="break-inside-avoid border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center h-64">
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8" />
                          </div>
                          <h3 className="font-bold text-xl mb-2 font-serif">发布新动态</h3>
                          <p className="text-sm text-muted-foreground mb-6">分享您的红色足迹、旅行照片或感悟，记录美好瞬间。</p>
                          <Button className="rounded-full px-8 shadow-lg shadow-primary/20">立即发布</Button>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>发布新动态</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>标题</Label>
                          <Input 
                            value={newPost.title} 
                            onChange={e => setNewPost({...newPost, title: e.target.value})} 
                            placeholder="给您的动态起个标题" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>内容</Label>
                          <Textarea 
                            value={newPost.content} 
                            onChange={e => setNewPost({...newPost, content: e.target.value})} 
                            placeholder="分享您的见闻..." 
                            className="h-32"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>标签</Label>
                          <Input 
                            value={newPost.tags} 
                            onChange={e => setNewPost({...newPost, tags: e.target.value})} 
                            placeholder="用逗号分隔，如：西柏坡, 研学" 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handlePublish} disabled={createPostMutation.isPending}>
                          {createPostMutation.isPending ? "发布中..." : "发布"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                    {posts.map((post) => (
                    <Card key={post.id} className="break-inside-avoid border-none shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                      <div className="relative">
                        <img src={post.image || "https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=2070&auto=format&fit=crop"} alt="Post" className="w-full transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {post.tags?.map(tag => (
                            <Badge key={tag} className="bg-black/50 backdrop-blur-md text-white border-none text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={post.avatar} />
                            <AvatarFallback>User</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold leading-none">{post.user}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{post.time}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-primary">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm mb-4 leading-relaxed text-foreground/90">{post.content}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors group/like">
                            <Heart className="w-4 h-4 group-hover/like:fill-current" /> 
                            <span>{post.likeCount}</span>
                          </button>
                          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <MessageSquare className="w-4 h-4" /> 
                            <span>{post.commentCount}</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="cooperation" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" /> 精选项目需求
                      </h3>
                      <Button variant="link" className="text-primary">查看全部 &rarr;</Button>
                    </div>
                    
                    {projects.map((project) => (
                      <Card key={project.id} className="hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-md">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{project.type}</Badge>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === '进行中' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {project.status}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{project.title}</h3>
                              <div className="flex items-center text-sm text-muted-foreground gap-4 flex-wrap">
                                <span className="flex items-center"><Building className="w-3.5 h-3.5 mr-1.5" /> {project.organization}</span>
                                <span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1.5" /> 截止: {project.deadline}</span>
                              </div>
                            </div>
                            <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 shrink-0 min-w-[120px]">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">项目预算</p>
                                <p className="text-lg font-bold text-primary">{project.budget}</p>
                              </div>
                              <Button size="sm" className="w-full md:w-auto rounded-full">
                                投递方案
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-zinc-900 text-white border-none overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      <CardContent className="p-8 space-y-6 relative z-10">
                        <h3 className="text-2xl font-serif font-bold">合作伙伴招募</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          我们要寻找志同道合的伙伴，共同挖掘河北红色文化的商业价值与社会价值。
                        </p>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> 文创设计师 / 工作室</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> 旅游服务供应商</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> 红色教育培训机构</li>
                          <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> 投融资机构</li>
                        </ul>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">申请加入生态</Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-amber-900 mb-2">发布您的需求</h3>
                        <p className="text-xs text-amber-700/80 mb-4">
                          无论是寻找设计服务、技术支持还是内容合作，这里都有专业的团队为您服务。
                        </p>
                        <Button variant="outline" className="w-full border-amber-200 text-amber-900 hover:bg-amber-100">
                          免费发布需求
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="knowledge" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Q&A Section */}
                  <Card className="h-full">
                    <CardHeader className="bg-secondary/20 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-bold">红色知识问答</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary text-xs">全部问答</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {[
                        { q: "西柏坡精神的核心内涵是什么？", a: "两个务必：务必使同志们继续地保持谦虚、谨慎、不骄、不躁的作风，务必使同志们继续地保持艰苦奋斗的作风。", likes: 342 },
                        { q: "狼牙山五壮士所属的部队番号是？", a: "八路军晋察冀军区第一军分区1团7连6班。", likes: 215 },
                        { q: "李大钊同志是在哪里英勇就义的？", a: "1927年4月28日，在北京西交民巷京师看守所内被奉系军阀绞杀。", likes: 189 }
                      ].map((qa, i) => (
                        <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                          <h4 className="font-bold mb-2 text-base text-foreground/90">{qa.q}</h4>
                          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{qa.a}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="text-primary cursor-pointer hover:underline font-medium">查看详情</span>
                            <div className="flex gap-4">
                              <span className="flex items-center hover:text-red-500 transition-colors cursor-pointer"><Heart className="w-3 h-3 mr-1" /> {qa.likes}</span>
                              <span className="flex items-center hover:text-primary transition-colors cursor-pointer"><Share2 className="w-3 h-3 mr-1" /> 分享</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button className="w-full mt-2" variant="outline">我要提问</Button>
                    </CardContent>
                  </Card>

                  {/* Industry Reports */}
                  <Card className="h-full">
                    <CardHeader className="bg-secondary/20 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-bold">产业发展报告</h3>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary text-xs">更多报告</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                      {[
                        { title: "2025河北省红色旅游发展白皮书", date: "2025-10-01", size: "4.2 MB", tag: "年度重磅" },
                        { title: "数字化技术在红色文化传播中的应用研究", date: "2025-09-15", size: "2.8 MB", tag: "技术前沿" },
                        { title: "京津冀红色旅游协同发展调研报告", date: "2025-08-20", size: "3.5 MB", tag: "区域协同" },
                        { title: "红色文创产品市场消费趋势分析", date: "2025-07-10", size: "1.9 MB", tag: "市场洞察" }
                      ].map((report, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl hover:bg-secondary/40 transition-all cursor-pointer group border border-transparent hover:border-primary/10">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 text-red-600 font-bold text-[10px] border border-red-100 flex-col leading-none">
                              <span>PDF</span>
                            </div>
                            <div className="min-w-0 space-y-1">
                              <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{report.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-sm">{report.tag}</Badge>
                                <p className="text-xs text-muted-foreground">{report.date} · {report.size}</p>
                              </div>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 rounded-full">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button className="w-full mt-4" variant="outline">订阅报告更新</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
