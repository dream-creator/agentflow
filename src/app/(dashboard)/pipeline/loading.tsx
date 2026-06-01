export default function PipelineLoading() {
  return (
    <div className="p-4 md:p-8">
      <div className="skeleton h-8 w-40 mb-6" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 min-w-[200px]">
            <div className="skeleton h-10 rounded-lg mb-3" />
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="skeleton h-20 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
