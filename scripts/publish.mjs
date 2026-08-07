import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFilesRecursively, readDeployConfig, uploadFileViaFtp } from './ftp-upload.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployConfigPath = path.join(repoRoot, '.vscode', 'sftp.json');
const sourceDir = path.join(repoRoot, 'spa');

function ensureDeployConfig() {
  const deployConfig = readDeployConfig(deployConfigPath);
  if (!deployConfig) {
    throw new Error('No FTP deploy config found. Set uploadHost, username, password, and remotePath in .vscode/sftp.json.');
  }

  if (deployConfig.protocol !== 'ftp') {
    throw new Error(`Unsupported protocol "${deployConfig.protocol}" in deploy config. Only ftp is supported.`);
  }

  return deployConfig;
}

function main() {
  const deployConfig = ensureDeployConfig();

  if (!existsSync(sourceDir)) {
    throw new Error(`Missing publish source directory: ${sourceDir}`);
  }

  const files = collectFilesRecursively(sourceDir);
  if (files.length === 0) {
    console.warn(`No files found in ${sourceDir}.`);
    return;
  }

  if (deployConfig.uploadHost === deployConfig.host) {
    console.warn('Using the public host as the FTP upload host. If Cloudflare is proxying that domain, uploads can fail.');
    console.warn('For the most reliable setup, point "uploadHost" at a DNS-only origin hostname such as ftp.<domain> or origin.<domain>.');
  }

  console.log(`Uploading ${files.length} file(s) from spa/ ...`);
  for (const file of files) {
    uploadFileViaFtp(deployConfig, file.absolutePath, file.relativePath);
  }

  console.log('Publish complete.');
}

main();
