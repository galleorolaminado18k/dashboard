export default function GeografiaLoading() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] p-6">
      <div className="mb-8 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-[#1A1A1C]" />
        <div className="mt-2 h-4 w-96 rounded bg-[#1A1A1C]" />
      </div>
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-[#1A1A1C]" />
        ))}
      </div>
    </div>
  )
}
