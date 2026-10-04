// npm postinstall:把内置 skill 安装到 agent 的发现目录。
// 任何失败都不应中断 npm 安装本身。
import { installSkill } from '../lib/install.mjs';

try {
  const { installed, skipped } = installSkill();
  if (!installed.length && !skipped.length) {
    console.log('wp-genesis-custom-blocks-skill: 未自动安装 skill(可运行 `wp-gcb-skill install`)');
  }
} catch {
  // 静默:postinstall 出错不影响安装
}
