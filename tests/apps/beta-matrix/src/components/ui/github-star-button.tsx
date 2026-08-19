import { Image } from 'expo-image';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

const GITHUB_ICON = require('@/assets/images/github.svg');

// lvcn's Button composes children rather than taking `label`/`icon` props, so the
// icon and label are passed as children and the Button's TextClassContext styles
// the label for the chosen variant.
export type GitHubStarButtonProps = Omit<React.ComponentProps<typeof Button>, 'variant'> & {
  label?: string;
};

/**
 * "Star on GitHub" call-to-action rendering the GitHub mark from `github.svg`.
 * The icon is tinted to the current theme so it works in light and dark mode.
 */
export function GitHubStarButton({ label = 'Star on GitHub', ...props }: GitHubStarButtonProps) {
  const theme = useTheme();

  return (
    <Button variant="outline" {...props}>
      <Image
        source={GITHUB_ICON}
        style={{ width: 18, height: 18 }}
        tintColor={theme.text}
        contentFit="contain"
        accessibilityLabel="GitHub"
      />
      <Text>{label}</Text>
    </Button>
  );
}
