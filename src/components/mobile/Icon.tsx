// Icon.tsx — set de íconos line-style del rediseño (portado del handoff)

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 22, color = "currentColor", stroke = 1.8 }: IconProps) {
  const c = color, s = size, sw = stroke;
  switch (name) {
    case "search": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth={sw}/><path d="m20 20-3.5-3.5" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "arrow-left": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 6l-6 6 6 6M8 12h12" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "arrow-right": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10 6l6 6-6 6M16 12H4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "close": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "home": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-9z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "home-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-9z" fill={c}/></svg>;
    case "briefcase": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke={c} strokeWidth={sw}/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" stroke={c} strokeWidth={sw}/></svg>;
    case "briefcase-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M10 3a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v3h18V9a2 2 0 0 0-2-2h-3V5a2 2 0 0 0-2-2h-4zm0 2h4v2h-4V5zM3 14v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H3z" fill={c}/></svg>;
    case "chat": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "chat-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill={c}/></svg>;
    case "user": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth={sw}/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "user-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill={c}/><path d="M4 21c0-4 4-7 8-7s8 3 8 7H4z" fill={c}/></svg>;
    case "star": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3.5l2.7 5.5 6.1.9-4.4 4.3 1 6L12 17.4l-5.5 2.9 1-6L3.2 9.9l6.1-.9L12 3.5z" fill={c}/></svg>;
    case "star-outline": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3.5l2.7 5.5 6.1.9-4.4 4.3 1 6L12 17.4l-5.5 2.9 1-6L3.2 9.9l6.1-.9L12 3.5z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "heart": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "heart-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill={c}/></svg>;
    case "bell": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0 1 12 0v4l1.5 3h-15L6 13V9zM10 19a2 2 0 0 0 4 0" stroke={c} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"/></svg>;
    case "bell-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0v4l1.5 3h-15L6 13V9z" fill={c}/><path d="M10 19a2 2 0 0 0 4 0" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/></svg>;
    case "settings": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth={sw}/><path d="M19.4 15a1.7 1.7 0 0 0 .4 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.4 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.4l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .4-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.4-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.4H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.4l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.4 1.9V9c.2.6.8 1 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "check": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-11" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "check-circle": return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={c}/><path d="M7.5 12.5l3 3 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>;
    case "plus": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "pin": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth={sw}/></svg>;
    case "pin-fill": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" fill={c}/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>;
    case "shield": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "sliders": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h12M20 6h0M4 12h4M12 12h8M4 18h12M20 18h0" stroke={c} strokeWidth={sw} strokeLinecap="round"/><circle cx="18" cy="6" r="2" stroke={c} strokeWidth={sw}/><circle cx="10" cy="12" r="2" stroke={c} strokeWidth={sw}/><circle cx="18" cy="18" r="2" stroke={c} strokeWidth={sw}/></svg>;
    case "send": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 12l16-8-6 17-3-7-7-2z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "paperclip": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "camera": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke={c} strokeWidth={sw}/></svg>;
    case "phone": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "wallet": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="2" stroke={c} strokeWidth={sw}/><path d="M3 10h18M16 15h2" stroke={c} strokeWidth={sw}/></svg>;
    case "trend": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 17l5-5 4 4 8-8M15 8h6v6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "eye": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke={c} strokeWidth={sw}/><circle cx="12" cy="12" r="3" stroke={c} strokeWidth={sw}/></svg>;
    case "logout": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h12" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "edit": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20h4l11-11-4-4L4 16v4z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "chevron-right": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "chevron-down": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "clock": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth={sw}/><path d="M12 7v5l3 2" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "calendar": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth={sw}/><path d="M3 10h18M8 3v4M16 3v4" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "badge": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2l3 3 4-1 1 4 3 3-3 3-1 4-4-1-3 3-3-3-4 1-1-4-3-3 3-3 1-4 4 1 3-3z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M8 12l3 3 5-6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "mic": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="12" rx="3" stroke={c} strokeWidth={sw}/><path d="M5 12a7 7 0 0 0 14 0M12 19v3" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "image": return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth={sw}/><circle cx="9" cy="10" r="2" stroke={c} strokeWidth={sw}/><path d="M3 17l5-4 4 3 4-4 5 5" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    default: return null;
  }
}

// Íconos ilustrativos de categoría
export function CategoryIcon({ name, size = 28, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s = size, c = color, sw = 1.8;
  switch (name) {
    case "gasista": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M14 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M8 18a6 6 0 0 0 12 0" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "electricista": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M15 3L6 16h6l-1 9 10-13h-6l1-9z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "plomero": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M14 3s7 7 7 13a7 7 0 0 1-14 0c0-6 7-13 7-13z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "pintor": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M22 4l-9 9 3 3 9-9-3-3z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M13 13L7 19c-1.5 1.5-1.5 4 0 5s4 0 5-1l6-7" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "fletes": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><rect x="2" y="7" width="13" height="11" rx="1" stroke={c} strokeWidth={sw}/><path d="M15 11h5l4 4v3h-9" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><circle cx="8" cy="21" r="2.2" stroke={c} strokeWidth={sw}/><circle cx="20" cy="21" r="2.2" stroke={c} strokeWidth={sw}/></svg>;
    case "albanil": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M3 25l5-5M8 20l-2-2 12-12 4 4-12 12-2-2z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "cerrajero": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><circle cx="9" cy="12" r="5" stroke={c} strokeWidth={sw}/><path d="M13 12h11M20 12v4M24 12v3" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "limpieza": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M11 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M20 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "carpintero": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M4 8l16 0-3 3-1-2-1 2-1-2-1 2-1-2-1 2-1-2-1 2-1-2-1 2-3-3z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M19 11l5 5-3 3-5-5" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "aire": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M14 3v22M3 14h22M6 6l16 16M22 6L6 22" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "jardinero": return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M22 4c-12 0-18 6-18 14 0 3 2 6 4 6 8 0 14-7 14-20z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/><path d="M8 24L20 8" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    default: return null;
  }
}
