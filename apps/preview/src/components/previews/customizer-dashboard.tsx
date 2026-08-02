import * as React from 'react';
import {
  Pressable,
  ScrollView,
  Text as NativeText,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  getFontFace,
  usePreviewDesignSystem,
} from '@/components/design-system/preview-design-system';
import { SemanticIcon } from '@/components/design-system/semantic-icon';
import { cn } from '@/lib/utils';

const TextClassContext = React.createContext('');

function Text({ className, style, ...props }: React.ComponentProps<typeof NativeText>) {
  const inheritedClassName = React.useContext(TextClassContext);
  const { fontFaces, recipe } = usePreviewDesignSystem();
  const resolvedClassName = cn(recipe.typography.body, inheritedClassName, className);
  return (
    <NativeText
      className={resolvedClassName}
      style={[style, { fontFamily: getFontFace(resolvedClassName, fontFaces), fontWeight: 'normal' }]}
      {...props}
    />
  );
}

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> & {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
};

function Button({ className, variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const { recipe } = usePreviewDesignSystem();
  const textClassName = cn(
    variant === 'default' ? 'text-primary-foreground' : 'text-foreground',
    recipe.typography.button,
    recipe.components.button.text,
    size === 'sm' && recipe.components.button.smallText
  );
  return (
    <TextClassContext.Provider value={textClassName}>
      <Pressable
        role="button"
        hitSlop={10}
        className={cn(
          'flex-row items-center justify-center border shadow-sm shadow-black/5 transition-colors',
          className,
          recipe.components.button.container,
          variant === 'outline'
            ? recipe.components.button.outline
            : recipe.components.button.default,
          size === 'sm' && recipe.components.button.small
        )}
        {...props}
      >
        <SemanticIcon name={variant === 'outline' ? 'arrow-right' : 'check'} />
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

function Card({ className, ...props }: React.ComponentProps<typeof View>) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <View
      className={cn(
        'border-border flex flex-col overflow-hidden border bg-card py-6 text-card-foreground shadow-sm shadow-black/5',
        className,
        recipe.layout.stackLg,
        recipe.components.card.shell
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <View
      className={cn(
        'flex flex-col px-6',
        className,
        recipe.layout.stackSm,
        recipe.components.card.header
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<typeof View>) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <View
      className={cn('px-6', className, recipe.layout.stackMd, recipe.components.card.content)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <Text
      role="heading"
      className={cn(
        'text-card-foreground',
        className,
        recipe.components.card.title,
        recipe.typography.cardTitle
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <Text
      className={cn(
        'text-muted-foreground',
        className,
        recipe.components.card.description,
        recipe.typography.caption
      )}
      {...props}
    />
  );
}

function Input({ id, className, style, ...props }: React.ComponentProps<typeof TextInput> & { id?: string }) {
  const { fontFaces, recipe } = usePreviewDesignSystem();
  const resolvedClassName = cn(
    'text-foreground w-full min-w-0 shadow-sm shadow-black/5 outline-none placeholder:text-muted-foreground',
    className,
    recipe.typography.body,
    recipe.components.input
  );
  return (
    <TextInput
      nativeID={id}
      className={resolvedClassName}
      style={[style, { fontFamily: getFontFace(resolvedClassName, fontFaces), fontWeight: 'normal' }]}
      {...props}
    />
  );
}

function Label({ htmlFor: _htmlFor, className, ...props }: React.ComponentProps<typeof Text> & { htmlFor?: string }) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <Text
      className={cn('text-foreground', className, recipe.components.label, recipe.typography.label)}
      {...props}
    />
  );
}

function Badge({ className, ...props }: React.ComponentProps<typeof View> & { variant?: 'outline' }) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <TextClassContext.Provider
      value={cn('text-foreground', recipe.components.badge.text, recipe.typography.badge)}
    >
      <View
        className={cn(
          'border-border flex-row items-center border',
          className,
          recipe.components.badge.shell
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function Checkbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      hitSlop={14}
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        'shrink-0 items-center justify-center shadow-sm shadow-black/5',
        recipe.components.checkbox,
        checked && 'border-primary bg-primary'
      )}
    >
      {checked ? (
        <SemanticIcon name="check" size={11} className="text-primary-foreground" />
      ) : null}
    </Pressable>
  );
}

function Progress({ value }: { value: number }) {
  const { recipe } = usePreviewDesignSystem();
  return (
    <View className={cn('w-full overflow-hidden', recipe.components.progress)}>
      <View
        className={cn('h-full', recipe.components.progressIndicator)}
        style={{ width: `${value}%` }}
      />
    </View>
  );
}

function Separator() {
  const { recipe } = usePreviewDesignSystem();
  return <View className={cn('h-px w-full shrink-0', recipe.components.separator)} />;
}

const CHART_BG = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'] as const;
const STOCK_DATA = [38, 30, 44, 40, 58, 52, 71, 66, 88];
const STOCK_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const POWER_DATA = [
  { use: 45, solar: 20 },
  { use: 62, solar: 34 },
  { use: 50, solar: 27 },
  { use: 80, solar: 45 },
  { use: 66, solar: 52 },
  { use: 94, solar: 61 },
  { use: 72, solar: 47 },
];
const REVENUE = [
  { label: 'Subscriptions', value: '$18.2k', pct: 92 },
  { label: 'One-time', value: '$11.4k', pct: 64 },
  { label: 'Services', value: '$7.8k', pct: 44 },
  { label: 'Add-ons', value: '$4.1k', pct: 24 },
  { label: 'Other', value: '$1.9k', pct: 12 },
];
const TRAFFIC = [
  { label: 'Direct', pct: 38 },
  { label: 'Organic', pct: 27 },
  { label: 'Referral', pct: 18 },
  { label: 'Social', pct: 11 },
  { label: 'Email', pct: 6 },
];

function AreaLineChart({
  data,
  height = 76,
  strokeWidth = 2.5,
  labels,
  formatValue,
}: {
  data: number[];
  height?: number;
  strokeWidth?: number;
  labels?: string[];
  formatValue?: (value: number) => string;
}) {
  const [width, setWidth] = React.useState(0);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const pad = strokeWidth + 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const points = data.map((value, index) => {
    const x =
      data.length > 1
        ? pad + (index * (width - pad * 2)) / (data.length - 1)
        : width / 2;
    const y = pad + (1 - (value - min) / span) * (height - pad * 2);
    return [x, y] as [number, number];
  });

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`)
    .join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const area =
    first && last
      ? `${line} L ${last[0]} ${height - pad} L ${first[0]} ${height - pad} Z`
      : '';

  const trackAt = React.useCallback(
    (x: number) => {
      if (!width || points.length === 0) return;
      let closest = 0;
      let best = Infinity;
      points.forEach((point, index) => {
        const distance = Math.abs(point[0] - x);
        if (distance < best) {
          best = distance;
          closest = index;
        }
      });
      setHovered(closest);
    },
    [points, width]
  );

  const active = hovered !== null ? points[hovered] : null;
  const activeValue = hovered !== null ? data[hovered] : null;
  const activeLabel = hovered !== null ? labels?.[hovered] : undefined;
  const tooltipWidth = 84;

  return (
    <View
      className="text-chart-1 relative"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height }}
      // React Native Web exposes pointer offsets that are not in the native event type.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPointerMove={(event: any) => {
        const nativeEvent = event?.nativeEvent ?? {};
        trackAt(nativeEvent.offsetX ?? nativeEvent.locationX ?? 0);
      }}
      onPointerLeave={() => setHovered(null)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(event) => trackAt(event.nativeEvent.locationX)}
      onResponderMove={(event) => trackAt(event.nativeEvent.locationX)}
      onResponderRelease={() => setHovered(null)}
      onResponderTerminate={() => setHovered(null)}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          {!!area && <Path d={area} fill="currentColor" fillOpacity={0.15} />}
          <Path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {active && (
            <Path
              d={`M ${active[0]} ${pad} L ${active[0]} ${height - pad}`}
              stroke="currentColor"
              strokeOpacity={0.35}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point[0]}
              cy={point[1]}
              r={hovered === index ? strokeWidth * 2 : strokeWidth}
              fill="currentColor"
            />
          ))}
        </Svg>
      ) : null}

      {active && activeValue !== null ? (
        <View
          pointerEvents="none"
          className="border-border bg-popover absolute items-center rounded-lg border px-2 py-1 shadow-sm shadow-black/10"
          style={{
            width: tooltipWidth,
            left: Math.min(
              Math.max(active[0] - tooltipWidth / 2, 0),
              Math.max(width - tooltipWidth, 0)
            ),
            top: Math.max(active[1] - 42, 0),
          }}
        >
          {!!activeLabel && (
            <Text className="text-muted-foreground text-[10px] leading-tight">
              {activeLabel}
            </Text>
          )}
          <Text className="text-popover-foreground text-xs font-semibold leading-tight">
            {formatValue ? formatValue(activeValue) : String(activeValue)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function CustomizerDashboard({ topPad = 24 }: { topPad?: number }) {
  const { recipe } = usePreviewDesignSystem();
  const [checked1, setChecked1] = React.useState(true);
  const [checked2, setChecked2] = React.useState(true);
  const [checked3, setChecked3] = React.useState(false);
  const [checked4, setChecked4] = React.useState(false);
  const [powerProgress, setPowerProgress] = React.useState(85);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPowerProgress((previous) => (previous >= 100 ? 10 : previous + 5));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background w-full"
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: recipe.layout.pagePaddingBottom,
        paddingHorizontal: recipe.layout.pagePaddingX,
      }}
    >
      <View className={cn('flex-row flex-wrap', recipe.layout.grid)}>
        <View className={cn('w-full lg:w-1/3', recipe.layout.column)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Account Access</CardTitle>
              <CardDescription>Update your credentials or re-authenticate.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className={recipe.layout.field}>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" placeholder="artist@studio.inc" defaultValue="artist@studio.inc" />
              </View>
              <View className={recipe.layout.field}>
                <Label htmlFor="password">Current Password</Label>
                <Input id="password" secureTextEntry defaultValue="hunter2hunter2" />
              </View>
              <Button>
                <Text>Update Security</Text>
              </Button>
              <View className="mt-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5 gap-1">
                <Text className="text-xs font-semibold text-destructive">Danger Zone</Text>
                <Text className="text-[11px] text-muted-foreground">
                  Archive account and remove catalog.
                </Text>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-muted-foreground">Card Balance</Text>
                <Text className="text-2xl font-bold mt-1">US$12.94</Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5">
                  US$11,337.06 Available
                </Text>
              </View>
              <Button size="sm" variant="outline">
                <Text>Pay Early</Text>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Revenue by Category</CardTitle>
              <CardDescription>Last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="gap-3">
              {REVENUE.map((item, index) => (
                <View key={item.label} className="gap-1.5">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted-foreground">{item.label}</Text>
                    <Text className="text-xs font-semibold text-foreground">{item.value}</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-muted/40">
                    <View
                      className={cn('h-full rounded-full', CHART_BG[index])}
                      style={{ width: `${item.pct}%` }}
                    />
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Transfer Funds</CardTitle>
              <CardDescription>Move money between accounts.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className={recipe.layout.field}>
                <Label >Amount to Transfer</Label>
                <Input placeholder="$ 1,200.00" defaultValue="$ 1,200.00" keyboardType="decimal-pad" />
              </View>
              <View className={recipe.layout.field}>
                <Label >From Account</Label>
                <Input defaultValue="Main Checking (•8402) — $12,450.00" />
              </View>
              <View className={recipe.layout.field}>
                <Label >To Account</Label>
                <Input defaultValue="High Yield Savings (•1192) — $42,100.00" />
              </View>
              <Separator />
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Estimated arrival</Text>
                  <Text className="text-xs font-semibold text-foreground">Today, Apr 14</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Transaction fee</Text>
                  <Text className="text-xs font-semibold text-foreground">$0.00</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Total amount</Text>
                  <Text className="text-xs font-bold text-foreground">$1,200.00</Text>
                </View>
              </View>
              <Button className="w-full mt-2">
                <Text>Confirm Transfer</Text>
              </Button>
            </CardContent>
          </Card>
        </View>

        <View className={cn('w-full lg:w-1/3', recipe.layout.column)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Receiving Method</CardTitle>
              <CardDescription>Set how you receive payout transfers.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className={recipe.layout.field}>
                <Label >Account Holder Name</Label>
                <Input defaultValue="Synthetic Horizons Music LLC" />
              </View>
              <View className={recipe.layout.field}>
                <Label >IBAN / Account Number</Label>
                <Input defaultValue="DE89 3704 0044 •••• ••" />
              </View>
              <Button className="w-full">
                <Text>Save Payout Settings</Text>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Power Usage</CardTitle>
              <CardDescription>Whole Home analysis.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-2 rounded-lg bg-muted/20 px-3 py-3">
                <View className="h-24 flex-row items-end justify-between">
                  {POWER_DATA.map((item, index) => (
                    <View key={index} className="h-full flex-1 flex-row items-end justify-center gap-0.5">
                      <View className="w-2 rounded-t bg-chart-1" style={{ height: `${item.use}%` }} />
                      <View className="w-2 rounded-t bg-chart-2" style={{ height: `${item.solar}%` }} />
                    </View>
                  ))}
                </View>
                <View className="flex-row justify-between px-0.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                    <Text key={index} className="flex-1 text-center text-[9px] text-muted-foreground">
                      {label}
                    </Text>
                  ))}
                </View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-row items-center gap-1.5">
                  <View className="size-2 rounded-full bg-chart-1" />
                  <Text className="text-[10px] text-muted-foreground">Usage</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="size-2 rounded-full bg-chart-2" />
                  <Text className="text-[10px] text-muted-foreground">Solar</Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-[10px] text-muted-foreground">Currently Using</Text>
                  <Text className="text-sm font-semibold text-foreground">3.4 kW</Text>
                </View>
                <View>
                  <Text className="text-[10px] text-muted-foreground">Solar Gen</Text>
                  <Text className="text-sm font-semibold text-green-600">+1.2 kW</Text>
                </View>
              </View>
              <View className={recipe.layout.field}>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted-foreground">Battery Level</Text>
                  <Text className="text-xs font-semibold text-foreground">{powerProgress}%</Text>
                </View>
                <Progress value={powerProgress} />
              </View>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Upcoming Payments</CardTitle>
              <CardDescription>Scheduled subscription items.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm font-semibold text-foreground">Netflix Subscription</Text>
                  <Text className="text-xs text-muted-foreground">Apr 15, 2024</Text>
                </View>
                <Text className="text-sm font-bold text-foreground">$19.99</Text>
              </View>
              <Separator />
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm font-semibold text-foreground">Rent Payment</Text>
                  <Text className="text-xs text-muted-foreground">Apr 1, 2024</Text>
                </View>
                <Text className="text-sm font-bold text-foreground">$2,400.00</Text>
              </View>
              <Separator />
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm font-semibold text-foreground">Auto Insurance</Text>
                  <Text className="text-xs text-muted-foreground">Apr 22, 2024</Text>
                </View>
                <Text className="text-sm font-bold text-foreground">$186.00</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        <View className={cn('w-full lg:w-1/3', recipe.layout.column)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Stock Performance</CardTitle>
              <CardDescription>6-month price history.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">Ticker</Text>
                <Badge variant="outline">
                  <Text>VOO</Text>
                </Badge>
              </View>
              <View className="rounded-lg bg-muted/20 p-2">
                <AreaLineChart
                  data={STOCK_DATA}
                  labels={STOCK_LABELS}
                  formatValue={(value) => `$${value.toFixed(2)}`}
                />
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-muted-foreground">65% achieved</Text>
                <Text className="text-xs font-bold text-foreground">$273,000</Text>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Traffic Sources</CardTitle>
              <CardDescription>Sessions this month.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="h-3 flex-row overflow-hidden rounded-full">
                {TRAFFIC.map((item, index) => (
                  <View
                    key={item.label}
                    className={cn('h-full', CHART_BG[index])}
                    style={{ width: `${item.pct}%` }}
                  />
                ))}
              </View>
              <View className="gap-2">
                {TRAFFIC.map((item, index) => (
                  <View key={item.label} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className={cn('size-2.5 rounded-full', CHART_BG[index])} />
                      <Text className="text-xs text-muted-foreground">{item.label}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-foreground">{item.pct}%</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Set a milestone</CardTitle>
              <CardDescription>Define your financial target.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className={recipe.layout.field}>
                <Label >Goal Name</Label>
                <Input placeholder="e.g. New Car, Home Downpayment" />
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1 gap-1.5">
                  <Label >Target Amount</Label>
                  <Input placeholder="$15,000" keyboardType="decimal-pad" />
                </View>
                <View className="flex-1 gap-1.5">
                  <Label >Target Date</Label>
                  <Input placeholder="Dec 2025" />
                </View>
              </View>
              <View className="flex-row gap-2 mt-2">
                <Button className="flex-1">
                  <Text>Create Goal</Text>
                </Button>
                <Button variant="outline" className="flex-1">
                  <Text>Cancel</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Notifications</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row items-center gap-2">
                <Checkbox checked={checked1} onCheckedChange={setChecked1} />
                <Text className="text-xs font-semibold text-foreground">Transaction alerts</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Checkbox checked={checked2} onCheckedChange={setChecked2} />
                <Text className="text-xs font-semibold text-foreground">Security alerts</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Checkbox checked={checked3} onCheckedChange={setChecked3} />
                <Text className="text-xs font-semibold text-foreground">Goal milestones</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Checkbox checked={checked4} onCheckedChange={setChecked4} />
                <Text className="text-xs font-semibold text-foreground">Market updates</Text>
              </View>
              <Button className="w-full mt-2">
                <Text>Save Preferences</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
