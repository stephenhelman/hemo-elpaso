import { ORG_NAME } from "@/lib/brand";

/**
 * The HOEP mark: full-colour icon (or the reversed-white one on dark bands) + the org name set in
 * TeX Gyre Bonum Bold as live text. Never recolour, stretch or add effects to the icon files.
 *
 * Brand-sheet minimum for the full-detail icon is 64px tall on screen. Header/footer use a smaller
 * icon on purpose (see docs/BRAND.md); pass `iconHeight` >= 64 anywhere there is room.
 */
const ICON = { light: "/brand/hoep-icon-color.svg", dark: "/brand/hoep-icon-reversed-white.svg" } as const;
const ASPECT = 371.663 / 478.109; // width / height of the icon artwork

export default function BrandMark({
  tone = "light",
  iconHeight = 40,
  iconAlt = ORG_NAME,
  showText = true,
  hideTextBelowSm = false,
  textClassName = "text-sm",
}: {
  tone?: "light" | "dark";
  iconHeight?: number;
  /** Use "" when the name is already written next to the icon (decorative repeat). */
  iconAlt?: string;
  showText?: boolean;
  hideTextBelowSm?: boolean;
  textClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ICON[tone]}
        alt={iconAlt}
        height={iconHeight}
        width={Math.round(iconHeight * ASPECT)}
        style={{ height: iconHeight, width: "auto" }}
        className="flex-shrink-0"
      />
      {showText && (
        <span className={`${hideTextBelowSm ? "hidden sm:block" : ""} font-bonum leading-tight ${textClassName}`}>
          <span className={`block uppercase tracking-wide ${tone === "dark" ? "text-white" : "text-brand-ink"}`}>Hemophilia Outreach</span>
          <span className={`block ${tone === "dark" ? "text-brand-pink" : "text-brand-maroon"}`}>of El Paso</span>
        </span>
      )}
    </span>
  );
}
