type P = { className?: string; size?: number; strokeWidth?: number };

const S = ({ className, size = 22, strokeWidth = 1.9, children }: P & { children: React.ReactNode }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const ChatIcon = (p: P) => (
  <S {...p}>
    <path d="M21 11.5c0 4.14-4.03 7.5-9 7.5-1 0-1.97-.14-2.87-.4L4 20l1.05-3.18C3.74 15.4 3 13.5 3 11.5 3 7.36 7.03 4 12 4s9 3.36 9 7.5Z" />
  </S>
);

export const UpdatesIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 1.9" />
  </S>
);

export const CommunitiesIcon = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 18c.5-3 2.7-4.6 5.5-4.6s5 1.6 5.5 4.6" />
    <path d="M16.5 5.5a3 3 0 1 1 0 5.4" />
    <path d="M17 13.8c1.9.4 3.1 1.6 3.5 3.7" />
  </S>
);

export const CallsIcon = (p: P) => (
  <S {...p}>
    <path d="M6.6 10.8c1.4 2.6 3.9 5.1 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.1.4 2.3.6 3.4.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.1.2 2.3.6 3.4.1.4 0 .9-.2 1.2l-2.2 2.2Z" />
  </S>
);

export const SettingsIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.5.7.9 1.3 1H21a2 2 0 1 1 0 4h-.09c-.6.1-1.1.5-1.31 1Z" />
  </S>
);

export const SearchIcon = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </S>
);

export const MoreIcon = (p: P) => (
  <S {...p}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </S>
);

export const BackIcon = (p: P) => (
  <S {...p}>
    <path d="M15 18 9 12l6-6" />
  </S>
);

export const CameraIcon = (p: P) => (
  <S {...p}>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.1-1.6A1 1 0 0 1 11.2 4h1.6a1 1 0 0 1 .9.4L14.8 6h2.7A2.5 2.5 0 0 1 20 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5Z" />
    <circle cx="12" cy="12" r="3.4" />
  </S>
);

export const MicIcon = (p: P) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </S>
);

export const EmojiIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 10h.01M15.5 10h.01" />
    <path d="M8.5 14.5c.8 1 2 1.6 3.5 1.6s2.7-.6 3.5-1.6" />
  </S>
);

export const PlusIcon = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const SendIcon = (p: P) => (
  <S {...p}>
    <path d="M3.5 11 20 4l-3.7 16-4.6-6.2L3.5 11Z" />
    <path d="m11.7 13.8 3.3-3.3" />
  </S>
);

export const PaperclipIcon = (p: P) => (
  <S {...p}>
    <path d="M9 12.5V7a3 3 0 0 1 6 0v7a5 5 0 0 1-10 0V7" />
  </S>
);

export const CheckIcon = (p: P) => (
  <S {...p}>
    <path d="m5 13 4 4L19 7" />
  </S>
);

export const DoubleCheckIcon = (p: P) => (
  <S {...p}>
    <path d="m2 13 4 4 8-9" />
    <path d="m9 14.5 2 2L21 7" />
  </S>
);

export const VerifiedIcon = (p: P) => (
  <S {...p} className={"text-x-blue " + (p.className ?? "")}>
    <path d="M12 2.6l2 1.7 2.6-.3 1 2.4 2.4 1-.3 2.6 1.7 2-1.7 2 .3 2.6-2.4 1-1 2.4-2.6-.3-2 1.7-2-1.7-2.6.3-1-2.4-2.4-1 .3-2.6-1.7-2 1.7-2-.3-2.6 2.4-1 1-2.4 2.6.3Z" />
    <path d="m9 12 2 2 4-4" stroke="#0d0d10" strokeWidth="2" />
  </S>
);

export const LockIcon = (p: P) => (
  <S {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </S>
);

export const BellIcon = (p: P) => (
  <S {...p}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </S>
);

export const ChevronRightIcon = (p: P) => (
  <S {...p}>
    <path d="m9 6 6 6-6 6" />
  </S>
);

export const ChevronDownIcon = (p: P) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

export const FilterIcon = (p: P) => (
  <S {...p}>
    <path d="M4 5h16M7 12h10M10 19h4" />
  </S>
);

export const PinIcon = (p: P) => (
  <S {...p}>
    <path d="M12 17v5M7 4h10v4l-2 3h-6L7 8Z" />
    <path d="M9 4V3M15 4V3" />
  </S>
);

export const MuteIcon = (p: P) => (
  <S {...p}>
    <path d="M11 5 6 9H3v6h3l5 4Z" />
    <path d="m16 9 5 5M21 9l-5 5" />
  </S>
);

export const XLogo = (p: P) => (
  <S {...p}>
    <path d="M5 5 19 19M19 5 5 19" />
  </S>
);

export const PencilIcon = (p: P) => (
  <S {...p}>
    <path d="M4 20h4l11-11-4-4L4 16Z" />
  </S>
);

export const TrashIcon = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </S>
);

export const LogoutIcon = (p: P) => (
  <S {...p}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M15 16l4-4-4-4M19 12H9" />
  </S>
);

export const InfoIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </S>
);

export const ShieldIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3 4 6.5V12c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6.5Z" />
  </S>
);

export const ImageIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.2" />
    <circle cx="8.5" cy="10" r="1.6" />
    <path d="m3 17 5-5 4 4 3-3 4 4" />
  </S>
);

export const VideoIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="m16 10 5-3v10l-5-3" />
  </S>
);

export const PhoneVoiceIcon = (p: P) => (
  <S {...p}>
    <path d="M20 16.5v2.5a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 19 19 0 0 1-5.8-5.8A19 19 0 0 1 4 2.7 2 2 0 0 1 6 2h2.5a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2L9.3 9.6a16 16 0 0 0 5.1 5.1l1.2-1.2a2 2 0 0 1 2-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z" />
  </S>
);

export const NetworkIcon = (p: P) => (
  <S {...p}>
    <path d="M5 17a3 3 0 0 1 3-3h8a3 3 0 0 1 0 6H8a3 3 0 0 1-3-3Z" />
    <path d="M3 6h18" />
    <path d="M6 11h12" />
  </S>
);

export const StarIcon = (p: P) => (
  <S {...p}>
    <path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9Z" />
  </S>
);

export const UserIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c.8-3.4 4-5.5 8-5.5s7.2 2.1 8 5.5" />
  </S>
);

export const GlobeIcon = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </S>
);

export const KeyIcon = (p: P) => (
  <S {...p}>
    <circle cx="8" cy="15" r="4.5" />
    <path d="m11 12 9-9M17 3l3 3M14 6l2 2" />
  </S>
);

export const DownloadIcon = (p: P) => (
  <S {...p}>
    <path d="M12 4v11M8 11l4 4 4-4M5 20h14" />
  </S>
);

export const ShareIcon = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="m8.7 10.6 6.6-3.2M8.7 13.4l6.6 3.2" />
  </S>
);

export const ReplyIcon = (p: P) => (
  <S {...p}>
    <path d="M9 17 4 12l5-5" />
    <path d="M4 12h9a7 7 0 0 1 7 7" />
  </S>
);

export const CopyIcon = (p: P) => (
  <S {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </S>
);

export const ForwardIcon = (p: P) => (
  <S {...p}>
    <path d="M15 7 20 12l-5 5" />
    <path d="M20 12H11a6 6 0 0 0-6 6" />
  </S>
);

export const EditIcon = (p: P) => (
  <S {...p}>
    <path d="M4 20h4l10-10-4-4L4 16Z" />
    <path d="m13.5 6.5 4 4" />
  </S>
);

export const MenuItemIcon = (p: P) => <S {...p}><circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/></S>;

export const RefreshIcon = (p: P) => (
  <S {...p}>
    <path d="M20 5v6h-6" />
    <path d="M4 19v-6h6" />
    <path d="M6.1 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 11.9-3" />
  </S>
);

export const LinkDeviceIcon = (p: P) => (
  <S {...p}>
    <rect x="8" y="3" width="8" height="12" rx="2" />
    <path d="M12 15v2M8 20a4 4 0 0 0 8 0" />
    <path d="M4 10h.01M20 10h.01" />
  </S>
);

export const QrIcon = (p: P) => (
  <S {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1" />
  </S>
);

export const UploadIcon = (p: P) => (
  <S {...p}>
    <path d="M12 15V4M7 8l5-5 5 5" />
    <path d="M4 20h16" />
  </S>
);

export const PaletteIcon = (p: P) => (
  <S {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.2.9-2 2-2h2a3.5 3.5 0 0 0 3.5-3.5C19.5 6.2 16 3 12 3Z" />
    <circle cx="7.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
  </S>
);
