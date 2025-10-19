export default function Loading() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="animate-pulse space-y-8">
        <div className="h-32 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-3xl" />
      </div>
    </div>
  )
}
