# DDZ 双人斗地主

私人双人斗地主 Web 游戏。

- 前端：Vue 3 + Vite
- 后端：Node.js + Express + Socket.IO
- 部署：Ubuntu 22.04 + PM2 + Nginx + Let's Encrypt
- 玩家：1 名管理员 + 1 名普通玩家
- 赛制：每场 8 局

## 已实现

- 双玩家实时连接，第三名玩家拒绝进入
- 54 张牌洗牌后随机移除 9 张，21 / 21 / 3 发牌
- 从 42 张玩家手牌中随机翻牌，翻牌持有者优先叫地主
- 两人都不叫时自动重新发牌
- 最多 4 次抢地主行动；最后成功抢地主者成为地主
- 地主获得 3 张底牌
- 地主、农民分别拥有一次“加倍 / 不加倍”选择
- 每次成功抢地主：当前倍数 ×2
- 每次炸弹或王炸：当前倍数 ×2
- 地主加倍：×2；农民加倍：×2
- 单局得分 = 底分 1 × 最终倍数；胜者加分、败者扣同分
- 8 局累计记分；第 8 局结算后整场自动结束
- 单牌、对子、三张、三带一、三带二、顺子、连对、飞机、飞机带单、飞机带对、炸弹、王炸
- 压牌、不要、回合切换和胜负判断
- 农民特殊胜利：剩余牌数 <= 成功抢地主次数
- 手机横屏 UI、单点多选以及横向拖动选牌
- 拖过含重复点数的连续范围时自动抽取顺子，例如 AAKKQJJJ1099887 可自动提起 AKQJ10987
- 管理员查看、替换普通玩家真实手牌
- 普通玩家被改牌后收到“你的牌被人拿走了”
- 管理员可随时直接修改双方累计记分
- 管理员可单方面强制结算当前局、开始下一局、直接结束整场，或指定本局赢家并立即结束整场
- 管理员可清空比分并开启新的 8 局赛
- 服务端按玩家过滤状态，普通玩家不会收到对手真实手牌
- 服务端只按牌 ID 接受出牌，并使用服务端真实手牌重新解析

## 本地开发

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

## 访问

普通玩家：

```text
https://你的域名/
```

管理员：

```text
https://你的域名/admin?key=管理员密码
```

## Ubuntu 一键部署（公开仓库）

仓库设为 Public 后，全新的 Ubuntu 22.04 服务器只需要执行：

```bash
curl -fsSL https://raw.githubusercontent.com/Hiccuppp/ddz/main/install.sh | sudo bash
```

脚本会依次询问：

- 游戏域名
- 管理员密码
- Let's Encrypt 邮箱（可选）
- 是否立即开启 HTTPS

然后自动完成：

- clone 最新代码
- 安装 Node.js 20 / npm / Git / Nginx / PM2 / Certbot
- 安装前后端依赖
- 运行服务端测试和构建前端
- 启动 Node.js 服务
- 配置 PM2 开机启动
- 配置 Nginx 和 Socket.IO WebSocket 反向代理
- 可选自动申请 Let's Encrypt HTTPS

也可以完全非交互部署：

```bash
curl -fsSL https://raw.githubusercontent.com/Hiccuppp/ddz/main/install.sh | \
  sudo env DOMAIN=ddz.example.com ADMIN_KEY='your-password' SSL_EMAIL='you@example.com' ENABLE_SSL=Y bash
```

## Ubuntu 22.04 部署

服务器克隆仓库后：

```bash
cp .env.example .env
nano .env
sudo bash deploy.sh
```

DNS 指向服务器后开启 HTTPS：

```bash
sudo bash setup-ssl.sh
```

`deploy.sh` 自动安装 Node.js 20、npm、Git、Nginx、PM2、Certbot，安装依赖、构建前端、启动后端并配置 WebSocket 反向代理和开机恢复。

> 仓库为 Private，服务器首次 clone 需要配置 GitHub SSH Key、PAT，或先手动完成 clone。

## 测试和 CI

```bash
cd server
npm test
```

GitHub Actions 在 push / pull request 时运行服务端测试并执行前端 production build。
