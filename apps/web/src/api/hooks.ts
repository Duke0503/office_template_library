import type {
  CategoryDto,
  DocumentDto,
  EditorConfigResponse,
  ListResponse,
  TemplateDetailDto,
  TemplateKind,
  TemplateSummaryDto,
} from '@otl/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, isNotFound } from './client';

// Server state lives only in these hooks (AD-10).

const retry = (count: number, error: unknown) => !isNotFound(error) && count < 2;

export const keys = {
  templates: (kind: TemplateKind, q: string, category: string) => ['templates', kind, q, category] as const,
  categories: (kind: TemplateKind) => ['categories', kind] as const,
  template: (id: string) => ['template', id] as const,
  documents: ['documents'] as const,
  document: (id: string) => ['document', id] as const,
  editorConfig: (id: string) => ['editor-config', id] as const,
};

export function useTemplates(kind: TemplateKind, q: string, category: string) {
  const params = new URLSearchParams({ kind });
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  return useQuery({
    queryKey: keys.templates(kind, q, category),
    queryFn: () => apiFetch<ListResponse<TemplateSummaryDto>>(`/api/templates?${params}`),
    placeholderData: keepPreviousData,
    retry,
  });
}

export function useCategories(kind: TemplateKind) {
  return useQuery({
    queryKey: keys.categories(kind),
    queryFn: () => apiFetch<ListResponse<CategoryDto>>(`/api/categories?kind=${kind}`),
    retry,
  });
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: keys.template(id ?? ''),
    queryFn: () => apiFetch<TemplateDetailDto>(`/api/templates/${id}`),
    enabled: Boolean(id),
    retry,
  });
}

export function useDocuments(options: { pollUntil?: number } = {}) {
  return useQuery({
    queryKey: keys.documents,
    queryFn: () => apiFetch<ListResponse<DocumentDto>>('/api/documents'),
    // After the editor closes, poll briefly so the saved version shows up (EXPERIENCE.md).
    refetchInterval: () => (options.pollUntil && Date.now() < options.pollUntil ? 3000 : false),
    retry,
  });
}

export function useDocument(id: string) {
  return useQuery({ queryKey: keys.document(id), queryFn: () => apiFetch<DocumentDto>(`/api/documents/${id}`), retry });
}

export function useEditorConfig(id: string) {
  return useQuery({
    queryKey: keys.editorConfig(id),
    queryFn: () => apiFetch<EditorConfigResponse>(`/api/documents/${id}/editor-config`),
    // A config carries the current editor key; never reuse a stale one.
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => apiFetch<DocumentDto>(`/api/templates/${templateId}/documents`, { method: 'POST' }),
    onSuccess: (document) => {
      queryClient.setQueryData(keys.document(document.id), document);
      void queryClient.invalidateQueries({ queryKey: keys.documents });
    },
  });
}
