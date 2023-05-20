/**
 * tailwindcss color preset
 * @see {@link https://tailwindcss.com/docs/customizing-colors}
 */

import twcolors from 'tailwindcss/colors'

type TailwindColorStop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

function tailwindColorMap<T extends keyof typeof twcolors>(
  name: T,
): {
    [P in keyof typeof twcolors[T] as `${T}-${TailwindColorStop}`]: string
  } {
  // @ts-expect-error: I promise the type is correct:
  return Object.fromEntries(
    Object.entries(twcolors[name]).map(([num, value]) => [`${name}-${num}`, value]),
  )
}

export const colors = () => {
  return {
    white: twcolors.white,
    black: twcolors.black,
    transparent: 'transparent',
    ...tailwindColorMap('slate'),
    ...tailwindColorMap('gray'),
    ...tailwindColorMap('zinc'),
    ...tailwindColorMap('neutral'),
    ...tailwindColorMap('stone'),
    ...tailwindColorMap('red'),
    ...tailwindColorMap('orange'),
    ...tailwindColorMap('amber'),
    ...tailwindColorMap('yellow'),
    ...tailwindColorMap('lime'),
    ...tailwindColorMap('green'),
    ...tailwindColorMap('emerald'),
    ...tailwindColorMap('teal'),
    ...tailwindColorMap('cyan'),
    ...tailwindColorMap('sky'),
    ...tailwindColorMap('blue'),
    ...tailwindColorMap('indigo'),
    ...tailwindColorMap('violet'),
    ...tailwindColorMap('purple'),
    ...tailwindColorMap('fuchsia'),
    ...tailwindColorMap('pink'),
    ...tailwindColorMap('rose'),
  }
}
