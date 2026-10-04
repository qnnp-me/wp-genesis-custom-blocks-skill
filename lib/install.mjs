// 把内置 skill 目录整体复制到 agent 的发现目录。
// best-effort:任何失败都不应中断安装。
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** skill 的 id(也是安装后的目录名)。 */
export const SKILL_ID = 'wp-genesis-custom-blocks';

/** 包内 skill 源目录。 */
export function skillSourceDir() {
  return join(pkgRoot, 'skills', SKILL_ID);
}

/** skill 要安装到的目录列表(可用环境变量覆盖)。 */
export function skillTargetDirs() {
  const dirs = [];
  // 显式指定「skills 根目录」时,追加 <root>/<id>
  if (process.env.AGENT_SKILL_DIR) {
    dirs.push(resolve(process.env.AGENT_SKILL_DIR, SKILL_ID));
  }
  // 显式指定「这个 skill 的最终目录」
  if (process.env.WP_GCB_SKILL_DIR) {
    dirs.push(resolve(process.env.WP_GCB_SKILL_DIR));
  }
  // 默认:agent 的发现目录
  dirs.push(join(homedir(), '.agents', 'skills', SKILL_ID));
  return dirs;
}

/** 复制 skill 到目标目录,返回成功写入的目录列表。 */
export function installSkill({ quiet = false } = {}) {
  if (process.env.WP_GCB_SKIP_SKILL) return [];

  const src = skillSourceDir();
  if (!existsSync(src)) return [];

  const installed = [];
  for (const dir of skillTargetDirs()) {
    try {
      mkdirSync(dir, { recursive: true });
      for (const entry of readdirSync(src)) {
        cpSync(join(src, entry), join(dir, entry), { recursive: true });
      }
      installed.push(dir);
    } catch {
      // 忽略:安装脚本不应因写 skill 失败而中断
    }
  }

  if (!quiet) {
    for (const dir of installed) {
      console.log(`${SKILL_ID}: skill 已安装到 ${dir}`);
    }
  }

  return installed;
}
