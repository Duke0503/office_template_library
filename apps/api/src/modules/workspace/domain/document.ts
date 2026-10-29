import { kindOf, type TemplateKind } from '@otl/shared';
import { AppError, NotFoundError } from '../../../shared/errors.js';

export interface TemplateOrigin {
  templateId: string;
  revision: number;
  templateName: string;
}

export interface Document {
  id: string;
  kind: TemplateKind;
  title: string;
  origin: TemplateOrigin;
  version: number;
  storageKey: string;
  editorKey: string;
  createdAt: string;
  updatedAt: string;
}

/** Every version gets its own file and its own editor key (AD-6). */
export const versionKey = (documentId: string, version: number, kind: TemplateKind) =>
  `documents/${documentId}/v${version}.${kindOf(kind).extension}`;

export const editorKeyFor = (documentId: string, version: number) => `${documentId}-v${version}`;

export class DocumentNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('DOCUMENT_NOT_FOUND', `No document with id ${id}.`);
  }
}

export class CopyVerificationError extends AppError {
  constructor() {
    super('COPY_VERIFICATION_FAILED', 'The copied file does not match the template revision.', 500);
  }
}
