import { Icon } from "@/components/ui/icon";
import * as React from "react";
import { Pressable, Text, View } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react-native";
import { Portal } from "@rn-primitives/portal";
import { AccessibilityInfo } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Animated, {
  FadeInUp,
  FadeOutUp,
  ReduceMotion,
} from "react-native-reanimated";

type ToastType = "default" | "success" | "error" | "warning" | "info";

type ToastData = {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
};

type ToastOptions = Omit<ToastData, "id" | "title">;
type ToastContextProps = {
  toasts: ToastData[];
  toast: (title: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextProps | null>(null);
const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const toastListeners = new Set<
  (title: string, options?: ToastOptions) => void
>();
let toastSequence = 0;

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = React.useCallback(
    (title: string, options: ToastOptions = {}) => {
      const id = `toast-${Date.now()}-${toastSequence++}`;
      const item: ToastData = { id, title, duration: 4000, ...options };
      setToasts((current) => [...current.slice(-2), item]);
      void AccessibilityInfo.announceForAccessibility(
        [title, options.description].filter(Boolean).join(". "),
      );

      if (item.duration && item.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), item.duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const listener = (title: string, options?: ToastOptions) => {
      showToast(title, options);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, [showToast]);

  React.useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
      timers.current.clear();
    },
    [],
  );

  const value = React.useMemo(
    () => ({ toasts, toast: showToast, dismiss }),
    [dismiss, showToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal name="lovdacn-toast-viewport">
        <ToastViewport />
      </Portal>
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { toasts, dismiss } = useToast();
  const insets = React.useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;

  return (
    <View
      className="pointer-events-none absolute left-4 right-4 z-50 flex-col items-center gap-2"
      style={{
        top: insets.top + 16,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {toasts.map((item) => (
        <AnimatedToast
          key={item.id}
          item={item}
          onDismiss={() => dismiss(item.id)}
        />
      ))}
    </View>
  );
}

function AnimatedToast({
  item,
  onDismiss,
}: {
  item: ToastData;
  onDismiss: () => void;
}) {
  const icons = {
    success: <Icon as={CheckCircle2} size={18} className="text-primary" />,
    error: <Icon as={AlertCircle} size={18} className="text-destructive" />,
    warning: <Icon as={AlertCircle} size={18} className="text-foreground" />,
    info: <Icon as={Info} size={18} className="text-primary" />,
    default: null,
  };

  return (
    <Animated.View
      accessibilityRole="alert"
      entering={FadeInUp.reduceMotion(ReduceMotion.System)}
      exiting={FadeOutUp.reduceMotion(ReduceMotion.System)}
      className={cn(
        "bg-background border-border pointer-events-auto w-full max-w-[400px] flex-row items-start gap-3 rounded-lg border p-4 shadow-md",
      )}
    >
      {icons[item.type ?? "default"]}
      <View className="flex-1">
        <Text className="text-foreground text-sm font-semibold leading-normal">
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-muted-foreground mt-1 text-xs leading-normal">
            {item.description}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel="Dismiss notification"
        accessibilityRole="button"
        onPress={onDismiss}
        className="min-h-11 min-w-11 items-center justify-center rounded-md active:bg-muted"
      >
        <Icon as={X} size={16} className="text-muted-foreground" />
      </Pressable>
    </Animated.View>
  );
}

const toast = {
  show(title: string, options?: ToastOptions) {
    for (const listener of toastListeners) listener(title, options);
  },
};

export { ToastProvider, useToast, toast };
export type { ToastData, ToastType };
