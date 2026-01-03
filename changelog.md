# Changelog

## 2026-01-03 (Late Evening - Part 2)

### Fixed
- **Menu Loading Without Authentication**
  - Removed `ensureAnonymousAuth()` requirement from menu loading initialization
  - Menu items and categories now load immediately without authentication errors
  - Fixed issue where menu wouldn't appear when anonymous sign-ins are disabled in Supabase
  - Menu loading no longer blocks on authentication failures

### Changed
- **Authentication Handling**
  - Anonymous authentication is now only attempted when creating orders (not during menu loading)
  - Added graceful error handling for authentication failures in order operations
  - Order creation will attempt authentication but continue if it fails (with null user ID)
  - `fetchActiveOrder()` now handles auth failures gracefully and returns null if no session exists

### Enhanced
- **Error Messages**
  - Improved error messages in order creation to distinguish auth errors from other errors
  - ClientView silently handles auth errors when checking for active orders (expected behavior when anonymous auth is disabled)

### Files Modified
- `App.tsx` - Removed `ensureAnonymousAuth()` from initialization, improved error handling in order creation
- `services/menuService.ts` - Added error handling in `createOrder()` and `fetchActiveOrder()` for auth failures
- `components/ClientView.tsx` - Improved error handling when checking for active orders

## 2026-01-03 (Late Evening)

### Fixed
- **Admin Panel Scrolling Issue**
  - Fixed scrolling in Admin Panel by adding proper flex layout with `flex-1 overflow-y-auto` to the content container
  - Admin Panel now properly scrolls through long lists of menu items

### Changed
- **Admin Panel Menu Management**
  - Menu items are now grouped and sorted by category for easier management
  - Categories are displayed as section headers with items organized underneath
  - Category dropdown is now dynamically populated from the database instead of hardcoded values
  - Added "Disponible" (Available) and "Populaire" (Popular) toggle fields in the admin form
  - Improved save button with loading state and proper error handling

### Added
- **Menu Item Persistence to Supabase**
  - Implemented `updateMenuItems()` function in `services/menuService.ts` to persist menu changes to Supabase database
  - Added `fetchAllMenuItems()` function to fetch all menu items (including unavailable ones) for admin view
  - Menu changes in Admin Panel now properly save to the database and persist across sessions
  - New items created in Admin Panel are properly inserted into the database with auto-generated UUIDs
  - Existing items are updated using upsert operations

### Enhanced
- **App Component Menu Management**
  - Added separate state for admin menu (`adminMenu`) that includes unavailable items
  - Implemented `handleUpdateMenu()` function that calls the persistence service and refreshes both admin and public menus
  - Added category fetching on app initialization
  - Categories are now passed to AdminView component for dynamic dropdown population

### Files Modified
- `services/menuService.ts` - Added `updateMenuItems()` and `fetchAllMenuItems()` functions
- `App.tsx` - Added category fetching, admin menu state, and `handleUpdateMenu()` function
- `components/AdminView.tsx` - Fixed scrolling, added category grouping, dynamic category dropdown, and database persistence

## 2026-01-03 (Evening)

### Fixed
- **Row-Level Security (RLS) Policy Error**
  - Fixed "new row violates row-level security policy" error when creating orders as unauthenticated guest
  - Updated RLS policies to require authenticated users (including anonymous) instead of allowing `created_by: null`
  - Modified `orders` INSERT policy to require `auth.uid() IS NOT NULL`
  - Updated `order_items` policies to match the new authentication requirement

### Changed
- **Anonymous Authentication Implementation**
  - Implemented Supabase Anonymous Authentication for guest users
  - Added `ensureAnonymousAuth()` helper function in `services/supabaseClient.ts` to automatically sign in users anonymously if no session exists
  - Updated `createOrder()` in `services/menuService.ts` to associate orders with authenticated user ID instead of `null`
  - Modified `App.tsx` to initialize anonymous authentication on app startup
  - Updated RLS policies in database to allow authenticated users (including anonymous) to create and view their own orders

### Added
- **Order Persistence for Guests**
  - Added `fetchActiveOrder()` function in `services/menuService.ts` to retrieve the current user's active order (PENDING or VALIDATED status)
  - Updated `ClientView.tsx` to check for existing active orders on mount
  - If an active order exists, automatically navigates to `/waiting` screen and restores cart state
  - Guest users can now reload the page and see their order status persisted via anonymous session

### Database Changes
- Updated `orders` table INSERT policy: Changed from `WITH CHECK (true)` to `WITH CHECK (auth.uid() IS NOT NULL)`
- Updated `order_items` table INSERT policy: Changed to require `auth.uid() IS NOT NULL` and verify order ownership
- Applied migration `fix_orders_rls_for_anonymous_auth` to production database

### Files Modified
- `services/supabaseClient.ts` - Added `ensureAnonymousAuth()` function
- `services/menuService.ts` - Updated `createOrder()` and added `fetchActiveOrder()`
- `components/ClientView.tsx` - Added order persistence check on mount
- `App.tsx` - Initialize anonymous auth on startup
- `supabase_migration.sql` - Updated RLS policies for future deployments

## 2026-01-03

### Added
- **Supabase Backend Integration**
  - Created new Supabase project `blackmoonkitchenOS` in `SuperCelmar's Org` organization
  - Installed `@supabase/supabase-js` package for database integration
  - Created comprehensive database schema with migrations:
    - `profiles` table for user roles (guest, waiter, admin, chef)
    - `categories` table for menu categorization
    - `menu_items` table with French/Chinese names, codes, prices, and images
    - `orders` table tracking order status, type, payment method, and totals
    - `order_items` junction table for order line items
  - Implemented Row Level Security (RLS) policies for data access control
  - Added database triggers for automatic `updated_at` timestamps and order total calculations
  - Created `services/supabaseClient.ts` with Supabase client initialization and type definitions
  - Created `services/menuService.ts` with functions for:
    - Fetching menu items and categories
    - Creating orders and order items
    - Updating order status and table assignments
    - Real-time subscriptions for order changes
  - Seeded database with 40+ menu items extracted from provided menu images:
    - Entrées (5 items): Gyoza, Raviolis, Bouchées, Brioche, etc.
    - Salades (5 items): Beef, Shrimp, Chicken, Seaweed, Tempura salads
    - Pho (5 items): Special, Beef meatballs, Beef ragout, Pork ribs
    - Udon (5 items): Pork ribs, Glazed pork, Chicken meatballs, Beef ragout, Braised beef
    - Bols de riz blanc (8 items): Various rice bowls with different proteins
    - Riz (4 items): Loc lac, Cantonese, Shrimp fried rice, Plain rice
- **Environment Variables Configuration**
  - Extracted hardcoded Supabase credentials to `.env.local`
  - Created `vite-env.d.ts` for proper TypeScript support of `import.meta.env`
  - Updated `tsconfig.json` to include Vite client types

### Changed
- **Frontend Refactoring**
  - Updated `types.ts` to align with database schema while maintaining backward compatibility
  - Refactored `App.tsx` to:
    - Load menu items from Supabase on mount
    - Fetch orders from Supabase and subscribe to real-time changes
    - Create orders through Supabase API instead of local state
    - Update order status and table assignments via Supabase
  - Updated `components/ClientView.tsx` to filter menu items by category slug instead of enum
  - Removed dependency on `INITIAL_MENU` constant (now loaded from database)
- **Supabase Client Configuration**
  - Refactored `services/supabaseClient.ts` to use `import.meta.env` for credentials

### Database Schema Details
- **Enums**: `user_role`, `order_status`, `order_type`, `payment_method`
- **Indexes**: Added performance indexes on frequently queried columns
- **RLS Policies**: 
  - Public read access for categories and available menu items
  - Role-based access control for orders (guests can create, staff can manage)
  - Users can only view their own profiles
- **Triggers**: Automatic order total calculation when order items change

### Files Created
- `supabase_migration.sql` - Initial database schema migration
- `seed-menu-data.sql` - Menu data seeding script
- `services/supabaseClient.ts` - Supabase client and type definitions
- `services/menuService.ts` - Database service functions

### Files Modified
- `App.tsx` - Integrated Supabase for data fetching and real-time updates
- `types.ts` - Updated to match database schema
- `components/ClientView.tsx` - Updated category filtering logic
- `package.json` - Added `@supabase/supabase-js` dependency

## 2025-01-27

### Added
- **Vercel Deployment Configuration**
  - Created `vercel.json` configuration file with proper build settings
  - Configured SPA routing with rewrites to handle client-side routing
  - Updated README.md with comprehensive Vercel deployment instructions
  - Added instructions for both GitHub integration and CLI deployment methods
  - Documented environment variable configuration for Vercel

### Configuration Details
- Build command: `npm run build`
- Output directory: `dist` (Vite default)
- Framework: Vite (auto-detected by Vercel)
- SPA routing: All routes rewrite to `/index.html` for client-side routing

