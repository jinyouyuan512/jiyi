import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getAllRoutes: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "重走赶考路",
      subtitle: "西柏坡深度研学之旅",
      location: "石家庄 · 平山县",
      days: "3天2晚",
      difficulty: "medium",
      price: "580.00",
      coverImage: "/images/xibaipo.jpg",
      images: [],
      tags: ["经典", "党建"],
      description: "探访革命圣地西柏坡",
      highlights: [],
      itinerary: [],
      included: [],
      excluded: [],
      rating: "4.9",
      reviewCount: 128,
      viewCount: 5000,
      bookingCount: 300,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getRouteById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        title: "重走赶考路",
        location: "石家庄 · 平山县",
        days: "3天2晚",
        price: "580.00",
      });
    }
    return Promise.resolve(null);
  }),
  searchRoutes: vi.fn().mockResolvedValue([]),
  getRecommendedRoute: vi.fn().mockResolvedValue({
    id: 1,
    title: "重走赶考路",
    location: "石家庄 · 平山县",
  }),
  getAllProducts: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "狼牙山五壮士纪念徽章",
      category: "纪念品",
      price: "128.00",
      coverImage: "/images/product-badge.jpg",
      status: "active",
    },
  ]),
  getProductById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        name: "狼牙山五壮士纪念徽章",
        price: "128.00",
      });
    }
    return Promise.resolve(null);
  }),
  getFeaturedProducts: vi.fn().mockResolvedValue([]),
  getRecommendedProduct: vi.fn().mockResolvedValue(null),
  getAllArtifacts: vi.fn().mockResolvedValue([]),
  getArtifactById: vi.fn().mockResolvedValue(null),
  searchArtifacts: vi.fn().mockResolvedValue([]),
  getRelatedArtifacts: vi.fn().mockResolvedValue([]),
  getAllAttractions: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "西柏坡纪念馆",
      location: "石家庄市平山县",
      category: "memorial",
      status: "active",
    },
  ]),
  getAttractionById: vi.fn().mockResolvedValue(null),
  searchAttractions: vi.fn().mockResolvedValue([]),
  getAllCourses: vi.fn().mockResolvedValue([]),
  getCourseById: vi.fn().mockResolvedValue(null),
  getFeaturedCourses: vi.fn().mockResolvedValue([]),
  getAllCommunityPosts: vi.fn().mockResolvedValue([]),
  createCommunityPost: vi.fn().mockResolvedValue({ insertId: 1 }),
  getAllProjects: vi.fn().mockResolvedValue([]),
  getAllOralHistories: vi.fn().mockResolvedValue([]),
  getAssetByAttractionId: vi.fn().mockResolvedValue(null),
  getAvailableUEInstance: vi.fn().mockResolvedValue(null),
  allocateUEInstance: vi.fn().mockResolvedValue(undefined),
  releaseUEInstance: vi.fn().mockResolvedValue(undefined),
  createExperienceRecord: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateExperienceStatus: vi.fn().mockResolvedValue(undefined),
  getUserExperiences: vi.fn().mockResolvedValue([]),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue({ insertId: 1 }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      phone: null,
      password: null,
      identity: null,
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Routes API", () => {
  it("should return all routes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const routes = await caller.routes.list();

    expect(routes).toHaveLength(1);
    expect(routes[0].title).toBe("重走赶考路");
  });

  it("should return route by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const route = await caller.routes.getById({ id: 1 });

    expect(route).not.toBeNull();
    expect(route?.title).toBe("重走赶考路");
  });

  it("should return null for non-existent route", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const route = await caller.routes.getById({ id: 999 });

    expect(route).toBeNull();
  });

  it("should return recommended route", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const route = await caller.routes.recommendation();

    expect(route).not.toBeNull();
    expect(route?.title).toBe("重走赶考路");
  });
});

describe("Products API", () => {
  it("should return all products", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("狼牙山五壮士纪念徽章");
  });

  it("should return product by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const product = await caller.products.getById({ id: 1 });

    expect(product).not.toBeNull();
    expect(product?.name).toBe("狼牙山五壮士纪念徽章");
  });
});

describe("Attractions API", () => {
  it("should return all attractions", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const attractions = await caller.attractions.list();

    expect(attractions).toHaveLength(1);
    expect(attractions[0].name).toBe("西柏坡纪念馆");
  });
});

describe("Community API", () => {
  it("should return all community posts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const posts = await caller.community.list();

    expect(posts).toEqual([]);
  });

  it("should require authentication to create post", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.community.create({
        title: "Test Post",
        content: "Test Content",
      })
    ).rejects.toThrow("请先登录");
  });

  it("should allow authenticated user to create post", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.community.create({
      title: "Test Post",
      content: "Test Content",
      tags: ["test"],
    });

    expect(result).toBeDefined();
  });
});

describe("Experience API", () => {
  it("should require authentication to start experience", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.experience.start({ attractionId: 1 })
    ).rejects.toThrow("请先登录");
  });

  it("should allow authenticated user to start experience", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.experience.start({ attractionId: 1 });

    expect(result.success).toBe(true);
  });

  it("should require authentication to view records", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.experience.myRecords()).rejects.toThrow("请先登录");
  });
});

describe("Orders API", () => {
  it("should require authentication to create order", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.create({
        orderType: "product",
        itemId: 1,
        itemName: "Test Product",
        quantity: 1,
        unitPrice: 100,
        totalAmount: 100,
      })
    ).rejects.toThrow("请先登录");
  });

  it("should allow authenticated user to create order", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.create({
      orderType: "product",
      itemId: 1,
      itemName: "Test Product",
      quantity: 1,
      unitPrice: 100,
      totalAmount: 100,
    });

    expect(result.success).toBe(true);
    expect(result.orderNumber).toMatch(/^ORD-/);
  });

  it("should require authentication to view orders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.myOrders()).rejects.toThrow("请先登录");
  });
});

describe("Oral History API", () => {
  it("should return all oral histories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const histories = await caller.oralHistory.list();

    expect(histories).toEqual([]);
  });
});

describe("Immersive API", () => {
  it("should return asset by attraction id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const asset = await caller.immersive.getAsset({ attractionId: 1 });

    expect(asset).toBeNull();
  });

  it("should require authentication to connect UE", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.immersive.connectUE({ attractionId: 1 })
    ).rejects.toThrow("请先登录以访问云渲染服务");
  });
});
