import { Icon } from "@/components/ui/icon";
import { Text, TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Slot } from "@rn-primitives/slot";
import { ChevronRight, MoreHorizontal } from "lucide-react-native";
import * as React from "react";
import { Pressable, View } from "@/components/ui/primitives";
import { I18nManager, Platform } from "react-native";

function Breadcrumb({ ...props }: React.ComponentProps<typeof View>) {
  return <View accessibilityLabel="Breadcrumb" role="navigation" {...props} />;
}

function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <TextClassContext.Provider value="text-muted-foreground text-sm leading-normal">
      <View
        className={cn("flex-row flex-wrap items-center gap-1.5", className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn("min-h-11 flex-row items-center gap-1.5", className)}
      {...props}
    />
  );
}

type BreadcrumbLinkProps = React.ComponentProps<typeof Pressable> & {
  asChild?: boolean;
};

function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps) {
  const Component = asChild ? Slot : Pressable;
  return (
    <TextClassContext.Provider
      value={cn(
        "text-muted-foreground text-sm leading-normal",
        Platform.select({
          web: "transition-colors group-hover:text-foreground",
        }),
      )}
    >
      <Component
        accessibilityRole="link"
        className={cn(
          "group min-h-11 min-w-11 flex-row items-center justify-center",
          Platform.select({ web: "hover:text-foreground" }),
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      role="none"
      aria-current="page"
      className={cn(
        "text-foreground text-sm font-normal leading-normal",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View role="presentation" className={cn(className)} {...props}>
      {children ?? (
        <Icon
          as={ChevronRight}
          className={cn(
            "text-muted-foreground size-3.5",
            I18nManager.isRTL && "rotate-180",
          )}
        />
      )}
    </View>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      role="presentation"
      accessibilityLabel="More breadcrumb items"
      className={cn(
        "size-11 min-h-11 min-w-11 items-center justify-center",
        className,
      )}
      {...props}
    >
      <Icon as={MoreHorizontal} className="text-muted-foreground size-4" />
    </View>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
