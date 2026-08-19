import {
  Activity as GlyphActivity,
  Apple as GlyphApple,
  ArrowRight as GlyphArrowRight,
  Bell as GlyphBell,
  BookOpen as GlyphBookOpen,
  Bot as GlyphBot,
  Calendar as GlyphCalendar,
  ChartNoAxesCombined as GlyphChartNoAxesCombined,
  Check as GlyphCheck,
  ChevronDown as GlyphChevronDown,
  ChevronLeft as GlyphChevronLeft,
  ChevronRight as GlyphChevronRight,
  ChevronsUpDown as GlyphChevronsUpDown,
  ChevronUp as GlyphChevronUp,
  X as GlyphX,
  Command as GlyphCommand,
  CreditCard as GlyphCreditCard,
  DollarSign as GlyphDollarSign,
  CircleX as GlyphCircleX,
  Frame as GlyphFrame,
  GalleryVerticalEnd as GlyphGalleryVerticalEnd,
  GitFork as GlyphGitFork,
  Home as GlyphHome,
  Info as GlyphInfo,
  LayoutDashboard as GlyphLayoutDashboard,
  LifeBuoy as GlyphLifeBuoy,
  LoaderCircle as GlyphLoaderCircle,
  Loader2 as GlyphLoader2,
  PanelLeft as GlyphPanelLeft,
  CheckCircle2 as GlyphCheckCircle2,
  AlertCircle as GlyphAlertCircle,
  Lock as GlyphLock,
  Mail as GlyphMail,
  Menu as GlyphMenu,
  Minus as GlyphMinus,
  Ellipsis as GlyphEllipsis,
  Package as GlyphPackage,
  ChartPie as GlyphChartPie,
  Plus as GlyphPlus,
  Search as GlyphSearch,
  Settings as GlyphSettings,
  Settings2 as GlyphSettings2,
  ShoppingCart as GlyphShoppingCart,
  SquareTerminal as GlyphSquareTerminal,
  CircleCheck as GlyphCircleCheck,
  TrendingDown as GlyphTrendingDown,
  TrendingUp as GlyphTrendingUp,
  User as GlyphUser,
  Users as GlyphUsers,
  WalletCards as GlyphWalletCards,
  TriangleAlert as GlyphTriangleAlert,
} from "lucide-react-native"
import * as React from 'react';

export type SemanticIconProps = {
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  accessibilityLabel?: string;
  decorative?: boolean;
  [key: string]: unknown;
};
export type SemanticIconComponent = React.ComponentType<SemanticIconProps>;

function createSemanticIcon(Glyph: React.ComponentType<any>, displayName: string): SemanticIconComponent {
  const Component = React.forwardRef<any, SemanticIconProps>(function SemanticIcon(
    {
      size = 16,
      color = 'currentColor',
      className,
      strokeWidth = 2,
      weight = 'regular',
      accessibilityLabel,
      decorative = !accessibilityLabel,
      ...props
    },
    ref
  ) {
    return <Glyph ref={ref} size={size} color={color} className={className} strokeWidth={strokeWidth} accessibilityLabel={decorative ? undefined : accessibilityLabel} aria-hidden={decorative} accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'} {...props} />;
  });
  Component.displayName = displayName;
  return Component;
}

export const Activity = createSemanticIcon(GlyphActivity, "Activity");
export const Apple = createSemanticIcon(GlyphApple, "Apple");
export const ArrowRight = createSemanticIcon(GlyphArrowRight, "ArrowRight");
export const Bell = createSemanticIcon(GlyphBell, "Bell");
export const BookOpen = createSemanticIcon(GlyphBookOpen, "BookOpen");
export const Bot = createSemanticIcon(GlyphBot, "Bot");
export const Calendar = createSemanticIcon(GlyphCalendar, "Calendar");
export const Chart = createSemanticIcon(GlyphChartNoAxesCombined, "Chart");
export const Check = createSemanticIcon(GlyphCheck, "Check");
export const ChevronDown = createSemanticIcon(GlyphChevronDown, "ChevronDown");
export const ChevronDownIcon = createSemanticIcon(GlyphChevronDown, "ChevronDownIcon");
export const ChevronLeft = createSemanticIcon(GlyphChevronLeft, "ChevronLeft");
export const ChevronRight = createSemanticIcon(GlyphChevronRight, "ChevronRight");
export const ChevronsUpDown = createSemanticIcon(GlyphChevronsUpDown, "ChevronsUpDown");
export const ChevronUp = createSemanticIcon(GlyphChevronUp, "ChevronUp");
export const ChevronUpIcon = createSemanticIcon(GlyphChevronUp, "ChevronUpIcon");
export const X = createSemanticIcon(GlyphX, "X");
export const Command = createSemanticIcon(GlyphCommand, "Command");
export const CreditCard = createSemanticIcon(GlyphCreditCard, "CreditCard");
export const DollarSign = createSemanticIcon(GlyphDollarSign, "DollarSign");
export const ErrorIcon = createSemanticIcon(GlyphCircleX, "ErrorIcon");
export const Frame = createSemanticIcon(GlyphFrame, "Frame");
export const GalleryVerticalEnd = createSemanticIcon(GlyphGalleryVerticalEnd, "GalleryVerticalEnd");
export const GitFork = createSemanticIcon(GlyphGitFork, "GitFork");
export const Home = createSemanticIcon(GlyphHome, "Home");
export const Info = createSemanticIcon(GlyphInfo, "Info");
export const LayoutDashboard = createSemanticIcon(GlyphLayoutDashboard, "LayoutDashboard");
export const LifeBuoy = createSemanticIcon(GlyphLifeBuoy, "LifeBuoy");
export const Loader = createSemanticIcon(GlyphLoaderCircle, "Loader");
export const Loader2 = createSemanticIcon(GlyphLoader2, "Loader2");
export const PanelLeft = createSemanticIcon(GlyphPanelLeft, "PanelLeft");
export const CheckCircle2 = createSemanticIcon(GlyphCheckCircle2, "CheckCircle2");
export const AlertCircle = createSemanticIcon(GlyphAlertCircle, "AlertCircle");
export const Lock = createSemanticIcon(GlyphLock, "Lock");
export const Mail = createSemanticIcon(GlyphMail, "Mail");
export const Menu = createSemanticIcon(GlyphMenu, "Menu");
export const Minus = createSemanticIcon(GlyphMinus, "Minus");
export const MoreHorizontal = createSemanticIcon(GlyphEllipsis, "MoreHorizontal");
export const Package = createSemanticIcon(GlyphPackage, "Package");
export const PieChart = createSemanticIcon(GlyphChartPie, "PieChart");
export const Plus = createSemanticIcon(GlyphPlus, "Plus");
export const Search = createSemanticIcon(GlyphSearch, "Search");
export const Settings = createSemanticIcon(GlyphSettings, "Settings");
export const Settings2 = createSemanticIcon(GlyphSettings2, "Settings2");
export const ShoppingCart = createSemanticIcon(GlyphShoppingCart, "ShoppingCart");
export const SquareTerminal = createSemanticIcon(GlyphSquareTerminal, "SquareTerminal");
export const SuccessIcon = createSemanticIcon(GlyphCircleCheck, "SuccessIcon");
export const TrendingDown = createSemanticIcon(GlyphTrendingDown, "TrendingDown");
export const TrendingUp = createSemanticIcon(GlyphTrendingUp, "TrendingUp");
export const User = createSemanticIcon(GlyphUser, "User");
export const Users = createSemanticIcon(GlyphUsers, "Users");
export const Wallet = createSemanticIcon(GlyphWalletCards, "Wallet");
export const Warning = createSemanticIcon(GlyphTriangleAlert, "Warning");
