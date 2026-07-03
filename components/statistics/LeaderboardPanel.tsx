'use client';

import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
  currentUserName: string;
}

export default function LeaderboardPanel({
  leaderboard,
  currentUserName,
}: LeaderboardPanelProps) {
  const podium = leaderboard.slice(0, 3).sort((a, b) => a.rank - b.rank);
  const remainingLeaderboard = leaderboard.filter((member) => member.rank > 3);

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'h-16 sm:h-20';
      case 2:
        return 'h-12 sm:h-16';
      case 3:
        return 'h-10 sm:h-14';
      default:
        return 'h-10';
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-600 bg-slate-800/50">
      <div className="border-b border-slate-700/60 bg-gradient-to-b from-slate-900/40 to-transparent px-3 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto flex max-w-md items-end justify-center gap-2 sm:gap-4">
          {[2, 1, 3].map((position) => {
            const member = podium.find((m) => m.rank === position);
            if (!member) return null;
            const isFirst = position === 1;

            return (
              <div
                key={position}
                className={`flex min-w-0 max-w-[5.5rem] flex-1 flex-col items-center sm:max-w-[6.5rem] ${
                  isFirst ? 'order-2' : position === 2 ? 'order-1' : 'order-3'
                }`}
              >
                <span className={`mb-1 ${isFirst ? 'text-2xl' : 'text-xl'}`}>
                  {getMedalEmoji(position)}
                </span>
                <div
                  className={`${getPodiumHeight(position)} flex w-full items-end justify-center rounded-t-lg border border-slate-600/80 bg-gradient-to-b ${getMedalColor(
                    position
                  )} pb-1.5 shadow-md`}
                >
                  <p className={`font-bold text-white/95 ${isFirst ? 'text-xl' : 'text-lg'}`}>
                    {position}
                  </p>
                </div>
                <div className="mt-2 w-full text-center">
                  <p className="truncate text-xs font-semibold sm:text-sm">{member.name}</p>
                  <p className="text-[10px] text-slate-400">{member.level}-daraja</p>
                  <p className="text-[10px] font-bold text-blue-400 sm:text-xs">{member.xp} XP</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {remainingLeaderboard.length > 0 && (
        <div className="divide-y divide-slate-700/50">
          {remainingLeaderboard.map((member) => (
            <div
              key={member.rank}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 ${
                member.name === currentUserName
                  ? 'bg-gradient-to-r from-blue-500/15 to-purple-600/15'
                  : 'hover:bg-slate-700/30'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="w-6 text-center text-sm font-bold text-slate-500">
                  {member.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{member.name}</p>
                  <p className="text-[10px] text-slate-400">{member.level}-daraja</p>
                </div>
              </div>
              <p className="flex-shrink-0 text-sm font-bold text-blue-400">{member.xp} XP</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
