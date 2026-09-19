# DDZ 双人斗地主

私人双人斗地主 Web 游戏。

- 前端：Vue 3 + Vite
- 后端：Node.js + Express + Socket.IO
- 部署：Ubuntu 22.04 + PM2 + Nginx + Let's Encrypt
- 玩家：1 名管理员 + 1 名普通玩家

## 已实现

- 双玩家实时连接，第三名玩家拒绝进入
- 54 张牌洗牌后随机移除 9 张，21 / 21 / 3 发牌
- 从 42 张玩家手牌中随机翻牌，翻牌持有者优先叫地主
- 两人都不叫时自动重新发牌
- 最多 4 次抢地主行动；最后成功抢地主者成为地主
- 地主获得 3 张底牌并先出
- 单牌、对子、三张、三带一、三带二、顺子、连对、飞机、飞机带单、飞机带对、炸弹、王炸
- 压牌、不要、回合切换和胜负判断
- 农民特殊胜利：剩余牌数 <= 成功抢地主次数
- 管理员查看普通玩家真实手牌
- 管理员替换普通玩家任意一张牌
- 普通玩家被改牌后收到“你的牌被人拿走了”
- 手机横屏 UI、触摸选牌、选牌上浮
- 服务端按玩家过滤状态，普通玩家不会收到对手真实手牌
- 服务端只按牌 ID 接受出牌，并使用服务端真实手牌重新解析，避免客户端伪造点数

## 本地开发

先创建配置：

```bash
cp .env.example .env
```

编辑：

```env
ADMIN_KEY=your-secret-key
DOMAIN=ddz.example.com
PORT=3000
SSL_EMAIL=you@example.com
```

启动后端：

```bash
cd server
npm install
npm test
npm start
```

另开终端启动前端：

```bash
cd client
npm install
npm run dev
```

Vite 开发服务器会把 `/socket.io` 和 `/health` 转发到本机 3000 端口。

## 访问方式

普通玩家：

```text
https://你的域名/
```

管理员：

```text
https://你的域名/admin?key=管理员密码
```

## Ubuntu 22.04 部署

最低建议配置：

- 1 vCPU
- 1 GB RAM
- 20 GB Disk

先确保域名 A/AAAA 记录指向服务器。

在服务器克隆本仓库后：

```bash
cp .env.example .env
nano .env
sudo bash deploy.sh
```

`deploy.sh` 会自动：

1. 安装 Git、Node.js 20、npm、Nginx、PM2、Certbot、rsync
2. 拉取当前 Git 仓库最新代码
3. 安装前后端依赖
4. 构建 Vue 前端
5. 使用 PM2 启动 Node 服务并设置开机恢复
6. 配置 Nginx SPA 路由
7. 将 `/socket.io/` 反向代理到 Node 服务

首次部署完成并确认 DNS 已生效后：

```bash
sudo bash setup-ssl.sh
```

该脚本使用 Let's Encrypt 配置 HTTPS 和 HTTP -> HTTPS 跳转。

> 本仓库当前是 Private。服务器首次 `git clone` 时需要已经配置 GitHub SSH Key、PAT，或先手动把仓库克隆到服务器。进入已克隆仓库后执行 `sudo bash deploy.sh` 不需要脚本再次认证克隆。

## 部署文件

```text
deploy.sh
setup-ssl.sh

deploy/
├── deploy.sh
├── nginx.conf
└── ssl.sh
```

## 健康检查

```text
GET /health
```

正常返回类似：

```json
{"ok":true,"phase":"waiting"}
```

## 测试和 CI

服务端：

```bash
cd server
npm test
```

GitHub Actions 会在 push / pull request 时运行服务端测试并执行前端构建。
