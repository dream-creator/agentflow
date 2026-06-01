export default function LeadsLoading() {
  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <div className="skeleton h-12 rounded-xl mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
