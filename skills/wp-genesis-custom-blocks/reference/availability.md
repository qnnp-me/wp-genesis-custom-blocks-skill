# 可用性:为什么 GCB 的端点常常打不通

## 第 0 步:插件装了没

```bash
wpops plugins list | grep -i genesis
```

- 列表里**没有** `genesis-custom-blocks` → 插件未装/未启用。先安装并启用:
  <https://cn.wordpress.org/plugins/genesis-custom-blocks/>(后台「插件 → 安装插件」搜 Genesis Custom Blocks)。没插件时 `genesis_custom_block` 根本不存在。
- 有且 `[active]` → 进入下面的「路由打不通」排查。

## 两种「不可用」要分清

| 现象 | 原因 | 处理 |
|---|---|---|
| 插件列表里没有 / 未启用 | 插件未装或未启用 | 安装并启用插件 |
| 插件已启用,但 `wpops content list genesis_custom_block` → `404 rest_no_route` | `init` 时序导致 `show_in_rest` 为 false(见下「根因」) | 加 PHP 强制开放(见「兜底:强制开放 REST」) |

## 根因

插件 `genesis-custom-blocks`,文件 `php/PostTypes/BlockPost.php`:

```php
'show_in_rest'  => current_user_can( 'edit_posts' ),
```

CPT 在 `init` 注册,而:

- **Cookie 会话**(后台已登录):`init` 时用户已就位 → `show_in_rest = true` → 路由存在。
- **应用密码**(wpops / curl Basic Auth):应用密码认证要求 `REST_REQUEST` 常量已定义,而它在 `parse_request` 阶段(晚于 `init`)才定义 → `init` 时 `current_user_can` 为 `false` → CPT 以「不开放 REST」注册 → 路由**根本不存在** → `rest_no_route`(404)。

**换用户/换角色无效**(哪怕 administrator),因为问题不是权限,是注册时序。

## 判定命令

```bash
wpops raw GET /wp-json/wp/v2/genesis_custom_block       # 404 => 不可用
wpops content list genesis_custom_block                 # 404 => 不可用
wpops raw GET /wp-json/ | grep genesis_custom_block     # 路由表里没有 => 不可用
wpops raw GET "/wp-json/wp/v2/types?context=edit" | grep genesis   # 类型表里没有 => 不可用(佐证)
```

对照(证明 wpops/凭据没问题):

```bash
wpops content list blocks           # 核心可复用区块,应能列出
wpops raw GET "/wp-json/genesis-custom-blocks/template-file?blockName=x"  # 插件自身路由,应返回
```

## 兜底:强制开放 REST

```php
add_filter( 'register_post_type_args', function ( $args, $post_type ) {
    if ( 'genesis_custom_block' === $post_type ) {
        $args['show_in_rest'] = true;
    }
    return $args;
}, 10, 2 );
```

- 位置:**mu-plugin**(推荐,永不被主题/插件更新覆盖)或 **WPCode 的 PHP 片段**。
- **REST 无法自动添加**——WPCode 与「额外 CSS」都没有可写路由,这一步必须用户在后台手动完成。
- 加完重跑判定命令,应能 200 / 列出。
- 副作用:`show_in_rest => true` 会让该 CPT 在 REST 里可读(view 上下文),一般无碍。

## 经验

- 出现 `rest_no_route` 而不是 `rest_forbidden`:说明是「路由没注册」,优先怀疑这类 `init` 时序/条件注册。
- 用户说「我这边能用」时,先问清是 Cookie 会话还是应用密码——两者行为可能完全不同。
