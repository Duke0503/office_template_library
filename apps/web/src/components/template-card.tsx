import { kindOf, type TemplateSummaryDto } from '@otl/shared';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { countLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

/** A template thumbnail letterboxed to its kind's aspect on the backdrop tone (DESIGN.md). */
export function Thumbnail({ src, kind, className }: { src: string; kind: TemplateSummaryDto['kind']; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn('relative flex items-center justify-center bg-thumbnail-backdrop p-4', className)}>
      <div className="relative w-full" style={{ aspectRatio: kindOf(kind).previewAspect }}>
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn('size-full object-contain shadow-sm transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
        />
      </div>
    </div>
  );
}

export function TemplateCard({ template, onOpen }: { template: TemplateSummaryDto; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${template.name}, ${template.category.name}, ${countLabel(template.kind, template.previewCount)}`}
      className="group flex flex-col overflow-hidden rounded-[10px] border bg-card text-left transition-shadow hover:shadow-md focus-visible:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      data-testid="template-card"
    >
      <Thumbnail src={template.thumbnailUrl} kind={template.kind} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col gap-2 border-t p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] leading-tight font-semibold">{template.name}</h3>
          <Badge variant="secondary" className="shrink-0">
            {template.category.name}
          </Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        <p className="mt-auto text-xs text-muted-foreground">{countLabel(template.kind, template.previewCount)}</p>
      </div>
    </button>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
