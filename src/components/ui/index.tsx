/**
 * Bazowe komponenty UI Kidelo. Wszystko mobile-first, NativeWind.
 */

import React from 'react';
import { Pressable, Text, View, type PressableProps, type ViewProps } from 'react-native';

import { Icon, type IconName } from './Icon';
import { colors } from '@/theme/tokens';

export { Icon, type IconName } from './Icon';
export { LanguageSwitcher } from './LanguageSwitcher';

// ============ BUTTON ============

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: 'primary' | 'light' | 'ghost';
  full?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children: string;
}

export function Button({
  variant = 'primary',
  full,
  icon,
  iconRight,
  children,
  ...rest
}: ButtonProps) {
  const base = 'flex-row items-center justify-center gap-2 px-5 py-3.5 rounded-card';
  const variants = {
    primary: 'bg-evergreen active:bg-evergreen-dark',
    light: 'bg-surface border border-line active:bg-line/40',
    ghost: 'active:bg-line/40',
  };
  const textColors = {
    primary: 'text-cream',
    light: 'text-ink',
    ghost: 'text-ink',
  };
  const iconColor = variant === 'primary' ? colors.cream.DEFAULT : colors.ink.DEFAULT;

  return (
    <Pressable className={`${base} ${variants[variant]} ${full ? 'w-full' : ''}`} {...rest}>
      {icon && <Icon name={icon} size={18} color={iconColor} />}
      <Text className={`${textColors[variant]} font-sans-medium text-[15px]`}>{children}</Text>
      {iconRight && <Icon name={iconRight} size={18} color={iconColor} />}
    </Pressable>
  );
}

// ============ CARD ============

interface CardProps extends ViewProps {
  tint?: 'sand' | 'sage' | 'clay';
  onPress?: () => void;
}

export function Card({ tint, onPress, children, className, ...rest }: CardProps) {
  const tintBg = {
    sand: 'bg-blush-soft',
    sage: 'bg-sage-soft',
    clay: 'bg-terracotta-soft',
  };
  const base = `bg-surface border border-line rounded-card p-4 ${tint ? tintBg[tint] : ''}`;
  const combined = `${base} ${className ?? ''}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${combined} active:opacity-80`}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={combined} {...rest}>
      {children}
    </View>
  );
}

// ============ KICKER (etykietka nad nagłówkiem) ============

export function Kicker({ children }: { children: string }) {
  return (
    <Text className="text-sage uppercase tracking-wider text-[11px] font-sans-medium">{children}</Text>
  );
}

// ============ PILL (badge ze statusem) ============

export type PillTone = 'sage' | 'clay' | 'evergreen' | 'mustard' | 'neutral' | 'sand';

const pillTones: Record<PillTone, string> = {
  sage: 'bg-sage-soft text-evergreen',
  clay: 'bg-terracotta-soft text-terracotta-dark',
  evergreen: 'bg-evergreen text-cream',
  mustard: 'bg-mustard-soft text-terracotta-dark',
  neutral: 'bg-line text-ink-soft',
  sand: 'bg-blush-soft text-terracotta-dark',
};

export function Pill({ children, tone = 'sage' }: { children: string; tone?: PillTone }) {
  return (
    <View className={`self-start px-2.5 py-1 rounded-full ${pillTones[tone].split(' ')[0]}`}>
      <Text className={`text-[11px] font-sans-medium ${pillTones[tone].split(' ')[1]}`}>
        {children}
      </Text>
    </View>
  );
}

// ============ CHIP (filter pill) ============

interface ChipProps {
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  size?: 'sm' | 'md';
  children: string;
}

export function Chip({ active, onPress, icon, size = 'md', children }: ChipProps) {
  const bg = active ? 'bg-evergreen' : 'bg-surface border border-line';
  const fg = active ? 'text-cream' : 'text-ink';
  const compact = size === 'sm';
  return (
    <Pressable
      onPress={onPress}
      className={`${bg} flex-row items-center ${compact ? 'gap-1 px-2.5 py-1' : 'gap-1.5 px-3 py-2'} rounded-full active:opacity-80`}
    >
      {icon && (
        <Icon
          name={icon}
          size={compact ? 11 : 14}
          color={active ? colors.cream.DEFAULT : colors.ink.DEFAULT}
        />
      )}
      <Text className={`${fg} ${compact ? 'text-[11px]' : 'text-[13px]'} font-sans-medium`}>
        {children}
      </Text>
    </Pressable>
  );
}

// ============ PROGRESS BAR ============

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View className="h-1 bg-line rounded-full overflow-hidden">
      <View className="h-full bg-evergreen rounded-full" style={{ width: `${pct}%` }} />
    </View>
  );
}

// ============ ICON BADGE (kolorowe kółko z ikoną) ============

interface IconBadgeProps {
  name: IconName;
  theme?: 'sage' | 'sand' | 'clay';
  size?: number;
}

export function IconBadge({ name, theme = 'sand', size = 36 }: IconBadgeProps) {
  const themes = {
    sage: { bg: 'bg-sage-soft', color: colors.evergreen.DEFAULT },
    sand: { bg: 'bg-blush-soft', color: colors.terracotta.dark },
    clay: { bg: 'bg-terracotta-soft', color: colors.terracotta.dark },
  };
  const t = themes[theme];
  return (
    <View
      className={`${t.bg} items-center justify-center rounded-card`}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={Math.round(size * 0.5)} color={t.color} />
    </View>
  );
}

// ============ CHECKBOX ============

interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  size?: number;
}

export function Checkbox({ checked, onPress, size = 22 }: CheckboxProps) {
  const style = `items-center justify-center rounded-md border-1.5 ${
    checked ? 'bg-evergreen border-evergreen' : 'bg-cream border-line-strong'
  }`;
  const inner = checked ? <Icon name="check" size={size - 8} color={colors.cream.DEFAULT} strokeWidth={2.4} /> : null;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={style} style={{ width: size, height: size }}>
        {inner}
      </Pressable>
    );
  }
  return (
    <View className={style} style={{ width: size, height: size }} pointerEvents="none">
      {inner}
    </View>
  );
}

// ============ FIELD (label + input) ============

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] text-ink-soft font-sans-medium uppercase tracking-wide">
        {label}
      </Text>
      {children}
    </View>
  );
}
