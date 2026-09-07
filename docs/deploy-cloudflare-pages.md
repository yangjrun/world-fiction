# 部署到 Cloudflare Pages

这个项目是 Astro 静态站。照片处理在浏览器执行，部署不需要后端、数据库或 R2。
现有 Cloudflare 域名可以直接绑定到 Pages，使用免费套餐即可起步。

## 构建环境

- Node.js：22.21.0，已记录在根目录 `.node-version`。
- pnpm：11.4.0，已记录在 `package.json` 的 `packageManager`。
- `SITE_URL`：最终公开访问的 HTTPS 地址，例如 `https://photo.your-domain.com`。
  使用根域名或子域名均可；不包含页面路径。

## 连接 Git 仓库自动部署

先将项目推送到自己的 GitHub 或 GitLab 仓库。提交 `pnpm-lock.yaml`、
`pnpm-workspace.yaml` 和 `patches/`，确保依赖补丁也能在构建环境中使用。
模型、WASM、`node_modules/` 和 `dist/` 不需要提交。

在 Cloudflare 的 Workers & Pages 中创建 **Pages** 项目，连接仓库，配置：

| 设置 | 值 |
| --- | --- |
| Framework preset | Astro |
| Build command | `pnpm run build:pages` |
| Build output directory | `dist` |
| Root directory | 仓库根目录 |
| 环境变量 `NODE_VERSION` | `22.21.0` |
| 环境变量 `PNPM_VERSION` | `11.4.0` |
| 环境变量 `SITE_URL` | 实际准备绑定的 HTTPS 域名 |

Production 和 Preview 构建均设置 `SITE_URL` 为正式域名，避免预览地址进入
canonical 和站点地图。Pages 会默认阻止其预览部署被搜索引擎索引。

构建会自动完成：

1. 下载缺失的 Face Landmarker 和 U2-Net 模型，校验 SHA-256；已有模型只校验。
2. 从依赖复制需要的 WASM 与模块加载器，清理旧的 ONNX 运行时。
3. 生成静态页面、站点地图和浏览器代码。
4. 检查必需资源、模型校验和、25 MiB 单文件限制及文件数量。

缺失或占位的 `SITE_URL`、损坏的模型、超限文件都会让部署构建失败。
网络错误时构建也会失败，重新部署即可重试下载。

## 从本机直接上传

如果暂时没有远程仓库，可以本机构建，再创建 Pages 的 Direct Upload 项目。
Pages 的 Git 集成和 Direct Upload 项目不能直接互相切换；如果之后希望自动部署，
优先从一开始就使用 Git 集成。

PowerShell：

```powershell
pnpm install --frozen-lockfile
$env:SITE_URL = 'https://photo.your-domain.com'
pnpm run build:pages
```

在 Pages 上传整个 `dist` 文件夹，保留内部目录结构。也可以使用官方 CLI：

```powershell
pnpm dlx wrangler@4 login
pnpm dlx wrangler@4 pages deploy dist --project-name YOUR_PAGES_PROJECT
```

普通的 `pnpm build` 可用于本地检查，未设置 `SITE_URL` 时仍会使用开发占位地址。
用于正式上传时运行 `pnpm run build:pages`，不要上传含占位域名的旧产物。

## 绑定已有域名

构建成功后，在 Pages 项目的 **Custom domains** 中添加准备使用的完整域名。
对于当前 Cloudflare 账户管理的域名，可以按引导创建 DNS 记录并签发 HTTPS 证书。
如同名记录已被其他网站使用，先选择空闲子域名或确认替换对象。
仅在 DNS 页面添加 CNAME 不足以完成 Pages 自定义域名绑定。

绑定的地址须与构建时的 `SITE_URL` 一致；修改后重新构建、部署。
同时使用根域名和 `www` 时，选一个作为正式地址，并将另一个重定向过去。

## 上线检查

- 首页按浏览器语言跳转，多语言页面及嵌套证件规格页可以直接打开和刷新。
- 上传测试照片，完成人脸检测、背景替换和图片下载。
- `/models/u2netp.onnx`、`/models/face_landmarker.task`、`/wasm/ort/` 下的
  `.mjs` 和 `.wasm` 请求成功；照片本身不应发送到服务器。
- `/sitemap-index.xml` 和页面 canonical 使用正式域名。
- WASM 和模型使用同源地址，非指纹 URL 重新验证缓存；带哈希的前端资源长期缓存。

## 官方参考

- [Pages 限制](https://developers.cloudflare.com/pages/platform/limits/)
- [Pages 自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages 缓存与 HTTP 头](https://developers.cloudflare.com/pages/configuration/headers/)
