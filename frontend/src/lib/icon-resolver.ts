import type { LucideIcon } from 'lucide-react';
import {
  // Roles & people
  ShieldCheck, BadgeDollarSign, Pencil, Scissors, Paintbrush, Wrench,
  UserCircle, Users, UserCog, UserCheck, UserPlus, Briefcase, HardHat,
  // Things & areas
  Hammer, Ruler, Boxes, Package, ShoppingCart, ClipboardList, ClipboardCheck,
  Truck, Car, Bus, Forklift, Factory, Building2, Warehouse, Map,
  Calendar, Clock, Bell, Settings, BarChart3, LayoutDashboard,
  CheckSquare, FileText, FileEdit, FileCheck, Receipt,
  // Tools / status
  Sparkles, Star, Heart, Flag, Bookmark, Tag, KeyRound, Lock,
  Search, Plus, Minus, Filter, Download, Upload, Save, Trash2,
  Crown, Trophy, Award, Target, Zap, ShieldAlert, AlertTriangle,
  // Communication
  Mail, MessageSquare, Phone, Send,
} from 'lucide-react';

export const ICON_OPTIONS: { name: string; component: LucideIcon }[] = [
  { name: 'ShieldCheck', component: ShieldCheck },
  { name: 'BadgeDollarSign', component: BadgeDollarSign },
  { name: 'Pencil', component: Pencil },
  { name: 'Scissors', component: Scissors },
  { name: 'Paintbrush', component: Paintbrush },
  { name: 'Wrench', component: Wrench },
  { name: 'UserCircle', component: UserCircle },
  { name: 'Users', component: Users },
  { name: 'UserCog', component: UserCog },
  { name: 'UserCheck', component: UserCheck },
  { name: 'UserPlus', component: UserPlus },
  { name: 'Briefcase', component: Briefcase },
  { name: 'HardHat', component: HardHat },
  { name: 'Hammer', component: Hammer },
  { name: 'Ruler', component: Ruler },
  { name: 'Boxes', component: Boxes },
  { name: 'Package', component: Package },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'ClipboardList', component: ClipboardList },
  { name: 'ClipboardCheck', component: ClipboardCheck },
  { name: 'Truck', component: Truck },
  { name: 'Car', component: Car },
  { name: 'Bus', component: Bus },
  { name: 'Forklift', component: Forklift },
  { name: 'Factory', component: Factory },
  { name: 'Building2', component: Building2 },
  { name: 'Warehouse', component: Warehouse },
  { name: 'Map', component: Map },
  { name: 'Calendar', component: Calendar },
  { name: 'Clock', component: Clock },
  { name: 'Bell', component: Bell },
  { name: 'Settings', component: Settings },
  { name: 'BarChart3', component: BarChart3 },
  { name: 'LayoutDashboard', component: LayoutDashboard },
  { name: 'CheckSquare', component: CheckSquare },
  { name: 'FileText', component: FileText },
  { name: 'FileEdit', component: FileEdit },
  { name: 'FileCheck', component: FileCheck },
  { name: 'Receipt', component: Receipt },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Flag', component: Flag },
  { name: 'Bookmark', component: Bookmark },
  { name: 'Tag', component: Tag },
  { name: 'KeyRound', component: KeyRound },
  { name: 'Lock', component: Lock },
  { name: 'Search', component: Search },
  { name: 'Plus', component: Plus },
  { name: 'Minus', component: Minus },
  { name: 'Filter', component: Filter },
  { name: 'Download', component: Download },
  { name: 'Upload', component: Upload },
  { name: 'Save', component: Save },
  { name: 'Trash2', component: Trash2 },
  { name: 'Crown', component: Crown },
  { name: 'Trophy', component: Trophy },
  { name: 'Award', component: Award },
  { name: 'Target', component: Target },
  { name: 'Zap', component: Zap },
  { name: 'ShieldAlert', component: ShieldAlert },
  { name: 'AlertTriangle', component: AlertTriangle },
  { name: 'Mail', component: Mail },
  { name: 'MessageSquare', component: MessageSquare },
  { name: 'Phone', component: Phone },
  { name: 'Send', component: Send },
];

const ICON_MAP: Record<string, LucideIcon> = ICON_OPTIONS.reduce((acc, { name, component }) => {
  acc[name] = component;
  return acc;
}, {} as Record<string, LucideIcon>);

export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return UserCircle;
  return ICON_MAP[name] || UserCircle;
}
