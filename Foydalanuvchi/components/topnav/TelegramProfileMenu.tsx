'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Crown, User } from 'lucide-react';
import { formatUzbekDate } from '@/lib/datetime';
import { useTelegramWebApp } from '@/components/TelegramWebAppProvider';
import { OverlayPortal } from '@/components/OverlayPortal';

interface TelegramProfileMenuProps {
  now: Date;
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.trim().charAt(0) ?? '';
  const last = lastName?.trim().charAt(0) ?? '';
  return (first + last).toUpperCase() || 'U';
}

function formatProfileDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return formatUzbekDate(date, { weekday: 'short' });
}

export function TelegramProfileMenu({ now }: TelegramProfileMenuProps) {
  const { loading, telegramUser, profile } = useTelegramWebApp();
  const [open, setOpen] = useState(false);

  const displayName =
    [profile?.first_name ?? telegramUser?.first_name, profile?.last_name ?? telegramUser?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Foydalanuvchi';

  const username = profile?.username ?? telegramUser?.username;
  const avatarUrl = profile?.avatar_url ?? telegramUser?.photo_url;
  const telegramId = profile?.telegram_id ?? telegramUser?.id;
  const phone = profile?.phone;
  const language = profile?.language_code ?? telegramUser?.language_code;
  const isPremium = profile?.is_premium ?? telegramUser?.is_premium;
  const startedAt = formatProfileDate(profile?.started_at);
  const lastStartAt = formatProfileDate(profile?.last_start_at);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  if (!telegramUser && !loading) {
    return (
      <div className="text-right flex-shrink-0 min-w-0 max-w-[42%] sm:max-w-none">
        <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider truncate">
          {formatUzbekDate(now, { weekday: 'long' })}
        </p>
      </div>
    );
  }

  const detailRows = [
    telegramId ? { label: 'Telegram ID', value: String(telegramId) } : null,
    phone ? { label: 'Telefon', value: phone } : null,
    language ? { label: 'Til', value: language.toUpperCase() } : null,
    startedAt ? { label: "Ro'yxatdan o'tgan", value: startedAt } : null,
    lastStartAt ? { label: 'Oxirgi start', value: lastStartAt } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-800/80 px-2 py-1.5 hover:bg-slate-800 transition-colors"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Profil menyusi"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white">
              {getInitials(profile?.first_name ?? telegramUser?.first_name, profile?.last_name ?? telegramUser?.last_name)}
            </span>
          )}
        </div>
        <span className="hidden sm:block text-sm font-semibold text-slate-100 max-w-[7rem] truncate">
          {displayName.split(' ')[0]}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <OverlayPortal>
        <AnimatePresence>
          {open && (
            <>
              <motion.button
                key="profile-backdrop"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[110] cursor-default bg-black/60"
                onClick={() => setOpen(false)}
                aria-label="Profilni yopish"
              />

              <motion.div
                key="profile-panel"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="fixed z-[111] right-3 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden"
                style={{ top: 'max(4.25rem, calc(env(safe-area-inset-top, 0px) + 3.25rem))' }}
                role="dialog"
                aria-label="Profil"
              >
                <div className="p-4 text-center border-b border-slate-700/80 bg-slate-900">
                  <div className="mx-auto w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-slate-600">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {getInitials(profile?.first_name ?? telegramUser?.first_name, profile?.last_name ?? telegramUser?.last_name)}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-base font-bold text-white leading-tight">{displayName}</p>

                  {username && (
                    <p className="mt-0.5 text-sm text-slate-400 truncate">@{username}</p>
                  )}

                  {isPremium && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-semibold">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                </div>

                {detailRows.length > 0 ? (
                  <dl className="p-3 space-y-2.5">
                    {detailRows.map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                        <dt className="text-slate-400 shrink-0">{row.label}</dt>
                        <dd className="text-slate-100 font-medium text-right break-all">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="p-4 text-sm text-slate-400 text-center">Qo'shimcha ma&apos;lumot yo&apos;q</p>
                )}

                <div className="px-3 py-2.5 border-t border-slate-700/80 bg-slate-800/50">
                  <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Telegram profili
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </OverlayPortal>
    </div>
  );
}
