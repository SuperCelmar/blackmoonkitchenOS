# Changelog

## 2026-01-05

### Changed
- **Python Scripts Organization**
  - Moved all Python scripts into `scripts/` folder for better project organization
  - Updated file paths in all scripts to reference CSV files in parent directory (`../`)
  - Scripts affected:
    - `enrich_menu.py` - Updated default input/output paths to `../menu.csv` and `../menu_enriched.csv`
    - `update_missing_fields.py` - Updated CSV path and `.env` file paths to parent directory
    - `generate_menu_sql.py` - Updated CSV input and SQL output paths to parent directory
    - `process_csv.py` - Updated all file references (`good_ids.txt`, CSV files) to parent directory
  - All scripts now run from `scripts/` directory and correctly reference data files in project root

### Files Moved
- `enrich_menu.py` → `scripts/enrich_menu.py`
- `generate_menu_sql.py` → `scripts/generate_menu_sql.py`
- `process_csv.py` → `scripts/process_csv.py`
- `update_missing_fields.py` → `scripts/update_missing_fields.py`

### Files Modified
- `scripts/enrich_menu.py` - Updated file paths to reference parent directory
- `scripts/update_missing_fields.py` - Updated CSV and env file paths
- `scripts/generate_menu_sql.py` - Updated CSV input and SQL output paths
- `scripts/process_csv.py` - Updated all file references to parent directory
- `changelog.md` - Documented Python scripts reorganization

## 2026-01-04 (Night - Part 2)

### Fixed
- **NOT NULL Constraint Violation in Menu Update Script**
  - Removed all `upsert()` operations - script now ONLY uses `update()` to modify existing rows
  - Changed from upsert to regular UPDATE operations to avoid NOT NULL constraint violations on `code` field
  - Upsert was attempting to insert new rows without required `code` values, causing database errors
  - Regular UPDATE preserves existing row data and only modifies specified fields (`image_url`, `name_cn`)
  - Error message: `'null value in column "code" of relation "menu_items" violates not-null constraint'` now resolved
  - Script now explicitly updates existing rows only - no insert operations whatsoever

### Changed
- **Update Functions Refactored**
  - Renamed `update_menu_item()` to `update_menu_item_by_id()` for clarity
  - Added `update_menu_item_by_code()` function for code-based updates
  - Both functions use UPDATE operations only (never INSERT)
  - Updated logic to try code-based update first, then fallback to ID-based update
  - Added explicit comments: "UPDATE ONLY, no insert" in function docstrings

### Files Modified
- `update_missing_fields.py` - Removed all upsert logic, replaced with UPDATE-only operations for both code and ID-based updates
- `changelog.md` - Documented fix for NOT NULL constraint violation and UPDATE-only approach

## 2026-01-04 (Night)

### Added
- **Menu Fields Update Script**
  - Created `update_missing_fields.py` script to sync missing `image_url` and `name_cn` fields from `menu_enriched.csv` to Supabase
  - Script queries Supabase for menu items with missing fields and matches them with CSV data
  - Implements intelligent matching logic:
    - Primary match by `code` field (case-sensitive)
    - Fallback match by `id` (UUID) for items without codes
  - Safety features:
    - Default dry-run mode to preview changes without modifying database
    - `--execute` flag required to actually perform updates
    - `--limit` flag for testing with subset of items
    - Comprehensive logging and summary reporting
    - Handles edge cases: empty strings vs NULL, multiple matches, missing CSV data
  - Added `supabase>=2.0.0` package to `requirements.txt` for Python Supabase client

### Files Created
- `update_missing_fields.py` - Script to update missing menu fields from CSV to Supabase

### Files Modified
- `requirements.txt` - Added supabase package dependency
- `changelog.md` - Documented new update script

## 2026-01-04 (Evening)

### Completed
- **Menu Data Migration to Supabase**
  - Successfully migrated all 129 menu items from `menu_enriched.csv` to Supabase `menu_items` table
  - Created SQL migration script `menu_migration.sql` with proper category mapping
  - Generated categories for missing items: 'Plaque chauffante', 'Pimenté', 'Desserts', 'Vins', 'Bo Bun', 'Nouilles Sautées', 'Boissons', 'Café', 'Thé', 'Eau Minérale', 'Apéritifs', 'Bières', 'Soupes Traditionnelles', 'Pho', 'Udon', 'Bols de riz blanc'
  - Executed migration in batches (7 batches of 20 statements each) to handle large SQL files
  - All menu items now properly mapped to correct categories using slug-based lookups
  - Items with codes use `ON CONFLICT (code) DO UPDATE` for upsert behavior
  - Items without codes use `WHERE NOT EXISTS` to prevent duplicates based on `name_fr`

### Files Created
- `menu_migration.sql` - Complete SQL migration with categories and menu items
- `menu_items_only.sql` - Extracted menu items SQL for separate execution
- `generate_menu_sql.py` - Python script to generate SQL from CSV data

### Files Modified
- `changelog.md` - Added entry for menu migration completion

## 2026-01-04

### Added
- **Menu Image Enrichment Pipeline**
  - Created `enrich_menu.py` script with tiered API strategy for fetching menu item images
  - Implemented multi-tier search approach:
    1. Spoonacular API for food-specific dishes (Pho, Gyoza, Bo Bun, etc.)
    2. Google Custom Search API for specific products and brands (wines, beverages)
    3. Unsplash API as aesthetic fallback for generic items
    4. Placeholder fallback for items without matches
  - Added safety features:
    - Default dry-run mode to preview changes without modifying files
    - Automatic backup creation (`menu.csv.bak`) before processing
    - `--limit` flag for testing with subset of items
    - `--execute` flag required to actually save changes
    - Outputs to `menu_enriched.csv` (does not overwrite original)
  - Created `requirements.txt` with Python dependencies (pandas, requests, python-dotenv)
  - Script includes rate limiting, error handling, and progress reporting
  - Supports item type detection (dish, drink, wine) for optimized search queries

### Changed
- **Menu Data Cleanup**
  - Processed `menu_enriched.csv` to remove `id` values for rows that were not part of the core 32 items.
  - Preserved all 130 menu items from the original dataset.
  - For the 32 core items, cleared `name_cn` and `image_url` fields as requested.
  - Normalized boolean values to lowercase (`true`/`false`).
  - Created a safety backup `menu_enriched.csv.bak_20260104` before processing.

### Files Created
- `enrich_menu.py` - Menu image enrichment script with tiered API strategy
- `requirements.txt` - Python dependencies for enrichment script
- `menu.csv.bak` - Backup of original menu data

### Files Modified
- `changelog.md` - Added entry for menu enrichment pipeline

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

