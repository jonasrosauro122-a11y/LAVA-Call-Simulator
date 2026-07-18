import {
  ShieldCheck, PhoneOutgoing, CalendarClock, TrendingUp, Bell, Stethoscope,
  Briefcase, Headset, Languages, GraduationCap,
  BookOpen, HelpCircle, Mic2, Award, Flame, Star, Zap, CheckCircle2, Sparkles,
  Rocket, Brain, Target, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  // path icons
  ShieldCheck, PhoneOutgoing, CalendarClock, TrendingUp, Bell, Stethoscope,
  Briefcase, Headset, Languages, GraduationCap,
  // achievement icons
  BookOpen, HelpCircle, Mic2, Award, Flame, Star, Zap, CheckCircle2, Sparkles,
  Rocket, Brain, Target,
};

export function pathIcon(name: string): LucideIcon {
  return ICONS[name] ?? GraduationCap;
}

export function iconByName(name: string): LucideIcon {
  return ICONS[name] ?? Star;
}
