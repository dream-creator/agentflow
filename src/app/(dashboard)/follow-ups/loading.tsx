export default function FollowUpsLoading() {
  return (
    <div className="p-4 md:p-8">
      <div className="skeleton h-8 w-48 mb-6" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
