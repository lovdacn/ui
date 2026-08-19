import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View } from '@/components/ui/primitives';

function Card({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value={cn('text-card-foreground text-sm')}>
      <View
        className={cn(
          'border-border flex flex-col gap-6 border py-6 shadow-black/5 bg-card rounded-xl shadow-xs',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col px-6 gap-1 rounded-t-xl', className)} {...props} />;
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {

  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-tight', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-6 rounded-b-xl', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
