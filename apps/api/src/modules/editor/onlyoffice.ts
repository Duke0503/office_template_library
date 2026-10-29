import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { kindOf, type EditorConfigResponse } from '@otl/shared';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors.js';
import type { Document } from '../workspace/domain/document.js';

// Anti-corruption layer over ONLYOFFICE Document Server (D1, AD-7). ONLYOFFICE terms
// (callback status codes, JWT shapes, its URLs) stay in this module.

export interface OnlyofficeSettings {
  jwtSecret: string;
  appSecret: string;
  publicDocServerUrl: string;
  internalDocServerUrl: string;
  appInternalUrl: string;
}

export class InvalidFileTokenError extends AppError {
  constructor() {
    super('INVALID_FILE_TOKEN', 'The file link is invalid or expired.', 403);
  }
}

export class InvalidEditorTokenError extends AppError {
  constructor() {
    super('INVALID_EDITOR_TOKEN', 'The editor request is not signed by Document Server.', 403);
  }
}

/** The callback fields this app relies on. */
export interface CallbackClaims {
  key: string;
  status: number;
  url?: string;
}

/** Callback statuses (https://api.onlyoffice.com/docs/docs-api/usage-api/callback-handler/). */
export const CallbackStatus = {
  Editing: 1,
  ReadyForSaving: 2,
  SavingError: 3,
  ClosedWithoutChanges: 4,
  ForceSave: 6,
  ForceSaveError: 7,
} as const;

const FILE_TOKEN_TTL = '10m';

export class OnlyofficeGateway {
  constructor(private readonly settings: OnlyofficeSettings) {}

  /** Signed URL Document Server uses to fetch one document version (AD-7). */
  fileUrl(document: Document): string {
    const token = jwt.sign({ documentId: document.id, version: document.version }, this.settings.appSecret, {
      expiresIn: FILE_TOKEN_TTL,
      audience: 'documentserver-file',
    });
    return `${this.settings.appInternalUrl}/api/files/documents/${document.id}/versions/${document.version}?token=${encodeURIComponent(token)}`;
  }

  verifyFileToken(token: unknown, documentId: string, version: number): void {
    if (typeof token !== 'string') throw new InvalidFileTokenError();
    try {
      const claims = jwt.verify(token, this.settings.appSecret, { audience: 'documentserver-file' }) as {
        documentId: string;
        version: number;
      };
      if (claims.documentId !== documentId || claims.version !== version) throw new InvalidFileTokenError();
    } catch {
      throw new InvalidFileTokenError();
    }
  }

  editorConfig(document: Document): EditorConfigResponse {
    const kind = kindOf(document.kind);
    const config: Record<string, unknown> = {
      document: {
        fileType: kind.extension,
        key: document.editorKey,
        title: `${document.title}.${kind.extension}`,
        url: this.fileUrl(document),
        permissions: { edit: true, download: true, print: true, comment: true },
      },
      documentType: kind.documentType,
      editorConfig: {
        mode: 'edit',
        lang: 'en',
        callbackUrl: `${this.settings.appInternalUrl}/api/editor/callback/${document.id}`,
        user: { id: 'local-user', name: 'You' },
        customization: { forcesave: false, autosave: true, compactHeader: true, hideRightMenu: false },
      },
      type: 'desktop',
      width: '100%',
      height: '100%',
    };
    config.token = jwt.sign(config, this.settings.jwtSecret, { algorithm: 'HS256' });
    return { documentServerUrl: this.settings.publicDocServerUrl, config };
  }

  /**
   * Verifies a callback (AD-7). Document Server signs it in the Authorization header (claims
   * wrapped in `payload`) or in a body `token`. Only verified claims are trusted.
   */
  verifyCallback(authorization: string | undefined, body: unknown): CallbackClaims {
    const bodyToken = typeof body === 'object' && body !== null ? (body as { token?: unknown }).token : undefined;
    const headerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const token = headerToken ?? (typeof bodyToken === 'string' ? bodyToken : undefined);
    if (!token) throw new InvalidEditorTokenError();

    let claims: Record<string, unknown>;
    try {
      claims = jwt.verify(token, this.settings.jwtSecret, { algorithms: ['HS256'] }) as Record<string, unknown>;
    } catch {
      throw new InvalidEditorTokenError();
    }
    const data = (headerToken && typeof claims.payload === 'object' ? claims.payload : claims) as Record<string, unknown>;
    if (typeof data.key !== 'string' || typeof data.status !== 'number') throw new InvalidEditorTokenError();
    return { key: data.key, status: data.status, url: typeof data.url === 'string' ? data.url : undefined };
  }

  /**
   * Downloads an edited file. The URL comes from Document Server and may name the host the
   * browser uses, so its origin is replaced with the internal one and no other host is fetched.
   */
  async downloadEditedFile(url: string, targetPath: string): Promise<void> {
    const source = new URL(url);
    const internal = new URL(this.settings.internalDocServerUrl);
    const target = new URL(source.pathname + source.search, internal);
    if (target.origin !== internal.origin) throw new Error('Refusing to fetch outside Document Server.');

    const response = await fetch(target, { redirect: 'error' });
    if (!response.ok || !response.body) throw new Error(`Document Server returned ${response.status} for the edited file.`);
    await pipeline(Readable.fromWeb(response.body as import('node:stream/web').ReadableStream), createWriteStream(targetPath));
  }

  async isReachable(): Promise<boolean> {
    try {
      const response = await fetch(new URL('/healthcheck', this.settings.internalDocServerUrl), {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
