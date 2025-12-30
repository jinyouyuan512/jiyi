import { eq, desc, and, or, like, sql } from "drizzle-orm";
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
