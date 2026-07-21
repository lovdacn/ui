import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(value || new Date());
  const selectedDate = value;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Get total days in previous month
  const totalDaysPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const days = [];

  // Previous month offset days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: totalDaysPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, totalDaysPrevMonth - i),
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month offset days to complete the calendar grid rows (6 rows * 7 days = 42 cells)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i),
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleDateSelect = (date: Date) => {
    if (onChange) {
      onChange(date);
    }
  };

  return (
    <View className={cn('p-3 rounded-lg border border-border bg-background w-full max-w-[320px]', className)}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-sm font-semibold text-foreground">
          {monthNames[month]} {year}
        </Text>
        <View className="flex-row gap-1">
          <Pressable
            onPress={handlePrevMonth}
            className="p-1.5 rounded-md border border-border active:bg-muted"
          >
            <ChevronLeft size={16} className="text-foreground" />
          </Pressable>
          <Pressable
            onPress={handleNextMonth}
            className="p-1.5 rounded-md border border-border active:bg-muted"
          >
            <ChevronRight size={16} className="text-foreground" />
          </Pressable>
        </View>
      </View>

      {/* Weekdays */}
      <View className="flex-row justify-between mb-2">
        {weekdays.map((day, index) => (
          <View key={index} className="w-8 items-center">
            <Text className="text-xs text-muted-foreground font-medium">{day}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View className="flex-row flex-wrap justify-between">
        {days.map((item, index) => {
          const selected = isSelected(item.date);
          const today = isToday(item.date);

          return (
            <Pressable
              key={index}
              onPress={() => handleDateSelect(item.date)}
              className={cn(
                'w-8 h-8 items-center justify-center rounded-md my-0.5',
                selected && 'bg-primary text-primary-foreground',
                !selected && today && 'bg-accent text-accent-foreground',
                !selected && !today && 'active:bg-muted'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  selected ? 'text-primary-foreground' : 'text-foreground',
                  !item.isCurrentMonth && 'text-muted-foreground opacity-50'
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

Calendar.displayName = 'Calendar';

export { Calendar };
export type { CalendarProps };
