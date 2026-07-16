import * as React from 'react';
import { View, ScrollView, StyleSheet, Pressable, useColorScheme, Platform } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';

// Component imports
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Extra dependencies for examples
import { Image } from 'react-native';
import { Home, Terminal } from 'lucide-react-native';

// Preset encoding/decoding utilities copied from lovda preset config
const PRESET_STYLES = ["new-york", "default", "luma", "lyra", "maia", "mira", "nova", "rhea", "sera", "vega"] as const;
const PRESET_BASE_COLORS = ["zinc", "slate", "stone", "gray", "neutral", "taupe", "mauve", "olive", "mist"] as const;
const PRESET_THEMES = ["zinc", "slate", "stone", "gray", "neutral", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"] as const;
const PRESET_CHART_COLORS = PRESET_THEMES;
const PRESET_FONTS = ["inter", "dm-sans", "nunito-sans", "figtree", "outfit", "manrope", "space-grotesk", "montserrat", "roboto", "raleway", "public-sans", "source-sans-3", "lora", "merriweather", "playfair-display", "jetbrains-mono", "space-mono", "fira-code", "noto-serif", "roboto-slab", "instrument-sans", "instrument-serif", "geist"] as const;
const PRESET_ICON_LIBRARIES = ["lucide", "phosphor", "tabler", "expo", "heroicons"] as const;
const PRESET_RADII = ["default", "none", "small", "medium", "large", "full"] as const;

const PRESET_FIELDS_V1 = [
  { key: "style", values: PRESET_STYLES, bits: 4 },
  { key: "baseColor", values: PRESET_BASE_COLORS, bits: 4 },
  { key: "theme", values: PRESET_THEMES, bits: 5 },
  { key: "chartColor", values: PRESET_CHART_COLORS, bits: 5 },
  { key: "font", values: PRESET_FONTS, bits: 5 },
  { key: "iconLibrary", values: PRESET_ICON_LIBRARIES, bits: 3 },
  { key: "radius", values: PRESET_RADII, bits: 3 },
] as const;

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function fromBase62(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62.indexOf(str.charAt(i));
    if (idx === -1) return -1;
    result = result * 62 + idx;
  }
  return result;
}

function decodePreset(code: string) {
  if (!code || code.length < 2) return null;
  if (code.charAt(0) !== "a") return null;
  const bits = fromBase62(code.slice(1));
  if (bits < 0) return null;

  const result: Record<string, string> = {};
  let offset = 0;
  for (const field of PRESET_FIELDS_V1) {
    const idx = Math.floor(bits / 2 ** offset) % 2 ** field.bits;
    const values = field.values as readonly string[];
    result[field.key] = idx < values.length ? values[idx]! : values[0]!;
    offset += field.bits;
  }
  return result;
}

// HSL mappings for base colors (background, card, border, etc.)
const BASE_COLORS_HSL: Record<string, {
  light: Record<string, string>;
  dark: Record<string, string>;
}> = {
  zinc: {
    light: { background: "0 0% 100%", foreground: "240 10% 3.9%", card: "0 0% 100%", "card-foreground": "240 10% 3.9%", popover: "0 0% 100%", "popover-foreground": "240 10% 3.9%", secondary: "240 4.8% 95.9%", "secondary-foreground": "240 5.9% 10%", muted: "240 4.8% 95.9%", "muted-foreground": "240 3.8% 46.1%", accent: "240 4.8% 95.9%", "accent-foreground": "240 5.9% 10%", destructive: "0 84.2% 60.2%", "destructive-foreground": "0 0% 98%", border: "240 5.9% 90%", input: "240 5.9% 90%", ring: "240 10% 3.9%" },
    dark: { background: "240 10% 3.9%", foreground: "0 0% 98%", card: "240 10% 3.9%", "card-foreground": "0 0% 98%", popover: "240 10% 3.9%", "popover-foreground": "0 0% 98%", secondary: "240 3.7% 15.9%", "secondary-foreground": "0 0% 98%", muted: "240 3.7% 15.9%", "muted-foreground": "240 5% 64.9%", accent: "240 3.7% 15.9%", "accent-foreground": "0 0% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "0 0% 98%", border: "240 3.7% 15.9%", input: "240 3.7% 15.9%", ring: "240 4.9% 83.9%" }
  },
  slate: {
    light: { background: "0 0% 100%", foreground: "222.2 84% 4.9%", card: "0 0% 100%", "card-foreground": "222.2 84% 4.9%", popover: "0 0% 100%", "popover-foreground": "222.2 84% 4.9%", secondary: "210 40% 96.1%", "secondary-foreground": "222.2 47.4% 11.2%", muted: "210 40% 96.1%", "muted-foreground": "215.4 16.3% 46.9%", accent: "210 40% 96.1%", "accent-foreground": "222.2 47.4% 11.2%", destructive: "0 84.2% 60.2%", "destructive-foreground": "210 40% 98%", border: "214.3 31.8% 91.4%", input: "214.3 31.8% 91.4%", ring: "222.2 84% 4.9%" },
    dark: { background: "222.2 84% 4.9%", foreground: "210 40% 98%", card: "222.2 84% 4.9%", "card-foreground": "210 40% 98%", popover: "222.2 84% 4.9%", "popover-foreground": "210 40% 98%", secondary: "217.2 32.6% 17.5%", "secondary-foreground": "210 40% 98%", muted: "217.2 32.6% 17.5%", "muted-foreground": "215 20.2% 65.1%", accent: "217.2 32.6% 17.5%", "accent-foreground": "210 40% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "210 40% 98%", border: "217.2 32.6% 17.5%", input: "217.2 32.6% 17.5%", ring: "212.7 26.8% 83.9%" }
  },
  stone: {
    light: { background: "0 0% 100%", foreground: "24 9.8% 10%", card: "0 0% 100%", "card-foreground": "24 9.8% 10%", popover: "0 0% 100%", "popover-foreground": "24 9.8% 10%", secondary: "60 4.8% 95.9%", "secondary-foreground": "24 9.8% 10%", muted: "60 4.8% 95.9%", "muted-foreground": "25 5.3% 44.7%", accent: "60 4.8% 95.9%", "accent-foreground": "24 9.8% 10%", destructive: "0 84.2% 60.2%", "destructive-foreground": "60 9.1% 97.8%", border: "20 5.9% 90%", input: "20 5.9% 90%", ring: "24 9.8% 10%" },
    dark: { background: "24 9.8% 10%", foreground: "60 9.1% 97.8%", card: "24 9.8% 10%", "card-foreground": "60 9.1% 97.8%", popover: "24 9.8% 10%", "popover-foreground": "60 9.1% 97.8%", secondary: "12 6.5% 15.1%", "secondary-foreground": "60 9.1% 97.8%", muted: "12 6.5% 15.1%", "muted-foreground": "24 5.4% 63.9%", accent: "12 6.5% 15.1%", "accent-foreground": "60 9.1% 97.8%", destructive: "0 62.8% 30.6%", "destructive-foreground": "60 9.1% 97.8%", border: "12 6.5% 15.1%", input: "12 6.5% 15.1%", ring: "24 5.7% 82.9%" }
  },
  gray: {
    light: { background: "0 0% 100%", foreground: "220 8.9% 4%", card: "0 0% 100%", "card-foreground": "220 8.9% 4%", popover: "0 0% 100%", "popover-foreground": "220 8.9% 4%", secondary: "220 14.3% 95.9%", "secondary-foreground": "220 8.9% 4%", muted: "220 14.3% 95.9%", "muted-foreground": "220 8.9% 46.1%", accent: "220 14.3% 95.9%", "accent-foreground": "220 8.9% 4%", destructive: "0 84.2% 60.2%", "destructive-foreground": "210 20% 98%", border: "220 13% 91%", input: "220 13% 91%", ring: "220 8.9% 4%" },
    dark: { background: "220 8.9% 4%", foreground: "210 20% 98%", card: "220 8.9% 4%", "card-foreground": "210 20% 98%", popover: "220 8.9% 4%", "popover-foreground": "210 20% 98%", secondary: "215 13.8% 12.4%", "secondary-foreground": "210 20% 98%", muted: "215 13.8% 12.4%", "muted-foreground": "217.9 10.6% 64.9%", accent: "215 13.8% 12.4%", "accent-foreground": "210 20% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "210 20% 98%", border: "215 13.8% 12.4%", input: "215 13.8% 12.4%", ring: "216 12.2% 83.9%" }
  },
  neutral: {
    light: { background: "0 0% 100%", foreground: "0 0% 3.9%", card: "0 0% 100%", "card-foreground": "0 0% 3.9%", popover: "0 0% 100%", "popover-foreground": "0 0% 3.9%", secondary: "0 0% 96.1%", "secondary-foreground": "0 0% 9%", muted: "0 0% 96.1%", "muted-foreground": "0 0% 45.1%", accent: "0 0% 96.1%", "accent-foreground": "0 0% 9%", destructive: "0 84.2% 60.2%", "destructive-foreground": "0 0% 98%", border: "0 0% 89.8%", input: "0 0% 89.8%", ring: "0 0% 3.9%" },
    dark: { background: "0 0% 3.9%", foreground: "0 0% 98%", card: "0 0% 3.9%", "card-foreground": "0 0% 98%", popover: "0 0% 3.9%", "popover-foreground": "0 0% 98%", secondary: "0 0% 14.9%", "secondary-foreground": "0 0% 98%", muted: "0 0% 14.9%", "muted-foreground": "0 0% 63.9%", accent: "0 0% 14.9%", "accent-foreground": "0 0% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "0 0% 98%", border: "0 0% 14.9%", input: "0 0% 14.9%", ring: "0 0% 83.1%" }
  },
  taupe: {
    light: { background: "0 0% 100%", foreground: "24 5% 10%", card: "0 0% 100%", "card-foreground": "24 5% 10%", popover: "0 0% 100%", "popover-foreground": "24 5% 10%", secondary: "30 6% 96%", "secondary-foreground": "24 5% 10%", muted: "30 6% 96%", "muted-foreground": "30 5% 45%", accent: "30 6% 96%", "accent-foreground": "24 5% 10%", destructive: "0 84.2% 60.2%", "destructive-foreground": "0 0% 98%", border: "30 5% 90%", input: "30 5% 90%", ring: "24 5% 10%" },
    dark: { background: "24 5% 10%", foreground: "30 6% 98%", card: "24 5% 10%", "card-foreground": "30 6% 98%", popover: "24 5% 10%", "popover-foreground": "30 6% 98%", secondary: "24 6% 16%", "secondary-foreground": "30 6% 98%", muted: "24 6% 16%", "muted-foreground": "30 5% 65%", accent: "24 6% 16%", "accent-foreground": "30 6% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "0 0% 98%", border: "24 6% 16%", input: "24 6% 16%", ring: "30 5% 83%" }
  },
  mauve: {
    light: { background: "0 0% 100%", foreground: "290 5% 10%", card: "0 0% 100%", "card-foreground": "290 5% 10%", popover: "0 0% 100%", "popover-foreground": "290 5% 10%", secondary: "290 6% 96%", "secondary-foreground": "290 5% 10%", muted: "290 6% 96%", "muted-foreground": "290 5% 45%", accent: "290 6% 96%", "accent-foreground": "290 5% 10%", destructive: "0 84.2% 60.2%", "destructive-foreground": "0 0% 98%", border: "290 5% 90%", input: "290 5% 90%", ring: "290 5% 10%" },
    dark: { background: "290 5% 10%", foreground: "290 6% 98%", card: "290 5% 10%", "card-foreground": "290 6% 98%", popover: "290 5% 10%", "popover-foreground": "290 6% 98%", secondary: "290 6% 16%", "secondary-foreground": "290 6% 98%", muted: "290 6% 16%", "muted-foreground": "290 5% 65%", accent: "290 6% 16%", "accent-foreground": "290 6% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "0 0% 98%", border: "290 6% 16%", input: "290 6% 16%", ring: "290 5% 83%" }
  },
  olive: {
    light: { background: "0 0% 100%", foreground: "110 5% 10%", card: "0 0% 100%", "card-foreground": "110 5% 10%", popover: "0 0% 100%", "popover-foreground": "110 5% 10%", secondary: "110 6% 96%", "secondary-foreground": "110 5% 10%", muted: "110 6% 96%", "muted-foreground": "110 5% 45%", accent: "110 6% 96%", "accent-foreground": "110 5% 10%", destructive: "0 84.2% 60.2%", "destructive-foreground": "0 0% 98%", border: "110 5% 90%", input: "110 5% 90%", ring: "110 5% 10%" },
    dark: { background: "110 5% 10%", foreground: "110 6% 98%", card: "110 5% 10%", "card-foreground": "110 6% 98%", popover: "110 5% 10%", "popover-foreground": "110 6% 98%", secondary: "110 6% 16%", "secondary-foreground": "110 6% 98%", muted: "110 6% 16%", "muted-foreground": "110 5% 65%", accent: "110 6% 16%", "accent-foreground": "110 6% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "0 0% 98%", border: "110 6% 16%", input: "110 6% 16%", ring: "110 5% 83%" }
  },
  mist: {
    light: { background: "0 0% 100%", foreground: "228 4% 5%", card: "0 0% 100%", "card-foreground": "228 4% 5%", popover: "0 0% 100%", "popover-foreground": "228 4% 5%", secondary: "197 2% 95%", "secondary-foreground": "223 6% 13%", muted: "197 2% 95%", "muted-foreground": "213 7% 45%", accent: "197 2% 95%", "accent-foreground": "223 6% 13%", destructive: "0 84.2% 60.2%", "destructive-foreground": "197 2% 98%", border: "214 5% 91%", input: "214 5% 91%", ring: "223 6% 13%" },
    dark: { background: "228 4% 5%", foreground: "197 2% 98%", card: "223 6% 13%", "card-foreground": "197 2% 98%", popover: "223 6% 13%", "popover-foreground": "197 2% 98%", secondary: "216 4% 17%", "secondary-foreground": "197 2% 98%", muted: "216 4% 17%", "muted-foreground": "214 6% 65%", accent: "216 4% 17%", "accent-foreground": "197 2% 98%", destructive: "0 62.8% 30.6%", "destructive-foreground": "197 2% 98%", border: "216 4% 17%", input: "216 4% 17%", ring: "213 7% 45%" }
  }
};

// Theme overrides for primary & primary-foreground HSL colors
const THEME_ACCENTS: Record<string, {
  light: { primary: string; foreground: string };
  dark: { primary: string; foreground: string };
}> = {
  zinc: { light: { primary: "240 5.9% 10%", foreground: "0 0% 98%" }, dark: { primary: "0 0% 98%", foreground: "240 5.9% 10%" } },
  slate: { light: { primary: "222.2 47.4% 11.2%", foreground: "210 40% 98%" }, dark: { primary: "210 40% 98%", foreground: "222.2 47.4% 11.2%" } },
  stone: { light: { primary: "24 9.8% 10%", foreground: "60 9.1% 97.8%" }, dark: { primary: "60 9.1% 97.8%", foreground: "24 9.8% 10%" } },
  gray: { light: { primary: "220 8.9% 4%", foreground: "210 20% 98%" }, dark: { primary: "210 20% 98%", foreground: "220 8.9% 4%" } },
  neutral: { light: { primary: "0 0% 9%", foreground: "0 0% 98%" }, dark: { primary: "0 0% 98%", foreground: "0 0% 9%" } },
  red: { light: { primary: "0 84.2% 60.2%", foreground: "0 0% 98%" }, dark: { primary: "0 72.2% 50.6%", foreground: "0 0% 98%" } },
  orange: { light: { primary: "24.6 95% 53.1%", foreground: "60 9.1% 97.8%" }, dark: { primary: "20.5 90.2% 48.2%", foreground: "60 9.1% 97.8%" } },
  amber: { light: { primary: "37.9 92.1% 50.2%", foreground: "20 14.3% 4.1%" }, dark: { primary: "37.9 92.1% 50.2%", foreground: "20 14.3% 4.1%" } },
  yellow: { light: { primary: "47.9 95.8% 51.2%", foreground: "26 83.3% 14.1%" }, dark: { primary: "47.9 95.8% 51.2%", foreground: "26 83.3% 14.1%" } },
  lime: { light: { primary: "84.8 81% 44%", foreground: "20 14.3% 4.1%" }, dark: { primary: "84.8 81% 44%", foreground: "20 14.3% 4.1%" } },
  green: { light: { primary: "142.1 76.2% 36.3%", foreground: "355.6 100% 99.7%" }, dark: { primary: "142.1 70.6% 45.3%", foreground: "144.4 61.5% 7.6%" } },
  emerald: { light: { primary: "161.4 93.5% 30.4%", foreground: "355.6 100% 99.7%" }, dark: { primary: "161.4 93.5% 30.4%", foreground: "355.6 100% 99.7%" } },
  teal: { light: { primary: "174.7 83.9% 31.6%", foreground: "355.6 100% 99.7%" }, dark: { primary: "174.7 83.9% 31.6%", foreground: "355.6 100% 99.7%" } },
  cyan: { light: { primary: "188.7 94.5% 42.7%", foreground: "210 40% 98%" }, dark: { primary: "188.7 94.5% 42.7%", foreground: "210 40% 98%" } },
  sky: { light: { primary: "198.6 88.7% 48.4%", foreground: "210 40% 98%" }, dark: { primary: "198.6 88.7% 48.4%", foreground: "210 40% 98%" } },
  blue: { light: { primary: "221.2 83.2% 53.3%", foreground: "210 40% 98%" }, dark: { primary: "217.2 91.2% 59.8%", foreground: "222.2 47.4% 11.2%" } },
  indigo: { light: { primary: "238.9 70% 50.4%", foreground: "210 40% 98%" }, dark: { primary: "238.9 70% 50.4%", foreground: "210 40% 98%" } },
  violet: { light: { primary: "262.1 83.3% 57.8%", foreground: "210 40% 98%" }, dark: { primary: "263.4 70% 50.4%", foreground: "210 40% 98%" } },
  purple: { light: { primary: "270.7 91% 38.4%", foreground: "210 40% 98%" }, dark: { primary: "270.7 91% 38.4%", foreground: "210 40% 98%" } },
  fuchsia: { light: { primary: "292.2 84.1% 49%", foreground: "210 40% 98%" }, dark: { primary: "292.2 84.1% 49%", foreground: "210 40% 98%" } },
  pink: { light: { primary: "327.3 73.6% 50.4%", foreground: "210 40% 98%" }, dark: { primary: "327.3 73.6% 50.4%", foreground: "210 40% 98%" } },
  rose: { light: { primary: "346.8 77.2% 49.8%", foreground: "355.6 100% 99.7%" }, dark: { primary: "346.8 77.2% 49.8%", foreground: "355.6 100% 99.7%" } },
};

// Dashboard Component rendering a premium 3-column desktop layout of cards
const DashboardComponent = ({ topPad = 64 }: { topPad?: number }) => {
  const [checked1, setChecked1] = React.useState(true);
  const [checked2, setChecked2] = React.useState(true);
  const [checked3, setChecked3] = React.useState(false);
  const [checked4, setChecked4] = React.useState(false);
  const [powerProgress, setPowerProgress] = React.useState(85);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPowerProgress((prev) => (prev >= 100 ? 10 : prev + 5));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView className="flex-1 bg-background w-full" contentContainerStyle={{ paddingTop: topPad, paddingBottom: 48, paddingHorizontal: 24 }}>
      <View className="flex-row flex-wrap -mx-3 gap-y-6">
        {/* Column 1 */}
        <View className="w-full lg:w-1/3 px-3 gap-6">
          {/* Card 1: Account Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Account Access</CardTitle>
              <CardDescription>Update your credentials or re-authenticate.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-1.5">
                <Label htmlFor="email"><Text className="text-xs font-semibold">Email Address</Text></Label>
                <Input id="email" placeholder="artist@studio.inc" value="artist@studio.inc" readOnly />
              </View>
              <View className="gap-1.5">
                <Label htmlFor="password"><Text className="text-xs font-semibold">Current Password</Text></Label>
                <Input id="password" secureTextEntry value="••••••••••••" readOnly />
              </View>
              <Button>
                <Text>Update Security</Text>
              </Button>
              <View className="mt-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5 gap-1">
                <Text className="text-xs font-semibold text-destructive">Danger Zone</Text>
                <Text className="text-[11px] text-muted-foreground">Archive account and remove catalog.</Text>
              </View>
            </CardContent>
          </Card>

          {/* Card 2: Card Balance */}
          <Card>
            <CardContent className="pt-6 flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-muted-foreground">Card Balance</Text>
                <Text className="text-2xl font-bold mt-1">US$12.94</Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5">US$11,337.06 Available</Text>
              </View>
              <Button size="sm" variant="outline">
                <Text>Pay Early</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Transfer Funds */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Transfer Funds</CardTitle>
              <CardDescription>Move money between accounts.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-1.5">
                <Label><Text className="text-xs font-semibold">Amount to Transfer</Text></Label>
                <Input placeholder="$ 1,200.00" value="$ 1,200.00" readOnly />
              </View>
              <View className="gap-1.5">
                <Label><Text className="text-xs font-semibold">From Account</Text></Label>
                <Input value="Main Checking (•8402) — $12,450.00" readOnly />
              </View>
              <View className="gap-1.5">
                <Label><Text className="text-xs font-semibold">To Account</Text></Label>
                <Input value="High Yield Savings (•1192) — $42,100.00" readOnly />
              </View>
              <Separator />
              <View className="gap-2">
                <View className="flex-row justify-between"><Text className="text-xs text-muted-foreground">Estimated arrival</Text><Text className="text-xs font-semibold text-foreground">Today, Apr 14</Text></View>
                <View className="flex-row justify-between"><Text className="text-xs text-muted-foreground">Transaction fee</Text><Text className="text-xs font-semibold text-foreground">$0.00</Text></View>
                <View className="flex-row justify-between"><Text className="text-xs text-muted-foreground">Total amount</Text><Text className="text-xs font-bold text-foreground">$1,200.00</Text></View>
              </View>
              <Button className="w-full mt-2">
                <Text>Confirm Transfer</Text>
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Column 2 */}
        <View className="w-full lg:w-1/3 px-3 gap-6">
          {/* Card 4: Payout Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Receiving Method</CardTitle>
              <CardDescription>Set how you receive payout transfers.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-1.5">
                <Label><Text className="text-xs font-semibold">Account Holder Name</Text></Label>
                <Input value="Synthetic Horizons Music LLC" readOnly />
              </View>
              <View className="gap-1.5">
                <Label><Text className="text-xs font-semibold">IBAN / Account Number</Text></Label>
                <Input value="DE89 3704 0044 •••• ••" readOnly />
              </View>
              <Button className="w-full">
                <Text>Save Payout Settings</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Card 5: Power Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Power Usage</CardTitle>
              <CardDescription>Whole Home analysis.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              {/* Fake Bar Chart */}
              <View className="flex-row justify-between items-end h-28 px-4 py-4 bg-muted/20 rounded-lg">
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '30%' }} />
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '55%' }} />
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '40%' }} />
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '75%' }} />
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '60%' }} />
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '90%' }} />
                <View className="w-4 bg-chart-1 rounded-t" style={{ height: '50%' }} />
              </View>
              <View className="flex-row justify-between">
                <View><Text className="text-[10px] text-muted-foreground">Currently Using</Text><Text className="text-sm font-semibold text-foreground">3.4 kW</Text></View>
                <View><Text className="text-[10px] text-muted-foreground">Solar Gen</Text><Text className="text-sm font-semibold text-green-600">+1.2 kW</Text></View>
              </View>
              <View className="gap-1.5">
                <View className="flex-row justify-between"><Text className="text-xs text-muted-foreground">Battery Level</Text><Text className="text-xs font-semibold text-foreground">{powerProgress}%</Text></View>
                <Progress value={powerProgress} />
              </View>
            </CardContent>
          </Card>

          {/* Card 6: Upcoming Payments */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Upcoming Payments</CardTitle>
              <CardDescription>Scheduled subscription items.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row justify-between items-center">
                <View><Text className="text-sm font-semibold text-foreground">Netflix Subscription</Text><Text className="text-xs text-muted-foreground">Apr 15, 2024</Text></View>
                <Text className="text-sm font-bold text-foreground">$19.99</Text>
              </View>
              <Separator />
              <View className="flex-row justify-between items-center">
                <View><Text className="text-sm font-semibold text-foreground">Rent Payment</Text><Text className="text-xs text-muted-foreground">Apr 1, 2024</Text></View>
                <Text className="text-sm font-bold text-foreground">$2,400.00</Text>
              </View>
              <Separator />
              <View className="flex-row justify-between items-center">
                <View><Text className="text-sm font-semibold text-foreground">Auto Insurance</Text><Text className="text-xs text-muted-foreground">Apr 22, 2024</Text></View>
                <Text className="text-sm font-bold text-foreground">$186.00</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Column 3 */}
        <View className="w-full lg:w-1/3 px-3 gap-6">
          {/* Card 7: Stock Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Stock Performance</CardTitle>
              <CardDescription>6-month price history.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted-foreground">Ticker</Text>
                <Badge variant="outline"><Text>VOO</Text></Badge>
              </View>
              {/* Fake Trend Line */}
              <View className="h-16 justify-center bg-muted/20 rounded-lg p-2 overflow-hidden flex-row items-center gap-1">
                <View className="w-full h-[2px] bg-chart-1 relative flex-row justify-between">
                  <View className="size-2 rounded-full bg-chart-1 -top-1" />
                  <View className="size-2 rounded-full bg-chart-1 -top-3" />
                  <View className="size-2 rounded-full bg-chart-1 -top-1" />
                  <View className="size-2 rounded-full bg-chart-1 -top-2" />
                  <View className="size-2 rounded-full bg-chart-1 -top-4" />
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-[11px] text-muted-foreground">65% achieved</Text>
                <Text className="text-xs font-bold text-foreground">$273,000</Text>
              </View>
            </CardContent>
          </Card>

          {/* Card 8: Set Milestone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Set a milestone</CardTitle>
              <CardDescription>Define your financial target.</CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="gap-1.5">
                <Label><Text className="text-xs font-semibold">Goal Name</Text></Label>
                <Input placeholder="e.g. New Car, Home Downpayment" readOnly />
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1 gap-1.5">
                  <Label><Text className="text-xs font-semibold">Target Amount</Text></Label>
                  <Input placeholder="$15,000" readOnly />
                </View>
                <View className="flex-1 gap-1.5">
                  <Label><Text className="text-xs font-semibold">Target Date</Text></Label>
                  <Input placeholder="Dec 2025" readOnly />
                </View>
              </View>
              <View className="flex-row gap-2 mt-2">
                <Button className="flex-1"><Text>Create Goal</Text></Button>
                <Button variant="outline" className="flex-1"><Text>Cancel</Text></Button>
              </View>
            </CardContent>
          </Card>

          {/* Card 9: Notifications */}
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
};

// Showcase Component rendering a dynamic dashboard mockup of key controls
const ShowcaseComponent = ({ topPad = 60 }: { topPad?: number }) => {
  const [checked, setChecked] = React.useState(false);
  const [airplane, setAirplane] = React.useState(false);
  const [progressVal, setProgressVal] = React.useState(33);
  const [activeTab, setActiveTab] = React.useState('general');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgressVal((prev) => (prev >= 100 ? 10 : prev + 10));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView className="flex-1 bg-background w-full" contentContainerStyle={{ paddingTop: topPad, paddingBottom: 32, paddingHorizontal: 16, gap: 16 }}>
      {/* Header Info */}
      <Card className="w-full">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <View>
            <CardTitle className="text-xl font-bold">Showcase Preview</CardTitle>
            <CardDescription>Live styling customizer</CardDescription>
          </View>
          <Badge>
            <Text>Live</Text>
          </Badge>
        </CardHeader>
        <CardContent className="gap-4">
          <Text>
            This dashboard displays your real-time styling, base colors, font selections, and roundness.
          </Text>
          <View className="flex-row gap-2">
            <Badge variant="outline">
              <Text>v4.0</Text>
            </Badge>
          </View>
        </CardContent>
      </Card>

      {/* Interactive Controls */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Interactive Controls</CardTitle>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="flex-row items-center gap-2">
            <Checkbox id="showcase-checkbox" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="showcase-checkbox" onPress={() => setChecked(!checked)}>
              <Text>Enable features</Text>
            </Label>
          </View>

          <View className="flex-row items-center justify-between">
            <Label htmlFor="showcase-switch" onPress={() => setAirplane(!airplane)}>
              <Text>Airplane Mode</Text>
            </Label>
            <Switch id="showcase-switch" checked={airplane} onCheckedChange={setAirplane} />
          </View>

          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">System Loading</Text>
              <Text className="text-xs text-muted-foreground">{progressVal}%</Text>
            </View>
            <Progress value={progressVal} />
          </View>

          <View className="flex-row gap-2">
            <Button className="flex-1">
              <Text>Primary Action</Text>
            </Button>
            <Button variant="outline" className="flex-1">
              <Text>Cancel</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex-row">
              <TabsTrigger value="general" className="flex-1">
                <Text>General</Text>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1">
                <Text>Security</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="p-4 border border-t-0 border-border rounded-b-lg gap-2">
              <Text variant="large">Profile Details</Text>
              <Input placeholder="John Doe" value="John Doe" readOnly />
              <Input placeholder="john@example.com" value="john@example.com" readOnly />
            </TabsContent>
            <TabsContent value="security" className="p-4 border border-t-0 border-border rounded-b-lg gap-2">
              <Text variant="large">Change Password</Text>
              <Input placeholder="Current Password" secureTextEntry readOnly />
              <Input placeholder="New Password" secureTextEntry readOnly />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ScrollView>
  );
};

const COMPONENT_RENDERERS: Record<string, () => React.ReactNode> = {
  dashboard: () => <DashboardComponent />,
  showcase: () => <ShowcaseComponent />,
  accordion: () => (
    <Accordion type="single" collapsible className="w-full max-w-sm">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <Text>Is it accessible?</Text>
        </AccordionTrigger>
        <AccordionContent>
          <Text>Yes. It adheres to the WAI-ARIA design pattern.</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  alert: () => (
    <Alert icon={Terminal} className="w-full max-w-sm">
      <AlertTitle>
        <Text>Heads up!</Text>
      </AlertTitle>
      <AlertDescription>
        <Text>You can add components to your app using the CLI.</Text>
      </AlertDescription>
    </Alert>
  ),
  "alert-dialog": () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Text>Show Dialog</Text>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Text>Are you sure?</Text>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Text>This action cannot be undone.</Text>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>Cancel</Text>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Text>Continue</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  "aspect-ratio": () => (
    <View className="w-full max-w-sm">
      <AspectRatio ratio={16 / 9}>
        <Image
          source={{ uri: "https://picsum.photos/800/450" }}
          style={{ width: '100%', height: '100%', borderRadius: 8 }}
          resizeMode="cover"
        />
      </AspectRatio>
    </View>
  ),
  avatar: () => (
    <Avatar alt="User">
      <AvatarImage source={{ uri: "https://github.com/shadcn.png" }} />
      <AvatarFallback>
        <Text>CN</Text>
      </AvatarFallback>
    </Avatar>
  ),
  badge: () => (
    <Badge>
      <Text>Badge</Text>
    </Badge>
  ),
  button: () => (
    <Button>
      <Text>Button</Text>
    </Button>
  ),
  card: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <Text>Card Title</Text>
        </CardTitle>
        <CardDescription>
          <Text>Card description</Text>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Text>Card content</Text>
      </CardContent>
      <CardFooter>
        <Text>Card footer</Text>
      </CardFooter>
    </Card>
  ),
  checkbox: () => {
    const [checked, setChecked] = React.useState(false);
    return (
      <View className="flex-row items-center gap-2">
        <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor="terms" onPress={() => setChecked(!checked)}>
          <Text>Accept terms and conditions</Text>
        </Label>
      </View>
    );
  },
  collapsible: () => (
    <Collapsible className="w-full max-w-sm">
      <CollapsibleTrigger className="p-2 border border-border rounded-md">
        <Text className="text-center">Toggle collapsible panel</Text>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <View className="p-4 border border-t-0 border-border rounded-b-md bg-muted/20">
          <Text>Collapsible content</Text>
        </View>
      </CollapsibleContent>
    </Collapsible>
  ),
  "context-menu": () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <View className="rounded-md border border-dashed border-border p-8 min-w-[200px] items-center justify-center">
          <Text className="text-muted-foreground">Long press here</Text>
        </View>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <Text>Back</Text>
        </ContextMenuItem>
        <ContextMenuItem>
          <Text>Forward</Text>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  dialog: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Text>Open Dialog</Text>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Text>Dialog title</Text>
          </DialogTitle>
          <DialogDescription>
            <Text>Dialog description</Text>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
  "dropdown-menu": () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Text>Open Dropdown</Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Text>Profile</Text>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Text>Settings</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  "hover-card": () => (
    <HoverCard>
      <HoverCardTrigger>
        <Text className="underline text-primary">@lvcn</Text>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text>Beautifully designed React Native components.</Text>
      </HoverCardContent>
    </HoverCard>
  ),
  icon: () => <Icon as={Home} className="size-6 text-foreground" />,
  input: () => {
    const [val, setVal] = React.useState('');
    return (
      <View className="w-full max-w-sm">
        <Input placeholder="Email" keyboardType="email-address" value={val} onChangeText={setVal} />
      </View>
    );
  },
  label: () => (
    <Label>
      <Text className="font-bold">Email Address</Text>
    </Label>
  ),
  menubar: () => (
    <Menubar>
      <MenubarMenu value="file">
        <MenubarTrigger>
          <Text>File</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Text>New Tab</Text>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
  "native-only-animated-view": () => (
    <NativeOnlyAnimatedView className="p-4 bg-muted/30 border border-border rounded-lg">
      <Text>Animated on native, plain view on web.</Text>
    </NativeOnlyAnimatedView>
  ),
  popover: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Text>Open Popover</Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Text>Place content for the popover here.</Text>
      </PopoverContent>
    </Popover>
  ),
  progress: () => (
    <View className="w-full max-w-sm p-4">
      <Progress value={33} />
    </View>
  ),
  "radio-group": () => {
    const [value, setValue] = React.useState('comfortable');
    return (
      <RadioGroup value={value} onValueChange={setValue} className="gap-2">
        <View className="flex-row items-center gap-2">
          <RadioGroupItem value="default" id="r1" />
          <Label htmlFor="r1" onPress={() => setValue('default')}>
            <Text>Default</Text>
          </Label>
        </View>
        <View className="flex-row items-center gap-2">
          <RadioGroupItem value="comfortable" id="r2" />
          <Label htmlFor="r2" onPress={() => setValue('comfortable')}>
            <Text>Comfortable</Text>
          </Label>
        </View>
      </RadioGroup>
    );
  },
  select: () => {
    const [value, setValue] = React.useState<{ value: string; label: string }>({ value: 'apple', label: 'Apple' });
    return (
      <View className="w-full max-w-sm">
        <Select value={value} onValueChange={(val) => val && setValue(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple" label="Apple" />
            <SelectItem value="banana" label="Banana" />
          </SelectContent>
        </Select>
      </View>
    );
  },
  separator: () => (
    <View className="w-full max-w-sm items-center gap-2">
      <Text>Above</Text>
      <Separator className="my-2" />
      <Text>Below</Text>
    </View>
  ),
  skeleton: () => (
    <View className="flex-row items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <View className="gap-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[160px]" />
      </View>
    </View>
  ),
  switch: () => {
    const [checked, setChecked] = React.useState(false);
    return (
      <View className="flex-row items-center gap-2">
        <Switch id="airplane" checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor="airplane" onPress={() => setChecked(!checked)}>
          <Text>Airplane Mode</Text>
        </Label>
      </View>
    );
  },
  tabs: () => {
    const [value, setValue] = React.useState('account');
    return (
      <Tabs value={value} onValueChange={setValue} className="w-full max-w-sm">
        <TabsList className="flex-row">
          <TabsTrigger value="account" className="flex-1">
            <Text>Account</Text>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1">
            <Text>Password</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="p-4 border border-t-0 border-border rounded-b-lg">
          <Text>Make changes to your account here.</Text>
        </TabsContent>
        <TabsContent value="password" className="p-4 border border-t-0 border-border rounded-b-lg">
          <Text>Change your password here.</Text>
        </TabsContent>
      </Tabs>
    );
  },
  text: () => (
    <View className="gap-2 items-center">
      <Text variant="h1">Heading 1</Text>
      <Text variant="large">Large text</Text>
      <Text>Default body text</Text>
      <Text variant="muted">Muted text</Text>
    </View>
  ),
  textarea: () => {
    const [val, setVal] = React.useState('');
    return (
      <View className="w-full max-w-sm">
        <Textarea placeholder="Type your message here." value={val} onChangeText={setVal} />
      </View>
    );
  },
  toggle: () => {
    const [active, setActive] = React.useState(false);
    return (
      <Toggle aria-label="Toggle italic" pressed={active} onPressedChange={setActive}>
        <Text>Italic</Text>
      </Toggle>
    );
  },
  "toggle-group": () => {
    const [value, setValue] = React.useState('a');
    return (
      <ToggleGroup type="single" value={value} onValueChange={(val) => val && setValue(val)}>
        <ToggleGroupItem value="a">
          <Text>A</Text>
        </ToggleGroupItem>
        <ToggleGroupItem value="b">
          <Text>B</Text>
        </ToggleGroupItem>
        <ToggleGroupItem value="c">
          <Text>C</Text>
        </ToggleGroupItem>
      </ToggleGroup>
    );
  },
  tooltip: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">
          <Text>Hover or Tap</Text>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <Text>Add to library</Text>
      </TooltipContent>
    </Tooltip>
  ),
};


// Premium fake StatusBar inside the phone frame
const StatusBar = () => {
  const [time, setTime] = React.useState('9:41 AM');

  React.useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View className="absolute top-0 left-0 right-0 h-10 px-6 flex-row items-center justify-between z-50 bg-background/80 border-b border-border/10 backdrop-blur-md">
      <Text className="text-xs font-semibold">{time}</Text>
      <View className="flex-row items-center gap-1.5">
        <Text className="text-[10px]">📶</Text>
        <Text className="text-[10px]">🔋</Text>
      </View>
    </View>
  );
};

export default function PresentPage() {
  const { component, preset, chrome, colorScheme: urlColorScheme } = useLocalSearchParams<{
    component: string;
    preset?: string;
    chrome?: string;
    colorScheme?: 'light' | 'dark';
  }>();
  const systemColorScheme = useColorScheme();
  const activeColorScheme = urlColorScheme || systemColorScheme || 'light';

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const isDark = activeColorScheme === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (!preset) return;

    const config = decodePreset(preset);
    if (!config) return;

    const baseColor = config.baseColor || 'zinc';
    const themeName = config.theme || 'zinc';
    const chartColor = config.chartColor || 'blue';
    const radius = config.radius || 'default';
    const font = config.font || 'inter';

    // 1. Get base color variables
    const baseColorSet = BASE_COLORS_HSL[baseColor] || BASE_COLORS_HSL.zinc;
    const activeColors = isDark ? baseColorSet.dark : baseColorSet.light;

    // Apply base colors
    for (const [key, val] of Object.entries(activeColors)) {
      root.style.setProperty(`--${key}`, val);
    }

    // Apply theme override for primary
    const themeSet = THEME_ACCENTS[themeName] || THEME_ACCENTS.zinc;
    const activeTheme = isDark ? themeSet.dark : themeSet.light;
    root.style.setProperty('--primary', activeTheme.primary);
    root.style.setProperty('--primary-foreground', activeTheme.foreground);
    root.style.setProperty('--ring', activeTheme.primary); // usually matches primary

    // Apply the selected chart color independently from the interface accent.
    const chartTheme = THEME_ACCENTS[chartColor] || THEME_ACCENTS.blue;
    const activeChart = isDark ? chartTheme.dark : chartTheme.light;
    root.style.setProperty('--chart-1', activeChart.primary);
    root.style.setProperty('--chart-2', activeChart.primary);
    root.style.setProperty('--chart-3', activeChart.primary);
    root.style.setProperty('--chart-4', activeChart.primary);
    root.style.setProperty('--chart-5', activeChart.primary);

    // 2. Set radius
    const RADIUS_MAP: Record<string, string> = {
      default: "0.5rem",
      none: "0rem",
      small: "0.125rem",
      medium: "0.625rem",
      large: "0.75rem",
      full: "1.5rem"
    };
    const radiusValue = RADIUS_MAP[radius] || "0.5rem";
    root.style.setProperty('--radius', radiusValue);

    // 3. Inject Google Font dynamically
    const FONT_MAP: Record<string, string> = {
      "inter": "Inter",
      "dm-sans": "DM Sans",
      "nunito-sans": "Nunito Sans",
      "figtree": "Figtree",
      "outfit": "Outfit",
      "manrope": "Manrope",
      "space-grotesk": "Space Grotesk",
      "montserrat": "Montserrat",
      "roboto": "Roboto",
      "raleway": "Raleway",
      "public-sans": "Public Sans",
      "source-sans-3": "Source Sans 3",
      "lora": "Lora",
      "merriweather": "Merriweather",
      "playfair-display": "Playfair Display",
      "jetbrains-mono": "JetBrains Mono",
      "space-mono": "Space Mono",
      "fira-code": "Fira Code",
      "noto-serif": "Noto Serif",
      "roboto-slab": "Roboto Slab",
      "instrument-sans": "Instrument Sans",
      "instrument-serif": "Instrument Serif",
      "geist": "Geist",
    };
    const fontName = FONT_MAP[font] || "Inter";

    let fontLink = document.getElementById('google-font-customizer') as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = 'google-font-customizer';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;700&display=swap`;
    
    root.style.setProperty('--font-sans', `'${fontName}', sans-serif`);
  }, [preset, activeColorScheme]);

  if (!component || !COMPONENT_RENDERERS[component]) {
    return (
      <ScrollView className="flex-1 bg-background p-6">
        <Text variant="h2" className="mb-4">Component Presenter</Text>
        <Text variant="muted" className="mb-6">Select a component to preview:</Text>
        <View className="flex-row flex-wrap gap-2">
          {Object.keys(COMPONENT_RENDERERS).map((name) => (
            <Link key={name} href={`/present?component=${name}`} asChild>
              <Pressable style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <View className="rounded-lg border border-border bg-card px-4 py-2">
                  <Text>{name}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    );
  }

  const Renderer = COMPONENT_RENDERERS[component];

  if (component === 'showcase' || component === 'dashboard') {
    // `chrome=web` renders a desktop-style preview (no phone status bar, smaller top inset).
    // Anything else (e.g. `chrome=mobile`) keeps the phone status bar.
    const isWeb = chrome === 'web';
    const topPad = isWeb ? 24 : component === 'dashboard' ? 64 : 60;
    const Component = component === 'dashboard' ? DashboardComponent : ShowcaseComponent;
    return (
      <View
        className="flex-1 bg-background w-full relative"
        style={Platform.OS === 'web' ? ({ height: '100vh' } as any) : undefined}
      >
        {!isWeb && <StatusBar />}
        <Component topPad={topPad} />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-6 bg-background w-full">
      <Renderer />
    </View>
  );
}
