#!/usr/bin/env node
// 手动安装 / 更新 skill:wp-gcb-skill install
import { installSkill, skillTargetDirs, skillSourceDir } from '../lib/install.mjs';

const cmd = process.argv[2] || 'install';

if (cmd === 'install') {
  const dirs = installSkill();
  if (!dirs.length) {
    console.error(
      `未安装任何目录。检查源目录是否存在:${skillSourceDir()}\n` +
        `目标:${skillTargetDirs().join('\n       ')}`
    );
    process.exit(1);
  }
  process.exit(0);
}

if (cmd === 'where') {
  console.log(`源:${skillSourceDir()}`);
  console.log(`目标:\n  ${skillTargetDirs().join('\n  ')}`);
  process.exit(0);
}

console.log('用法: wp-gcb-skill [install|where]');
process.exit(2);
