import type { TemplateKind } from '@otl/shared';
import { FileTextIcon, PresentationIcon, type LucideIcon } from 'lucide-react';

/** Icon per kind; an exhaustive map so a new kind fails to compile until it has one (AD-3). */
export const KIND_ICONS: Record<TemplateKind, LucideIcon> = {
  docx: FileTextIcon,
  pptx: PresentationIcon,
};
