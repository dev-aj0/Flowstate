export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="h-20 bg-white/5 rounded-lg animate-pulse" />
      <div className="glass-card p-8">
        <div className="h-8 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

