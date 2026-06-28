/**
 * Icon.tsx — system ikon Kidelo, port z prototypu HTML.
 * Wszystkie ikony: stroke 1.6px, viewBox 24x24, currentColor.
 */

import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

const PATHS: Record<string, string> = {
  route: 'M5 18c0-5 3-7 7-7s7-2 7-7 M5 18h.01 M19 4h.01',
  routeAlt: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M8 17h6a3 3 0 0 0 3-3V9',
  school: 'M3 9l9-5 9 5-9 5-9-5Z M7 11v5c0 1 2 2 5 2s5-1 5-2v-5',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z M16 12h3 M3 9h14',
  list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M5 20c0-3.5 3-6 7-6s7 2.5 7 6',
  stethoscope: 'M5 4v5a4 4 0 0 0 8 0V4 M9 17a5 5 0 0 0 9-3v-2 M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  hospital: 'M4 21V7l8-4 8 4v14 M9 21v-5h6v5 M12 7v4 M10 9h4',
  file: 'M7 3h7l5 5v13H7V3Z M14 3v5h5',
  briefcase: 'M4 8h16v11H4V8Z M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  activity: 'M3 12h4l2 6 4-14 2 8h4',
  heart: 'M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z',
  bag: 'M6 8h12l-1 12H7L6 8Z M9 8V6a3 3 0 0 1 6 0v2',
  gift: 'M4 11h16v9H4v-9Z M3 7h18v4H3V7Z M12 7v13 M12 7S10 3 8 4s0 3 4 3 M12 7s2-4 4-3-0 3-4 3',
  phone: 'M8 3h8v18H8V3Z M11 18h2',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  back: 'M19 12H5 M11 18l-6-6 6-6',
  check: 'M5 12l4 4 10-11',
  plus: 'M12 5v14 M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 20l-4-4',
  star: 'M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8L12 4Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 8v4l3 2',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z M10 19a2 2 0 0 0 4 0',
  chevron: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  shield: 'M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01',
  layers: 'M12 4l8 4-8 4-8-4 8-4Z M4 12l8 4 8-4 M4 16l8 4 8-4',
  cross: 'M6 6l12 12 M18 6 6 18',
  pencil: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6',
  checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3',
  pinFill: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z',
  heartPulse: 'M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z M7 13h2l1.5-3 2 5 1.5-4 1 2H17',
  baby: 'M12 4a5 5 0 1 0 0 10A5 5 0 0 0 12 4Z M9.5 9h.01 M14.5 9h.01 M10 12s.5 1.5 2 1.5 2-1.5 2-1.5 M7 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5',
  milk: 'M9 3h6l1 4H8L9 3Z M8 7v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7H8Z M10 11h4 M10 14h2',
  diary: 'M4 4h16v16H4V4Z M4 9h16 M9 4v5 M15 4v5 M8 14h3 M8 17h5',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  syringe: 'M18 2l4 4-3 3-4-4 3-3Z M14 6l-9 9 M11 11l5 5 M3 21l4-4 M7 17l-4 4 M14 10l1 1',
  drop: 'M12 4C12 4 6 10.8 6 15a6 6 0 0 0 12 0c0-4.2-6-11-6-11Z',
  image: 'M21 15l-5-5L5 21 M3 3h18v18H3V3Z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  foot: 'M9 4c2 0 3 2 3 5s-1 5-3 5-3-1-3-4 1-6 3-6Z M16 13c1.5 0 2 1 2 2.5S17 18 15.5 18 14 17 14 16s.5-3 2-3 M7 18c1 0 1.5.8 1.5 1.8S7.8 22 6.8 22 5.5 21.2 5.5 20.2 6 18 7 18Z',
  flask: 'M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9',
  bottle: 'M10 2h4 M10 4h4v3l1 2v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V9l1-2V4 M9 12h6',
  pump: 'M3 7l9 5-9 5V7Z M12 12h3 M15 9h5v6h-5V9Z',
  stopwatch: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M12 14V10 M9 2h6 M19 6l1.5-1.5',
  note: 'M6 3h9l4 4v14H6V3Z M14 3v5h5 M9 12h7 M9 16h5',
  pill: 'M12 3a4 4 0 0 1 4 4v10a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z M8 12h8',
  trophy: 'M8 21h8 M12 17v4 M5 4h14v8a7 7 0 0 1-14 0V4Z M3 9h2 M19 9h2',
  play: 'M8 5l11 7-11 7V5Z',
  pause: 'M8 5v14 M16 5v14',
  minus: 'M5 12h14',
  grid: 'M4 4h7v7H4V4Z M13 4h7v7h-7V4Z M4 13h7v7H4v-7Z M13 13h7v7h-7v-7Z',
  shirt: 'M8.5 4L5 6.5l1.4 3.4 1.6-.8V20h8V9.1l1.6.8L20 6.5 16.5 4 C16.5 4 14.8 6 12 6 9.2 6 8.5 4 8.5 4Z',
  shoe: 'M3 16.5V11l3-1 2.5 2.5L12 13l5.5 1.5c2 .6 3.5 1 3.5 2.5H3Z M3 16.5h18 M9 11.5l1 1.5',
  blocks: 'M4 13h6v6.5H4V13Z M13.5 13h6v6.5h-6V13Z M9.5 4.5a2.7 2.7 0 1 0 .01 0Z M6.5 16h1 M16 16h1',
  book: 'M12 6.5C10 5 6.8 5 5 5.6v12.2c1.8-.6 5-.6 7 .9 2-1.5 5.2-1.5 7-.9V5.6C17.2 5 14 5 12 6.5Z M12 6.5V19',
  crib: 'M4 7v12 M20 7v12 M4 11h16 M4 7h16 M8 7v4 M12 7v4 M16 7v4 M3 19h18',
  lotion: 'M13.5 3h-3v2.2L9 7v11a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V7l-1.5-1.8V3Z M9.5 11h5 M15.5 3h2.5',
  dots: 'M6 12h.01 M12 12h.01 M18 12h.01',
  calendar: 'M5 5h14v15H5V5Z M5 9h14 M9 3v4 M15 3v4 M9 13h2 M9 16h6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
  clipboard: 'M9 4h6v3H9V4Z M8 5H6v15h12V5h-2 M9.5 13l2 2 3.5-3.5',
  journal: 'M6 3h11a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Z M9 8h6 M9 12h6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = colors.ink.DEFAULT, strokeWidth = 1.6 }: IconProps) {
  const pathData = PATHS[name] ?? PATHS.info ?? '';
  // Path może mieć kilka segmentów połączonych spacją + M
  const segments = pathData.split(' M').map((seg, i) => (i === 0 ? seg : `M${seg}`));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {segments.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
