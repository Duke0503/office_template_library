import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ORDER = ['system', 'light', 'dark'] as const;
const LABEL = { system: 'Theme: system', light: 'Theme: light', dark: 'Theme: dark' };
const ICON = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };

/** Cycles System → Light → Dark; next-themes remembers the choice (EXPERIENCE.md). */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = (ORDER as readonly string[]).includes(theme ?? '') ? (theme as (typeof ORDER)[number]) : 'system';
  const Icon = ICON[current];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`${LABEL[current]}. Switch to ${next}.`} onClick={() => setTheme(next)}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{LABEL[current]}</TooltipContent>
    </Tooltip>
  );
}
