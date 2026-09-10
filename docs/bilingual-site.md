# 中英文网站交付说明

分支：`codex/site-bilingual`。本分支用于双语功能交付，不合并到 `main`。

## 英文内容执行记录（2026-09-10）

已补齐线上 2 个在售产品、1 篇资讯，以及首页/关于/联系的英文文本，并启用对应英文版本。采用事务及原记录匹配校验，只更新 `translations.en`；核验中文原文、商品参数及原发布/删除状态均未改变（数据库自动更新 `updated_at`）。

认证新闻已翻译并保存为英文草稿：原文同时出现 KASONS 与 Yuanye（源叶），认证归属需要人工核对后再发布。测试占位新闻（标题“虞”、正文“hi”）及其余草稿/测试/已删除产品未修改，避免将无效内容自动公开。

原文图片和认证材料保留原件，不改写证书图中文字或生成替代凭证。英文译文不构成对原文认证声明的独立核实。

## 数据库执行记录（2026-09-08）

已在 `Chem-B2B Project`（`ykwtbexlgescfjdjbeyg`）通过 Supabase 迁移 `add_bilingual_content_columns` 添加四张表的 `translations` JSONB 字段。迁移前后 products 8 条、news_articles 2 条、info_articles 1 条、site_content 1 条；排除新增字段后的原数据校验值全部一致，未导入示例或覆盖现有内容。

权限收紧已完成：用户登录 Vercel 后，确认 Production 已配置 `DATABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`（未展开或输出值）。随后执行迁移 `protect_bilingual_content_drafts`，撤销四张表的公开 SELECT 并保留服务端访问。SQL 验证 anon/authenticated 无表级及列级读取权限；实际 REST 验证四张表均为服务端 HTTP 200、匿名 HTTP 401。原内容校验值仍与迁移前一致。英文草稿的原始内容不再可被匿名直接读取。

## 已实现

- 网站右上角 `中文 | English`；中文沿用原路径，英文使用 `/en` 前缀。
- 切换时保留页面路径、查询参数和锚点，以 Cookie 记住首页语言偏好。
- 首页、产品、新闻、资讯、关于、联系、询价车、全站搜索和管理后台接入双语。
- 首页产品搜索与全站搜索同时保留。产品与资讯分类采用稳定分类键，筛选条件写入 URL。
- 询价车在两种语言间共用；联系表单草稿在当前浏览器会话中保留。
- 后台分别编辑中文和英文。英文产品、文章有发布开关；首页、关于、联系的英文发布状态分别保存。
- 富文本中的根相对站内链接跟随语言；资源下载、邮件、电话和外部链接保持原样。
- 页面语言属性、标题、canonical 和中英文 alternate 链接随语言切换。

## 启用前必须完成

1. 确保服务端使用 `DATABASE_URL`，或 Supabase URL 加服务端 `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`。密钥不能放入 `NEXT_PUBLIC_*` 变量，也不要提交到 Git。只有匿名 key 的配置不再支持读取 CMS 原始内容。
2. 部署此分支代码前后协调执行 `supabase/bilingual-content-migration.sql`。脚本新增四个 `translations` JSONB 字段，并撤销匿名用户直接读取这四张 CMS 表的权限，防止英文草稿随已发布中文记录被读取。网站继续通过服务端提供已发布内容。脚本保留原中文数据，可重复执行。
3. 到后台为线上实际产品、新闻、资讯和页面填写英文，校对后勾选发布并保存。代码中的 `data/*.json` 是本地示例的英文译文，不会自动覆盖或翻译线上 Supabase 数据。

不要为了此功能执行 `db:migrate-json`：现有全量导入脚本会替换远程数据，不是此次增量迁移的步骤。

未发布英文的文章不出现在英文列表，直接访问对应详情会显示英文说明及“查看中文版本”。已有英文名称且尚无独立英文翻译记录的旧产品可继续显示英文名称；其他缺失说明使用英文询价提示，不自动猜测化学信息。创建独立英文草稿后，必须发布才能出现在英文产品列表。

保存前请先完成当前编辑；切换整个后台界面语言会重新载入页面，尚未保存的 CMS 编辑不会自动保留。客户填写的询价备注等原始提交数据不进行机器翻译。

## 轮播图片

原四张图片保留不变。含中文字的两张在英文界面使用独立英文版本，其余两张无中文的画面共用：

- `public/carousel-en-brand.png`：1875 × 492。
- `public/carousel-en-search.png`：1875 × 492。

生成方式：内置图像生成/编辑，以原图为参考，保留品牌、实验室器皿、蓝绿配色和询价流程主题，将画面文字改为英文。生成后去除多余背景边缘并按比例放入 1875 × 492 画布，未使用非等比拉伸；最终尺寸及图片本身已检查。

核心编辑要求记录：保留 KASONS 标志及原图主题；品牌图文案为 “KASONS BIOCHEMICALS”, “Exploring Carbohydrates. Endless Synthesis.”, “Research Reagents, Reference Standards & Chemicals”；流程图使用英文检索说明及 “Browse Products → Add to Cart → Send Inquiry → Receive Quote”。

商品图片、文章封面以及富文本内的图片如果自身含中文字，还需在英文编辑面板提供相应英文资源；程序不会自动翻译上传图片中的文字。

## 验证范围

代码交付阶段遵照要求，不执行 build/dev/start，不启动网站或浏览器验收，不提交、不推送。2026-09-08 获得数据库实施授权后，执行了上述字段增量迁移及数据库只读核验。

本地只做 TypeScript 无输出类型检查、Git 差异格式检查，以及图片尺寸/内容检查。实际部署后应人工检查：

- 中英文之间切换产品详情、带关键词/分类的列表，URL 和筛选是否保留。
- 首页两种搜索、资讯分类、询价车及联系表单草稿。
- 后台英文保存/发布、取消英文发布、中文内容不受影响。
- 分别保存首页、关于、联系，其他区域英文内容不被覆盖。
- 手机宽度下导航和语言按钮、英文轮播图、富文本图片与内部链接。
- 匿名 Supabase REST 无法读取原始 `translations`，服务端仍可正常读取。

Postgres 文章保存现在使用事务。Supabase REST 路径先批量 upsert 成功再删除被移除的文章，避免插入失败时先清空列表；多个 REST 请求仍不是跨请求事务，后台并发编辑应协调进行。

数据库安全检查另发现原有 `set_updated_at` 函数未固定 search_path，未在本次增量迁移中修改；参见 [Supabase 检查说明](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)。`quotes` 表的 RLS 无公开策略属于当前服务端专用访问设计，本次没有开放该表。
