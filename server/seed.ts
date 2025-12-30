import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { attractions, type InsertAttraction } from "../drizzle/schema";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const hebeiAttractions: InsertAttraction[] = [
  {
    name: "西柏坡纪念馆",
    location: "河北省石家庄市平山县西柏坡镇",
    latitude: "38.3303000",
    longitude: "113.9333000",
    category: "memorial",
    coverImage: "/images/xibaipo.jpg",
    description: "西柏坡是解放战争时期中央工委、中共中央和解放军总部的所在地，是“两个务必”的诞生地，新中国从这里走来。",
    history: "1948年5月至1949年3月，中共中央在此指挥了震惊中外的辽沈、淮海、平津三大战役，召开了具有伟大历史意义的七届二中全会。",
    openingHours: "09:00 - 17:00",
    ticketPrice: "免费",
    status: "active"
  },
  {
    name: "狼牙山五壮士纪念馆",
    location: "河北省保定市易县狼牙山镇",
    latitude: "39.0089000",
    longitude: "115.2322000",
    category: "site",
    coverImage: "/images/langyashan.jpg",
    description: "狼牙山是晋察冀边区东部的重要屏障，因其峰峦状似狼牙而得名。这里发生了著名的狼牙山五壮士舍身跳崖的英雄事迹。",
    history: "1941年9月25日，八路军战士马宝玉、葛振林、宋学义、胡德林、胡福才五位英雄，为了掩护部队和群众转移，将日伪军引上狼牙山棋盘陀峰顶，最后英勇跳崖。",
    openingHours: "08:00 - 17:30",
    ticketPrice: "80元",
    status: "active"
  },
  {
    name: "冉庄地道战遗址",
    location: "河北省保定市清苑区冉庄镇",
    latitude: "38.6855000",
    longitude: "115.3644000",
    category: "site",
    coverImage: "https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=2070&auto=format&fit=crop",
    description: "冉庄地道战遗址是抗日战争时期中国共产党领导下的冀中平原人民开展地道战的典型代表。",
    history: "抗日战争时期，冉庄人民利用地道优势，配合八路军主力部队，与日伪军进行了长期艰苦卓绝的斗争，创造了辉煌的战绩。",
    openingHours: "09:00 - 16:30",
    ticketPrice: "免费",
    status: "active"
  },
  {
    name: "白洋淀雁翎队纪念馆",
    location: "河北省雄安新区安新县",
    latitude: "38.8675000",
    longitude: "115.9356000",
    category: "museum",
    coverImage: "https://images.unsplash.com/photo-1552553068-18ee9111812d?q=80&w=2070&auto=format&fit=crop",
    description: "白洋淀是华北平原上最大的淡水湖，抗日战争时期，活跃在这里的雁翎队利用水乡地理优势，沉重打击了日本侵略者。",
    history: "雁翎队成立于1939年，他们利用芦苇荡和港汊，开展水上游击战，切断日军水上运输线，被誉为“水上神兵”。",
    openingHours: "08:30 - 17:30",
    ticketPrice: "40元",
    status: "active"
  },
  {
    name: "李大钊纪念馆",
    location: "河北省唐山市乐亭县",
    latitude: "39.4361000",
    longitude: "118.9056000",
    category: "memorial",
    coverImage: "https://images.unsplash.com/photo-1580910051053-480623e3a84b?q=80&w=2070&auto=format&fit=crop",
    description: "李大钊纪念馆是为纪念中国共产主义运动的先驱、伟大的马克思主义者、杰出的无产阶级革命家、中国共产党的主要创始人之一李大钊同志而建立的。",
    history: "1997年8月16日落成开馆。馆内陈列了大量珍贵的历史文物和图片，系统介绍了李大钊同志的生平事迹和革命精神。",
    openingHours: "09:00 - 16:30",
    ticketPrice: "免费",
    status: "active"
  },
  {
    name: "八路军一二九师司令部旧址",
    location: "河北省邯郸市涉县赤岸村",
    latitude: "36.5500000",
    longitude: "113.6500000",
    category: "site",
    coverImage: "https://images.unsplash.com/photo-1604580864964-c856ce219c01?q=80&w=2070&auto=format&fit=crop",
    description: "八路军一二九师司令部旧址是抗日战争时期八路军一二九师师部所在地，刘伯承、邓小平等老一辈革命家曾在这里长期战斗和生活。",
    history: "129师在太行山区战斗生活了6年之久，运筹帷幄，决胜千里，创建了晋冀鲁豫抗日根据地。",
    openingHours: "08:00 - 18:00",
    ticketPrice: "免费",
    status: "active"
  },
  {
    name: "晋察冀边区革命纪念馆",
    location: "河北省保定市阜平县城南庄镇",
    latitude: "38.8500000",
    longitude: "114.2000000",
    category: "memorial",
    coverImage: "https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?q=80&w=2070&auto=format&fit=crop",
    description: "晋察冀边区革命纪念馆是为纪念晋察冀边区军民在抗日战争和解放战争中创下的光辉业绩而建立的。",
    history: "晋察冀边区是中国共产党在敌后创建的第一个抗日根据地，被誉为“新中国的雏形”。",
    openingHours: "09:00 - 17:00",
    ticketPrice: "免费",
    status: "active"
  }
];

async function seed() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log("Seeding attractions...");
  
  try {
    // Clear existing attractions (optional, be careful in production)
    // await db.delete(attractions); 

    for (const attraction of hebeiAttractions) {
      await db.insert(attractions).values(attraction);
      console.log(`Inserted: ${attraction.name}`);
    }

    console.log("Seeding completed!");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await connection.end();
  }
}

seed();
