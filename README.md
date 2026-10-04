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

**方式 A(推荐,gh 原生):**

```bash
# 装到本机(OpenCode,用户级)。不给 skill 名会先列出仓库里的 skill。
gh skill install qnnp-me/wp-genesis-custom-blocks-skill wp-genesis-custom-blocks --agent opencode --scope user

# 装到当前项目(项目级 .agents/skills)
gh skill install qnnp-me/wp-genesis-custom-blocks-skill --all --agent opencode --scope project
```

> `gh skill` 是 GitHub CLI 的原生 skill 分发(preview),支持 `list / search / update`,并会记录来源以便 `gh skill update`。

**方式 B(npm / git,机器上没有 gh 时):**

```bash
# 从 GitHub 直接装(会跑 postinstall,自动把 skill 铺到 ~/.agents/skills/)
npm i -g github:qnnp-me/wp-genesis-custom-blocks-skill

# 或 clone 后手动装
git clone https://github.com/qnnp-me/wp-genesis-custom-blocks-skill
node wp-genesis-custom-blocks-skill/scripts/cli.mjs install
```

安装后 skill 位于:`~/.agents/skills/wp-genesis-custom-blocks/`(含 `SKILL.md` 与 `reference/`)。

## 开发机 vs 部署机

- **开发机(changing the skill)**:让安装目录**直接指向源码**(junction),改完即时生效,不用反复安装;`gh skill update` 不会拿发布版覆盖你正在改的内容。
  ```powershell
  # 若已是普通目录先删掉
  Remove-Item -Recurse -Force "$HOME\.agents\skills\wp-genesis-custom-blocks"
  cmd /c mklink /J "$HOME\.agents\skills\wp-genesis-custom-blocks" "$HOME\Projects\wp-genesis-custom-blocks-skill\skills\wp-genesis-custom-blocks"
  ```
  > 安装器检测到目标是指向源码的符号链接/junction 会**自动跳过**(不会把源码覆盖自己)。
- **部署机 / 别人的机器(只消费)**:用 `gh skill install`,可 `gh skill update`、可 `--pin` 锁版本(见上)。

## 更新

```bash
gh skill update wp-genesis-custom-blocks                          # gh 原生(推荐)
# 或
npm i -g github:qnnp-me/wp-genesis-custom-blocks-skill
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
