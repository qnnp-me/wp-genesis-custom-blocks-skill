# AGENTS.md — 在本仓库工作

本仓库的**发布物是一个 agent skill**(`wp-genesis-custom-blocks`),通过 `gh skill` 与 npm 分发。它本身不是应用——在这里干活 = 改这个 **skill 的内容**与**安装器**。
面向使用者的安装说明在 `README.md`;面向 agent 的"怎么用这个 skill"在 `skills/wp-genesis-custom-blocks/SKILL.md`。

## 发布物与结构

- `skills/wp-genesis-custom-blocks/SKILL.md` —— **skill 本体**(会被安装到用户机器)。
  - frontmatter 必须有:`name`(与目录名一致)、`description`(加载判据,写清"何时用")、`license`。
  - skill 名只用小写字母 / 数字 / 连字符。
- `skills/wp-genesis-custom-blocks/reference/*.md` —— skill 的细节参考(随 skill 一起安装)。
- `lib/install.mjs` —— 把 skill 复制到 agent 发现目录;遇到 **symlink/junction 会跳过**(开发机把安装目录指向源码,别覆盖源码)。
- `scripts/cli.mjs`(`wp-gcb-skill install|where`)、`scripts/postinstall.mjs`。
- `README.md` = 使用者向;`AGENTS.md`(本文件)= 贡献者向。

## 开发与验证

```bash
node scripts/cli.mjs where      # 看源目录 / 目标目录
node scripts/cli.mjs install    # 铺到 ~/.agents/skills/(遇 junction 跳过)
gh skill publish --dry-run      # agentskills.io 规范校验(必须无 error)
```

- 开发机推荐把 `~/.agents/skills/wp-genesis-custom-blocks` 做成指向 `skills/wp-genesis-custom-blocks` 的 **junction**,改完即时生效(见 README「开发机 vs 部署机」)。
- 想装到 `~/.agents/skills/` 用 `--agent universal`(或 `--dir "$HOME/.agents/skills"`);`--agent opencode` 是 `~/.config/opencode/skills/`,别搞混。

## 约定

- **只有改动落在 `skills/` 里才会到达用户**;`README.md` / `AGENTS.md` / `lib` / `scripts` 只是仓库自身。
- 不要把与 skill 无关的文件放进 `skills/`(会被安装)。**尤其别在 `skills/<name>/` 里放 `AGENTS.md`** —— 那会随 skill 一起安装,污染 skill。
- `description` 是给 agent 的触发条件:明确、含同义关键词(如 `genesis-custom-blocks`、`GCB`、`自定义区块`)。
- 行尾 LF。

## 发版

1. 改 `skills/` 内容 → `gh skill publish --dry-run` 校验通过。
2. 更新 `package.json` 的 `version`(与 git tag 对应)。
3. `git commit && git push`。
4. `gh skill publish --tag vX.Y.Z`(校验并建 release;会确保仓库有 `agent-skills` topic)。
5. `npm publish`(需 2FA / OTP;新版本可能走 staged)。
6. 保持 **git tag / gh release / npm** 版本一致;`gh skill install qnnp-me/wp-genesis-custom-blocks-skill <skill>` 默认取最新 release。

## 边界(重要)

- **`AGENTS.md` ≠ `SKILL.md`**:前者是"怎么改这个仓库",后者是"怎么用这个 skill(装到别人机器)"。二者不要互相拷贝。
- 本文件不进 npm 包(`files` 白名单未含它),也不参与 `gh skill` 发现;仅在仓库内生效。
