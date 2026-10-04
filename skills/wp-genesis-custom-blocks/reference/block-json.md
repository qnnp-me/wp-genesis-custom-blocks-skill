# 区块定义 JSON(存在 `post_content`)

GCB 的 `Block` 类直接从 `post_content` 反序列化:

```php
$this->name = $post->post_name;
$this->from_json( $post->post_content );   // {"genesis-custom-blocks/<name>": {...}}
```

所以一份区块定义长这样:

```json
{
  "genesis-custom-blocks/project-card": {
    "name": "project-card",
    "title": "项目卡片",
    "excluded": [],
    "icon": "genesis_custom_blocks",
    "category": { "slug": "text", "title": "Text", "icon": null },
    "keywords": ["project", "项目"],
    "displayModal": false,
    "templateMarkup": "<article class=\"wp-card\">…{{title}}…</article>",
    "templateCss": ".wp-tag::before{…}",
    "fields": {
      "title": { "name": "title", "label": "项目名", "control": "text", "type": "string",
                 "location": "editor", "width": "50", "order": 0, "default": "", "placeholder": "", "help": "", "maxlength": "" }
    }
  }
}
```

要点:

- `post_name`(slug)= `name` = 顶层 key 里的 `<name>`,三者必须一致。
- `icon` 用 `genesis_custom_blocks` 即可(也可用 dashicons 名)。
- `category` 用内置分类(`text`/`common`/`widgets`/`embed`/`formatting`/`layout`),或自定义(插件会自动注册分类)。
- `excluded`:数组,列出「不显示该区块」的文章类型。

## field 常用键

| 键 | 说明 |
|---|---|
| `name` | 字段名(模板里 `{{name}}`) |
| `label` | 编辑器里的标签 |
| `control` | 控件类型(见下) |
| `type` | `string` / `number` / `boolean` / `array`(inner_blocks、repeater 常为 string/array) |
| `location` | 一般 `editor` |
| `width` | 编辑器里占宽(百分数字符串,如 `"50"`) |
| `order` | 排序 |
| `default` / `placeholder` / `help` / `maxlength` | 常规 |

## control 取值

`text` `textarea` `url` `email` `file` `number` `color` `image` `inner_blocks` `select` `multiselect` `toggle` `range` `checkbox` `radio`(以及 `repeater`)。

## 模板里的两个限制

- 无**循环**:不能 foreach。要重复项 → 用固定几个字段,或改用 `inner_blocks`(仅一个)。
- 无**条件**:空字段照样输出。用 CSS 的 `:empty` / `[href=""]` 隐藏(见 `templates.md`)。

## 写入命令

```bash
# 建:先建文章拿 id,再写 JSON 正文
wpops content create genesis_custom_block --title "项目卡片" --slug project-card --status publish --json
wpops content update genesis_custom_block <id> --from-file block.json --yes

# 改字段:改 block.json 后重跑 update 即可
# 读:wpops raw GET "/wp-json/wp/v2/genesis_custom_block/<id>?context=edit"
# 删:wpops content delete genesis_custom_block <id> --force
```

> 编辑器的字段是**固定**的;想「动态增删标签/链接」,加更多字段槽(空槽靠 CSS 隐藏)。
