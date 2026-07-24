import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'outline';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  /** Optional leading element, e.g. an icon. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A pressable call-to-action with `primary` (filled) and `outline` variants.
 */
export function Button({ label, variant = 'primary', icon, style, ...props }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: theme.text }
          : { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.backgroundSelected },
        pressed && styles.pressed,
        style,
      ]}
      {...props}>
      {icon}
      <ThemedText type="smallBold" style={{ color: isPrimary ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    paddingHorizontal: Spacing.four,
    borderRadius: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});
