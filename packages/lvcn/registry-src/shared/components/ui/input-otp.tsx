import { Pressable, TextInput, View } from "@/components/ui/primitives";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as React from "react";
import { Platform } from "react-native";

type InputOTPContextValue = {
  value: string;
  maxLength: number;
  focused: boolean;
  activeIndex: number;
};

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null);

function useInputOTPContext() {
  const context = React.useContext(InputOTPContext);
  if (!context)
    throw new Error(
      "InputOTP compound components must be used within <InputOTP>.",
    );
  return context;
}

type InputOTPProps = Omit<
  React.ComponentProps<typeof TextInput>,
  "value" | "onChangeText" | "maxLength"
> & {
  value: string;
  onChangeText: (value: string) => void;
  maxLength?: number;
  children: React.ReactNode;
  className?: string;
};

function InputOTP({
  value,
  onChangeText,
  maxLength = 6,
  children,
  className,
  ...props
}: InputOTPProps) {
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);
  const activeIndex = Math.min(value.length, maxLength - 1);
  const context = React.useMemo<InputOTPContextValue>(
    () => ({ value, maxLength, focused, activeIndex }),
    [activeIndex, focused, maxLength, value],
  );

  return (
    <InputOTPContext.Provider value={context}>
      <Pressable
        accessible={false}
        className={cn("relative w-full flex-row items-center", className)}
        onPress={() => inputRef.current?.focus()}
      >
        {children}
        <TextInput
          ref={inputRef}
          accessibilityLabel="One-time password"
          accessibilityValue={{
            text: `${value.length} of ${maxLength} characters entered`,
          }}
          value={value}
          onChangeText={(text) =>
            onChangeText(text.replace(/\s/g, "").slice(0, maxLength))
          }
          maxLength={maxLength}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          caretHidden={true}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 opacity-0"
          {...props}
        />
      </Pressable>
    </InputOTPContext.Provider>
  );
}

function InputOTPGroup({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn(
        "w-full flex-1 flex-row items-center justify-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

type InputOTPSlotProps = React.ComponentProps<typeof View> & { index: number };

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const { value, focused, activeIndex, maxLength } = useInputOTPContext();
  const char = value[index] ?? "";
  const isActive =
    focused &&
    (activeIndex === index ||
      (value.length === maxLength && index === maxLength - 1));

  return (
    <View
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      className={cn(
        "border-input bg-background h-12 min-h-11 min-w-9 max-w-11 flex-1 items-center justify-center rounded-md border",
        isActive && "border-ring border-2",
        Platform.select({ web: "transition-all" }),
        className,
      )}
      {...props}
    >
      {char ? (
        <Text className="text-foreground text-lg font-medium leading-normal">
          {char}
        </Text>
      ) : isActive ? (
        <View className="bg-foreground h-5 w-px" />
      ) : null}
    </View>
  );
}

function InputOTPSeparator({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      role="presentation"
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
      className={cn("items-center justify-center px-0.5", className)}
      {...props}
    >
      <View className="bg-border h-1 w-2 rounded-full" />
    </View>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
