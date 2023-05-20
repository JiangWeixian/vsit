/**
 * refs: https://github.com/JiangWeixian/stitches.config/blob/master/tailwindcss/stitches.config.ts
 */
import { createStitches, defaultThemeMap } from '@stitches/react'

import { colors } from './colors'

import type * as Stitches from '@stitches/react'

const space = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
  px: '1px',
  /**
   * `0.5` is not valid stitches token name
   * @see {@link https://stitches.dev/docs/tokens#naming-convention}
   */
  '0_5': '0.125rem',
  '1_5': '0.375rem',
  '2_5': '0.625rem',
  '3_5': '0.875rem',
} as const

const getTransition = (propertyValues: string[]) => {
  return propertyValues.map(p => `${p} cubic-bezier(0.4, 0, 0.2, 1) 150ms`).join(',')
}

const stitches = createStitches({
  prefix: 'mayumi',
  theme: {
    colors: {
      current: 'currentColor',
      ...colors(),
      white: 'rgb(255 255 255)',
      black: 'rgb(0 0 0)',
    },
    radii: {
      default: '0.25rem',
      none: '0px',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    space,
    sizes: {
      ...space,
      full: '100%',
      min: 'min-content',
      max: 'max-content',
      fit: 'fit-content',
      /**
       * `1/2` is not valid token name
       * @see {@link https://stitches.dev/docs/tokens#naming-convention}
       */
      '1-2': '50%',
      '1-3': '33.333333%',
      '2-3': '66.666667%',
      '1-4': '25%',
      '2-4': '50%',
      '3-4': '75%',
      '1-5': '20%',
      '2-5': '40%',
      '3-5': '60%',
      '4-5': '80%',
      '1-6': '16.666667%',
      '2-6': '33.333333%',
      '3-6': '50%',
      '4-6': '66.666667%',
      '5-6': '83.333333%',
      '1-12': '8.333333%',
      '2-12': '16.666667%',
      '3-12': '25%',
      '4-12': '33.333333%',
      '5-12': '41.666667%',
      '6-12': '50%',
      '7-12': '58.333333%',
      '8-12': '66.666667%',
      '9-12': '75%',
      '10-12': '83.333333%',
      '11-12': '91.666667%',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    lineHeights: {
      xs: '1rem',
      sm: '1.25rem',
      base: '1.5rem',
      lg: '1.75rem',
      xl: '1.75rem',
      '2xl': '2rem',
      '3xl': '2.25rem',
      '4xl': '2.5rem',
      '5xl': '1',
      '6xl': '1',
      '7xl': '1',
      '8xl': '1',
      '9xl': '1',
      // leading
      3: '.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    fonts: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontWeights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    letterSpacings: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
    zIndices: {
      0: '0',
      10: '10',
      20: '20',
      30: '30',
      40: '40',
      50: '50',
      auto: 'auto',
    },
    shadows: {
      xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': ' 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      none: 'none',
    },
    transitions: {
      default: getTransition([
        'color',
        'background-color',
        'border-color',
        'text-decoration-color',
        'fill',
        'stroke',
        'opacity',
        'box-shadow',
        'transform',
        'filter',
        'backdrop-filter',
      ]),
      none: 'none',
      all: 'all cubic-bezier(0.4, 0, 0.2, 1) 150ms',
      colors: getTransition([
        'color',
        'background-color',
        'border-color',
        'text-decoration-color',
        'fill',
        'stroke',
      ]),
      opacity: 'opacity cubic-bezier(0.4, 0, 0.2, 1) 150ms',
      shadow: 'box-shadow cubic-bezier(0.4, 0, 0.2, 1) 150ms',
      transform: 'transform cubic-bezier(0.4, 0, 0.2, 1) 150ms',
    },
  },
  media: {
    sm: '640px',
    md: '960px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    tablet: '640px',
    laptop: '1024px',
    desktop: '1280px',
  },
  utils: {
    /**
     * Spacing: Padding & Margin
     */
    p: (value: Stitches.PropertyValue<'padding'>) => ({
      padding: value,
    }),
    pt: (value: Stitches.PropertyValue<'paddingTop'>) => ({
      paddingTop: value,
    }),
    pr: (value: Stitches.PropertyValue<'paddingRight'>) => ({
      paddingRight: value,
    }),
    pb: (value: Stitches.PropertyValue<'paddingBottom'>) => ({
      paddingBottom: value,
    }),
    pl: (value: Stitches.PropertyValue<'paddingLeft'>) => ({
      paddingLeft: value,
    }),
    px: (value: Stitches.PropertyValue<'paddingLeft'>) => ({
      paddingLeft: value,
      paddingRight: value,
    }),
    py: (value: Stitches.PropertyValue<'paddingTop'>) => ({
      paddingTop: value,
      paddingBottom: value,
    }),
    m: (value: Stitches.PropertyValue<'margin'>) => ({
      margin: value,
    }),
    mt: (value: Stitches.PropertyValue<'marginTop'>) => ({
      marginTop: value,
    }),
    mr: (value: Stitches.PropertyValue<'marginRight'>) => ({
      marginRight: value,
    }),
    mb: (value: Stitches.PropertyValue<'marginBottom'>) => ({
      marginBottom: value,
    }),
    ml: (value: Stitches.PropertyValue<'marginLeft'>) => ({
      marginLeft: value,
    }),
    mx: (value: Stitches.PropertyValue<'marginLeft'>) => ({
      marginLeft: value,
      marginRight: value,
    }),
    my: (value: Stitches.PropertyValue<'marginTop'>) => ({
      marginTop: value,
      marginBottom: value,
    }),
    /**
     * Display flex, and set `alignItems` & `justifyContent`
     */
    flexBox: (value: Stitches.PropertyValue<'alignItems'>) => ({
      display: 'flex',
      alignItems: value,
      justifyContent: value,
    }),
    /**
     * Border radius
     */
    rounded: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderRadius: value,
    }),
    roundedT: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderTopRightRadius: value,
      borderTopLeftRadius: value,
    }),
    roundedR: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderTopRightRadius: value,
      borderBottomRightRadius: value,
    }),
    roundedB: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderBottomRightRadius: value,
      borderBottomLeftRadius: value,
    }),
    roundedL: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderTopLeftRadius: value,
      borderBottomLeftRadius: value,
    }),
    roundedTL: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderTopLeftRadius: value,
    }),
    roundedTR: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderTopRightRadius: value,
    }),
    roundedBL: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderBottomLeftRadius: value,
    }),
    roundedBR: (value: Stitches.PropertyValue<'borderRadius'>) => ({
      borderBottomRightRadius: value,
    }),
    /**
     * Border width
     */
    bw: (value: Stitches.PropertyValue<'borderWidth'>) => ({
      borderWidth: value,
    }),
    /**
     * Typo
     */
    leading: (value: Stitches.PropertyValue<'lineHeight'>) => ({
      lineHeight: value,
    }),
    /**
     * linear gradient
     */
    linearGradient: (value: Stitches.PropertyValue<'backgroundImage'>) => ({
      backgroundImage: `linear-gradient(${value})`,
    }),
    /**
     * W & H
     */
    w: (value: Stitches.PropertyValue<'width'>) => ({ width: value }),
    h: (value: Stitches.PropertyValue<'height'>) => ({ height: value }),
    mw: (value: Stitches.PropertyValue<'maxWidth'>) => ({ maxWidth: value }),
    mh: (value: Stitches.PropertyValue<'maxHeight'>) => ({
      maxHeight: value,
    }),
    container: (value: Stitches.PropertyValue<'maxWidth'>) => ({ maxWidth: value }),
    size: (value: Stitches.PropertyValue<'width'>) => ({
      width: value,
      height: value,
    }),
    /**
     * Transforms
     */
    scale: (value: Stitches.PropertyValue<'scale'>) => ({
      transform: `scale(${value})`,
    }),
    /**
     * Combine fontsize and line-height
     */
    text: (value: Stitches.PropertyValue<'lineHeight'>) => ({
      lineHeight: value,
      fontSize: value,
    }),
  },
  themeMap: {
    ...defaultThemeMap,
    indent: 'space',
  },
})

export const styled = stitches.styled
export const globalCSS = stitches.globalCss
export const keyframes = stitches.keyframes
