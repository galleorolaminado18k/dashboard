import React from "react"

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive"
}

export function Alert({ variant = "default", className = "", children, ...rest }: AlertProps) {
  const base = "rounded-md p-3 flex items-start gap-3"
  const variants: Record<string, string> = {
    default: "bg-blue-50 border border-blue-100 text-blue-800",
    destructive: "bg-red-50 border border-red-100 text-red-800",
  }

  return (
    <div className={[base, variants[variant], className].filter(Boolean).join(" ")} role="alert" {...rest}>
      {children}
    </div>
  )
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm leading-tight">{children}</div>
}

export default Alert
