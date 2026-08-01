import { View, type SharedAnimationProps } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import * as RadioGroupPrimitive from '@rn-primitives/radio-group';
import { Platform } from 'react-native';

/** True when the caller actually requested motion for this instance. */
function hasMotionProps(p: SharedAnimationProps) {
  return p.animate !== undefined || p.activeAnimate !== undefined || p.motionActive !== undefined;
}

function RadioGroup({
  className,
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root> & SharedAnimationProps) {
  const rootProps = { className: cn('gap-3', className), ...props };

  if (!hasMotionProps({ animate, activeAnimate, motionActive })) {
    return <RadioGroupPrimitive.Root {...rootProps} />;
  }

  return (
    <RadioGroupPrimitive.Root {...rootProps} asChild>
      <View
        animate={animate}
        activeAnimate={activeAnimate}
        motionActive={motionActive}
        reduceMotion={reduceMotion}
      />
    </RadioGroupPrimitive.Root>
  );
}

function RadioGroupItem({
  className,
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & SharedAnimationProps) {
  const itemProps = {
    className: cn(
      'border-input dark:bg-input/30 aspect-square size-4 shrink-0 items-center justify-center rounded-full border shadow-sm shadow-black/5',
      Platform.select({
        web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed',
      }),
      props.disabled && 'opacity-50',
      className
    ),
    ...props,
  };

  const indicator = <RadioGroupPrimitive.Indicator className="bg-primary size-2 rounded-full" />;

  // Item's canonical active state is `checked` (selected).
  if (!hasMotionProps({ animate, activeAnimate, motionActive })) {
    return <RadioGroupPrimitive.Item {...itemProps}>{indicator}</RadioGroupPrimitive.Item>;
  }

  return (
    <RadioGroupPrimitive.Item {...itemProps} asChild>
      <View
        animate={animate}
        activeAnimate={activeAnimate}
        motionActive={motionActive}
        reduceMotion={reduceMotion}>
        {indicator}
      </View>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
