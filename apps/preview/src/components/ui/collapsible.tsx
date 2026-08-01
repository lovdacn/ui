import { Pressable, View, type SharedAnimationProps } from '@/components/ui/primitives';
import * as CollapsiblePrimitive from '@rn-primitives/collapsible';

/** True when the caller actually requested motion for this instance. */
function hasMotionProps(p: SharedAnimationProps) {
  return p.animate !== undefined || p.activeAnimate !== undefined || p.motionActive !== undefined;
}

/**
 * Collapsible keeps its layout/measurement behaviour in the primitive; `animate` /
 * `activeAnimate` attach to the visual hosts with `asChild` (one host, no extra node), and
 * only when the caller asks for motion so default rendering is unchanged.
 * Canonical active state: `expanded` (open).
 */
function Collapsible({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & SharedAnimationProps) {
  if (!hasMotionProps({ animate, activeAnimate, motionActive })) {
    return <CollapsiblePrimitive.Root {...props} />;
  }

  return (
    <CollapsiblePrimitive.Root {...props} asChild>
      <View
        animate={animate}
        activeAnimate={activeAnimate}
        motionActive={motionActive ?? props.open}
        reduceMotion={reduceMotion}
      />
    </CollapsiblePrimitive.Root>
  );
}

function CollapsibleTrigger({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger> & SharedAnimationProps) {
  if (!hasMotionProps({ animate, activeAnimate, motionActive })) {
    return <CollapsiblePrimitive.Trigger {...props} />;
  }

  return (
    <CollapsiblePrimitive.Trigger {...props} asChild>
      <Pressable
        animate={animate}
        activeAnimate={activeAnimate}
        motionActive={motionActive}
        reduceMotion={reduceMotion}
      />
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsibleContent({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content> & SharedAnimationProps) {
  if (!hasMotionProps({ animate, activeAnimate, motionActive })) {
    return <CollapsiblePrimitive.Content {...props} />;
  }

  return (
    <CollapsiblePrimitive.Content {...props} asChild>
      <View
        animate={animate}
        activeAnimate={activeAnimate}
        motionActive={motionActive}
        reduceMotion={reduceMotion}
      />
    </CollapsiblePrimitive.Content>
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
