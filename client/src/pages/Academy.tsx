import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, BookOpen, Award, Users, Video, FileQuestion, CheckCircle2 } from "lucide-react";

export default function Academy() {
  const courses = [
    {
      id: 1,
      title: "西柏坡精神的当代价值",
      instructor: "李教授",
      duration: "45分钟",
      students: 1200,
      image: "/images/xibaipo.jpg",
      progress: 0
    },
    {
      id: 2,
      title: "抗日战争中的河北英雄",
      instructor: "王研究员",
      duration: "60分钟",
      students: 850,
      image: "/images/langyashan.jpg",
      progress: 30
    },
    {
      id: 3,
      title: "中国共产党在河北的早期活动",
      instructor: "张博士",
      duration: "50分钟",
      students: 600,
      image: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?q=80&w=2000&auto=format&fit=crop",
      progress: 0
    }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary">红色学堂</Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">传承红色基因</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            汇集党史专家与精品课程，打造随时随地的红色文化学习平台。
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "在线课程", value: "100+", icon: <PlayCircle className="w-6 h-6 text-primary" /> },
            { label: "注册学员", value: "50k+", icon: <Users className="w-6 h-6 text-primary" /> },
            { label: "研学活动", value: "200+", icon: <BookOpen className="w-6 h-6 text-primary" /> },
            { label: "颁发证书", value: "10k+", icon: <Award className="w-6 h-6 text-primary" /> },
          ].map((stat, i) => (
            <Card key={i} className="border-none bg-secondary/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-2 p-3 bg-background rounded-full shadow-sm">{stat.icon}</div>
                <div className="text-2xl font-bold font-serif">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Course List */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-serif font-bold">热门课程</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full">全部课程</Button>
              <Button variant="outline" size="sm" className="rounded-full">专家讲座</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold font-serif mb-2 line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>讲师：{course.instructor}</span>
                    <span>{course.students}人学习</span>
                  </div>
                  {course.progress > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>学习进度</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                      <Button size="sm" className="w-full mt-4">继续学习</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full mt-2">开始学习</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quiz Section */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
            <CardContent className="p-8 flex flex-col h-full justify-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">党史专家直播讲座</h3>
              <p className="text-muted-foreground mb-6">
                每周五晚8点，邀请党史研究专家进行在线直播，深度解读河北红色历史，支持实时互动提问。
              </p>
              <Button className="self-start">预约下期直播</Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-8 flex flex-col h-full justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">红色知识在线测试</h3>
              <p className="text-muted-foreground mb-6">
                检验学习成果，参与每日答题挑战。连续打卡可获得“红色学习标兵”勋章及文创商城积分奖励。
              </p>
              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">开始答题</Button>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" /> 今日已有 2,340 人参与
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate */}
        <div className="bg-primary/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-6">
            <Badge className="bg-primary text-white border-none">荣誉认证</Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">“冀忆红途”电子证书体系</h2>
            <p className="text-muted-foreground text-lg">
              完成指定课程学习或参与线下研学活动，即可获得官方认证的电子证书，记录您的红色文化传承之旅。
            </p>
            <Button size="lg" className="rounded-full px-8">查看我的证书</Button>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-64 md:w-80 aspect-[3/4] bg-white shadow-2xl rounded-lg p-6 rotate-3 hover:rotate-0 transition-transform duration-500 border-8 border-double border-primary/20">
              <div className="h-full border border-primary/10 flex flex-col items-center justify-center text-center space-y-4 p-4">
                <Award className="w-16 h-16 text-primary" />
                <h3 className="font-serif font-bold text-xl">结业证书</h3>
                <p className="text-xs text-muted-foreground">兹证明</p>
                <p className="font-bold text-lg border-b border-primary/20 px-4 pb-1">张三</p>
                <p className="text-xs text-muted-foreground">顺利完成“西柏坡精神”专题学习</p>
                <div className="mt-auto pt-4 w-full flex justify-between items-end">
                  <div className="w-16 h-16 border-2 border-primary/30 rounded-full flex items-center justify-center text-[10px] text-primary/50 rotate-12">
                    冀忆红途
                  </div>
                  <span className="text-[10px] text-muted-foreground">2025.12.28</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
