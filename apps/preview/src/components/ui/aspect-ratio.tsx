import { View, type SharedAnimationProps } from '@/components/ui/primitives';
import * as AspectRatioPrimitive from '@rn-primitives/aspect-ratio';

function AspectRatio({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root> & SharedAnimationProps) {
  // Primitive-owned host: attach motion with `asChild` (no extra layout node), and only
  // when the caller asks for it so default rendering is unchanged.
  const hasMotion =
    animate !== undefined || activeAnimate !== undefined || motionActive !== undefined;

  if (!hasMotion) {
    return <AspectRatioPrimitive.Root {...props} />;
  }

  return (
    <AspectRatioPrimitive.Root {...props} asChild>
      <View
        animate={animate}
        activeAnimate={activeAnimate}
        motionActive={motionActive}
        reduceMotion={reduceMotion}
      />
    </AspectRatioPrimitive.Root>
  );
}

export { AspectRatio };
