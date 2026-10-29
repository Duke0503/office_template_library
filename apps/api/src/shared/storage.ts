import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, copyFile, link, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';

// File storage addressed by server-generated keys (AD-9). Two views of one root:
// - FileReader: read-only, handed to code that serves or copies template files (AD-2).
// - FileWriter: create-only. A key is written once and never overwritten.

export interface FileReader {
  open(key: string): Readable;
  sha256(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
  sizeOf(key: string): Promise<number>;
}

export interface FileWriter extends FileReader {
  /** Copies `sourcePath` to a new key. Fails if the key exists. Returns the sha256. */
  putFromFile(sourcePath: string, key: string, options?: { readOnly?: boolean }): Promise<string>;
  /** Copies an existing key to a new key. Fails if the target exists. Returns the sha256. */
  copy(fromKey: string, toKey: string): Promise<string>;
  /** A path for a temporary file inside the storage root, on the same volume as the keys. */
  tempPath(): string;
  /** Moves a temp file to a new key. Fails if the key exists. */
  commitTemp(tempPath: string, key: string): Promise<void>;
  removeTemp(tempPath: string): Promise<void>;
}

export class StorageKeyError extends Error {}

const KEY_PATTERN = /^[a-z0-9][a-z0-9._/-]*$/i;

export function sha256OfStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export function sha256OfFile(filePath: string): Promise<string> {
  return sha256OfStream(createReadStream(filePath));
}

export class LocalFileStorage implements FileWriter {
  private readonly root: string;
  private readonly tmpDir: string;

  constructor(root: string) {
    this.root = path.resolve(root);
    this.tmpDir = path.join(this.root, '.tmp');
  }

  /** Resolves a key under the root; rejects anything that escapes it (AD-9). */
  resolve(key: string): string {
    if (!KEY_PATTERN.test(key) || key.split('/').some((part) => part === '..' || part === '.')) {
      throw new StorageKeyError(`Invalid storage key: ${key}`);
    }
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) {
      throw new StorageKeyError(`Storage key escapes the root: ${key}`);
    }
    return full;
  }

  open(key: string): Readable {
    return createReadStream(this.resolve(key));
  }

  sha256(key: string): Promise<string> {
    return sha256OfFile(this.resolve(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async sizeOf(key: string): Promise<number> {
    return (await stat(this.resolve(key))).size;
  }

  async putFromFile(sourcePath: string, key: string, options: { readOnly?: boolean } = {}) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    // COPYFILE_EXCL: never overwrite an existing key.
    await copyFile(sourcePath, target, 1 /* fs.constants.COPYFILE_EXCL */);
    if (options.readOnly) await chmod(target, 0o444);
    return sha256OfFile(target);
  }

  async copy(fromKey: string, toKey: string) {
    return this.putFromFile(this.resolve(fromKey), toKey);
  }

  tempPath(): string {
    return path.join(this.tmpDir, `${randomUUID()}.part`);
  }

  async commitTemp(tempPath: string, key: string) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    // link() fails when the target exists, so a version file is never overwritten.
    await link(tempPath, target);
    await rm(tempPath, { force: true });
  }

  async removeTemp(tempPath: string) {
    await rm(tempPath, { force: true });
  }

  async init() {
    await mkdir(this.tmpDir, { recursive: true });
  }
}
