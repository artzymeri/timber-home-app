import type { LucideIcon } from 'lucide-react-native';
import {
  ShieldCheck, BadgeDollarSign, Pencil, Scissors, Paintbrush, Wrench,
  UserCircle, Users, UserCog, UserCheck, UserPlus, Briefcase, HardHat,
  Hammer, Ruler, Boxes, Package, ShoppingCart, ClipboardList, ClipboardCheck,
  Truck, Car, Bus, Forklift, Factory, Building2, Warehouse, Map,
  Calendar, Clock, Bell, Settings, BarChart3, LayoutDashboard,
  CheckSquare, FileText, FileEdit, FileCheck, Receipt,
  Sparkles, Star, Heart, Flag, Bookmark, Tag, KeyRound, Lock,
  Search, Plus, Minus, Filter, Download, Upload, Save, Trash2,
  Crown, Trophy, Award, Target, Zap, ShieldAlert, AlertTriangle,
  Mail, MessageSquare, Phone, Send, Workflow, Cog,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck, BadgeDollarSign, Pencil, Scissors, Paintbrush, Wrench,
  UserCircle, Users, UserCog, UserCheck, UserPlus, Briefcase, HardHat,
  Hammer, Ruler, Boxes, Package, ShoppingCart, ClipboardList, ClipboardCheck,
  Truck, Car, Bus, Forklift, Factory, Building2, Warehouse, Map,
  Calendar, Clock, Bell, Settings, BarChart3, LayoutDashboard,
  CheckSquare, FileText, FileEdit, FileCheck, Receipt,
  Sparkles, Star, Heart, Flag, Bookmark, Tag, KeyRound, Lock,
  Search, Plus, Minus, Filter, Download, Upload, Save, Trash2,
  Crown, Trophy, Award, Target, Zap, ShieldAlert, AlertTriangle,
  Mail, MessageSquare, Phone, Send, Workflow, Cog,
};

export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return UserCircle;
  return ICON_MAP[name] || UserCircle;
}

/** Page-key → icon, mirrors the iconMap in web's app-shell. */
export const PAGE_ICON_MAP: Record<string, LucideIcon> = {
  'admin.dashboard': LayoutDashboard,
  'admin.orders': ShoppingCart,
  'admin.inventory': Package,
  'admin.purchase_orders': ClipboardList,
  'admin.fleet': Truck,
  'admin.machinery': Cog,
  'admin.users': UserPlus,
  'admin.roles': ShieldCheck,
  'admin.stages': Workflow,
  'admin.attendance': Clock,
  'admin.notifications': Bell,
  'admin.settings': Settings,
  'office.dashboard': LayoutDashboard,
  'office.orders': ShoppingCart,
  'office.settings': Settings,
  'factory.tasks': CheckSquare,
  'factory.qa_report': ClipboardList,
  'factory.settings': Settings,
  'field.schedule': Calendar,
  'field.fleet_checkout': Car,
  'field.settings': Settings,
};

export function iconForPage(pageKey: string): LucideIcon {
  return PAGE_ICON_MAP[pageKey] || Briefcase;
}
