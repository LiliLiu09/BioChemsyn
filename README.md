# BioChemSyn / KASONS

凯森斯生物（KASONS）化学品 B2B 网站。项目包含中英文公开网站、产品与资讯搜索、询价流程、内容管理后台、管理员身份验证和网站浏览量统计。

- 正式网站：`https://biochemsyn.com`
- 后台登录：`https://biochemsyn.com/admin/login`
- GitHub：`https://github.com/LiliLiu09/BioChemsyn`

## 主要功能

### 公开网站

- 中文与英文页面切换，英文路径使用 `/en`
- 产品目录、分类、CAS/货号/名称/同义词搜索
- 产品详情、新闻详情和资讯详情
- 询价车与询价表单
- Resend 询价邮件通知
- 响应式页面和 SEO 元数据

### 管理后台

- 首页、关于我们和联系我们内容管理
- 产品创建、Excel/CSV 批量导入、草稿、批量上架、软删除、恢复、筛选和排序
- 新闻与资讯的中英文内容管理
- 询价状态与销售备注管理
- 管理员数据库账号和加密密码登录
- 今日、近 7 天、近 30 天浏览量及热门页面统计

## 技术栈

- Next.js 15 App Router
- React 19、TypeScript
- Supabase Postgres、Storage、Row Level Security
- Resend 邮件服务
- AWS Lightsail、Nginx、systemd、Let's Encrypt
- Vercel（可选部署环境）

## 项目结构

```text
app/                    Next.js 页面与 API Routes
components/             公共组件和后台组件
data/                   本地 JSON 后备数据
lib/                    CMS、数据库、身份验证、邮件和国际化逻辑
public/                 静态资源
scripts/                数据库和数据迁移脚本
supabase/               数据库结构与迁移 SQL
middleware.ts           中英文路径处理
```

## 环境变量

复制 `.env.example` 为 `.env.local`，并填写真实值。不要把 `.env.local`、数据库密码、Service Role Key 或 Resend API Key 提交到 Git。

```env
NEXT_PUBLIC_SITE_URL=https://biochemsyn.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
SALES_EMAIL=support@biochemsyn.com
RESEND_API_KEY=
MAIL_FROM="凯森斯生物 KASONS <support@biochemsyn.com>"
```

说明：

- `NEXT_PUBLIC_*` 会发送到浏览器，只能放公开配置。
- `SUPABASE_SERVICE_ROLE_KEY`、`DATABASE_URL` 和 `RESEND_API_KEY` 只能用于服务器端。
- `DATABASE_URL` 用于直接访问 Postgres、运行数据库脚本和高效的服务端查询。
- `SUPABASE_SERVICE_ROLE_KEY` 用于 CMS 写入和 Storage 上传。
- Resend 必须先验证 `biochemsyn.com`，才能用 `support@biochemsyn.com` 发信。

## 本地开发

要求：Node.js 20 或更高版本、npm。

```powershell
cd D:\chem-b2b-next
npm install
npm run dev
```

打开：

- 网站：`http://localhost:3000`
- 后台：`http://localhost:3000/admin/login`

常用命令：

```powershell
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本并执行类型检查
npm run start            # 启动已构建的生产版本
npm run db:apply-schema  # 使用 DATABASE_URL 应用 supabase/schema.sql
npm run db:migrate-json  # 将本地 JSON 数据迁移到 Supabase
```

## Supabase 数据库

主要表：

- `products`
- `news_articles`
- `info_articles`
- `site_content`
- `quotes`
- `admin_users`
- `admin_sessions`
- `page_views_daily`

新环境可以在配置好 `DATABASE_URL` 后运行：

```powershell
npm run db:apply-schema
```

现有环境按需要在 Supabase SQL Editor 中执行对应迁移。每个迁移通常只需执行一次：

```text
supabase/product-status-migration.sql
supabase/bilingual-content-migration.sql
supabase/admin-auth-migration.sql
supabase/page-views-migration.sql
```

`schema.sql` 包含完整结构；迁移文件用于升级已经存在的数据库。不要在每次部署时重复运行迁移。

## 管理员账号

网站没有公开管理员注册入口。管理员邮箱和加密密码保存在数据库中，明文密码不会写入代码。

在 Supabase SQL Editor 中创建或修改管理员：

```sql
insert into public.admin_users (email, password_hash)
values (
  'your-admin@example.com',
  extensions.crypt('replace-with-a-strong-password', extensions.gen_salt('bf', 12))
)
on conflict ((lower(email))) do update
set password_hash = excluded.password_hash,
    active = true,
    updated_at = now();
```

修改密码后建议清除该管理员的旧会话：

```sql
delete from public.admin_sessions
where user_id = (
  select id
  from public.admin_users
  where lower(email) = lower('your-admin@example.com')
);
```

未登录访问 `/admin` 或任何后台页面时，会自动跳转到 `/admin/login`。

## 浏览量统计和数据库流量优化

- `PageViewTracker` 只统计允许的公开页面，不统计后台与 API。
- 同一浏览器短时间重复打开同一路径会被去重。
- 数据按澳大利亚珀斯日期和标准化路径聚合到 `page_views_daily`，不保存访客 IP。
- 后台统计页：`/admin/analytics`。
- 公开产品、新闻、资讯和站点内容使用服务端缓存，并在后台保存后按标签失效。
- 列表页只读取需要的字段，详情页按 ID 或 slug 查询，搜索结果数量受限，以减少 Supabase Shared Pooler Egress。

部署浏览量功能前，必须确认已执行：

```text
supabase/page-views-migration.sql
```

## AWS Lightsail 重新部署

服务器项目目录：

```text
/var/www/biochemsyn/BioChemsyn
```

SSH 登录服务器后依次执行：

```bash
cd /var/www/biochemsyn/BioChemsyn

# 必须先检查是否存在服务器本地修改
git status --short

# 只有上一步没有输出时才继续
git pull --ff-only origin main
npm install
npm run build

# 只在构建成功后重启服务
sudo systemctl restart biochemsyn
sudo systemctl status biochemsyn --no-pager

# 验证 Node 服务和公网 HTTPS
curl -I http://127.0.0.1:3000
curl -I https://biochemsyn.com
```

日常重新部署不需要 Reboot 整台 Lightsail。

如果 `biochemsyn.service` 不存在，查找实际服务名：

```bash
sudo systemctl list-units --type=service --all | grep -Ei 'biochem|next|node'
```

查看应用或 Nginx 日志：

```bash
sudo journalctl -u biochemsyn -n 100 --no-pager
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

## 域名和 HTTPS

GoDaddy DNS 推荐配置：

```text
A      @      <Lightsail 静态公网 IP>
CNAME  www    biochemsyn.com
```

Lightsail 必须使用静态 IP，避免实例重启后公网 IP 改变。开放 TCP 端口 `80` 和 `443`。

Nginx 站点配置中的域名应包含：

```nginx
server_name biochemsyn.com www.biochemsyn.com;
```

检查 Nginx 配置后申请或重新安装证书：

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d biochemsyn.com -d www.biochemsyn.com
sudo certbot renew --dry-run
```

如果 Certbot 报 `duplicate listen options`，先检查 `/etc/nginx/sites-enabled/` 中重复的 `listen 443` 或重复启用的站点，修复后再次运行 `sudo nginx -t`，不要反复申请新证书。

## Resend 邮件

要从 `support@biochemsyn.com` 发送询价邮件：

1. 在 Resend 添加并验证 `biochemsyn.com`。
2. 在 GoDaddy 添加 Resend 提供的 DKIM、SPF/MX 和可选 DMARC 记录。
3. Resend 显示域名验证成功后，设置 `RESEND_API_KEY`、`MAIL_FROM` 和 `SALES_EMAIL`。
4. 重启应用服务使环境变量生效。

`onboarding@resend.dev` 只适合测试，通常只能发到 Resend 账号所有者邮箱。

## Git 工作流程

```powershell
git status --short --branch
git switch -c codex/feature-name

# 修改并验证
npm run build

git add <相关文件>
git commit -m "Describe the change"
git push origin HEAD:main
```

提交前请确认没有把 `.env.local`、密钥、临时 Excel、导出文件或无关修改加入提交。不要用 `git reset --hard` 清理包含重要工作的目录。

## 部署检查清单

- `npm run build` 成功。
- 首页、产品、新闻、资讯和搜索页面正常打开。
- `/en` 及英文详情页正常打开。
- 未登录访问后台会跳转到登录页。
- 管理员可以登录、保存内容和上传图片。
- 草稿与已删除产品不会出现在公开网站。
- 询价可以写入数据库并发送通知邮件。
- `/admin/analytics` 可以显示浏览量。
- `https://biochemsyn.com` 证书有效，HTTP 自动跳转 HTTPS。

## 常见问题

### 后台保存失败

检查 `DATABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、数据库迁移以及 Supabase 项目状态。

### 部署后仍显示旧内容

确认服务器已经拉取最新 `main`、构建成功并重启正确的 systemd 服务。后台保存会主动清除相关内容缓存；外部 CDN 或浏览器缓存仍可能需要刷新。

### 图片在本地显示、线上不显示

不要依赖只存在于本机的文件路径。产品和文章图片应使用 `public/` 中已提交的静态文件，或上传到 Supabase Storage 并保存公开 URL。

### Supabase Egress 过高

优先检查列表页是否读取了正文或大字段、是否重复全表读取、是否绕过缓存，以及页面是否在短时间内反复请求。部署当前缓存和定向查询代码后，再观察下一个计费周期的 Shared Pooler Egress。
