import { Inter, Poppins } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

/**
 * TeX Gyre Bonum Bold (GUST Font License, see src/fonts/). Used ONLY for the HOEP wordmark
 * (the org name beside the icon in the header/footer); body text stays Inter, headings Poppins.
 */
export const bonum = localFont({
  src: "../fonts/texgyrebonum-bold.otf",
  weight: "700",
  variable: "--font-bonum",
  display: "swap",
});
