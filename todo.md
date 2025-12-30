# 冀忆红途 - 后端开发任务清单

## 数据库设计与实现
- [x] 设计旅游线路表结构（routes）
- [x] 设计景点表结构（attractions）
- [x] 设计文创商品表结构（products）
- [x] 设计数字文物表结构（artifacts）
- [x] 设计课程表结构（courses）
- [x] 设计用户收藏表结构（favorites）
- [x] 设计订单表结构（orders）
- [x] 设计社区内容表结构（community_posts）
- [x] 执行数据库迁移

## 数据填充
- [x] 迁移旅游线路数据到数据库
- [x] 迁移景点数据到数据库
- [x] 迁移文创商品数据到数据库
- [x] 迁移数字文物数据到数据库
- [x] 迁移课程数据到数据库

## API开发
- [x] 实现旅游线路查询API
- [x] 实现景点查询API
- [x] 实现文创商品查询API
- [x] 实现数字文物查询API
- [x] 实现课程查询API
- [x] 实现用户收藏功能API
- [x] 实现订单管理API
- [x] 实现社区内容API

## 前端集成
- [x] 更新首页数据获取逻辑
- [x] 更新旅游模块数据获取逻辑
- [x] 更新展馆模块数据获取逻辑
- [x] 更新学堂模块数据获取逻辑
- [x] 更新商城模块数据获取逻辑
- [x] 更新社区模块数据获取逻辑

## 测试与优化
- [x] 编写API单元测试
- [x] 前端功能测试（TypeScript类型检查通过）
- [x] 性能优化（代码分割、Chunk优化）

## 代码质量修复（2024-12-30）
- [x] 修复 server/routers.ts 语法错误（括号不匹配、代码结构混乱）
- [x] 修复 server/db.ts 缺少 `ne` 导入
- [x] 修复 client/src/pages/Community.tsx 中 `isLoading` 改为 `isPending`
- [x] 修复 client/src/pages/Profile.tsx 中 `isLoading` 改为 `loading`
- [x] 修复 client/src/pages/Store.tsx 中 `product.sales` 可能为 null 的问题
- [x] 添加 API 单元测试文件 server/api.test.ts（20个测试用例）
- [x] 优化 vite.config.ts 添加代码分割配置
