"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function SessionLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="glass-card px-8 py-4">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-2 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          </div>
          <div className="glass-card p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-[250px] w-full" />
          </div>
          <div className="glass-card p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


