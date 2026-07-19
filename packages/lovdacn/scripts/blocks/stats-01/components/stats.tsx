import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export type Stat = {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  caption: string;
};

const SAMPLE_STATS: Stat[] = [
  {
    label: 'Total Revenue',
    value: '$15,231.89',
    delta: '+20.1%',
    trend: 'up',
    caption: 'Trending up this month',
  },
  {
    label: 'New Customers',
    value: '1,234',
    delta: '-4.5%',
    trend: 'down',
    caption: 'Down 4.5% this period',
  },
  {
    label: 'Active Accounts',
    value: '45,678',
    delta: '+12.5%',
    trend: 'up',
    caption: 'Strong user retention',
  },
];

export function Stats({ data = SAMPLE_STATS }: { data?: Stat[] }) {
  return (
    <View className="gap-4 p-4">
      {data.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="gap-1">
            <View className="flex-row items-center justify-between">
              <CardDescription>{stat.label}</CardDescription>
              <Badge variant={stat.trend === 'up' ? 'secondary' : 'destructive'}>
                <Icon as={stat.trend === 'up' ? TrendingUp : TrendingDown} className="size-3" />
                <Text>{stat.delta}</Text>
              </Badge>
            </View>
            <CardTitle className="text-3xl">{stat.value}</CardTitle>
          </CardHeader>
          <CardFooter>
            <Text className="text-muted-foreground text-sm">{stat.caption}</Text>
          </CardFooter>
        </Card>
      ))}
    </View>
  );
}
