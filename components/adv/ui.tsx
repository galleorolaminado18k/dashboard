"use client"

import type React from "react"

import clsx from "clsx"

export const GoldRing = ({ className = "" }) => (
  <span
    className={clsx(
      "absolute inset-0 pointer-events-none rounded-[22px]",
      "bg-[radial-gradient(1200px_250px_at_-10%_-40%,rgba(201,176,116,.18),transparent)]",
      className,
    )}
  />
)

export const Kpi = ({
  title,
  value,
  sub,
  tone = "gold",
  right,
}: {
  title: string
  value: string | number
  sub?: string | React.ReactNode
  tone?: "gold" | "blue" | "violet" | "amber"
  right?: React.ReactNode
}) => {
  const ring =
    tone === "gold"
      ? "bg-[radial-gradient(1200px_250px_at_-10%_-40%,rgba(201,176,116,.18),transparent)]"
      : tone === "blue"
        ? "bg-[radial-gradient(1200px_250px_at_-10%_-40%,rgba(60,120,255,.12),transparent)]"
        : tone === "violet"
          ? "bg-[radial-gradient(1200px_250px_at_-10%_-40%,rgba(140,80,255,.12),transparent)]"
          : "bg-[radial-gradient(1200px_250px_at_-10%_-40%,rgba(255,175,0,.10),transparent)]"

  return (
    <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-[0_16px_50px_rgba(0,0,0,.06)] p-5">
      <span className={clsx("absolute inset-0 rounded-2xl", ring)} />
      <div className="relative flex items-start justify-between">
        <div className="text-sm text-neutral-500">{title}</div>
        {right}
      </div>
      <div className="relative mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="relative mt-1 text-xs text-neutral-500">{sub}</div>}
    </div>
  )
}

export const Pill = ({
  children,
  color = "neutral",
}: {
  children: React.ReactNode
  color?: "neutral" | "green" | "amber" | "red" | "blue"
}) => {
  const map: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border border-amber-200",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
  }
  return <span className={clsx("px-2.5 py-1 rounded-full text-xs", map[color])}>{children}</span>
}

export const IconBtn = ({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  title?: string
}) => (
  <button
    title={title}
    onClick={onClick}
    className={clsx(
      "h-9 px-3 rounded-xl border text-sm",
      active ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-50 border-neutral-200",
    )}
  >
    {children}
  </button>
)

export const LiveBadge = () => (
  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs border border-emerald-200">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
    Tiempo real
  </span>
)

