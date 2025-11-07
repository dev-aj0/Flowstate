"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <div className="h-8 w-64"><Skeleton className="h-8 w-64" /></div>
        <div className="mt-2 h-5 w-80"><Skeleton className="h-5 w-80" /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-8">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="glass-card p-8 lg:col-span-2">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg glass-card-strong">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


