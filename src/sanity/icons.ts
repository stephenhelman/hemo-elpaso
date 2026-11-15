import {
  Heart, Clock, DollarSign, Megaphone, BookOpen, Users, Globe, Shield, Phone, Mail,
  Calendar, ClipboardList, Bell, Star, ArrowRight, Sun,
} from "lucide-react";

export const ICONS = {
  heart: Heart, clock: Clock, dollarSign: DollarSign, megaphone: Megaphone, bookOpen: BookOpen,
  users: Users, globe: Globe, shield: Shield, phone: Phone, mail: Mail, calendar: Calendar,
  clipboardList: ClipboardList, bell: Bell, star: Star, arrowRight: ArrowRight, sun: Sun,
} as const;
export type IconKey = keyof typeof ICONS;
export const iconFor = (key?: string | null) => (key && key in ICONS ? ICONS[key as IconKey] : null);
