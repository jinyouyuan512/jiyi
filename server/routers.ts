import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// Helper to check admin role
const requireAdmin = (user: any) => {
  if (!user) throw new Error("请先登录");
  if (user.role !== 'admin') throw new Error("权限不足，需要管理员权限");
  return user;
};

export const appRouter = router({
  system: systemRouter,

  // ============ Auth Module ============
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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

        await db.createUser({
          email: input.email,
          phone: input.phone,
          password: input.password,
          name: input.name || openId,
          loginMethod: loginMethod,
          openId: openId,
        });

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
        account: z.string().min(1, "请输入账号"),
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
        avatar: z.string().optional(),
        bio: z.string().optional(),
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

    changePassword: publicProcedure
      .input(z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(6, "新密码长度至少为6位"),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");

        const user = await db.getUserByOpenId(ctx.user.openId);
        if (!user || !user.password) {
          throw new Error("用户不存在或未设置密码");
        }

        const isValid = await bcrypt.compare(input.oldPassword, user.password);
        if (!isValid) {
          throw new Error("原密码错误");
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        await db.updateUser(ctx.user.openId, { password: hashedPassword });

        return { success: true };
      }),
  }),

  // ============ User Module ============
  user: router({
    // Get user addresses
    addresses: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      return await db.getUserAddresses(ctx.user.id);
    }),

    // Add address
    addAddress: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().min(11).max(11),
        province: z.string().min(1),
        city: z.string().min(1),
        district: z.string().min(1),
        detail: z.string().min(1),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.createUserAddress({ ...input, userId: ctx.user.id });
        return { success: true };
      }),

    // Update address
    updateAddress: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        province: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        detail: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        const { id, ...data } = input;
        await db.updateUserAddress(id, ctx.user.id, data);
        return { success: true };
      }),

    // Delete address
    deleteAddress: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.deleteUserAddress(input.id, ctx.user.id);
        return { success: true };
      }),

    // Get notifications
    notifications: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        unreadOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        return await db.getUserNotifications(ctx.user.id, input);
      }),

    // Mark notification as read
    markNotificationRead: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),

    // Mark all notifications as read
    markAllNotificationsRead: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      await db.markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),

    // Get favorites
    favorites: publicProcedure
      .input(z.object({ itemType: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        return await db.getUserFavorites(ctx.user.id, input?.itemType);
      }),

    // Toggle favorite
    toggleFavorite: publicProcedure
      .input(z.object({
        itemType: z.enum(["route", "attraction", "product", "artifact", "course", "post"]),
        itemId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        return await db.toggleFavorite(ctx.user.id, input.itemType, input.itemId);
      }),
  }),

  // ============ Cart Module ============
  cart: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      return await db.getCartItems(ctx.user.id);
    }),

    add: publicProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.addToCart(ctx.user.id, input.productId, input.quantity || 1);
        return { success: true };
      }),

    updateQuantity: publicProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().min(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.updateCartItemQuantity(input.id, ctx.user.id, input.quantity);
        return { success: true };
      }),

    remove: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.removeFromCart(input.id, ctx.user.id);
        return { success: true };
      }),

    clear: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ============ Orders Module ============
  orders: router({
    create: publicProcedure
      .input(z.object({
        orderType: z.enum(["product", "route", "course"]),
        itemId: z.number(),
        itemName: z.string(),
        itemImage: z.string().optional(),
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

        const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;

        await db.createOrder({
          userId: ctx.user.id,
          orderNumber,
          orderType: input.orderType,
          itemId: input.itemId,
          itemName: input.itemName,
          itemImage: input.itemImage,
          quantity: input.quantity,
          unitPrice: input.unitPrice.toString(),
          totalAmount: input.totalAmount.toString(),
          paymentMethod: input.paymentMethod,
          shippingAddress: input.shippingAddress,
          status: 'paid',
        });

        return { success: true, orderNumber };
      }),

    myOrders: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("请先登录");
      return await db.getOrdersByUserId(ctx.user.id);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        const order = await db.getOrderById(input.id);
        if (!order || order.userId !== ctx.user.id) {
          throw new Error("订单不存在");
        }
        return order;
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

    reviews: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductReviews(input.productId);
      }),

    addReview: publicProcedure
      .input(z.object({
        productId: z.number(),
        orderId: z.number().optional(),
        rating: z.number().min(1).max(5),
        content: z.string().optional(),
        images: z.array(z.string()).optional(),
        isAnonymous: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.createProductReview({
          userId: ctx.user.id,
          productId: input.productId,
          orderId: input.orderId,
          rating: input.rating,
          content: input.content,
          images: input.images,
          isAnonymous: input.isAnonymous,
        });
        return { success: true };
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

    toggleLike: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        return await db.toggleLike(ctx.user.id, 'artifact', input.id);
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

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCommunityPostById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        images: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");

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

    comments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPostComments(input.postId);
      }),

    addComment: publicProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          content: input.content,
          parentId: input.parentId,
        });
        return { success: true };
      }),

    toggleLike: publicProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        return await db.toggleLike(ctx.user.id, 'post', input.postId);
      }),

    report: publicProcedure
      .input(z.object({
        targetType: z.enum(["post", "comment", "user"]),
        targetId: z.number(),
        reason: z.enum(["spam", "inappropriate", "harassment", "misinformation", "other"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("请先登录");
        await db.createReport({
          userId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
          description: input.description,
        });
        return { success: true };
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

        await db.allocateUEInstance(instance.id, ctx.user.id);

        return {
          success: true,
          signalingUrl: instance.signalingUrl,
          instanceId: instance.instanceId,
          expiresIn: 300,
        };
      }),

    disconnectUE: publicProcedure
      .input(z.object({ instanceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) return;
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

  // ============ Admin Module ============
  admin: router({
    // Dashboard
    dashboard: publicProcedure.query(async ({ ctx }) => {
      requireAdmin(ctx.user);
      return await db.getDashboardStats();
    }),

    // User Management
    users: router({
      list: publicProcedure
        .input(z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          search: z.string().optional(),
          status: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getAllUsers(input);
        }),

      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getUserById(input.id);
        }),

      update: publicProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          role: z.enum(["user", "admin"]).optional(),
          identity: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          const { id, ...data } = input;
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'update_user',
            targetType: 'user',
            targetId: id,
            details: data,
          });
          
          return await db.updateUserById(id, data);
        }),

      ban: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          await db.banUser(input.id);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'ban_user',
            targetType: 'user',
            targetId: input.id,
          });
          
          return { success: true };
        }),

      unban: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          await db.unbanUser(input.id);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'unban_user',
            targetType: 'user',
            targetId: input.id,
          });
          
          return { success: true };
        }),
    }),

    // Product Management
    products: router({
      list: publicProcedure
        .input(z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          status: z.string().optional(),
          category: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getAllProductsAdmin(input);
        }),

      create: publicProcedure
        .input(z.object({
          name: z.string().min(1),
          subtitle: z.string().optional(),
          category: z.string().min(1),
          price: z.number().min(0),
          originalPrice: z.number().optional(),
          coverImage: z.string().min(1),
          images: z.array(z.string()).optional(),
          description: z.string().min(1),
          materials: z.string().optional(),
          dimensions: z.string().optional(),
          designer: z.string().optional(),
          stock: z.number().min(0).optional(),
          tags: z.array(z.string()).optional(),
          isFeatured: z.boolean().optional(),
          isHot: z.boolean().optional(),
          isNew: z.boolean().optional(),
          status: z.enum(["active", "inactive", "soldout"]).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          
          await db.createProduct({
            ...input,
            price: input.price.toString(),
            originalPrice: input.originalPrice?.toString(),
          });
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'create_product',
            targetType: 'product',
            details: { name: input.name },
          });
          
          return { success: true };
        }),

      update: publicProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          subtitle: z.string().optional(),
          category: z.string().optional(),
          price: z.number().optional(),
          originalPrice: z.number().optional(),
          coverImage: z.string().optional(),
          images: z.array(z.string()).optional(),
          description: z.string().optional(),
          materials: z.string().optional(),
          dimensions: z.string().optional(),
          designer: z.string().optional(),
          stock: z.number().optional(),
          tags: z.array(z.string()).optional(),
          isFeatured: z.boolean().optional(),
          isHot: z.boolean().optional(),
          isNew: z.boolean().optional(),
          status: z.enum(["active", "inactive", "soldout"]).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          const { id, price, originalPrice, ...data } = input;
          
          const updateData: any = { ...data };
          if (price !== undefined) updateData.price = price.toString();
          if (originalPrice !== undefined) updateData.originalPrice = originalPrice.toString();
          
          await db.updateProduct(id, updateData);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'update_product',
            targetType: 'product',
            targetId: id,
          });
          
          return { success: true };
        }),

      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          await db.deleteProduct(input.id);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'delete_product',
            targetType: 'product',
            targetId: input.id,
          });
          
          return { success: true };
        }),
    }),

    // Order Management
    orders: router({
      list: publicProcedure
        .input(z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getAllOrders(input);
        }),

      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getOrderById(input.id);
        }),

      updateStatus: publicProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["pending", "paid", "shipped", "completed", "cancelled", "refunded"]),
          trackingNumber: z.string().optional(),
          trackingCompany: z.string().optional(),
          adminNote: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          const { id, status, ...data } = input;
          
          await db.updateOrderStatus(id, status, data);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'update_order_status',
            targetType: 'order',
            targetId: id,
            details: { status },
          });
          
          return { success: true };
        }),
    }),

    // Review Management
    reviews: router({
      list: publicProcedure
        .input(z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          status: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getAllReviews(input);
        }),

      updateStatus: publicProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["approved", "rejected"]),
          adminReply: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          
          await db.updateReviewStatus(input.id, input.status, input.adminReply);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'update_review_status',
            targetType: 'review',
            targetId: input.id,
            details: { status: input.status },
          });
          
          return { success: true };
        }),
    }),

    // Community Management
    posts: router({
      list: publicProcedure
        .input(z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          status: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getAllCommunityPostsAdmin(input);
        }),

      update: publicProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["active", "inactive", "deleted", "pending"]).optional(),
          isTop: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          const { id, ...data } = input;
          
          await db.updateCommunityPost(id, data as any);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'update_post',
            targetType: 'post',
            targetId: id,
            details: data,
          });
          
          return { success: true };
        }),

      delete: publicProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          await db.deleteCommunityPost(input.id);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'delete_post',
            targetType: 'post',
            targetId: input.id,
          });
          
          return { success: true };
        }),

      setTop: publicProcedure
        .input(z.object({ id: z.number(), isTop: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          await db.setPostTop(input.id, input.isTop);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: input.isTop ? 'set_post_top' : 'unset_post_top',
            targetType: 'post',
            targetId: input.id,
          });
          
          return { success: true };
        }),

      setFeatured: publicProcedure
        .input(z.object({ id: z.number(), isFeatured: z.boolean() }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          await db.setPostFeatured(input.id, input.isFeatured);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: input.isFeatured ? 'set_post_featured' : 'unset_post_featured',
            targetType: 'post',
            targetId: input.id,
          });
          
          return { success: true };
        }),
    }),

    // Report Management
    reports: router({
      list: publicProcedure
        .input(z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          status: z.string().optional(),
        }).optional())
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx.user);
          return await db.getAllReports(input);
        }),

      resolve: publicProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["resolved", "dismissed"]),
          adminNote: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const admin = requireAdmin(ctx.user);
          
          await db.resolveReport(input.id, admin.id, input.status, input.adminNote);
          
          await db.createAdminLog({
            adminId: admin.id,
            action: 'resolve_report',
            targetType: 'report',
            targetId: input.id,
            details: { status: input.status },
          });
          
          return { success: true };
        }),
    }),

    // Admin Logs
    logs: publicProcedure
      .input(z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        adminId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        requireAdmin(ctx.user);
        return await db.getAdminLogs(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
