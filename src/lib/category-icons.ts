import {
  AirVent, Camera, Car, Hammer, Laptop, Package, PenTool, Scissors,
  Shapes, Shirt, Sparkles, Utensils, Zap, type LucideIcon,
} from "lucide-react";
import { REF_CATEGORIES } from "@/lib/reference";
import type { CategoryIcon } from "@/lib/data";

/** Peta icon-string → komponen Lucide (dipakai map, timeline, kartu). */
const ICONS: Record<CategoryIcon, LucideIcon> = {
  "air-vent": AirVent, laptop: Laptop, car: Car, sparkles: Sparkles,
  camera: Camera, hammer: Hammer, scissors: Scissors, zap: Zap,
  utensils: Utensils, shirt: Shirt, shapes: Shapes,
  package: Package, "pen-tool": PenTool,
};

/** Ikon untuk nama kategori dari DB (mis. "Servis AC & elektronik"). */
export function iconForCategory(catName: string): LucideIcon {
  const ref = REF_CATEGORIES.find((c) => c.name === catName);
  return (ref && ICONS[ref.icon as CategoryIcon]) || Sparkles;
}
