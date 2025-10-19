import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="flex gap-4 mb-8">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 rounded-2xl">
            <Skeleton className="h-4 w-20 mb-4" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-16" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6 rounded-2xl">
            <Skeleton className="h-6 w-48 mb-6" />
            <Skeleton className="h-96 w-full" />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="p-6 rounded-2xl">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-96 w-full" />
          </Card>
        </div>
      </div>
    </div>
  )
}
