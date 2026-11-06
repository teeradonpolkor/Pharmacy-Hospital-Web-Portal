import React from 'react';
import {
  Boxes,
  Package,
  ClipboardCheck,
  BellRing,
  FileSpreadsheet,
  Stethoscope,
  ShieldAlert,
  Leaf,
  FlaskConical,
  Database,
  Activity,
  FileHeart,
  Pill,
  Syringe,
  HeartPulse,
  FolderKanban,
  BarChart3,
  Bot,
  ExternalLink,
  Layers,
  Sparkles,
  LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Boxes,
  Package,
  ClipboardCheck,
  BellRing,
  FileSpreadsheet,
  Stethoscope,
  ShieldAlert,
  Leaf,
  FlaskConical,
  Database,
  Activity,
  FileHeart,
  Pill,
  Syringe,
  HeartPulse,
  FolderKanban,
  BarChart3,
  Bot,
  Layers,
  Sparkles,
};

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name] || Package;
  return <IconComponent {...props} />;
};

export const AVAILABLE_ICONS = [
  'Package',
  'Boxes',
  'ClipboardCheck',
  'BellRing',
  'FileSpreadsheet',
  'Stethoscope',
  'ShieldAlert',
  'Leaf',
  'FlaskConical',
  'Database',
  'Activity',
  'FileHeart',
  'Pill',
  'Syringe',
  'HeartPulse',
  'FolderKanban',
  'BarChart3',
  'Bot',
];
