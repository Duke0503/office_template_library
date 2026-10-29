// The single registry of template kinds (AD-3). Every kind-specific value lives here;
// adding a kind such as xlsx means adding one entry, not hunting for branches.

export const TEMPLATE_KINDS = ['docx', 'pptx'] as const;

export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

export interface KindDefinition {
  kind: TemplateKind;
  extension: string;
  mimeType: string;
  /** Content type of the main part in [Content_Types].xml; proves the ZIP is this kind. */
  mainContentType: string;
  /** ONLYOFFICE editor type. */
  documentType: 'word' | 'slide' | 'cell';
  label: string;
  pluralLabel: string;
  /** What one preview image shows. */
  previewUnit: 'page' | 'slide';
  /** CSS aspect-ratio of one page or slide: portrait A4 or 16:9. */
  previewAspect: string;
}

export const KINDS: Record<TemplateKind, KindDefinition> = {
  docx: {
    kind: 'docx',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mainContentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
    documentType: 'word',
    label: 'Document',
    pluralLabel: 'Documents',
    previewUnit: 'page',
    previewAspect: '210 / 297',
  },
  pptx: {
    kind: 'pptx',
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    mainContentType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
    documentType: 'slide',
    label: 'Presentation',
    pluralLabel: 'Presentations',
    previewUnit: 'slide',
    previewAspect: '16 / 9',
  },
};

export function isTemplateKind(value: unknown): value is TemplateKind {
  return typeof value === 'string' && (TEMPLATE_KINDS as readonly string[]).includes(value);
}

export function kindOf(kind: TemplateKind): KindDefinition {
  return KINDS[kind];
}
