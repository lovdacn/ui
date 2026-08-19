import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Pressable, Text, View } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear()
  );
}

function Calendar({
  value,
  onChange,
  className,
  locale,
  weekStartsOn = 0,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(value || new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex =
    (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const totalDaysPrevMonth = new Date(year, month, 0).getDate();
  const monthLabel = currentDate.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const previousMonthLabel = new Date(year, month - 1, 1).toLocaleDateString(
    locale,
    {
      month: "long",
      year: "numeric",
    },
  );
  const nextMonthLabel = new Date(year, month + 1, 1).toLocaleDateString(
    locale,
    {
      month: "long",
      year: "numeric",
    },
  );
  const weekdays = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const sunday = new Date(2024, 0, 7 + ((weekStartsOn + index) % 7));
        return sunday.toLocaleDateString(locale, { weekday: "short" });
      }),
    [locale, weekStartsOn],
  );

  const days: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];
  for (let index = firstDayIndex - 1; index >= 0; index -= 1) {
    days.push({
      day: totalDaysPrevMonth - index,
      isCurrentMonth: false,
      date: new Date(year, month - 1, totalDaysPrevMonth - index),
    });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    days.push({ day, isCurrentMonth: true, date: new Date(year, month, day) });
  }
  for (let day = 1; days.length < 42; day += 1) {
    days.push({
      day,
      isCurrentMonth: false,
      date: new Date(year, month + 1, day),
    });
  }

  return (
    <View
      accessibilityLabel={`Calendar, ${monthLabel}`}
      className={cn(
        "bg-background border-border w-full max-w-sm rounded-lg border p-3",
        className,
      )}
    >
      <View className="mb-4 flex-row items-center justify-between">
        <Text
          accessibilityRole="header"
          className="text-foreground text-sm font-semibold leading-normal"
        >
          {monthLabel}
        </Text>
        <View className="flex-row gap-1">
          <Pressable
            accessibilityLabel={`Show ${previousMonthLabel}`}
            accessibilityRole="button"
            onPress={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="border-border h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-md border active:bg-muted"
          >
            <Icon as={ChevronLeft} size={18} className="text-foreground" />
          </Pressable>
          <Pressable
            accessibilityLabel={`Show ${nextMonthLabel}`}
            accessibilityRole="button"
            onPress={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="border-border h-11 min-h-11 w-11 min-w-11 items-center justify-center rounded-md border active:bg-muted"
          >
            <Icon as={ChevronRight} size={18} className="text-foreground" />
          </Pressable>
        </View>
      </View>

      <View className="mb-1 flex-row">
        {weekdays.map((day, index) => (
          <View
            key={`${day}-${index}`}
            className="items-center"
            style={{ width: "14.2857%" }}
          >
            <Text className="text-muted-foreground text-xs font-medium leading-normal">
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((item) => {
          const selected = Boolean(value && sameDay(item.date, value));
          const today = sameDay(item.date, new Date());
          const dateLabel = item.date.toLocaleDateString(locale, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          return (
            <Pressable
              key={item.date.toISOString()}
              accessibilityLabel={dateLabel}
              accessibilityHint={today ? "Today" : undefined}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange?.(item.date)}
              className={cn(
                "my-0.5 h-11 min-h-11 items-center justify-center rounded-md",
                selected && "bg-primary",
                !selected && today && "bg-accent",
                !selected && !today && "active:bg-muted",
              )}
              style={{ width: "14.2857%" }}
            >
              <Text
                className={cn(
                  "text-xs font-medium leading-normal",
                  selected ? "text-primary-foreground" : "text-foreground",
                  !item.isCurrentMonth && "text-muted-foreground opacity-50",
                )}
              >
                {item.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps };
