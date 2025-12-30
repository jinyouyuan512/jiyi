import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }), // Added phone field
  password: text("password"),
  identity: varchar("identity", { length: 50 }).default("普通游客"), // Added identity field
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 旅游线路表
 */
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  subtitle: text("subtitle"),
  location: varchar("location", { length: 200 }).notNull(),
  days: varchar("days", { length: 50 }).notNull(), // e.g., "3天2晚"
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // 人均价格
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  tags: json("tags").$type<string[]>(), // e.g., ["经典", "研学"]
  description: text("description").notNull(),
  highlights: json("highlights").$type<string[]>(),
  itinerary: json("itinerary").$type<{day: number, title: string, activities: string[]}[]>(),
  included: json("included").$type<string[]>(), // 费用包含
  excluded: json("excluded").$type<string[]>(), // 费用不含
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
  // New fields for immersive experience
  era: varchar("era", { length: 100 }), // 时代背景
  duration: varchar("duration", { length: 50 }), // 体验时长
  streamUrl: text("streamUrl"), // UE Pixel Streaming URL
  modelUrl: text("modelUrl"), // Web3D Model URL (.glb)
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
  category: varchar("category", { length: 100 }).notNull(), // e.g., "家居生活", "办公文具"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  description: text("description").notNull(),
  materials: text("materials"), // 材质说明
  dimensions: varchar("dimensions", { length: 200 }), // 尺寸规格
  designer: varchar("designer", { length: 100 }),
  stock: int("stock").default(0),
  sales: int("sales").default(0),
  tags: json("tags").$type<string[]>(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  reviewCount: int("reviewCount").default(0),
  viewCount: int("viewCount").default(0),
  isFeatured: boolean("isFeatured").default(false),
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
  category: varchar("category", { length: 100 }).notNull(), // e.g., "文献", "武器", "生活用品"
  era: varchar("era", { length: 100 }).notNull(), // 年代
  origin: varchar("origin", { length: 200 }), // 出土地/来源
  currentLocation: varchar("currentLocation", { length: 200 }), // 现存地
  coverImage: text("coverImage").notNull(),
  images: json("images").$type<string[]>(),
  model3dUrl: text("model3dUrl"), // 3D模型链接
  vrUrl: text("vrUrl"), // VR体验链接
  description: text("description").notNull(),
  historicalContext: text("historicalContext"), // 历史背景
  culturalSignificance: text("culturalSignificance"), // 文化意义
  dimensions: varchar("dimensions", { length: 200 }),
  materials: varchar("materials", { length: 200 }),
  condition: varchar("condition", { length: 100 }), // 保存状态
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
  instructorTitle: varchar("instructorTitle", { length: 200 }), // 讲师职称
  instructorAvatar: text("instructorAvatar"),
  coverImage: text("coverImage").notNull(),
  videoUrl: text("videoUrl"),
  duration: int("duration").notNull(), // 课程时长（分钟）
  lessonCount: int("lessonCount").default(1), // 课时数
  description: text("description").notNull(),
  objectives: json("objectives").$type<string[]>(), // 学习目标
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
  status: mysqlEnum("status", ["active", "inactive", "deleted"]).default("active").notNull(),
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
  itemType: mysqlEnum("itemType", ["route", "attraction", "product", "artifact", "course"]).notNull(),
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
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "shipped", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  shippingAddress: json("shippingAddress").$type<{
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  }>(),
  remark: text("remark"),
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
  type: varchar("type", { length: 100 }).notNull(), // e.g., "设计众筹", "技术合作"
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
  certificateUrl: text("certificateUrl"), // 证书链接
});

export type ExperienceRecord = typeof experienceRecords.$inferSelect;
export type InsertExperienceRecord = typeof experienceRecords.$inferInsert;

/**
 * 口述历史表
 */
export const oralHistories = mysqlTable("oral_histories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  interviewee: varchar("interviewee", { length: 100 }).notNull(), // 受访者姓名
  description: text("description").notNull(), // 简介
  coverImage: text("coverImage").notNull(),
  mediaType: mysqlEnum("mediaType", ["audio", "video"]).default("audio").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  content: text("content"), // 访谈全文/歌词
  duration: int("duration").notNull(), // 时长(秒)
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
  fileSize: int("fileSize"), // bytes
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
  signalingUrl: text("signalingUrl").notNull(), // WebSocket 信令地址
  status: mysqlEnum("status", ["idle", "busy", "offline"]).default("idle").notNull(),
  currentUserId: int("currentUserId").references(() => users.id),
  lastHeartbeat: timestamp("lastHeartbeat").defaultNow().notNull(),
  region: varchar("region", { length: 50 }).default("cn-north-1"),
});

export type UEInstance = typeof ueInstances.$inferSelect;
export type InsertUEInstance = typeof ueInstances.$inferInsert;
