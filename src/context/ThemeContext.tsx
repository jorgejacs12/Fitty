import { createContext, useContext, useState, type ReactNode } from "react";

export interface Palette {
  id: string; name: string;
  swatches: string[]; // 4 colors for the picker row
  primary: string; onPrimary: string;
  primaryContainer: string; onPrimaryContainer: string;
  secondary: string; onSecondary: string;
  secondaryContainer: string; onSecondaryContainer: string;
  tertiary: string; onTertiary: string;
  tertiaryContainer: string; onTertiaryContainer: string;
}

export const PALETTES: Palette[] = [
  {
    id: "violet", name: "Deep Violet",
    swatches: ["#4F378B","#EADDFF","#625B71","#FFD8E4"],
    primary:"#4F378B", onPrimary:"#FFFFFF",
    primaryContainer:"#EADDFF", onPrimaryContainer:"#21005D",
    secondary:"#625B71", onSecondary:"#FFFFFF",
    secondaryContainer:"#E8DEF8", onSecondaryContainer:"#1D192B",
    tertiary:"#7D5260", onTertiary:"#FFFFFF",
    tertiaryContainer:"#FFD8E4", onTertiaryContainer:"#31111D",
  },
  {
    id: "orange", name: "Tiger Orange",
    swatches: ["#C84B00","#FFD8BB","#7D5700","#B0F0C8"],
    primary:"#C84B00", onPrimary:"#FFFFFF",
    primaryContainer:"#FFD8BB", onPrimaryContainer:"#341000",
    secondary:"#7D5700", onSecondary:"#FFFFFF",
    secondaryContainer:"#FFDEA0", onSecondaryContainer:"#271900",
    tertiary:"#1B6B3A", onTertiary:"#FFFFFF",
    tertiaryContainer:"#B0F0C8", onTertiaryContainer:"#002111",
  },
  {
    id: "forest", name: "Midnight Forest",
    swatches: ["#1B5E20","#C8E6C9","#33691E","#B2DFDB"],
    primary:"#1B5E20", onPrimary:"#FFFFFF",
    primaryContainer:"#C8E6C9", onPrimaryContainer:"#002107",
    secondary:"#33691E", onSecondary:"#FFFFFF",
    secondaryContainer:"#DCEDC8", onSecondaryContainer:"#102000",
    tertiary:"#004D40", onTertiary:"#FFFFFF",
    tertiaryContainer:"#B2DFDB", onTertiaryContainer:"#001510",
  },
  {
    id: "ocean", name: "Ocean",
    swatches: ["#006494","#C9E6FF","#4A6572","#BBDEFB"],
    primary:"#006494", onPrimary:"#FFFFFF",
    primaryContainer:"#C9E6FF", onPrimaryContainer:"#001E30",
    secondary:"#4A6572", onSecondary:"#FFFFFF",
    secondaryContainer:"#CCE5F0", onSecondaryContainer:"#071E27",
    tertiary:"#0D47A1", onTertiary:"#FFFFFF",
    tertiaryContainer:"#BBDEFB", onTertiaryContainer:"#001433",
  },
  {
    id: "ember", name: "Ember",
    swatches: ["#BF360C","#FFD8CC","#795548","#FFE0B2"],
    primary:"#BF360C", onPrimary:"#FFFFFF",
    primaryContainer:"#FFD8CC", onPrimaryContainer:"#370D00",
    secondary:"#795548", onSecondary:"#FFFFFF",
    secondaryContainer:"#D7CCC8", onSecondaryContainer:"#2C1B0E",
    tertiary:"#E65100", onTertiary:"#FFFFFF",
    tertiaryContainer:"#FFE0B2", onTertiaryContainer:"#3E1A00",
  },
];

const THEME_KEY = "fitty_theme";

interface ThemeCtx { palette: Palette; setTheme: (id: string) => void; }
const ThemeContext = createContext<ThemeCtx>({ palette: PALETTES[0], setTheme: () => {} });

function injectCSSVars(p: Palette) {
  let el = document.getElementById("fitty-theme") as HTMLStyleElement | null;
  if (!el) { el = document.createElement("style"); el.id = "fitty-theme"; document.head.appendChild(el); }
  el.textContent = `:root{--fp:${p.primary};--fop:${p.onPrimary};--fpc:${p.primaryContainer};--fopc:${p.onPrimaryContainer};--fs:${p.secondary};--fos:${p.onSecondary};--fsc:${p.secondaryContainer};--fosc:${p.onSecondaryContainer};--ft:${p.tertiary};--fot:${p.onTertiary};--ftc:${p.tertiaryContainer};--fotc:${p.onTertiaryContainer};}`;
  // Update browser chrome / PWA status bar color
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (meta) meta.content = p.primary;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_KEY) || "violet");
  const palette = PALETTES.find(p => p.id === themeId) || PALETTES[0];
  // Inject immediately (synchronous for first paint)
  injectCSSVars(palette);
  const setTheme = (id: string) => {
    const p = PALETTES.find(pal => pal.id === id) || PALETTES[0];
    setThemeId(id);
    localStorage.setItem(THEME_KEY, id);
    injectCSSVars(p);
  };
  return <ThemeContext.Provider value={{ palette, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
