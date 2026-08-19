import { Icon } from "@/components/ui/icon";
import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@rn-primitives/dialog";
import { X } from "lucide-react-native";
import * as React from "react";
import { durations, Text, View } from "@/components/ui/primitives";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type GestureResponderEvent,
  type ViewProps,
  useWindowDimensions,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import {
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
} from "react-native-reanimated";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetPortal = DialogPrimitive.Portal;
const SheetClose = DialogPrimitive.Close;
const FullWindowOverlay =
  Platform.OS === "ios" ? RNFullWindowOverlay : React.Fragment;
const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

type SheetSide = "top" | "bottom" | "left" | "right";

const SheetSideContext = React.createContext<{ side: SheetSide }>({
  side: "right",
});

function useOptionalSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
}

function SheetOverlay({
  className,
  children,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, "asChild"> & {
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
          "absolute bottom-0 left-0 right-0 top-0 z-50 flex bg-black/80",
          Platform.select({ web: "fixed cursor-default [&>*]:cursor-auto" }),
          className,
        )}
        {...props}
        onPress={Platform.select({ web: onOverlayPress, native: onPress })}
        asChild={Platform.OS !== "web"}
      >
        <NativeOnlyAnimatedView
          entering={FadeIn.duration(durations.base).reduceMotion(
            ReduceMotion.System,
          )}
          exiting={FadeOut.duration(durations.fast).reduceMotion(
            ReduceMotion.System,
          )}
        >
          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", default: "height" })}
            pointerEvents="box-none"
            style={{ flex: 1, width: "100%" }}
          >
            {children}
          </KeyboardAvoidingView>
        </NativeOnlyAnimatedView>
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

interface SheetContentProps extends React.ComponentProps<
  typeof DialogPrimitive.Content
> {
  side?: SheetSide;
  portalHost?: string;
}

function SheetContent({
  className,
  portalHost,
  side = "right",
  children,
  style,
  ...props
}: SheetContentProps) {
  const insets = useOptionalSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const safeWidth = Math.max(240, width - insets.left - insets.right);
  const safeHeight = Math.max(240, height - insets.top - insets.bottom);
  const horizontalWidth = Math.min(384, safeWidth * 0.8);
  const verticalHeight = Math.min(384, safeHeight * 0.6);

  const enteringAnimation = {
    left: SlideInLeft,
    right: SlideInRight,
    top: SlideInUp,
    bottom: SlideInDown,
  }[side]
    .duration(durations.slow)
    .reduceMotion(ReduceMotion.System);

  const exitingAnimation = {
    left: SlideOutLeft,
    right: SlideOutRight,
    top: SlideOutUp,
    bottom: SlideOutDown,
  }[side]
    .duration(durations.base)
    .reduceMotion(ReduceMotion.System);

  const sideClasses = {
    left: "left-0 h-full border-r border-border max-w-sm",
    right: "right-0 h-full border-l border-border max-w-sm",
    top: "top-0 w-full border-b border-border max-h-sm",
    bottom: "bottom-0 w-full border-t border-border max-h-sm",
  };
  const webAnimations = {
    left: "animate-in slide-in-from-left duration-250",
    right: "animate-in slide-in-from-right duration-250",
    top: "animate-in slide-in-from-top duration-250",
    bottom: "animate-in slide-in-from-bottom duration-250",
  };
  const dimensions =
    side === "left" || side === "right"
      ? { width: horizontalWidth, maxHeight: safeHeight }
      : { height: verticalHeight, maxWidth: safeWidth };

  return (
    <SheetPortal hostName={portalHost}>
      <SheetOverlay>
        <SheetSideContext.Provider value={{ side }}>
          <DialogPrimitive.Content
            className={cn(
              "bg-background absolute z-50 flex flex-col gap-6 p-6 text-sm shadow-lg shadow-black/5",
              sideClasses[side],
              Platform.select({ web: webAnimations[side] }),
              className,
            )}
            asChild={Platform.OS !== "web"}
            {...props}
            style={[
              dimensions,
              {
                paddingTop: 24 + insets.top,
                paddingRight: 24 + insets.right,
                paddingBottom: 24 + insets.bottom,
                paddingLeft: 24 + insets.left,
              },
              style,
            ]}
          >
            <NativeOnlyAnimatedView
              entering={enteringAnimation}
              exiting={exitingAnimation}
              className="h-full w-full"
            >
              <ScrollView
                bounces={false}
                contentContainerStyle={{ gap: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                style={{ flex: 1, width: "100%" }}
              >
                {children}
              </ScrollView>
              <DialogPrimitive.Close
                accessibilityLabel="Close sheet"
                className={cn(
                  "absolute right-4 top-4 rounded opacity-70 active:opacity-100",
                  Platform.select({
                    web: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2",
                  }),
                )}
                hitSlop={16}
                style={{
                  top: Math.max(16, insets.top + 8),
                  right: Math.max(16, insets.right + 8),
                }}
              >
                <Icon
                  as={X}
                  className="text-accent-foreground web:pointer-events-none size-4 shrink-0"
                />
                <Text className="sr-only">Close</Text>
              </DialogPrimitive.Close>
            </NativeOnlyAnimatedView>
          </DialogPrimitive.Content>
        </SheetSideContext.Provider>
      </SheetOverlay>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: ViewProps) {
  return <View className={cn("flex flex-col gap-2", className)} {...props} />;
}

function SheetFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-foreground text-lg font-semibold leading-tight",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm leading-normal", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
