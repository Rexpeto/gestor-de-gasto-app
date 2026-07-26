import type { ComponentType } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  CircleQuestionMark,
  Coffee,
  Dumbbell,
  Ellipsis,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  PawPrint,
  Pill,
  Plane,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from 'lucide-react-native/icons';

const ICON_MAP: Record<string, ComponentType<{ size?: number; color?: string }>> = {
  'arrow-down-left': ArrowDownLeft,
  'arrow-up-right': ArrowUpRight,
  'banknote': Banknote,
  'book-open': BookOpen,
  'briefcase': Briefcase,
  'car': Car,
  'coffee': Coffee,
  'dumbbell': Dumbbell,
  'gamepad-2': Gamepad2,
  'gem': Gem,
  'gift': Gift,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  'circle-question-mark': CircleQuestionMark,
  'help-circle': CircleQuestionMark,
  'home': House,
  'house': House,
  'laptop': Laptop,
  'more-horizontal': Ellipsis,
  'ellipsis': Ellipsis,
  'paw-print': PawPrint,
  'pill': Pill,
  'plane': Plane,
  'shirt': Shirt,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'store': Store,
  'trending-up': TrendingUp,
  'utensils-crossed': UtensilsCrossed,
  'zap': Zap,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export const DEFAULT_ICON = 'circle-question-mark';

interface CategoryIconProps {
  name: string;
  size?: number;
  color?: string;
}

/**
 * Renders a Lucide icon by string name, with a fallback to HelpCircle.
 *
 * Use this wherever you display a category icon:
 *
 * ```tsx
 * <CategoryIcon name={cat.icon} size={18} color={cat.color} />
 * ```
 */
export function CategoryIcon({ name, size = 18, color }: CategoryIconProps) {
  const Icon = ICON_MAP[name] ?? CircleQuestionMark;
  return <Icon size={size} color={color} />;
}
