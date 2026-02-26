#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import {
  readFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  symlinkSync,
} from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");

const SKILLS = {
  "ledsreact-openapi": "Raw REST API interaction for any language",
  "ledsreact-webapp":
    "TypeScript SDK (@ledsreact/sdk) for Next.js web applications",
  "ledsreact-requirements":
    "Translate coach-level intent into Ledsreact-grounded specs",
};

const TARGET_ALIASES = new Map([
  ["claude", ".claude/skills"],
  ["codex", ".codex/skills"],
  ["cursor", ".cursor/skills"],
  ["agents", ".agents/skills"],
]);

function printHelp() {
  console.log(`
ledsreact-skills - Agent skills for building Ledsreact integrations

USAGE:
  ledsreact-skills <command> [options]

COMMANDS:
  list                    List all available skills
  install <skill>         Install a skill to .claude/skills/
  install-all             Install all skills to .claude/skills/
  path <skill>            Print the path to a skill file
  show <skill>            Print a skill's content

OPTIONS:
  --dir <path>            Target directory (default: current directory)
  --target <name|path>    Install target: claude, codex, cursor, agents, or a path
  --link                  Symlink SKILL.md instead of copying
  --help, -h              Show this help message

EXAMPLES:
  ledsreact-skills list
  ledsreact-skills install ledsreact-openapi
  ledsreact-skills install-all
  ledsreact-skills install-all --target codex
  ledsreact-skills install ledsreact-webapp --target cursor
  ledsreact-skills install ledsreact-openapi --target agents --link
  ledsreact-skills show ledsreact-requirements

AVAILABLE SKILLS:
${Object.entries(SKILLS)
  .map(([name, desc]) => `  ${name.padEnd(30)} ${desc}`)
  .join("\n")}
`);
}

function listSkills() {
  console.log("\nAvailable Ledsreact Skills:\n");
  Object.entries(SKILLS).forEach(([name, desc]) => {
    console.log(`  ${name.padEnd(30)} ${desc}`);
  });
  console.log("");
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function resolveTargetSkillsDir(targetDir, target) {
  if (!target) {
    return join(targetDir, ".claude", "skills");
  }

  const alias = TARGET_ALIASES.get(target);
  if (alias) {
    return join(targetDir, alias);
  }

  const resolved = resolve(targetDir, target);
  return resolved.endsWith("skills") ? resolved : join(resolved, "skills");
}

function installSkill(skillName, targetSkillsDir, useSymlink) {
  const skillsPath = join(packageRoot, "skills", skillName, "SKILL.md");

  if (!existsSync(skillsPath)) {
    console.error(`Error: Skill not found: ${skillName}`);
    console.log("Run 'ledsreact-skills list' to see available skills.");
    process.exit(1);
  }

  const targetPath = join(targetSkillsDir, skillName, "SKILL.md");
  const targetSkillDir = dirname(targetPath);

  ensureDir(targetSkillDir);

  if (useSymlink) {
    if (!existsSync(targetPath)) {
      symlinkSync(skillsPath, targetPath);
    }
    console.log(`Linked ${skillName} to ${targetPath}`);
    return;
  }

  copyFileSync(skillsPath, targetPath);
  console.log(`Installed ${skillName} to ${targetPath}`);
}

function installAllSkills(targetSkillsDir, useSymlink) {
  const skillNames = Object.keys(SKILLS);

  console.log(`Installing ${skillNames.length} skills...\n`);

  skillNames.forEach((skillName) => {
    installSkill(skillName, targetSkillsDir, useSymlink);
  });

  console.log(
    `\nDone! Installed ${skillNames.length} skills to ${targetSkillsDir}`,
  );
}

function showSkill(skillName) {
  const skillsPath = join(packageRoot, "skills", skillName, "SKILL.md");

  if (!existsSync(skillsPath)) {
    console.error(`Error: Skill not found: ${skillName}`);
    process.exit(1);
  }

  const content = readFileSync(skillsPath, "utf-8");
  console.log(content);
}

function printSkillPath(skillName) {
  const skillsPath = join(packageRoot, "skills", skillName, "SKILL.md");

  if (!existsSync(skillsPath)) {
    console.error(`Error: Skill not found: ${skillName}`);
    process.exit(1);
  }

  console.log(skillsPath);
}

// Parse arguments
const args = process.argv.slice(2);
let targetDir = process.cwd();
let target = null;
let useSymlink = false;

const dirIndex = args.indexOf("--dir");
if (dirIndex !== -1 && args[dirIndex + 1]) {
  targetDir = resolve(args[dirIndex + 1]);
  args.splice(dirIndex, 2);
}

const targetIndex = args.indexOf("--target");
if (targetIndex !== -1 && args[targetIndex + 1]) {
  target = args[targetIndex + 1];
  args.splice(targetIndex, 2);
}

const linkIndex = args.indexOf("--link");
if (linkIndex !== -1) {
  useSymlink = true;
  args.splice(linkIndex, 1);
}

const command = args[0];
const arg = args[1];
const targetSkillsDir = resolveTargetSkillsDir(targetDir, target);

switch (command) {
  case "list":
    listSkills();
    break;
  case "install":
    if (!arg) {
      console.error("Error: Please specify a skill to install.");
      console.log("Run 'ledsreact-skills list' to see available skills.");
      process.exit(1);
    }
    installSkill(arg, targetSkillsDir, useSymlink);
    break;
  case "install-all":
    installAllSkills(targetSkillsDir, useSymlink);
    break;
  case "show":
    if (!arg) {
      console.error("Error: Please specify a skill to show.");
      process.exit(1);
    }
    showSkill(arg);
    break;
  case "path":
    if (!arg) {
      console.error("Error: Please specify a skill.");
      process.exit(1);
    }
    printSkillPath(arg);
    break;
  case "--help":
  case "-h":
  case "help":
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
