import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  password: text("password"),
  avatar: text("avatar"), // 用户头像
  identity: varchar("identity", { length: 50 }).default("普通游客"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("userStatus", ["active", "inactive", "banned"]).default("active").notNull(),
  points: int("points").default(0), // 积分
  level: int("level").default(1), // 用户等级
  bio: text("bio"), // 个人简介
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 用户地址表
 */
export const userAddresses = mysqlTable("user_addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(), // 收货人姓名
  phone: varchar("phone", { length: 20 }).notNull(),
  province: varchar("province", { length: 50 }).notNull(),
  city: varchar("city", { length: 50 }).notNull(),
  district: varchar("district", { length: 50 }).notNull(),
  detail: text("detail").notNull(), // 详细地址
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = typeof userAddresses.$inferInsert;

/**
 * 购物车表
 */
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  productId: int("productId").notNull().references(() => products.id),
  quantity: int("quantity").default(1).notNull(),
  selected: boolean("selected").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * 商品评价表
 */
export const productReviews = mysqlTable("product_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  productId: int("productId").notNull().references(() => products.id),
  orderId: int("orderId").references(() => orders.id),
  rating: int("rating").notNull(), // 1-5 星
  content: text("content"),
  images: json("images").$type<string[]>(),
  isAnonymous: boolean("isAnonymous").default(false),
  status: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  adminReply: text("adminReply"), // 商家回复
  adminReplyAt: timestamp("adminReplyAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

/**
 * 社区评论表
 */
export const postComments = mysqlTable("post_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => communityPosts.id),
  userId: int("userId").notNull().references(() => users.id),
  parentId: int("parentId"), // 回复的评论ID，null表示顶级评论
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0),
  status: mysqlEnum("commentStatus", ["active", "deleted", "hidden"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

/**
 * 点赞记录表
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  targetType: mysqlEnum("targetType", ["post", "comment", "product", "artifact"]).notNull(),
  targetId: int("targetId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * 举报记录表
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  targetType: mysqlEnum("reportTargetType", ["post", "comment", "user", "review"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: mysqlEnum("reportReason", ["spam", "inappropriate", "harassment", "misinformation", "other"]).notNull(),
  description: text("description"),
  status: mysqlEnum("reportStatus", ["pending", "resolved", "dismissed"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * 商品分类表
 */
export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  parentId: int("parentId"), // 父分类ID
  sortOrder: int("sortOrder").default(0),
  status: mysqlEnum("categoryStatus", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * 系统通知表
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("notificationType", ["system", "order", "comment", "like", "follow"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  link: text("link"), // 跳转链接
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * 操作日志表（管理后台）
 */
export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create_product", "delete_post"
  targetType: varchar("targetType", { length: 50 }).notNull(), // e.g., "product", "post", "user"
  targetId: int("targetId"),
  details: json("details").$type<Record<string, unknown>>(), // 操作详情
  ip: varchar("ip", { length: 50 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

/**
 * 旅游线路表
 */
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  location: varchar("location", { length: 200 }).notNull(),
  days: varchar("days", { length: 50 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  description: text("description").notNull(),
  highlights: json("highlights").$type<string[]>(),
  itinerary: json("itinerary").$type<{day: number, title: string, activities: string[]}[]>(),
  included: json("included").$type<string[]>(),
  excluded: json("excluded").$type<string[]>(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  reviewCount: int("reviewCount").default(0),
  viewCount: int("viewCount").default(0),
  bookingCount: int("bookingCount").default(0),
  status: mysqlEnum("status", ["active", "inactive", "draft"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

/**
 * 景点表
 */
export const attractions = mysqlTable("attractions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  location: varchar("location", { length: 200 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  category: mysqlEnum("category", ["memorial", "museum", "site", "park", "other"]).default("site").notNull(),
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  description: text("description").notNull(),
  history: text("history"),
  openingHours: varchar("openingHours", { length: 200 }),
  ticketPrice: varchar("ticketPrice", { length: 100 }),
  contact: varchar("contact", { length: 100 }),
  facilities: json("facilities").$type<string[]>(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  reviewCount: int("reviewCount").default(0),
  viewCount: int("viewCount").default(0),
  era: varchar("era", { length: 100 }),
  duration: varchar("duration", { length: 50 }),
  streamUrl: text("streamUrl"),
  modelUrl: text("modelUrl"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attraction = typeof attractions.$inferSelect;
export type InsertAttraction = typeof attractions.$inferInsert;

/**
 * 文创商品表
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  category: varchar("category", { length: 100 }).notNull(),
  categoryId: int("categoryId").references(() => productCategories.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  description: text("description").notNull(),
  materials: text("materials"),
  dimensions: varchar("dimensions", { length: 200 }),
  designer: varchar("designer", { length: 100 }),
  stock: int("stock").default(0),
  sales: int("sales").default(0),
  tags: json("tags").$type<string[]>(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  reviewCount: int("reviewCount").default(0),
  viewCount: int("viewCount").default(0),
  isFeatured: boolean("isFeatured").default(false),
  isHot: boolean("isHot").default(false), // 热销标记
  isNew: boolean("isNew").default(false), // 新品标记
  status: mysqlEnum("status", ["active", "inactive", "soldout"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * 数字文物表
 */
export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  englishName: varchar("englishName", { length: 200 }),
  category: varchar("category", { length: 100 }).notNull(),
  era: varchar("era", { length: 100 }).notNull(),
  origin: varchar("origin", { length: 200 }),
  currentLocation: varchar("currentLocation", { length: 200 }),
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  model3dUrl: text("model3dUrl"),
  vrUrl: text("vrUrl"),
  description: text("description").notNull(),
  historicalContext: text("historicalContext"),
  culturalSignificance: text("culturalSignificance"),
  dimensions: varchar("dimensions", { length: 200 }),
  materials: varchar("materials", { length: 200 }),
  condition: varchar("condition", { length: 100 }),
  viewCount: int("viewCount").default(0),
  likeCount: int("likeCount").default(0),
  status: mysqlEnum("status", ["active", "inactive", "restoration"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * 课程表
 */
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  category: mysqlEnum("category", ["history", "culture", "tour", "research"]).default("history").notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("beginner").notNull(),
  instructor: varchar("instructor", { length: 100 }).notNull(),
  instructorTitle: varchar("instructorTitle", { length: 200 }),
  instructorAvatar: text("instructorAvatar"),
  coverImage: text("coverImage").notNull(),
  videoUrl: text("videoUrl"),
  duration: int("duration").notNull(),
  lessonCount: int("lessonCount").default(1),
  description: text("description").notNull(),
  objectives: json("objectives").$type<string[]>(),
  outline: json("outline").$type<{chapter: string, lessons: string[]}[]>(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00"),
  enrollmentCount: int("enrollmentCount").default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  reviewCount: int("reviewCount").default(0),
  viewCount: int("viewCount").default(0),
  isFeatured: boolean("isFeatured").default(false),
  status: mysqlEnum("status", ["active", "inactive", "draft"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * 社区文章表
 */
export const communityPosts = mysqlTable("community_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["journal", "report", "question", "answer"]).default("journal").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  images: json("images").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  relatedRouteId: int("relatedRouteId").references(() => routes.id),
  viewCount: int("viewCount").default(0),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  isTop: boolean("isTop").default(false), // 置顶
  isFeatured: boolean("isFeatured").default(false), // 精选
  status: mysqlEnum("status", ["active", "inactive", "deleted", "pending"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

/**
 * 用户收藏表
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  itemType: mysqlEnum("itemType", ["route", "attraction", "product", "artifact", "course", "post"]).notNull(),
  itemId: int("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * 订单表
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  orderType: mysqlEnum("orderType", ["product", "route", "course"]).notNull(),
  itemId: int("itemId").notNull(),
  itemName: varchar("itemName", { length: 200 }).notNull(),
  itemImage: text("itemImage"), // 商品图片
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "shipped", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentTime: timestamp("paymentTime"),
  shippingAddress: json("shippingAddress").$type<{
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  }>(),
  trackingNumber: varchar("trackingNumber", { length: 100 }), // 物流单号
  trackingCompany: varchar("trackingCompany", { length: 50 }), // 物流公司
  shippedAt: timestamp("shippedAt"),
  completedAt: timestamp("completedAt"),
  remark: text("remark"),
  adminNote: text("adminNote"), // 管理员备注
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * 产业合作项目表
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  organization: varchar("organization", { length: 200 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("进行中").notNull(),
  deadline: varchar("deadline", { length: 50 }),
  budget: varchar("budget", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * 用户体验记录表
 */
export const experienceRecords = mysqlTable("experience_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  attractionId: int("attractionId").notNull().references(() => attractions.id),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  status: mysqlEnum("status", ["in_progress", "completed"]).default("in_progress").notNull(),
  certificateUrl: text("certificateUrl"),
});

export type ExperienceRecord = typeof experienceRecords.$inferSelect;
export type InsertExperienceRecord = typeof experienceRecords.$inferInsert;

/**
 * 口述历史表
 */
export const oralHistories = mysqlTable("oral_histories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  interviewee: varchar("interviewee", { length: 100 }).notNull(),
  description: text("description").notNull(),
  coverImage: text("coverImage").notNull(),
  mediaType: mysqlEnum("mediaType", ["audio", "video"]).default("audio").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  content: text("content"),
  duration: int("duration").notNull(),
  relatedArtifactId: int("relatedArtifactId").references(() => artifacts.id),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OralHistory = typeof oralHistories.$inferSelect;
export type InsertOralHistory = typeof oralHistories.$inferInsert;

/**
 * Web3D 资产表
 */
export const assets3d = mysqlTable("assets_3d", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  type: mysqlEnum("type", ["glb", "gltf", "fbx", "obj"]).default("glb").notNull(),
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  fileSize: int("fileSize"),
  polygonCount: int("polygonCount"),
  relatedAttractionId: int("relatedAttractionId").references(() => attractions.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Asset3D = typeof assets3d.$inferSelect;
export type InsertAsset3D = typeof assets3d.$inferInsert;

/**
 * UE 云渲染实例表
 */
export const ueInstances = mysqlTable("ue_instances", {
  id: int("id").autoincrement().primaryKey(),
  instanceId: varchar("instanceId", { length: 100 }).notNull().unique(),
  signalingUrl: text("signalingUrl").notNull(),
  status: mysqlEnum("status", ["idle", "busy", "offline"]).default("idle").notNull(),
  currentUserId: int("currentUserId").references(() => users.id),
  lastHeartbeat: timestamp("lastHeartbeat").defaultNow().notNull(),
  region: varchar("region", { length: 50 }).default("cn-north-1"),
});

export type UEInstance = typeof ueInstances.$inferSelect;
export type InsertUEInstance = typeof ueInstances.$inferInsert;
