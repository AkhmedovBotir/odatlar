export default function MainLoading() {
  return (
    <div className="page-content flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
