export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="h-7 w-[220px] bg-surface-100 rounded-md animate-pulse" />
      <div className="h-4 w-[180px] bg-surface-100 rounded animate-pulse" />
      <div className="h-11 w-full bg-surface-100 rounded-lg mt-4 animate-pulse" />
      <div className="h-11 w-full bg-surface-200 rounded-lg animate-pulse" />
    </div>
  );
}
