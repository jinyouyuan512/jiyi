import { eq, desc, and, or, like, sql, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { 
  InsertUser, 
  users, 
  routes, 
  attractions, 
  products, 
  artifacts, 
  courses,
  communityPosts,
  favorites,
  orders,
  projects,
  type InsertCommunityPost,
  type InsertProject,
  type InsertOrder,
  type InsertExperienceRecord,
  experienceRecords,
  oralHistories,
  assets3d,
  ueInstances,
  type InsertOralHistory,
  type InsertAsset3D,
  type InsertUEInstance
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Helper function to parse JSON fields from database
function parseJsonFields<T extends Record<string, any>>(data: T, jsonFields: (keyof T)[]): T {
  const parsed = { ...data };
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field] as string);
      } catch (e) {
        // Keep original value if parsing fails
      }
    }
  }
  return parsed;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If password provided, hash it
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  
  // Ensure openId is present or generate one for email users
  if (!user.openId) {
    if (user.email) {
      user.openId = user.email;
    } else if (user.phone) {
      user.openId = user.phone;
    }
  }
  
  if (!user.openId) throw new Error("OpenId (Email or Phone) is required");

  // We use upsert logic or simple insert? upsertUser handles openId logic well.
  // But upsertUser doesn't handle password hashing if I pass raw password.
  // So I should use this function for registration.
  
  // Check if user exists
  const existing = await getUserByOpenId(user.openId);
  if (existing) throw new Error("User already exists");

  await db.insert(users).values(user);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(openId: string, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data).where(eq(users.openId, openId));
  return await getUserByOpenId(openId);
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(orders).values(order);
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return result.map(o => parseJsonFields(o, ['shippingAddress']));
}

// ============ Routes Functions ============
export async function getAllRoutes() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(routes)
    .where(eq(routes.status, 'active'))
    .orderBy(desc(routes.viewCount));
  
  return result.map(r => parseJsonFields(r, ['images', 'tags', 'highlights', 'itinerary', 'included', 'excluded']));
}

export async function getRecommendedRoute() {
  const db = await getDb();
  if (!db) return null;
  
  // Get the highest rated and most viewed route as the recommendation
  const result = await db
    .select()
    .from(routes)
    .where(eq(routes.status, 'active'))
    .orderBy(desc(routes.rating), desc(routes.viewCount))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images', 'tags', 'highlights', 'itinerary', 'included', 'excluded']) : null;
}

export async function getRouteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(routes)
    .where(eq(routes.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images', 'tags', 'highlights', 'itinerary', 'included', 'excluded']) : null;
}

export async function searchRoutes(keyword: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.status, 'active'),
        or(
          like(routes.title, `%${keyword}%`),
          like(routes.location, `%${keyword}%`),
          like(routes.description, `%${keyword}%`)
        )
      )
    )
    .orderBy(desc(routes.rating));
  
  return result.map(r => parseJsonFields(r, ['images', 'tags', 'highlights', 'itinerary', 'included', 'excluded']));
}

// ============ Products Functions ============
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(products)
    .where(eq(products.status, 'active'))
    .orderBy(desc(products.sales));
  
  return result.map(p => parseJsonFields(p, ['images', 'tags']));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images', 'tags']) : null;
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'active'),
        eq(products.isFeatured, true)
      )
    )
    .orderBy(desc(products.sales))
    .limit(8);
  
  return result.map(p => parseJsonFields(p, ['images', 'tags']));
}

export async function getRecommendedProduct() {
  const db = await getDb();
  if (!db) return null;
  
  // Get a specific featured product for the recommendation spot
  // We can randomize this or pick the top seller
  const result = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'active'),
        eq(products.isFeatured, true)
      )
    )
    .orderBy(desc(products.sales))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images', 'tags']) : null;
}

// ============ Artifacts Functions ============
export async function getAllArtifacts() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.status, 'active'))
    .orderBy(desc(artifacts.viewCount));
  
  return result.map(a => parseJsonFields(a, ['images']));
}

export async function getArtifactById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Increment view count
  await incrementArtifactViewCount(id);

  const result = await db
    .select()
    .from(artifacts)
    .where(eq(artifacts.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images']) : null;
}

export async function searchArtifacts(keyword: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(artifacts)
    .where(
      and(
        eq(artifacts.status, 'active'),
        or(
          like(artifacts.name, `%${keyword}%`),
          like(artifacts.category, `%${keyword}%`),
          like(artifacts.era, `%${keyword}%`),
          like(artifacts.description, `%${keyword}%`)
        )
      )
    )
    .orderBy(desc(artifacts.viewCount));
  
  return result.map(a => parseJsonFields(a, ['images']));
}

export async function getRelatedArtifacts(id: number, category: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(artifacts)
    .where(
      and(
        eq(artifacts.status, 'active'),
        eq(artifacts.category, category),
        ne(artifacts.id, id)
      )
    )
    .orderBy(desc(artifacts.viewCount))
    .limit(4);
  
  return result.map(a => parseJsonFields(a, ['images']));
}

export async function incrementArtifactViewCount(id: number) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db
      .update(artifacts)
      .set({ viewCount: sql`${artifacts.viewCount} + 1` })
      .where(eq(artifacts.id, id));
  } catch (error) {
    console.error(`[Database] Failed to increment view count for artifact ${id}:`, error);
  }
}

// ============ Attractions Functions ============
export async function getAllAttractions() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(attractions)
    .where(eq(attractions.status, 'active'))
    .orderBy(desc(attractions.viewCount));
  
  return result.map(a => parseJsonFields(a, ['images', 'facilities']));
}

export async function getAttractionById(id: number) {
  const db = await getDb();
  if (!db) return null;

  // Increment view count
  await incrementAttractionViewCount(id);
  
  const result = await db
    .select()
    .from(attractions)
    .where(eq(attractions.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images', 'facilities']) : null;
}

export async function searchAttractions(keyword: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(attractions)
    .where(
      and(
        eq(attractions.status, 'active'),
        or(
          like(attractions.name, `%${keyword}%`),
          like(attractions.location, `%${keyword}%`),
          like(attractions.description, `%${keyword}%`)
        )
      )
    )
    .orderBy(desc(attractions.viewCount));
  
  return result.map(a => parseJsonFields(a, ['images', 'facilities']));
}

export async function incrementAttractionViewCount(id: number) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db
      .update(attractions)
      .set({ viewCount: sql`${attractions.viewCount} + 1` })
      .where(eq(attractions.id, id));
  } catch (error) {
    console.error(`[Database] Failed to increment view count for attraction ${id}:`, error);
  }
}

// ============ Courses Functions ============
export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.status, 'active'))
    .orderBy(desc(courses.enrollmentCount));
  
  return result.map(c => parseJsonFields(c, ['objectives', 'outline']));
}

// ============ Experience Functions ============
export async function createExperienceRecord(record: InsertExperienceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(experienceRecords).values(record);
}

export async function updateExperienceStatus(id: number, status: 'completed', certificateUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(experienceRecords)
    .set({ 
      status, 
      endTime: new Date(),
      certificateUrl 
    })
    .where(eq(experienceRecords.id, id));
}

export async function getUserExperiences(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: experienceRecords.id,
      attractionName: attractions.name,
      startTime: experienceRecords.startTime,
      endTime: experienceRecords.endTime,
      status: experienceRecords.status,
      certificateUrl: experienceRecords.certificateUrl
    })
    .from(experienceRecords)
    .leftJoin(attractions, eq(experienceRecords.attractionId, attractions.id))
    .where(eq(experienceRecords.userId, userId))
    .orderBy(desc(experienceRecords.startTime));
}

// ============ Oral History Functions ============
export async function getAllOralHistories() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(oralHistories).orderBy(desc(oralHistories.createdAt));
}

export async function createOralHistory(data: InsertOralHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(oralHistories).values(data);
}

// ============ Immersive Assets Functions ============
export async function getAssetByAttractionId(attractionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(assets3d).where(eq(assets3d.relatedAttractionId, attractionId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAvailableUEInstance() {
  const db = await getDb();
  if (!db) return null;
  
  // Find an idle instance
  // In real world, this would likely involve a more complex lock/allocation mechanism
  const result = await db.select().from(ueInstances).where(eq(ueInstances.status, 'idle')).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function allocateUEInstance(instanceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(ueInstances)
    .set({ status: 'busy', currentUserId: userId, lastHeartbeat: new Date() })
    .where(eq(ueInstances.id, instanceId));
}

export async function releaseUEInstance(instanceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(ueInstances)
    .set({ status: 'idle', currentUserId: null })
    .where(eq(ueInstances.id, instanceId));
}

// ============ Community Functions ============
export async function getAllCommunityPosts() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      content: communityPosts.content,
      images: communityPosts.images,
      tags: communityPosts.tags,
      viewCount: communityPosts.viewCount,
      likeCount: communityPosts.likeCount,
      commentCount: communityPosts.commentCount,
      createdAt: communityPosts.createdAt,
      user: {
        name: users.name,
        // openId: users.openId, // Don't expose openId
      }
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.userId, users.id))
    .where(eq(communityPosts.status, 'active'))
    .orderBy(desc(communityPosts.createdAt));
  
  return result.map(post => {
    const parsed = parseJsonFields(post, ['images', 'tags']);
    // Format for frontend
    return {
      ...parsed,
      user: parsed.user?.name || "匿名用户",
      avatar: "https://github.com/shadcn.png", // Placeholder avatar for now
      time: new Date(parsed.createdAt).toLocaleDateString(),
      image: parsed.images && parsed.images.length > 0 ? parsed.images[0] : null
    };
  });
}

export async function createCommunityPost(post: InsertCommunityPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(communityPosts).values(post);
}

// ============ Projects Functions ============
export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(projects)
    .where(eq(projects.status, '进行中')) // or just all? let's filter by active status if we had one, but currently using Chinese status
    .orderBy(desc(projects.createdAt));
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['objectives', 'outline']) : null;
}

export async function getFeaturedCourses() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.status, 'active'),
        eq(courses.isFeatured, true)
      )
    )
    .orderBy(desc(courses.enrollmentCount))
    .limit(6);
  
  return result.map(c => parseJsonFields(c, ['objectives', 'outline']));
}


// ============ User Management Functions ============
export async function getAllUsers(options?: { page?: number; limit?: number; search?: string; status?: string }) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let query = db.select().from(users);
  
  if (options?.search) {
    query = query.where(
      or(
        like(users.name, `%${options.search}%`),
        like(users.email, `%${options.search}%`),
        like(users.phone, `%${options.search}%`)
      )
    ) as typeof query;
  }
  
  const result = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  
  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const total = countResult[0]?.count || 0;
  
  return { users: result, total };
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateUserById(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data).where(eq(users.id, id));
  return await getUserById(id);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete by setting status
  await db.update(users).set({ status: 'inactive' } as any).where(eq(users.id, id));
}

export async function banUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ status: 'banned' } as any).where(eq(users.id, id));
}

export async function unbanUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ status: 'active' } as any).where(eq(users.id, id));
}

// ============ User Address Functions ============
import { userAddresses, type InsertUserAddress } from "../drizzle/schema";

export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId)).orderBy(desc(userAddresses.isDefault));
}

export async function createUserAddress(address: InsertUserAddress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If this is set as default, unset other defaults first
  if (address.isDefault) {
    await db.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, address.userId));
  }
  
  return await db.insert(userAddresses).values(address);
}

export async function updateUserAddress(id: number, userId: number, data: Partial<InsertUserAddress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If setting as default, unset other defaults first
  if (data.isDefault) {
    await db.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
  }
  
  await db.update(userAddresses).set(data).where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
}

export async function deleteUserAddress(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(userAddresses).where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
}

// ============ Cart Functions ============
import { cartItems, type InsertCartItem } from "../drizzle/schema";

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      selected: cartItems.selected,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
        coverImage: products.coverImage,
        stock: products.stock
      }
    })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
  
  return result;
}

export async function addToCart(userId: number, productId: number, quantity: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if item already in cart
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);
  
  if (existing.length > 0) {
    // Update quantity
    await db.update(cartItems)
      .set({ quantity: sql`${cartItems.quantity} + ${quantity}` })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }
}

export async function updateCartItemQuantity(id: number, userId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }
}

export async function removeFromCart(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ============ Product Review Functions ============
import { productReviews, type InsertProductReview } from "../drizzle/schema";

export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: productReviews.id,
      rating: productReviews.rating,
      content: productReviews.content,
      images: productReviews.images,
      isAnonymous: productReviews.isAnonymous,
      adminReply: productReviews.adminReply,
      createdAt: productReviews.createdAt,
      user: {
        name: users.name
      }
    })
    .from(productReviews)
    .leftJoin(users, eq(productReviews.userId, users.id))
    .where(and(eq(productReviews.productId, productId), eq(productReviews.status, 'approved')))
    .orderBy(desc(productReviews.createdAt));
  
  return result.map(r => ({
    ...parseJsonFields(r, ['images']),
    userName: r.isAnonymous ? "匿名用户" : (r.user?.name || "用户")
  }));
}

export async function createProductReview(review: InsertProductReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(productReviews).values(review);
  
  // Update product rating and review count
  const reviews = await db.select({ rating: productReviews.rating })
    .from(productReviews)
    .where(and(eq(productReviews.productId, review.productId), eq(productReviews.status, 'approved')));
  
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await db.update(products).set({ 
      rating: avgRating.toFixed(1),
      reviewCount: reviews.length 
    }).where(eq(products.id, review.productId));
  }
}

export async function getAllReviews(options?: { page?: number; limit?: number; status?: string }) {
  const db = await getDb();
  if (!db) return { reviews: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let query = db
    .select({
      id: productReviews.id,
      rating: productReviews.rating,
      content: productReviews.content,
      status: productReviews.status,
      createdAt: productReviews.createdAt,
      user: { name: users.name },
      product: { name: products.name }
    })
    .from(productReviews)
    .leftJoin(users, eq(productReviews.userId, users.id))
    .leftJoin(products, eq(productReviews.productId, products.id));
  
  if (options?.status) {
    query = query.where(eq(productReviews.status, options.status as any)) as typeof query;
  }
  
  const result = await query.orderBy(desc(productReviews.createdAt)).limit(limit).offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(productReviews);
  const total = countResult[0]?.count || 0;
  
  return { reviews: result, total };
}

export async function updateReviewStatus(id: number, status: 'approved' | 'rejected', adminReply?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (adminReply) {
    updateData.adminReply = adminReply;
    updateData.adminReplyAt = new Date();
  }
  
  await db.update(productReviews).set(updateData).where(eq(productReviews.id, id));
}

// ============ Product Admin Functions ============
import { type InsertProduct } from "../drizzle/schema";

export async function getAllProductsAdmin(options?: { page?: number; limit?: number; status?: string; category?: string }) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let conditions: any[] = [];
  if (options?.status) {
    conditions.push(eq(products.status, options.status as any));
  }
  if (options?.category) {
    conditions.push(eq(products.category, options.category));
  }
  
  let query = db.select().from(products);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  const result = await query.orderBy(desc(products.createdAt)).limit(limit).offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(products);
  const total = countResult[0]?.count || 0;
  
  return { products: result.map(p => parseJsonFields(p, ['images', 'tags'])), total };
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(products).values(product);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(products).set(data).where(eq(products.id, id));
  return await getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete
  await db.update(products).set({ status: 'inactive' }).where(eq(products.id, id));
}

// ============ Order Admin Functions ============
export async function getAllOrders(options?: { page?: number; limit?: number; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let conditions: any[] = [];
  if (options?.status) {
    conditions.push(eq(orders.status, options.status as any));
  }
  if (options?.search) {
    conditions.push(
      or(
        like(orders.orderNumber, `%${options.search}%`),
        like(orders.itemName, `%${options.search}%`)
      )
    );
  }
  
  let query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      orderType: orders.orderType,
      itemName: orders.itemName,
      quantity: orders.quantity,
      totalAmount: orders.totalAmount,
      status: orders.status,
      shippingAddress: orders.shippingAddress,
      trackingNumber: orders.trackingNumber,
      createdAt: orders.createdAt,
      user: { name: users.name, phone: users.phone }
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  const result = await query.orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const total = countResult[0]?.count || 0;
  
  return { orders: result.map(o => parseJsonFields(o, ['shippingAddress'])), total };
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['shippingAddress']) : null;
}

export async function updateOrderStatus(id: number, status: string, data?: { trackingNumber?: string; trackingCompany?: string; adminNote?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  
  if (status === 'shipped' && data?.trackingNumber) {
    updateData.trackingNumber = data.trackingNumber;
    updateData.trackingCompany = data.trackingCompany;
    updateData.shippedAt = new Date();
  }
  
  if (status === 'completed') {
    updateData.completedAt = new Date();
  }
  
  if (data?.adminNote) {
    updateData.adminNote = data.adminNote;
  }
  
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}

// ============ Community Admin Functions ============
import { postComments, likes, reports, type InsertPostComment, type InsertReport } from "../drizzle/schema";

export async function getAllCommunityPostsAdmin(options?: { page?: number; limit?: number; status?: string }) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let query = db
    .select({
      id: communityPosts.id,
      title: communityPosts.title,
      content: communityPosts.content,
      type: communityPosts.type,
      viewCount: communityPosts.viewCount,
      likeCount: communityPosts.likeCount,
      commentCount: communityPosts.commentCount,
      isTop: communityPosts.isTop,
      isFeatured: communityPosts.isFeatured,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      user: { id: users.id, name: users.name }
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.userId, users.id));
  
  if (options?.status) {
    query = query.where(eq(communityPosts.status, options.status as any)) as typeof query;
  }
  
  const result = await query.orderBy(desc(communityPosts.createdAt)).limit(limit).offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(communityPosts);
  const total = countResult[0]?.count || 0;
  
  return { posts: result, total };
}

export async function getCommunityPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.id, id))
    .limit(1);
  
  return result.length > 0 ? parseJsonFields(result[0], ['images', 'tags']) : null;
}

export async function updateCommunityPost(id: number, data: Partial<InsertCommunityPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(communityPosts).set(data).where(eq(communityPosts.id, id));
}

export async function deleteCommunityPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(communityPosts).set({ status: 'deleted' }).where(eq(communityPosts.id, id));
}

export async function setPostTop(id: number, isTop: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(communityPosts).set({ isTop } as any).where(eq(communityPosts.id, id));
}

export async function setPostFeatured(id: number, isFeatured: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(communityPosts).set({ isFeatured } as any).where(eq(communityPosts.id, id));
}

// ============ Comment Functions ============
export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: postComments.id,
      content: postComments.content,
      parentId: postComments.parentId,
      likeCount: postComments.likeCount,
      createdAt: postComments.createdAt,
      user: { id: users.id, name: users.name }
    })
    .from(postComments)
    .leftJoin(users, eq(postComments.userId, users.id))
    .where(and(eq(postComments.postId, postId), eq(postComments.status, 'active')))
    .orderBy(postComments.createdAt);
  
  return result;
}

export async function createComment(comment: InsertPostComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(postComments).values(comment);
  
  // Update comment count on post
  await db.update(communityPosts)
    .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
    .where(eq(communityPosts.id, comment.postId));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the comment to find the post
  const comment = await db.select().from(postComments).where(eq(postComments.id, id)).limit(1);
  if (comment.length > 0) {
    await db.update(postComments).set({ status: 'deleted' }).where(eq(postComments.id, id));
    
    // Update comment count on post
    await db.update(communityPosts)
      .set({ commentCount: sql`${communityPosts.commentCount} - 1` })
      .where(eq(communityPosts.id, comment[0].postId));
  }
}

// ============ Like Functions ============
export async function toggleLike(userId: number, targetType: 'post' | 'comment' | 'product' | 'artifact', targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already liked
  const existing = await db.select().from(likes)
    .where(and(
      eq(likes.userId, userId),
      eq(likes.targetType, targetType),
      eq(likes.targetId, targetId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    
    // Update like count
    if (targetType === 'post') {
      await db.update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} - 1` })
        .where(eq(communityPosts.id, targetId));
    } else if (targetType === 'artifact') {
      await db.update(artifacts)
        .set({ likeCount: sql`${artifacts.likeCount} - 1` })
        .where(eq(artifacts.id, targetId));
    }
    
    return { liked: false };
  } else {
    // Like
    await db.insert(likes).values({ userId, targetType, targetId });
    
    // Update like count
    if (targetType === 'post') {
      await db.update(communityPosts)
        .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
        .where(eq(communityPosts.id, targetId));
    } else if (targetType === 'artifact') {
      await db.update(artifacts)
        .set({ likeCount: sql`${artifacts.likeCount} + 1` })
        .where(eq(artifacts.id, targetId));
    }
    
    return { liked: true };
  }
}

export async function getUserLikes(userId: number, targetType: 'post' | 'comment' | 'product' | 'artifact') {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({ targetId: likes.targetId })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.targetType, targetType)));
  
  return result.map(r => r.targetId);
}

// ============ Report Functions ============
export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(reports).values(report);
}

export async function getAllReports(options?: { page?: number; limit?: number; status?: string }) {
  const db = await getDb();
  if (!db) return { reports: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let query = db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      description: reports.description,
      status: reports.status,
      createdAt: reports.createdAt,
      user: { id: users.id, name: users.name }
    })
    .from(reports)
    .leftJoin(users, eq(reports.userId, users.id));
  
  if (options?.status) {
    query = query.where(eq(reports.status, options.status as any)) as typeof query;
  }
  
  const result = await query.orderBy(desc(reports.createdAt)).limit(limit).offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(reports);
  const total = countResult[0]?.count || 0;
  
  return { reports: result, total };
}

export async function resolveReport(id: number, adminId: number, status: 'resolved' | 'dismissed', adminNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(reports).set({
    status,
    adminNote,
    resolvedAt: new Date(),
    resolvedBy: adminId
  } as any).where(eq(reports.id, id));
}

// ============ Favorites Functions ============
export async function getUserFavorites(userId: number, itemType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (itemType) {
    return await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.itemType, itemType as any)))
      .orderBy(desc(favorites.createdAt));
  }
  
  return await db.select().from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function toggleFavorite(userId: number, itemType: 'route' | 'attraction' | 'product' | 'artifact' | 'course' | 'post', itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already favorited
  const existing = await db.select().from(favorites)
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.itemType, itemType),
      eq(favorites.itemId, itemId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Remove favorite
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { favorited: false };
  } else {
    // Add favorite
    await db.insert(favorites).values({ userId, itemType, itemId });
    return { favorited: true };
  }
}

// ============ Admin Log Functions ============
import { adminLogs, type InsertAdminLog } from "../drizzle/schema";

export async function createAdminLog(log: InsertAdminLog) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(adminLogs).values(log);
}

export async function getAdminLogs(options?: { page?: number; limit?: number; adminId?: number }) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const offset = (page - 1) * limit;
  
  let query = db
    .select({
      id: adminLogs.id,
      action: adminLogs.action,
      targetType: adminLogs.targetType,
      targetId: adminLogs.targetId,
      details: adminLogs.details,
      createdAt: adminLogs.createdAt,
      admin: { name: users.name }
    })
    .from(adminLogs)
    .leftJoin(users, eq(adminLogs.adminId, users.id));
  
  if (options?.adminId) {
    query = query.where(eq(adminLogs.adminId, options.adminId)) as typeof query;
  }
  
  const result = await query.orderBy(desc(adminLogs.createdAt)).limit(limit).offset(offset);
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(adminLogs);
  const total = countResult[0]?.count || 0;
  
  return { logs: result, total };
}

// ============ Notification Functions ============
import { notifications, type InsertNotification } from "../drizzle/schema";

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(notifications).values(notification);
}

export async function getUserNotifications(userId: number, options?: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const db = await getDb();
  if (!db) return { notifications: [], total: 0, unreadCount: 0 };
  
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  
  let result;
  if (options?.unreadOnly) {
    result = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  } else {
    result = await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.userId, userId));
  const total = countResult[0]?.count || 0;
  
  const unreadResult = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  const unreadCount = unreadResult[0]?.count || 0;
  
  return { notifications: result, total, unreadCount };
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ============ Statistics Functions (Dashboard) ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.status, 'active'));
  const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(communityPosts).where(eq(communityPosts.status, 'active'));
  
  // Revenue (sum of completed orders)
  const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(totalAmount), 0)` })
    .from(orders)
    .where(eq(orders.status, 'completed'));
  
  // Pending orders
  const [pendingOrders] = await db.select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, 'pending'));
  
  // Pending reviews
  const [pendingReviews] = await db.select({ count: sql<number>`count(*)` })
    .from(productReviews)
    .where(eq(productReviews.status, 'pending'));
  
  // Pending reports
  const [pendingReports] = await db.select({ count: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.status, 'pending'));
  
  return {
    userCount: userCount?.count || 0,
    orderCount: orderCount?.count || 0,
    productCount: productCount?.count || 0,
    postCount: postCount?.count || 0,
    revenue: revenue?.total || 0,
    pendingOrders: pendingOrders?.count || 0,
    pendingReviews: pendingReviews?.count || 0,
    pendingReports: pendingReports?.count || 0
  };
}
