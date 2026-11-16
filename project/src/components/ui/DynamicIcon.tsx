import {
  Gauge,
  Cpu,
  Wifi,
  Factory,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Gauge,
  Cpu,
  Wifi,
  Factory,
  Briefcase,
};

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Gauge;
  return <Icon className={className} />;
}
