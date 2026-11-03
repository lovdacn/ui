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
  SlideOutDown,
} from "react-native-reanimated";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";

const BottomSheet = DialogPrimitive.Root;
const BottomSheetTrigger = DialogPrimitive.Trigger;
const BottomSheetPortal = DialogPrimitive.Portal;
const BottomSheetClose = DialogPrimitive.Close;
const FullWindowOverlay =
  Platform.OS === "ios" ? RNFullWindowOverlay : React.Fragment;
const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

function useOptionalSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
}

function BottomSheetOverlay({
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
          "absolute bottom-0 left-0 right-0 top-0 z-50 flex justify-end bg-black/80",
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
            style={{ flex: 1, width: "100%", justifyContent: "flex-end" }}
          >
            {children}
          </KeyboardAvoidingView>
        </NativeOnlyAnimatedView>
      </DialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

interface BottomSheetContentProps extends React.ComponentProps<
  typeof DialogPrimitive.Content
> {
  portalHost?: string;
}

function BottomSheetContent({
  className,
  portalHost,
  children,
  style,
  ...props
}: BottomSheetContentProps) {
  const insets = useOptionalSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const maxHeight = Math.max(240, height - insets.top - 16);
  const maxWidth = Math.max(240, width - insets.left - insets.right);

  return (
    <BottomSheetPortal hostName={portalHost}>
      <BottomSheetOverlay>
        <DialogPrimitive.Content
          className={cn(
            "bg-background border-border z-50 flex w-full flex-col gap-6 rounded-t-4xl border-t p-6 text-sm shadow-lg shadow-black/5",
            Platform.select({
              web: "animate-in slide-in-from-bottom duration-250",
            }),
            className,
          )}
          asChild={Platform.OS !== "web"}
          {...props}
          style={[
            {
              maxHeight,
              maxWidth,
              paddingRight: 24 + insets.right,
              paddingBottom: 24 + insets.bottom,
              paddingLeft: 24 + insets.left,
            },
            style,
          ]}
        >
          <NativeOnlyAnimatedView
            entering={SlideInDown.duration(durations.slow).reduceMotion(
              ReduceMotion.System,
            )}
            exiting={SlideOutDown.duration(durations.base).reduceMotion(
              ReduceMotion.System,
            )}
            className="w-full flex-1 flex-col"
          >
            <View
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
              className="bg-muted mb-4 h-1 w-12 self-center rounded-full"
            />
            <ScrollView
              bounces={false}
              contentContainerStyle={{ gap: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              style={{ flexShrink: 1, width: "100%" }}
            >
              {children}
            </ScrollView>
            <DialogPrimitive.Close
              accessibilityLabel="Close bottom sheet"
              className={cn(
                "absolute right-4 top-4 rounded opacity-70 active:opacity-100",
                Platform.select({
                  web: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2",
                }),
              )}
              hitSlop={16}
              style={{ top: 16, right: Math.max(16, insets.right + 8) }}
            >
              <Icon
                as={X}
                className="text-accent-foreground web:pointer-events-none size-4 shrink-0"
              />
              <Text className="sr-only">Close</Text>
            </DialogPrimitive.Close>
          </NativeOnlyAnimatedView>
        </DialogPrimitive.Content>
      </BottomSheetOverlay>
    </BottomSheetPortal>
  );
}

function BottomSheetHeader({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn("flex flex-col gap-1.5 text-left", className)}
      {...props}
    />
  );
}

function BottomSheetFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function BottomSheetTitle({
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

function BottomSheetDescription({
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
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  BottomSheetTrigger,
};
