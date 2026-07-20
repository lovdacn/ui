import { Image } from 'expo-image';

import { Button, type ButtonProps } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const GITHUB_ICON = require('@/assets/images/github.svg');

export type GitHubStarButtonProps = Omit<ButtonProps, 'label' | 'variant' | 'icon'> & {
  label?: string;
};

/**
 * "Star on GitHub" call-to-action rendering the GitHub mark from `github.svg`.
 * The icon is tinted to the current theme so it works in light and dark mode.
 */
export function GitHubStarButton({ label = 'Star on GitHub', ...props }: GitHubStarButtonProps) {
  const theme = useTheme();

  return (
    <Button
      variant="outline"
      label={label}
      icon={
        <Image
          source={GITHUB_ICON}
          style={{ width: 18, height: 18 }}
          tintColor={theme.text}
          contentFit="contain"
          accessibilityLabel="GitHub"
        />
      }
      {...props}
    />
  );
}
