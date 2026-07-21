import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

type ToastData = {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
};

type ToastContextProps = {
  toasts: ToastData[];
  toast: (title: string, options?: Omit<ToastData, 'id' | 'title'>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextProps | null>(null);

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((title: string, options?: Omit<ToastData, 'id' | 'title'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastData = {
      id,
      title,
      ...options,
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismiss(id);
    }, 4000);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <View className="absolute top-12 left-4 right-4 z-50 flex-col items-center pointer-events-none gap-2">
      {toasts.map((item) => (
        <AnimatedToast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </View>
  );
}

function AnimatedToast({ item, onDismiss }: { item: ToastData; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 size={18} className="text-green-500" />,
    error: <AlertCircle size={18} className="text-destructive" />,
    warning: <AlertCircle size={18} className="text-yellow-500" />,
    info: <Info size={18} className="text-blue-500" />,
    default: null,
  };

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      className={cn(
        'w-full max-w-[400px] flex-row items-start gap-3 p-4 rounded-lg border border-border bg-background shadow-md pointer-events-auto'
      )}
    >
      {item.type && icons[item.type]}
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{item.title}</Text>
        {item.description && (
          <Text className="text-xs text-muted-foreground mt-1">{item.description}</Text>
        )}
      </View>
      <Pressable onPress={onDismiss} className="p-1 rounded-md active:bg-muted">
        <X size={14} className="text-muted-foreground" />
      </Pressable>
    </Animated.View>
  );
}

// Global programmatic trigger helper
const toast = {
  show: (title: string, options?: Omit<ToastData, 'id' | 'title'>) => {
    // Provided for API similarity to web. Hook-based is recommended in React Native.
  }
};

export { ToastProvider, useToast, toast };
export type { ToastData, ToastType };
