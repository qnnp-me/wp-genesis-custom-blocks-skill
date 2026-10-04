---
name: wp-genesis-custom-blocks
description: Use when creating, editing, or managing Genesis Custom Blocks (the genesis_custom_block post type) on a WordPress site through wpops — defining block fields and templates as JSON, checking whether the genesis_custom_block REST endpoint is actually reachable with application passwords, the show_in_rest timing gotcha and its PHP fallback, and injecting the blocks into pages. Requires wpops.
license: MIT
---

# Genesis Custom Blocks(GCB)管理

> **⚠️ 注意事项(先读)**
> 1. **站点需已装并启用插件**:[**Genesis Custom Blocks**](https://cn.wordpress.org/plugins/genesis-custom-blocks/)。没装就没有 `genesis_custom_block` 这个 CPT,本 skill 无从下手。
> 2. **依赖 wpops**:所有操作都通过 `wpops` 完成。没有就先 `npm i -g wpops` 并 `wpops setup`(或 `npx wpops`);不要手搓 curl。
> 3. **端点可能打不通**:插件已装也可能因 `'show_in_rest' => current_user_can('edit_posts')` 的时序问题,让应用密码请求返回 `rest_no_route`(404)。此时需在**站点侧**加一段 PHP 强制开放(见 §0),换用户/换命令都没用。

通过 `wpops` 管理 Genesis Custom Blocks(插件 `genesis-custom-blocks`)。**所有操作都走 `wpops`,不要手搓 curl**。

## 前置

- **站点已安装并启用 `genesis-custom-blocks` 插件**:<https://cn.wordpress.org/plugins/genesis-custom-blocks/>(后台「插件 → 安装插件」搜 Genesis Custom Blocks)。检测:`wpops plugins list | grep -i genesis`。
- 需要 `wpops` 与一个已配置站点(`wpops doctor` 通过)。没有就先装 `wpops`。
- GCB 的区块就是 CPT `genesis_custom_block`,所以核心 CRUD 用的是通用的 `wpops content <rest_base>`。

## 0. 先判断「能不能用」(必做第一步)

先确认**插件在不在**(不在就先装,别往下查):

```bash
wpops plugins list | grep -i genesis     # 应看到 genesis-custom-blocks [active]
```

插件已启用后,再判断**路由是否可用**。GCB 注册 CPT 时写死了:

```php
'show_in_rest' => current_user_can( 'edit_posts' ),
```

这行在 `init` 求值,而**应用密码要等 `REST_REQUEST` 定义后才认证(晚于 init)**。后果:

| 会话 | 路由 | 结果 |
|---|---|---|
| 后台登录浏览器的 Cookie 会话 | 注册 | 可用 |
| **应用密码(wpops / curl Basic Auth)** | 不注册 | `rest_no_route`(404) |

探测:

```bash
wpops content list genesis_custom_block        # 直接试
# 或看路由表
wpops raw GET /wp-json/ | grep genesis_custom_block
```

- 能列出 → 可用,进入第 1 步。
- 返回 `404 rest_no_route` → 不可用,按下节兜底(**不要反复重试**,换用户也没用)。

### 兜底:站点侧强制开放(需手动加 PHP)

```php
add_filter( 'register_post_type_args', function ( $args, $post_type ) {
    if ( 'genesis_custom_block' === $post_type ) {
        $args['show_in_rest'] = true;
    }
    return $args;
}, 10, 2 );
```

放进 **mu-plugin**,或 **WPCode 的 PHP 片段**(Location: Run Everywhere)。
这一步 **REST 做不到**(WPCode / Additional CSS 都没有可写路由),必须让用户在后台手动加。加完重跑上面的探测。

## 1. 区块定义存在哪

每个区块是一条 `genesis_custom_block` 文章,**`post_content` 就是一段 JSON**:

```json
{"genesis-custom-blocks/<slug>":{
  "name":"<slug>","title":"显示名","icon":"genesis_custom_blocks",
  "category":{"slug":"text","title":"Text","icon":null},"keywords":[],
  "templateMarkup":"<...>","templateCss":"...",
  "fields":{ "<field>":{"name":"<field>","label":"...","control":"text","type":"string","order":0} }
}}
```

- 文章的 `slug`(`post_name`)必须与 JSON 里的 `name`、以及顶层 key `genesis-custom-blocks/<name>` 一致。
- `control` 取值:`text` `textarea` `url` `email` `number` `color` `image` `select` `multiselect` `toggle` `range` `checkbox` `radio` `inner_blocks` `repeater`。详见 `reference/block-json.md`。

创建(默认草稿;要直接发布加 `--status publish`):

```bash
wpops content create genesis_custom_block --title "项目卡片" --slug project-card --status publish --json
wpops content update genesis_custom_block <id> --from-file block.json --yes
wpops content list genesis_custom_block
```

> 用脚本生成 `block.json`(`JSON.stringify`)最稳,手写转义容易错。

## 2. 模板渲染

- `templateMarkup`:用 `{{field}}` 直出,**没有循环、没有条件**。
- `templateCss`:该区块自带的 CSS,渲染时输出一次(适合放该区块专用的小样式,免动全局 CSS)。
- 字段值经 `wp_kses_post`:允许 `code/a/span/i/...`,`style` 属性允许,**自定义属性(`--dot`)也会保留**。
- 因为无条件下,常见的两个技巧:
  - 空元素隐藏:`.某类:empty{display:none}` / `a[href=""]{display:none}`。
  - 彩色圆点用伪元素 `.tag::before{content:"";background:var(--dot)}`(**不要**用子元素 `<i>`,否则 `:empty` 失效)。

更多:见 `reference/templates.md`。

## 3. 在页面里使用

区块名是 `genesis-custom-blocks/<slug>`,在正文里以**自闭合注释 + JSON 属性**出现:

```
<!-- wp:genesis-custom-blocks/<slug> {"field":"值","field2":"..."} /-->
```

放进带网格/弹性布局的 group 里即成网格:

```
<!-- wp:group {"className":"wp-grid","layout":{"type":"grid","columnCount":2}} -->
<div class="wp-block-group wp-grid">
<!-- wp:genesis-custom-blocks/project-card {"title":"wpops"} /-->
</div>
<!-- /wp:group -->
```

> 带 `layout` 的 group 子元素**不会**被套 inner-container,所以 flex/grid 直接生效。无 `layout` 的 group 才会套一层 inner-container。

字段数据直接写在该注释的 JSON 里(注意 `-->` 不能出现在值里)。

## 4. 验证

```bash
# 抓页面 HTML 看区块是否渲染
curl -s "https://<site>/<slug>" | grep -n "wp-card"
# 或直接在浏览器截图
```

## 常见坑

- `wpops content` 输出 id 末尾可能带 `\r`,拿去拼 URL 前先 `.Trim()`(否则会拼出 `.../<id>\r` → 莫名 404)。
- 改已发布内容会留修订,可回滚:`wpops revisions restore <id> <rev> --type pages`。
- 字段定义**不是** post meta,就是区块文章 `post_content` 里的 JSON——改字段=改那份 JSON。
- `previewAttributes` 可留空;只影响编辑器里的预览,不影响前台。
- GCB 的区块渲染输出会被 `wp_kses_post`,别指望塞 `<script>`/`<iframe>`。

## 相关

- 通用 REST / 任意 CPT 操作、安全流程(doctor / --dry-run):见 `wpops` skill。
- 本 skill 的细节参考:`reference/availability.md`、`reference/block-json.md`、`reference/templates.md`。
