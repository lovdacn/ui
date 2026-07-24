import { Image } from 'expo-image';

const LOGO = require('@/assets/images/lovdacn-logo.png');

export type LogoProps = {
  /** Rendered width and height in points. */
  size?: number;
};

/**
 * The lovdaCN brand logo.
 */
export function Logo({ size = 88 }: LogoProps) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="lovdaCN logo"
    />
  );
}
