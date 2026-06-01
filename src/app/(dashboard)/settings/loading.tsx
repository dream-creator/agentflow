export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="skeleton h-8 w-32 mb-6" />
      <div className="space-y-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  );
}
