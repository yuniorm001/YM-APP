import React from 'react';
import {
  Apple,
  RotateCcw,
  ArrowRight as ArrowRightIcon,
  Landmark,
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  BarChart3,
  Check as CheckIcon,
  CheckCircle2,
  Circle as CircleBaseIcon,
  Clock3,
  History,
  Cloud as CloudBaseIcon,
  Coins as CoinsBaseIcon,
  CreditCard as CreditCardBaseIcon,
  Crown as CrownBaseIcon,
  DollarSign,
  DoorOpen as DoorOpenBaseIcon,
  Mail,
  Upload,
  SlidersHorizontal,
  Save,
  Settings as SettingsIcon,
  Globe,
  Chrome,
  Heart as HeartBaseIcon,
  House as HouseBaseIcon,
  Info as InfoBaseIcon,
  KeyRound,
  Zap,
  List as ListBaseIcon,
  Send,
  Pencil,
  Plus as PlusBaseIcon,
  PlusCircle as PlusCircleBaseIcon,
  Receipt as ReceiptBaseIcon,
  ShieldCheck as ShieldCheckBaseIcon,
  Sparkles,
  Target as TargetBaseIcon,
  Trash2,
  TrendingDown,
  TrendingUp,
  User as UserBaseIcon,
  UserCircle2,
  UserPlus as UserPlusBaseIcon,
  Users,
  Wallet as WalletBaseIcon,
  TriangleAlert,
  AlertCircle,
  Search as SearchIcon,
  X as XBaseIcon
} from 'lucide-react';

const wrap = (Icon) => {
  const Wrapped = ({ weight, size, ...props }) => <Icon size={size} {...props} />;
  Wrapped.displayName = `PhosphorShim(${Icon.displayName || Icon.name || 'Icon'})`;
  return Wrapped;
};

export const AppleLogo = wrap(Apple);
export const ArrowCounterClockwise = wrap(RotateCcw);
export const ArrowRight = wrap(ArrowRightIcon);
export const Bank = wrap(Landmark);
export const Calendar = wrap(CalendarIcon);
export const CalendarBlank = wrap(CalendarDays);
export const CaretDown = wrap(ChevronDown);
export const CaretLeft = wrap(ChevronLeft);
export const CaretRight = wrap(ChevronRight);
export const CaretUp = wrap(ChevronUp);
export const ChartBar = wrap(BarChart3);
export const Check = wrap(CheckIcon);
export const CheckCircle = wrap(CheckCircle2);
export const Circle = wrap(CircleBaseIcon);
export const Clock = wrap(Clock3);
export const ClockCounterClockwise = wrap(History);
export const Cloud = wrap(CloudBaseIcon);
export const Coins = wrap(CoinsBaseIcon);
export const CreditCard = wrap(CreditCardBaseIcon);
export const Crown = wrap(CrownBaseIcon);
export const CurrencyDollar = wrap(DollarSign);
export const DoorOpen = wrap(DoorOpenBaseIcon);
export const EnvelopeSimple = wrap(Mail);
export const Export = wrap(Upload);
export const FadersHorizontal = wrap(SlidersHorizontal);
export const FloppyDisk = wrap(Save);
export const Gear = wrap(SettingsIcon);
export const GlobeHemisphereWest = wrap(Globe);
export const GoogleLogo = wrap(Chrome);
export const Heart = wrap(HeartBaseIcon);
export const House = wrap(HouseBaseIcon);
export const Info = wrap(InfoBaseIcon);
export const Key = wrap(KeyRound);
export const Lightning = wrap(Zap);
export const List = wrap(ListBaseIcon);
export const PaperPlaneTilt = wrap(Send);
export const PencilSimple = wrap(Pencil);
export const Plus = wrap(PlusBaseIcon);
export const PlusCircle = wrap(PlusCircleBaseIcon);
export const Receipt = wrap(ReceiptBaseIcon);
export const ShieldCheck = wrap(ShieldCheckBaseIcon);
export const Sparkle = wrap(Sparkles);
export const Target = wrap(TargetBaseIcon);
export const Trash = wrap(Trash2);
export const TrendDown = wrap(TrendingDown);
export const TrendUp = wrap(TrendingUp);
export const User = wrap(UserBaseIcon);
export const UserCircle = wrap(UserCircle2);
export const UserPlus = wrap(UserPlusBaseIcon);
export const UsersThree = wrap(Users);
export const Wallet = wrap(WalletBaseIcon);
export const Warning = wrap(TriangleAlert);
export const WarningCircle = wrap(AlertCircle);
export const MagnifyingGlass = wrap(SearchIcon);
export const X = wrap(XBaseIcon);
