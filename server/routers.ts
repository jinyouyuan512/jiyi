import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  // ============ Auth Module ============
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email("请输入有效的邮箱地址").optional(),
        phone: z.string().min(11, "请输入有效的手机号").max(11, "请输入有效的手机号").optional(),
        password: z.string().min(6, "密码长度至少为6位"),
        name: z.string().optional(),
      }).refine(data => data.email || data.phone, {
        message: "邮箱或手机号必须填写一个",
        path: ["email"]
      }))
      .mutation(async ({ input, ctx }) => {
        let openId = "";
        let loginMethod = "";

        if (input.email) {
          const existing = await db.getUserByEmail(input.email);
          if (existing) throw new Error("该邮箱已被注册");
          openId = input.email;
          loginMethod = "email";
        } else if (input.phone) {
          const existing = await db.getUserByPhone(input.phone);
          if (existing) throw new Error("该手机号已被注册");
          openId = input.phone;
          loginMethod = "phone";
        }

        // Create user
        await db.createUser({
          email: input.email,
          phone: input.phone,
          password: input.password,
          name: input.name || openId,
          loginMethod: loginMethod,
          openId: openId,
        });

        // Auto login logic
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name || openId,
          expiresInMs: ONE_YEAR_MS
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        account: z.string().min(1, "请输入账号"), // email or phone
        password: z.string().min(1, "请输入密码"),
      }))
      .mutation(async ({ input, ctx }) => {
        let user;

        if (input.account.includes("@")) {
          user = await db.getUserByEmail(input.account);
        } else {
          user = await db.getUserByPhone(input.account);
        }

        if (!user || !user.password) {
          throw new Error("账号或密码错误");
        }

        const isValid = await bcrypt.compare(input.password, user.password);
        if (!isValid) {
          throw new Error("账号或密码错误");
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),

    updateProfile: publicProcedure
      .input(z.object({
        name: z.string().optional(),
        identity: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");

        const updatedUser = await db.updateUser(ctx.user.openId, input);

        if (updatedUser) {
          const sessionToken = await sdk.createSessionToken(updatedUser.openId, {
            name: updatedUser.name || "",
            expiresInMs: ONE_YEAR_MS
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        }

        return updatedUser;
      }),
  }),

  // ============ Orders Module ============
  orders: router({
    create: publicProcedure
      .input(z.object({
        orderType: z.enum(["product", "route", "course"]),
        itemId: z.number(),
        itemName: z.string(),
        quantity: z.number().default(1),
        unitPrice: z.number(),
        totalAmount: z.number(),
        paymentMethod: z.string().optional(),
        shippingAddress: z.object({
          name: z.string(),
          phone: z.string(),
          province: z.string(),
          city: z.string(),
          district: z.string(),
          detail: z.string()
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;

        await db.createOrder({
          userId: ctx.user.id,
          orderNumber,
          orderType: input.orderType,
          itemId: input.itemId,
          itemName: input.itemName,
          quantity: input.quantity,
          unitPrice: input.unitPrice.toString(),
          totalAmount: input.totalAmount.toString(),
          paymentMethod: input.paymentMethod,
          shippingAddress: input.shippingAddress,
          status: 'paid', // Simulating instant payment
        });

        return { success: true, orderNumber };
      }),

    myOrders: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      return await db.getOrdersByUserId(ctx.user.id);
    }),
  }),

  // ============ Routes Module ============
  routes: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRoutes();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRouteById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .query(async ({ input }) => {
        return await db.searchRoutes(input.keyword);
      }),

    recommendation: publicProcedure.query(async () => {
      return await db.getRecommendedRoute();
    }),
  }),

  // ============ Products Module ============
  products: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProducts();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    featured: publicProcedure.query(async () => {
      return await db.getFeaturedProducts();
    }),

    recommendation: publicProcedure.query(async () => {
      return await db.getRecommendedProduct();
    }),
  }),

  // ============ Artifacts Module ============
  artifacts: router({
    list: publicProcedure.query(async () => {
      return await db.getAllArtifacts();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getArtifactById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .query(async ({ input }) => {
        return await db.searchArtifacts(input.keyword);
      }),

    related: publicProcedure
      .input(z.object({ id: z.number(), category: z.string() }))
      .query(async ({ input }) => {
        return await db.getRelatedArtifacts(input.id, input.category);
      }),
  }),

  // ============ Attractions Module ============
  attractions: router({
    list: publicProcedure.query(async () => {
      return await db.getAllAttractions();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAttractionById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .query(async ({ input }) => {
        return await db.searchAttractions(input.keyword);
      }),
  }),

  // ============ Courses Module ============
  courses: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCourses();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCourseById(input.id);
      }),

    featured: publicProcedure.query(async () => {
      return await db.getFeaturedCourses();
    }),
  }),

  // ============ Community Module ============
  community: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCommunityPosts();
    }),

    create: publicProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        images: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("请先登录");
        }

        return await db.createCommunityPost({
          userId: ctx.user.id,
          title: input.title,
          content: input.content,
          images: input.images,
          tags: input.tags,
          type: 'journal',
          status: 'active'
        });
      }),
  }),

  // ============ Projects Module ============
  projects: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProjects();
    }),
  }),

  // ============ Oral History Module ============
  oralHistory: router({
    list: publicProcedure.query(async () => {
      return await db.getAllOralHistories();
    }),
  }),

  // ============ Immersive Assets & UE Module ============
  immersive: router({
    getAsset: publicProcedure
      .input(z.object({ attractionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAssetByAttractionId(input.attractionId);
      }),

    connectUE: publicProcedure
      .input(z.object({ attractionId: z.number() }))
      .mutation(async ({ ctx }) => {
        if (!ctx.user) throw new Error("请先登录以访问云渲染服务");

        const instance = await db.getAvailableUEInstance();
        if (!instance) {
          throw new Error("当前云渲染服务器已满载，请稍后重试或使用 Web3D 模式");
        }

        // Lock the instance
        await db.allocateUEInstance(instance.id, ctx.user.id);

        return {
          success: true,
          signalingUrl: instance.signalingUrl,
          instanceId: instance.instanceId,
          expiresIn: 300, // seconds
        };
      }),

    disconnectUE: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) return; // Silent fail
        await db.releaseUEInstance(input.instanceId);
        return { success: true };
      }),
  }),

  // ============ Experience Module ============
  experience: router({
    start: publicProcedure
      .input(z.object({ attractionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");

        await db.createExperienceRecord({
          userId: ctx.user.id,
          attractionId: input.attractionId,
          status: 'in_progress'
        });

        return { success: true };
      }),

    complete: publicProcedure
      .input(z.object({
        recordId: z.number(),
        certificateUrl: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");

        await db.updateExperienceStatus(input.recordId, 'completed', input.certificateUrl);
        return { success: true };
      }),

    myRecords: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      return await db.getUserExperiences(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
