import { Icon } from '@/components/ui/icon';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import { X } from '@/components/ui/semantic-icon';
import * as React from 'react';
import { Text, View } from '@/components/ui/primitives';
import {
  Platform,
  ScrollView,
  useWindowDimensions,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function DialogOverlay({
  className,
  children,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, 'asChild'> & {
  children?: React.ReactNode;
}) {
  const { onOpenChange } = DialogPrimitive.useRootContext();

  function onOverlayPress(event: GestureResponderEvent) {
    onPress?.(event);
    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {
      onOpenChange(false);
    }
  }

  return (
    <FullWindowOverlay>
      <DialogPrimitive.Overlay
        className={cn(
          'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center p-2 bg-black/10',
          Platform.select({
            web: 'animate-in fade-in-0 fixed cursor-default [&>*]:cursor-auto',
          }),
          className
        )}
        {...props}
        onPress={Platform.select({ web: onOverlayPress, native: onPress })}
        asChild={Platform.OS !== 'web'}>
        <NativeOnlyAnimatedView entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <NativeOnlyAnimatedView entering={FadeIn.delay(50)} exiting={FadeOut.duration(150)}>
            <>{children}</>
          </NativeOnlyAnimatedView>
        </NativeOnlyAnimatedView>
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}
function DialogContent({
  className,
  portalHost,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  portalHost?: string;
}) {
  const { height, width } = useWindowDimensions();
  // Bound the shell to the actual window. Without a maximum height, long content
  // grows the dialog past the screen and the overflow is simply cut, taking the
  // footer actions with it. The insets leave the overlay's own padding visible.
  const maxHeight = Math.max(200, height - 32);
  const maxWidth = Math.max(240, width - 16);

  // The footer stays OUTSIDE the scroll area so the primary action is reachable
  // no matter how long the body is. Everything else scrolls. A dialog with no
  // DialogFooter behaves exactly as before.
  const childArray = React.Children.toArray(children);
  const isFooter = (child: React.ReactNode) =>
    React.isValidElement(child) && child.type === DialogFooter;
  const footer = childArray.filter(isFooter);
  const body = childArray.filter((child) => !isFooter(child));

  return (
    <DialogPortal hostName={portalHost}>
      <DialogOverlay>
        <DialogPrimitive.Content
          className={cn(
            'border-border z-50 mx-auto flex w-full flex-col border shadow-lg shadow-black/5 bg-popover max-w-lg gap-6 rounded-xl p-6 sm:max-w-md',
            Platform.select({
              web: 'animate-in fade-in-0 zoom-in-95 duration-200',
            }),
            className
          )}
          {...props}
          style={[{ maxHeight, maxWidth }, style]}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            contentContainerStyle={{ gap: 16 }}
            // Shrink to yield space to the footer; never grow past the content.
            style={{ flexGrow: 0, flexShrink: 1 }}>
            {body}
          </ScrollView>
          {footer}
          <DialogPrimitive.Close
            className={cn(
              'rounded opacity-70 active:opacity-100 absolute top-4 right-4',
              Platform.select({
                web: 'ring-offset-background focus:ring-ring data-[state=open]:bg-accent transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2',
              })
            )}
            hitSlop={12}>
            <Icon
              as={X}
              className={cn('text-accent-foreground web:pointer-events-none size-4 shrink-0')}
            />
            <Text className="sr-only">Close</Text>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ViewProps) {
  return (
    <View className={cn('flex flex-col text-center sm:text-left gap-2', className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-2', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-foreground text-lg leading-tight font-medium', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
