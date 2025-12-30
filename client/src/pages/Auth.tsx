import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  account: z.string().min(1, "请输入账号(邮箱或手机号)"),
  password: z.string().min(1, "请输入密码"),
});

const registerSchema = z.object({
  method: z.enum(["email", "phone"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.method === 'email') {
    if (!data.email || !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入有效的邮箱地址",
        path: ["email"]
      });
    }
  }
  if (data.method === 'phone') {
    if (!data.phone || data.phone.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "请输入11位手机号",
        path: ["phone"]
      });
    }
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "两次密码输入不一致",
      path: ["confirmPassword"]
    });
  }
});

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [registerMethod, setRegisterMethod] = useState<"email" | "phone">("phone");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`欢迎回来，${data.user.name || "用户"}！`);
      utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！已自动登录");
      utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: "", password: "" }
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { method: "phone", email: "", phone: "", password: "", confirmPassword: "" }
  });

  // Watch register method change to reset validation
  const onRegisterMethodChange = (value: string) => {
      setRegisterMethod(value as "email" | "phone");
      registerForm.setValue("method", value as "email" | "phone");
      registerForm.clearErrors();
  };

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({
        email: data.method === 'email' ? data.email : undefined,
        phone: data.method === 'phone' ? data.phone : undefined,
        password: data.password
    });
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-md shadow-lg border-none bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-serif text-primary">冀忆红途</CardTitle>
          <CardDescription>登录或注册您的账户，开启红色文化之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="account"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>账号</FormLabel>
                        <FormControl>
                          <Input placeholder="邮箱或手机号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>密码</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    登录
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  
                  <Tabs value={registerMethod} onValueChange={onRegisterMethodChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
                        <TabsTrigger value="phone" className="text-xs">手机号注册</TabsTrigger>
                        <TabsTrigger value="email" className="text-xs">邮箱注册</TabsTrigger>
                      </TabsList>
                  </Tabs>

                  {registerMethod === 'phone' ? (
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>手机号</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入11位手机号" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  ) : (
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>邮箱</FormLabel>
                            <FormControl>
                              <Input placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  )}

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>密码</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>确认密码</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    注册
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
