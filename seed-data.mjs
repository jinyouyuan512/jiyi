import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import 'dotenv/config'; // Add this line
import { routes, attractions, products, artifacts, courses } from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Starting data seeding...\n');

// Seed Routes Data
console.log('📍 Seeding routes...');
const routesData = [
  {
    title: '重走赶考路',
    subtitle: '追寻新中国从这里走来的足迹',
    location: '西柏坡 - 石家庄',
    days: '3天2晚',
    difficulty: 'medium',
    price: '580.00',
    coverImage: '/images/xibaipo.jpg',
    images: JSON.stringify(['/images/xibaipo.jpg', '/images/xibaipo-2.jpg']),
    tags: JSON.stringify(['经典', '研学', '党建']),
    description: '西柏坡是中国革命圣地之一，这里见证了新中国诞生前夕的关键时刻。本线路将带您深入了解"两个务必"的精神内涵，感受老一辈革命家的艰苦奋斗历程。',
    highlights: JSON.stringify([
      '参观西柏坡纪念馆，了解七届二中全会历史',
      '走进中共中央旧址，感受领袖工作生活场景',
      '聆听专家讲座，深入学习"赶考"精神',
      '体验红色研学课程，重温入党誓词'
    ]),
    itinerary: JSON.stringify([
      {
        day: 1,
        title: '抵达西柏坡',
        activities: ['接站', '入住酒店', '开营仪式', '观看纪录片《新中国从这里走来》']
      },
      {
        day: 2,
        title: '深度学习',
        activities: ['参观西柏坡纪念馆', '参观中共中央旧址', '专家讲座', '小组讨论']
      },
      {
        day: 3,
        title: '总结返程',
        activities: ['重温入党誓词', '结营仪式', '返程']
      }
    ]),
    included: JSON.stringify(['住宿', '餐饮', '门票', '讲解', '保险']),
    excluded: JSON.stringify(['往返交通', '个人消费']),
    rating: '4.9',
    reviewCount: 328,
    viewCount: 15420,
    bookingCount: 856,
    status: 'active'
  },
  {
    title: '太行抗战魂',
    subtitle: '重温八路军抗战峥嵘岁月',
    location: '狼牙山 - 白洋淀',
    days: '2天1晚',
    difficulty: 'medium',
    price: '480.00',
    coverImage: '/images/langyashan.jpg',
    images: JSON.stringify(['/images/langyashan.jpg', '/images/baiyangdian.jpg']),
    tags: JSON.stringify(['自然', '历史', '爱国']),
    description: '探访狼牙山五壮士跳崖遗址，游览白洋淀雁翎队纪念馆，感受太行儿女的英勇抗战精神。',
    highlights: JSON.stringify([
      '登临狼牙山，缅怀五壮士英勇事迹',
      '参观狼牙山五勇士陈列馆',
      '游览白洋淀，了解雁翎队抗日故事',
      '体验水上游击战术演示'
    ]),
    itinerary: JSON.stringify([
      {
        day: 1,
        title: '狼牙山之行',
        activities: ['前往狼牙山', '参观五勇士陈列馆', '登山缅怀', '晚餐']
      },
      {
        day: 2,
        title: '白洋淀探访',
        activities: ['游览白洋淀', '参观雁翎队纪念馆', '水上体验', '返程']
      }
    ]),
    included: JSON.stringify(['住宿', '餐饮', '门票', '船票', '保险']),
    excluded: JSON.stringify(['往返交通', '个人消费']),
    rating: '4.8',
    reviewCount: 256,
    viewCount: 12380,
    bookingCount: 642,
    status: 'active'
  },
  {
    title: '冉庄地道战',
    subtitle: '探秘抗日战争地下长城',
    location: '保定 - 冉庄',
    days: '1天',
    difficulty: 'easy',
    price: '180.00',
    coverImage: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=2070&auto=format&fit=crop',
    images: JSON.stringify(['https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=2070&auto=format&fit=crop']),
    tags: JSON.stringify(['体验', '亲子', '历史']),
    description: '走进冉庄地道战遗址，亲身体验抗战时期的地道战术，了解冀中人民的智慧与勇气。',
    highlights: JSON.stringify([
      '参观地道战遗址保护区',
      '体验地道内部结构',
      '观看地道战实景演出',
      '互动体验抗战生活'
    ]),
    itinerary: JSON.stringify([
      {
        day: 1,
        title: '冉庄一日游',
        activities: ['出发', '参观地道战遗址', '观看演出', '互动体验', '返程']
      }
    ]),
    included: JSON.stringify(['往返交通', '门票', '午餐', '保险']),
    excluded: JSON.stringify(['个人消费']),
    rating: '4.7',
    reviewCount: 189,
    viewCount: 8560,
    bookingCount: 423,
    status: 'active'
  }
];

for (const route of routesData) {
  await db.insert(routes).values(route);
}
console.log(`✓ Inserted ${routesData.length} routes\n`);

// Seed Products Data
console.log('🛍️  Seeding products...');
const productsData = [
  {
    name: "'红星照耀' 陶瓷茶具",
    subtitle: '传统工艺与红色文化的完美结合',
    category: '家居生活',
    price: '299.00',
    originalPrice: '399.00',
    coverImage: '/images/product-ceramic.jpg',
    images: JSON.stringify(['/images/product-ceramic.jpg']),
    description: '采用景德镇传统工艺烧制，融入红色五角星元素，一壶四杯，适合家庭使用或作为礼品赠送。',
    materials: '高岭土、釉料',
    dimensions: '茶壶：15cm×10cm，茶杯：6cm×5cm',
    designer: '李明',
    stock: 150,
    sales: 89,
    tags: JSON.stringify(['茶具', '陶瓷', '礼品']),
    rating: '4.9',
    reviewCount: 67,
    viewCount: 3420,
    isFeatured: true,
    status: 'active'
  },
  {
    name: '冀忆红途 纪念手账本',
    subtitle: '记录您的红色之旅',
    category: '办公文具',
    price: '68.00',
    coverImage: '/images/product-notebook.jpg',
    images: JSON.stringify(['/images/product-notebook.jpg']),
    description: '采用环保纸张，内页设计融入河北红色景点插画，适合旅行记录和日常笔记。',
    materials: '环保纸、布面精装',
    dimensions: '21cm×14cm，200页',
    designer: '王芳',
    stock: 500,
    sales: 234,
    tags: JSON.stringify(['文具', '手账', '旅行']),
    rating: '4.8',
    reviewCount: 156,
    viewCount: 5680,
    isFeatured: true,
    status: 'active'
  },
  {
    name: '西柏坡精神 浮雕笔筒',
    subtitle: '办公桌上的红色记忆',
    category: '工艺摆件',
    price: '128.00',
    coverImage: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=2070&auto=format&fit=crop',
    images: JSON.stringify(['https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=2070&auto=format&fit=crop']),
    description: '树脂材质，表面浮雕西柏坡纪念馆造型，既实用又具有纪念意义。',
    materials: '树脂、金属底座',
    dimensions: '10cm×10cm×12cm',
    designer: '张伟',
    stock: 200,
    sales: 78,
    tags: JSON.stringify(['摆件', '办公', '纪念']),
    rating: '4.7',
    reviewCount: 45,
    viewCount: 2340,
    isFeatured: false,
    status: 'active'
  },
  {
    name: '狼牙山五壮士 纪念徽章',
    subtitle: '限量发行，纯铜打造',
    category: '收藏纪念',
    price: '128.00',
    coverImage: '/images/product-badge.jpg',
    images: JSON.stringify(['/images/product-badge.jpg']),
    description: '纯铜材质，采用失蜡铸造工艺，表面镀金处理，限量发行1000枚，每枚带独立编号。',
    materials: '纯铜、镀金',
    dimensions: '直径5cm，厚度0.5cm',
    designer: '赵强',
    stock: 856,
    sales: 144,
    tags: JSON.stringify(['徽章', '收藏', '纪念']),
    rating: '5.0',
    reviewCount: 98,
    viewCount: 4520,
    isFeatured: true,
    status: 'active'
  }
];

for (const product of productsData) {
  await db.insert(products).values(product);
}
console.log(`✓ Inserted ${productsData.length} products\n`);

// Seed Artifacts Data
console.log('🏛️  Seeding artifacts...');
const artifactsData = [
  {
    name: '《晋察冀日报》创刊号',
    englishName: 'Jinchaji Daily - First Issue',
    category: '文献',
    era: '1937年',
    origin: '河北阜平',
    currentLocation: '河北博物院',
    coverImage: '/images/artifact-newspaper.jpg',
    images: JSON.stringify(['/images/artifact-newspaper.jpg']),
    description: '《晋察冀日报》是中国共产党在敌后抗日根据地创办的第一份党报，创刊于1937年12月11日。',
    historicalContext: '抗日战争时期，晋察冀边区是中国共产党领导的重要抗日根据地之一。为了宣传抗日主张，鼓舞军民士气，边区党委决定创办《晋察冀日报》。',
    culturalSignificance: '这份报纸见证了中国共产党在敌后根据地的新闻宣传工作，对于研究抗战时期的历史具有重要价值。',
    dimensions: '38cm×26cm',
    materials: '新闻纸',
    condition: '良好',
    viewCount: 2340,
    likeCount: 456,
    status: 'active'
  },
  {
    name: '八路军战士使用的步枪',
    englishName: 'Rifle Used by Eighth Route Army',
    category: '武器',
    era: '1940年代',
    origin: '河北涞源',
    currentLocation: '中国人民革命军事博物馆',
    coverImage: '/images/artifact-rifle.jpg',
    images: JSON.stringify(['/images/artifact-rifle.jpg']),
    model3dUrl: '/models/rifle-3d.glb',
    description: '这是一支八路军战士在抗日战争中使用的步枪，经过多次战斗，枪身留有明显的使用痕迹。',
    historicalContext: '抗日战争时期，八路军武器装备简陋，很多武器都是从敌人手中缴获而来。',
    culturalSignificance: '这支步枪见证了八路军艰苦卓绝的抗战历程，体现了中国军民不屈不挠的抗战精神。',
    dimensions: '长110cm',
    materials: '钢铁、木材',
    condition: '保存完好',
    viewCount: 5680,
    likeCount: 892,
    status: 'active'
  }
];

for (const artifact of artifactsData) {
  await db.insert(artifacts).values(artifact);
}
console.log(`✓ Inserted ${artifactsData.length} artifacts\n`);

// Seed Courses Data
console.log('📚 Seeding courses...');
const coursesData = [
  {
    title: '西柏坡精神的时代价值',
    subtitle: '深入学习"两个务必"思想',
    category: 'history',
    level: 'intermediate',
    instructor: '李教授',
    instructorTitle: '中共党史研究专家、河北师范大学教授',
    instructorAvatar: '/images/instructor-li.jpg',
    coverImage: '/images/course-xibaipo.jpg',
    videoUrl: '/videos/course-xibaipo.mp4',
    duration: 120,
    lessonCount: 6,
    description: '本课程系统讲解西柏坡精神的形成背景、核心内涵和时代价值，帮助学员深入理解"两个务必"思想在新时代的重要意义。',
    objectives: JSON.stringify([
      '了解西柏坡时期的历史背景',
      '掌握"两个务必"的核心内涵',
      '理解西柏坡精神的时代价值',
      '学会将西柏坡精神应用于实际工作'
    ]),
    outline: JSON.stringify([
      {
        chapter: '第一章：西柏坡时期的历史背景',
        lessons: ['解放战争形势', '中共中央进驻西柏坡', '七届二中全会']
      },
      {
        chapter: '第二章："两个务必"的提出',
        lessons: ['毛泽东的"赶考"思想', '"两个务必"的深刻内涵']
      },
      {
        chapter: '第三章：西柏坡精神的时代价值',
        lessons: ['新时代的"赶考"', '西柏坡精神与党的建设']
      }
    ]),
    price: '0.00',
    enrollmentCount: 3420,
    rating: '4.9',
    reviewCount: 856,
    viewCount: 12340,
    isFeatured: true,
    status: 'active'
  },
  {
    title: '河北红色旅游资源概览',
    subtitle: '了解河北丰富的红色文化遗产',
    category: 'tour',
    level: 'beginner',
    instructor: '王老师',
    instructorTitle: '河北省文化和旅游厅专家',
    instructorAvatar: '/images/instructor-wang.jpg',
    coverImage: '/images/course-tourism.jpg',
    videoUrl: '/videos/course-tourism.mp4',
    duration: 90,
    lessonCount: 4,
    description: '本课程全面介绍河北省的红色旅游资源，包括西柏坡、狼牙山、白洋淀等重要红色景点，为红色旅游提供专业指导。',
    objectives: JSON.stringify([
      '了解河北红色旅游资源分布',
      '掌握主要红色景点的历史背景',
      '学会规划红色旅游线路',
      '提升红色旅游讲解能力'
    ]),
    outline: JSON.stringify([
      {
        chapter: '第一章：河北红色旅游资源概况',
        lessons: ['河北红色历史简介', '主要红色景点分布']
      },
      {
        chapter: '第二章：经典红色景点详解',
        lessons: ['西柏坡', '狼牙山', '白洋淀', '冉庄地道战遗址']
      }
    ]),
    price: '99.00',
    enrollmentCount: 1580,
    rating: '4.8',
    reviewCount: 342,
    viewCount: 6780,
    isFeatured: true,
    status: 'active'
  }
];

for (const course of coursesData) {
  await db.insert(courses).values(course);
}
console.log(`✓ Inserted ${coursesData.length} courses\n`);

await connection.end();
console.log('✅ Data seeding completed successfully!');
