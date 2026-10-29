import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bath,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleQuestionMark,
  Clock,
  Cookie,
  Droplet,
  ExternalLink,
  FileText,
  Grid2x2,
  Hammer,
  HeartHandshake,
  House,
  Info,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Minus,
  PaintRoller,
  Phone,
  Plus,
  ReceiptText,
  Scale,
  Search,
  ShieldCheck,
  Shovel,
  Sparkles,
  TreeDeciduous,
  TriangleAlert,
  Truck,
  UserRound,
  Users,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cx } from "./cx";

/**
 * Icon keys. The first group matches `Category.icon` in the catalogue (lib/catalog/seed.ts);
 * the rest are UI icons.
 */
const ICONS = {
  // Category icons (catalogue keys)
  sparkles: Sparkles,
  truck: Truck,
  window: Grid2x2,
  tree: TreeDeciduous,
  wifi: Wifi,
  heart: HeartHandshake,
  paint: PaintRoller,
  bath: Bath,
  hammer: Hammer,
  zap: Zap,
  droplet: Droplet,
  house: House,
  shovel: Shovel,
  // UI icons
  phone: Phone,
  mail: Mail,
  menu: Menu,
  close: X,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  check: Check,
  "check-circle": CircleCheck,
  info: Info,
  warning: TriangleAlert,
  alert: CircleAlert,
  shield: ShieldCheck,
  "badge-check": BadgeCheck,
  external: ExternalLink,
  "map-pin": MapPin,
  calendar: Calendar,
  clock: Clock,
  minus: Minus,
  plus: Plus,
  user: UserRound,
  users: Users,
  help: CircleQuestionMark,
  lock: LockKeyhole,
  file: FileText,
  receipt: ReceiptText,
  scale: Scale,
  search: Search,
  cookie: Cookie,
  browser: AppWindow,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const iconNames = Object.keys(ICONS) as IconName[];

export function isIconName(name: string): name is IconName {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}

export interface IconProps {
  /** Icon key (see `IconName`). Unknown keys (e.g. a new catalogue icon) fall back to a "?" icon. */
  name: IconName | (string & {});
  /** Pixel size or CSS length. Default "1.25em" so it scales with the text. */
  size?: number | string;
  /** Accessible label. Without it the icon is decorative (`aria-hidden`). */
  label?: string;
  className?: string;
  strokeWidth?: number;
}

/** Lucide icon by key. Decorative unless `label` is given. Works in server and client components. */
export function Icon({ name, size = "1.25em", label, className, strokeWidth = 2 }: IconProps) {
  const Component: LucideIcon = isIconName(name) ? ICONS[name] : CircleQuestionMark;
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true, focusable: false } as const);
  return (
    <Component
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={cx("inline-block shrink-0", className)}
      {...a11y}
    />
  );
}
