# Dashboard de Ventas - AI Coding Instructions

## Architecture Overview

This is a Next.js 15 sales dashboard built with v0.app integration, featuring Spanish-language UI for managing sales, invoicing, inventory, and logistics in Colombia.

### Core Stack
- **Framework**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **UI Components**: Radix UI + shadcn/ui patterns + Lucide icons
- **Charts**: Chart.js + React Chart.js 2 + Recharts
- **State**: React hooks + SWR for data fetching
- **Styling**: Tailwind CSS v4 + Custom CSS variables for theming
- **External APIs**: MiPaquete shipping integration

## Project Structure Patterns

### Route Organization
- Main routes in `app/(dashboard)/` using Next.js route groups
- Root redirects to `/ventas` (primary sales page)
- Route collision prevention via custom build scripts (`scripts/next-fix-route-collisions.mjs`)
- Renamed conflicting pages to `.shadow.tsx` pattern

### Key Directories
- `app/(dashboard)/`: Main application routes with shared sidebar layout
- `components/`: Reusable UI components (forms, tables, charts)
- `lib/`: Business logic, API clients, type definitions, utilities
- `scripts/`: Database migrations and custom build tools
- `adapters/`: External service integrations

## Critical Workflows

### Database Schema Evolution
- Sequential migration files in `scripts/` (001_, 002_, etc.)
- Execute via Supabase dashboard SQL editor, not programmatically
- Always includes RLS policies and proper indexing
- Main tables: `sales`, `invoices`, `expenses`, `return_tracking`

### Build Process
```bash
# Pre-build route collision detection
node scripts/next-fix-route-collisions.mjs
# Standard Next.js build
pnpm run build
```

### Environment Setup
- Copy configuration from `CONFIGURACION.md`
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- MiPaquete API key hardcoded in `lib/mipaquete.ts` (production pattern)

## Development Conventions

### Component Patterns
- Server Components by default, `"use client"` only when needed
- Shadcn/ui component library in `components/ui/`
- Custom components follow PascalCase naming
- Form dialogs use Radix Dialog + React Hook Form + Zod validation

### Data Fetching
- SWR for client-side data fetching
- Supabase client created per request in `lib/supabase/client.ts`
- Mock data in `lib/fetchers.ts` for Meta campaigns (TODO: real integration)
- MiPaquete tracking via `lib/mipaquete.ts` with fixed API credentials

### Styling Approach
- Tailwind utility classes with CSS variables for theming
- Sidebar themes stored in localStorage with custom event system
- CSS custom properties in `:root` and `[data-sidebar-theme]` selectors
- Component-specific styles in individual CSS modules when needed

### State Management
- React Context for global state (Theme, Fiscal Year)
- SWR cache for server state
- Local state with useState/useEffect for UI state
- No global state management library (Redux, Zustand)

## Business Domain Specifics

### Sales Flow
- Sales → Invoices → Payments → Delivery tracking
- Status sync between `sales` and `invoices` tables via database triggers
- MiPaquete integration for Colombian shipping
- Support for returns and refunds

### Colombian Localization
- All UI text in Spanish
- COP currency formatting
- Colombian phone number formats (+57)
- Integration with local shipping provider (MiPaquete)

### Key Business Objects
- **Sale**: Core transaction with products (JSONB), client info, payment method
- **Invoice**: Generated from sales with PDF support and formal numbering
- **Expense**: Business expenses tracking
- **Inventory**: Product catalog with SKU-based tracking

## Integration Points

### Supabase Database
- Row Level Security enabled on all tables
- JSONB columns for flexible product data storage
- Proper foreign key relationships between sales/invoices
- Automatic timestamps with triggers

### MiPaquete API
- Shipping code generation and tracking
- Return status monitoring
- Fixed API key configuration (not environment variable)
- Error handling for network failures

## Development Notes

- Use `pnpm` as package manager (enforced in `package.json`)
- TypeScript strict mode enabled but build errors ignored for rapid development
- ESLint disabled during builds for faster iteration
- Images unoptimized for static export compatibility
- Route rewrites to avoid ad-blocker conflicts (`/publicidad` → `/marketing`)