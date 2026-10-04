# wp-genesis-custom-blocks-skill

一个 agent **skill**:通过 [wpops](https://github.com/qnnp-me/wpops) 管理 WordPress 的 **Genesis Custom Blocks**(区块定义即 `genesis_custom_block` 文章的 JSON 正文)。

它解决的几个「只有踩过才知道」的问题:

- **可用性判断**:GCB 的 CPT 在 `init` 用 `current_user_can('edit_posts')` 决定是否 `show_in_rest`,导致**应用密码请求永远 404**;skill 教你如何探测、如何用 PHP 兜底。
- **区块 JSON 结构**:`fields` / `templateMarkup` / `templateCss` 的写法与限制(无循环、无条件下)。
- **空槽隐藏技巧**:用 `:empty` / `[href=""]` + `::before` 圆点,绕开「模板不能写条件」。
- **完整工作流**:建区块 → 写 JSON → 在页面里以区块注释注入 → 验证。

## 前置

- 已安装 **wpops**(`npm i -g wpops`,或用 `npx wpops`),并已 `wpops setup` 配好站点。
- 站点已安装并启用 **Genesis Custom Blocks** 插件:<https://cn.wordpress.org/plugins/genesis-custom-blocks/>(检测:`wpops plugins list | grep -i genesis`)。

## 安装

任选一种:

```bash
# A. 从 GitHub 直接装(会跑 postinstall,自动把 skill 铺到 ~/.agents/skills/)
npm i -g github:qnnp-me/wp-genesis-custom-blocks-skill

# B. clone 后手动装
git clone https://github.com/qnnp-me/wp-genesis-custom-blocks-skill
node wp-genesis-custom-blocks-skill/scripts/cli.mjs install

# C. 如果它已发布到 npm(可选)
npm i -g wp-genesis-custom-blocks-skill
```

安装后 skill 位于:`~/.agents/skills/wp-genesis-custom-blocks/`(含 `SKILL.md` 与 `reference/`)。

## 更新

```bash
npm i -g github:qnnp-me/wp-genesis-custom-blocks-skill   # 重新拉取
# 或本地改动后:
node scripts/cli.mjs install
```

## 目录

```
lib/install.mjs                        # 复制 skill 到发现目录(递归整目录)
scripts/postinstall.mjs                # npm postinstall
scripts/cli.mjs                        # wp-gcb-skill install|where
skills/wp-genesis-custom-blocks/
  ├─ SKILL.md
  └─ reference/
     ├─ availability.md                # 端点可用性 / show_in_rest 时序 / PHP 兜底
     ├─ block-json.md                  # 区块定义 JSON 结构与 control 清单
     └─ templates.md                   # 模板/样式、kses、空槽技巧、完整示例
```

## 环境变量

| 变量 | 作用 |
|---|---|
| `AGENT_SKILL_DIR` | skills 根目录;skill 装到 `<该目录>/wp-genesis-custom-blocks` |
| `WP_GCB_SKILL_DIR` | 直接指定这个 skill 的目标目录 |
| `WP_GCB_SKIP_SKILL` | 设为任意值则跳过自动安装 |

## 卸载

删除 `~/.agents/skills/wp-genesis-custom-blocks/` 即可。

## License

MIT
