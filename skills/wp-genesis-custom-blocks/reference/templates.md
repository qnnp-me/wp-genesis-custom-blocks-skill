# 模板与样式

## 渲染器做了什么

`TemplateEditor::render_markup()`:

```php
preg_replace_callback( '#{{(\S+?)}}#', fn($m) => block_field($m[1]), $markup );
echo wp_kses_post( $rendered );
```

而 `block_field()` 本身对每个值也过一次 `wp_kses_post`。所以:

- `{{field}}` 的**值**由 `block_field` 输出,经过 `wp_kses_post`——HTML 标签(`code/a/span/i/strong/em/br/img/…`)与 `style` 属性**都被保留**,`<script>/<iframe>` 等被过滤。
- **自定义 CSS 属性(`--dot:#f00`)也保留**(已实测:`wp_kses_post` 不会剥掉 `--dot`)。

## templateCss

- 该区块自带的 CSS,渲染时以 `<style>` 输出一次(同名区块只输出一次)。
- 适合放「该区块专用」的小样式,避免去改全局/额外 CSS。

## 无条件下 → 用 CSS 隐藏空槽

模板不能写 if,所以用 CSS 选择器「藏」掉空字段:

```css
/* 空标签(内容为空)隐藏 */
.tag:empty { display: none; }

/* 空链接(地址为空 或 文字为空)隐藏 */
.links a[href=""] { display: none; }
.links a:empty { display: none; }
```

### 彩色圆点要用伪元素

```css
.tag::before { content:""; width:7px; height:7px; border-radius:50%; flex:none; background: var(--dot, #cbd5e1); }
```

模板:

```html
<span class="tag" style="--dot:{{tag1_color}}">{{tag1}}</span>
```

原因:如果圆点用子元素 `<i style="background:…">`,那么标签永远「非空」,`:empty` 就失效了。伪元素不算内容,所以 `:empty` 仍可命中。

## 一个完整例子(项目卡片)

`templateMarkup`:

```html
<article class="wp-card">
  <div class="wp-card-head">
    <span class="wp-card-avatar" style="background:{{avatar_bg}}">{{avatar}}</span>
    <span class="wp-card-titles">
      <span class="wp-card-title">{{title}}</span>
      <span class="wp-card-kind">{{kind}}</span>
    </span>
  </div>
  <p class="wp-card-desc">{{desc}}</p>
  <p class="wp-card-tags">
    <span class="wp-tag" style="--dot:{{tag1_color}}">{{tag1}}</span>
    <span class="wp-tag" style="--dot:{{tag2_color}}">{{tag2}}</span>
    <span class="wp-tag" style="--dot:{{tag3_color}}">{{tag3}}</span>
  </p>
  <p class="wp-card-links">
    <a class="wp-link-primary" href="{{link1_url}}">{{link1_text}}</a>
    <a href="{{link2_url}}">{{link2_text}}</a>
    <a href="{{link3_url}}">{{link3_text}}</a>
  </p>
</article>
```

`templateCss`:

```css
.wp-tag::before{content:"";width:7px;height:7px;border-radius:50%;flex:none;background:var(--dot,#cbd5e1);}
.wp-tag:empty{display:none;}
.wp-card-links a[href=""]{display:none;}
.wp-card-links a:empty{display:none;}
```

页面里的实例:

```
<!-- wp:genesis-custom-blocks/project-card {"avatar":"wp","avatar_bg":"linear-gradient(135deg,#6366f1,#4338ca)","title":"wpops","kind":"WordPress REST CLI","desc":"…(<code>--dry-run</code>)…","tag1":"JavaScript","tag1_color":"#f7df1e","tag2":"CLI","tag2_color":"#10b981","tag3":"WordPress","tag3_color":"#21759b","link1_text":"GitHub","link1_url":"https://github.com/qnnp-me/wpops","link2_text":"npm","link2_url":"https://www.npmjs.com/package/wpops","link3_text":"","link3_url":""} /-->
```

## 注意

- 模板/属性里**不要出现 `-->`**(会提前结束 HTML 注释)。
- 值里的双引号在 JSON 中要转义;建议用脚本 `JSON.stringify` 生成,别手拼。
- 字段值如果是 HTML(如 `<code>`),编辑器里的控件只是纯文本输入,但保存后前台会按 HTML 渲染(kses 放行)。
