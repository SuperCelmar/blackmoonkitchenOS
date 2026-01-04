## 2026-01-04 (Late Night - Part 7)

### Fixed
- **Authentication Transition & State Sync**
  - Resolved "stuck" login screen issue where users had to refresh after a successful login.
  - Implemented direct `AuthUser` object passing from `DevLogin` to `App` state to bypass race conditions.
  - Enhanced `authService.ts` with a robust retry mechanism (2 attempts, 500ms delay) for profile fetching to handle database trigger latency.
  - Refined `onAuthStateChange` listener in `App.tsx` to prevent redundant state updates and accidental clearing of valid user sessions.
  - Added detailed `[Auth]` console logging to track login success and state transition timing.

### Files Modified
- `services/authService.ts` - Added profile fetch retry logic and improved transition logging.
- `components/DevLogin.tsx` - Updated `onLoginSuccess` to pass the authenticated user directly.
- `App.tsx` - Simplified `handleLoginSuccess` and optimized the auth state change listener.
- `changelog.md` - Documented authentication fixes.


### Enhanced
- **Figma-Grade Cart UI/UX Overhaul**
  - **Component Standardization**: Updated the close button to a `rounded-2xl` square to match the cart's design system. Added a rotation micro-interaction on hover.
  - **Premium Empty State**:
    - Reduced the empty cart icon scale for a more elegant appearance.
    - Integrated `corner-patterns` and a pulse animation into the empty state.
    - Balanced the typography hierarchy for "Votre panier est vide" with italicized Playfair Display.
  - **Cohesive Checkout Architecture**:
    - Grouped the order note input and price summary into a single grounded, `shadow-inner` block.
    - Re-aligned the TVA and Total for better scan-ability (Logical left-to-right flow).
    - Significantly improved typography hierarchy: `5xl` for the total price and high-contrast, wide-tracked labels for metadata.
  - **Accessible & High-End Validation Button**:
    - Fixed contrast issues in the disabled state (darker muted tones for legibility).
    - Added a premium shimmer animation on hover for the active state.
    - Increased padding and standardized to `rounded-2xl` for a consistent touch-optimized feel.
  - Added `shimmer` keyframes to the global Tailwind configuration.

### Files Modified
- `components/OrderCreationView.tsx` - Complete redesign of the cart's structural and visual hierarchy.
- `index.html` - Added `shimmer` animation and keyframes.
- `changelog.md` - Documented UI/UX design fixes.

## 2026-01-04 (Late Night - Part 5)

### Enhanced
- **Cart UI/UX Refinement**
  - Redesigned the floating cart button to be theme-responsive (white/dark-zinc) with a subtle border.
  - Applied the `shadow-float` effect to the cart button for a premium hover experience.
  - Redesigned the cart sidebar overlay:
    - Implemented a theme-responsive background (`bg-white dark:bg-zinc-950`).
    - Added `glass-effect` to the sticky header and footer for a high-end look.
    - Updated text and icon colors for better contrast in both light and dark modes.
  - Refined cart item styling:
    - Updated item backgrounds and borders for theme responsiveness.
    - Integrated "corner patterns" on hover for a branded, upscale aesthetic.
    - Improved quantity controls with better contrast and hover states.
  - Enhanced the checkout section:
    - Highlighted the sub-total with the `primary` red for better focus.
    - Styled the order note input to match the app's minimalist design.
    - Re-styled the "VALIDER LA COMMANDE" button with the `shadow-float` effect and improved typography.

### Files Modified
- `components/OrderCreationView.tsx` - Complete overhaul of cart trigger, sidebar, items, and checkout styling.
- `changelog.md` - Documented cart UI refinements.

## 2026-01-04 (Late Night - Part 4)

### Enhanced
- **Order Creation UI/UX Refinement**
  - Significantly improved the category sidebar legibility and visual hierarchy:
    - Simplified to a **text-only** layout, removing redundant icons to maximize space.
    - Increased font size to `13px` with bold weight for high-contrast legibility.
    - Compact sidebar width (`w-20`) to allocate more real estate to the menu grid.
    - Added subtle bottom borders and increased vertical padding (`py-6`) for better tap targets.
    - Refined active state with a clean primary background and shadow for depth.

### Files Modified
- `components/OrderCreationView.tsx` - Removed icons, updated typography, and refined layout.
- `changelog.md` - Documented UI/UX improvements.

## 2026-01-04 (Late Night - Part 3)

### Redesigned
- **Tablet-Optimized Order Creation Interface**
  - Replaced the manual order creation modal with a full-screen, tablet-optimized interface (`OrderCreationView`).
  - Implemented a modern menu grid with large item images, category badges, and micro-interactions.
  - Added a dedicated category sidebar with intuitive icons and labels for quick navigation.
  - Feature-rich menu cards showing price, code, French and Chinese names, and item images.
  - Integrated a new "Cart Widget" system:
    - Floating cart button with item count badge and smooth animations.
    - Dark-themed sliding cart overlay (as seen in provided screenshots).
    - Advanced cart controls: quantity adjusters (+/-), quick remove, and item thumbnails.
    - Added order notes field directly in the cart widget for special requests.
    - Automatic total calculation with visual breakdown.
  - Enhanced navigation flow:
    - Direct access from "Nouvelle Commande" buttons in both map and table detail views.
    - Support for both "Sur Place" (Dine-in) and "À Emporter" (Takeaway) types.
    - Table selection integrated into the order creation header.
    - Seamless transition back to the floor plan view upon cancellation or completion.

### Files Created
- `components/OrderCreationView.tsx` - New full-screen order creation component with menu grid and cart widget.

### Files Modified
- `components/WaiterView.tsx` - Refactored to support the new `CREATE_ORDER` view mode and integrated `OrderCreationView`.
- `changelog.md` - Documented the order creation interface redesign.

## 2026-01-04

### Fixed
- **Authentication Check Hang & Connection Issues**
  - Increased authentication timeout from 5 seconds to 15 seconds in `App.tsx` to accommodate slow network conditions (e.g., restaurant Wi-Fi)
  - Added comprehensive logging throughout authentication flow to diagnose connection issues:
    - Logs timing for each authentication step (session check, profile fetch)
    - Logs user ID, email, and role at each stage
    - Logs detailed error information including error codes and messages
    - Console logs prefixed with `[Auth]` and `[AuthService]` for easy filtering
  - Enhanced error handling in `onAuthStateChange()` to prevent silent failures:
    - Profile fetch errors now return user with null role instead of failing completely
    - Added try-catch blocks around profile fetching operations
    - Better error messages with context (error codes, hints, details)
  - Improved `getCurrentUser()` to handle profile fetch errors gracefully
  - Implemented `isMounted` cleanup pattern in `useEffect` to prevent memory leaks and state updates on unmounted components

### Files Modified
- `App.tsx` - Increased timeout to 15s, added detailed logging throughout auth check flow
- `services/authService.ts` - Added comprehensive logging and enhanced error handling in all auth functions

## 2026-01-06

### Enhanced
- **Real-time Client Order Updates**
  - Added real-time subscription in ClientView to automatically update order status on the waiting screen
  - WaitingScreen now displays dynamic status messages and visual indicators based on order status:
    - PENDING: "En attente de confirmation" with hourglass icon
    - VALIDATED: "Commande confirmée !" with checkmark icon and "En Cuisine" badge
    - READY: "Commande prête !" with restaurant icon and "Prête" badge
    - PAID: "Commande terminée" with completion message
  - Order status updates automatically when waiter validates or kitchen updates order
  - Added `activeOrder` state tracking in ClientViewInner component
  - Subscription automatically updates UI when order status changes in database

- **Admin View All-Time Aggregation**
  - Added "All Time" revenue aggregation section in AdminView revenue tab
  - Displays total all-time revenue, total orders count, average order value, and last order date
  - Added `fetchAllPaidOrders()` function in `menuService.ts` to retrieve all paid orders
  - All-time stats load automatically when revenue tab is opened
  - Separate loading and error states for all-time data

### Files Modified
- `components/ClientView.tsx` - Added real-time subscription and enhanced WaitingScreen with dynamic status display
- `components/AdminView.tsx` - Added all-time revenue aggregation section with statistics
- `services/menuService.ts` - Added `fetchAllPaidOrders()` function for admin aggregation

## 2026-01-06

### Fixed
- **Admin Revenue Tab Loading Issue**
  - Added authentication check in `fetchTodayRevenue()` to ensure user is logged in
  - Improved error handling and logging for revenue queries
  - Added error display UI in revenue tab with retry button
  - Added detailed console logging to help debug RLS policy issues

### Added
- **Minimalist Admin Panel Expansion**
  - Added tabbed navigation to AdminView with two core tabs: "Carte" (Menu) and "Chiffre d'Affaires" (Daily Revenue)
  - Implemented click-to-upload image functionality for menu items
    - Image placeholder is now clickable and opens file picker
    - Uploads images to Supabase Storage bucket `menu-images`
    - Shows upload progress indicator during upload
    - Hover effect on existing images to indicate they can be replaced
  - Created Daily Revenue tab showing:
    - Large, prominent display of today's total revenue in euros
    - Complete list of all paid orders from today
    - Each order shows: time, table/takeaway info, total amount, payment method, and item details
    - Clean, simple design optimized for non-technical users
  - Added `uploadMenuImage()` function in `menuService.ts` for handling image uploads to Supabase Storage
  - Added `fetchTodayRevenue()` function to retrieve today's paid orders and calculate total revenue

### Files Modified
- `components/AdminView.tsx` - Refactored to tabbed interface with Menu and Revenue tabs
- `services/menuService.ts` - Added image upload and revenue fetching functions
- `changelog.md` - Documented new admin features

## 2026-01-04 (Late Night)

### Fixed
- **Kitchen View Syntax Error**
  - Fixed "Unexpected token" error in `KitchenView.tsx` caused by redundant curly braces in a ternary operator branch
  - Properly wrapped multiple JSX expressions in a Fragment within the `sidebarTab === 'queue'` condition
  - Fixed incorrect closing braces and parentheses structure in the sidebar rendering logic

### Files Modified
- `components/KitchenView.tsx` - Corrected JSX syntax and structure in sidebar rendering
- `changelog.md` - Documented syntax fix

## 2026-01-06

### Enhanced
- **Kitchen View Phase 2: Advanced Workflow Features**
  - Added Bulk Prep Summary tab in kitchen sidebar
  - Summary view aggregates all items across VALIDATED orders showing total quantities (e.g., "N1: 8 total")
  - Helps chefs prepare large batches of popular items efficiently
  - Implemented item-level progress tracking with click-to-check functionality
  - Clicking an item card toggles its prepared status in the database
  - Prepared items are visually dimmed with strikethrough and checkmark icon
  - Real-time synchronization of item prepared status across all kitchen displays
  - Added "Pousse" (Fire Mains) signal system for waiter-to-kitchen communication
  - Waiters can trigger "COMMENCER LES PLATS" button in table detail modal
  - Kitchen displays prominent "FIRE! / 开始主菜" badge when mains should start
  - Badge appears with pulsing animation and bell icon for high visibility
  - All changes sync in real-time via Supabase Realtime subscriptions

### Database Changes
- Added `is_prepared` boolean field to `order_items` table (default false)
- Added `mains_started` boolean field to `orders` table (default false)
- Created indexes for optimized queries on prepared items and mains_started orders
- Enabled Supabase Realtime publication for `order_items` table

### Technical Details
- Created `updateOrderItemPrepared()` function to toggle item prepared status
- Created `startMains()` function to trigger mains preparation signal
- Updated `subscribeToOrders()` to listen for both orders and order_items changes
- Added `orderItemId` field to frontend OrderItem type for database updates
- Bulk summary uses `useMemo` for efficient aggregation of all kitchen orders
- Item click handlers update database and trigger real-time UI updates

### Files Created
- `add_kitchen_phase2_fields_migration.sql` - Database migration for Phase 2 fields

### Files Modified
- `services/supabaseClient.ts` - Added `is_prepared` and `mains_started` fields to types
- `services/menuService.ts` - Added `updateOrderItemPrepared()` and `startMains()` functions, enhanced realtime subscriptions
- `types.ts` - Added `isPrepared`, `orderItemId`, and `mainsStarted` fields to frontend types
- `components/KitchenView.tsx` - Added Summary tab, item click handlers, and Pousse signal display
- `components/WaiterView.tsx` - Added "Fire Mains" button in table detail modal
- `changelog.md` - Documented Phase 2 implementation

- **Kitchen View Phase 1 Improvements**
  - Added item notes display with high-visibility styling (yellow background, bold text, sticky note icon)
  - Notes appear directly on item cards when present, ensuring special requests are never missed
  - Implemented real-time preparation timers with color-coded urgency indicators:
    - < 10 minutes: Zinc (default)
    - 10-20 minutes: Yellow warning
    - \> 20 minutes: Red with pulsing animation
  - Timers displayed in both sidebar queue and main focus view header
  - Timer format shows hours and minutes (e.g., "1h 15m" or "25m")
  - Added new order audio alert using Web Audio API
  - Alert plays a 800Hz beep sound when a new order enters the VALIDATED queue
  - Timer updates every minute automatically
  - Improved visual hierarchy with Clock icons for timer display

### Technical Details
- Added `formatElapsedTime()` helper function to calculate elapsed time and determine color coding
- Implemented `useEffect` hook with `setInterval` for timer updates (every 60 seconds)
- Audio alert uses Web Audio API oscillator for cross-browser compatibility
- Added `previousOrderCountRef` to track order count changes and trigger alerts only on new orders
- Timer calculation based on `order.createdAt` timestamp vs current time

### Files Modified
- `components/KitchenView.tsx` - Added notes rendering, timers, and audio alerts
- `changelog.md` - Documented kitchen view enhancements

## 2026-01-06

### Fixed
- **Kitchen View Category Filtering & UI Improvements**
  - Fixed menu items appearing in wrong category (e.g., "Nem au porc" showing in "PLATS" instead of "ENTRÉES")
  - Root cause: Order queries weren't including category slug data, causing category comparison to fail
  - Updated all order fetch queries to include `categories(slug)` join via `menu_items`
  - Modified `dbOrderToFrontend()` to extract and pass category slug to `dbMenuItemToFrontend()`
  - Menu items now correctly categorized based on their category slug (e.g., "entrees", "salades")

### Enhanced
- **Kitchen Queue Sidebar Cleanup**
  - Removed order ID display (e.g., "#ea32") from queue sidebar for cleaner UI
  - Removed "X items" badge from queue entries
  - Added "打包" (takeaway) tag indicator for pickup orders
  - Tag only appears for `TAKEAWAY` orders, dine-in orders show no tag

### Technical Details
- Updated `fetchActiveOrder()`, `fetchOrdersWithItems()`, and `subscribeToOrders()` queries to include category data
- Modified `dbOrderToFrontend()` converter to extract category slug from nested category relation
- Simplified queue rendering by removing unnecessary item count calculation and display

### Files Modified
- `services/menuService.ts` - Added category joins to order queries, updated converter to use category slugs
- `components/KitchenView.tsx` - Removed order ID and item count from queue, added takeaway tag
- `changelog.md` - Documented kitchen view fixes

## 2026-01-06

### Enhanced
- **Realtime Subscription Debugging & Monitoring**
  - Added comprehensive subscription status logging to `subscribeToOrders()` function
  - Subscription now logs connection status: SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED
  - Added detailed payload logging for INSERT and UPDATE events including order ID, status, and table number
  - Added order processing logs showing order details after realtime events are received
  - Enhanced error handling with warnings when orders are not found after realtime events
  - Console logs now provide visibility into realtime connection health and order update flow
  - Helps diagnose issues with order-table binding and kitchen realtime updates

### Technical Details
- Subscription status callback added to `.subscribe()` method in `menuService.ts`
- Payload logging includes event type, order ID, new status, and table number
- Order processing logs show order ID, status, table number, and item count
- Warning logs when order fetch fails after realtime event

### Files Modified
- `services/menuService.ts` - Added subscription status logging and detailed payload/processing logs
- `changelog.md` - Documented realtime debugging enhancements

## 2026-01-06

### Fixed
- **Order Card Not Disappearing on Drop**
  - Fixed issue where order cards remained visible in the queue after being dropped on a table
  - Added optimistic local state update to immediately hide dropped orders from the queue
  - Order cards now disappear instantly when dropped on a free table, providing immediate visual feedback
  - Added cleanup logic to sync dropped order tracking with database subscription updates
  - Undo functionality properly restores dropped orders back to the queue

### Files Modified
- `components/WaiterView.tsx` - Added droppedOrderIds state and optimistic filtering for instant UI feedback
- `changelog.md` - Documented order card disappearing fix

### Fixed
- **Table Drag Styling - Refined Visual Feedback**
  - Fixed aggressive red borders and multiple ring effects that appeared when dragging orders over tables
  - Replaced thick 4px red borders with subtle 2px accent border
  - Removed multiple layered rings (`ring-4 ring-primary/30`) and heavy red shadows
  - Removed pulsing animation (`animate-pulse`) in favor of smooth CSS transitions
  - Changed valid drop target styling to use gentle scale lift (`scale-105`) with soft shadow
  - Softened occupied table state from harsh red (`bg-red-50 border-red-200`) to warm orange tones (`bg-orange-50/50 border-orange-200`)
  - Removed redundant ring styling on outer container during drag operations
  - Decorative table elements (side bars/chairs) now use subtle primary color accents instead of full saturation
  - Visual feedback now matches the elegant "Le Gourmet" branding with clean, modern aesthetics

### Files Modified
- `components/dnd/DroppableTable.tsx` - Refined drag-over and occupied state styling for elegant visual feedback
- `changelog.md` - Documented table drag styling improvements

### Fixed
- **Drag-and-Drop Visual Feedback**
  - Fixed overwhelming visual dimming effect when dragging orders over floor plan
  - Removed container-level brightness filter (`brightness-75`) that dimmed entire Plan de Salle
  - Removed black overlay (`bg-black/20`) that further reduced visibility
  - Replaced aggressive per-table opacity/grayscale/scale effects with subtle visual feedback:
    - Invalid tables: subtle desaturation (`saturate-50`) instead of heavy opacity reduction
    - Valid tables: gentle scale-up and ring highlight (`scale-[1.02] ring-2 ring-primary/30`)
  - Floor plan now remains fully visible during drag operations, improving usability
  - Visual feedback now focuses on highlighting valid drop targets rather than dimming everything

### Files Modified
- `components/WaiterView.tsx` - Removed container brightness filter and overlay div
- `components/dnd/DroppableTable.tsx` - Simplified visual feedback with subtle saturate effect instead of opacity/grayscale
- `changelog.md` - Documented drag-and-drop visual feedback improvements

### Fixed
- **Drag Card Following Mouse Cursor**
  - Fixed issue where original order card was following mouse cursor alongside the compact overlay pill
  - Removed `transform` from original card style - card now stays in place when dragging starts
  - Changed opacity from `0.5` to `0` when dragging - original card completely disappears
  - Added smooth `opacity 150ms ease` transition for clean collapse effect
  - Only the compact pill overlay now follows the cursor, providing clean drag experience
  - Removed unused `CSS` utility import and `transform` variable from `useDraggable` hook

### Files Modified
- `components/dnd/DraggableOrderCard.tsx` - Removed transform, set opacity to 0 when dragging, added transition
- `changelog.md` - Documented drag card behavior fix

## 2026-01-06

### Fixed
- **Orders Not Appearing in Waiter Interface**
  - Fixed issue where orders created from client interface did not automatically appear in waiter interface
  - Root cause: Supabase Realtime was not enabled for the `orders` table, preventing real-time updates from being broadcast
  - Solution: Added `ALTER PUBLICATION supabase_realtime ADD TABLE orders;` to enable Realtime publication
  - Orders now appear instantly in waiter interface when created from client view
  - Real-time subscription in `App.tsx` now receives INSERT and UPDATE events for orders table

### Database Changes
- Enabled Supabase Realtime publication for `orders` table
- Added SQL command to `supabase_migration.sql` to enable realtime updates

### Files Modified
- `supabase_migration.sql` - Added Realtime publication command for orders table
- `changelog.md` - Documented Realtime fix

## 2026-01-06

### Redesigned
- **Complete Drag-and-Drop Queue Overhaul**
  - Replaced native HTML5 drag-and-drop with @dnd-kit for smooth, touch-friendly interactions
  - Implemented sleek, modern order cards with left accent bars indicating status (amber=pending, blue=in-kitchen, green=ready)
  - Added compact pill indicator that follows cursor during drag (minimalist design)
  - Valid tables now glow with pulse animation when order is dragged over them
  - Invalid tables (occupied or insufficient capacity) are heavily dimmed during drag
  - Added fade-out animation with checkmark on successful drop
  - Integrated toast notifications with 5-second undo capability
  - Full touch/tablet support with optimized activation delays
  - Cards now feature clean typography, quantity pills, and improved visual hierarchy

### Added
- **New DnD Components**
  - `DraggableOrderCard`: Sleek redesigned order card component with status indicators
  - `DroppableTable`: Table component with glow pulse animations and dim states
  - `DragOverlayContent`: Compact pill overlay that follows cursor during drag
  - `useOrderDnD`: Custom hook managing drag state, drop handlers, and undo logic
  - `ToastProvider`: Toast notification system with undo functionality using sonner

### Technical
- Installed @dnd-kit/core, @dnd-kit/utilities, and sonner dependencies
- Added PointerSensor and TouchSensor with optimized activation constraints
- Improved drag feedback with visual states (glow, dim, scale animations)
- Enhanced UX with smooth transitions and micro-interactions

## 2026-01-06

### Fixed
- **Sidebar Order Cards Display**
  - Restored full-width vertical cards in "Commandes en file" sidebar instead of compact grid
  - Cards now display complete order information with proper spacing
  - Maintained number of people display for DINE_IN orders
  - Cards remain clickable to open edit modal

- **Drag and Drop Functionality**
  - Fixed drag and drop not working when dragging orders onto tables in "Plan de Salle"
  - Added proper `onDragEnter` handler to prevent default behavior
  - Enhanced `onDragOver` handler with `stopPropagation()` to prevent event bubbling
  - Added drag handlers to map container to ensure drops are properly handled
  - Fixed `onDragEnd` handler to reset dragged order state
  - Prevented click event from firing when dragging orders
  - Drag and drop now properly validates DINE_IN orders and assigns them to tables

### Added
- **Tablet Order Grid Layout**
  - Converted "Commandes en file" section from large vertical row cards to compact responsive grid layout
  - Grid displays 2 columns on tablet, 3+ columns on larger screens
  - Orders are now displayed as compact cards optimized for tablet interaction
  - Cards show only essential information: order type, number of people, key items, time, and price

- **Number of People Tracking**
  - Added `number_of_people` field to orders table (defaults to 1)
  - Orders now track how many people are dining for DINE_IN orders
  - Number of people displayed with group icon in order cards
  - Editable number of people in order edit modal

- **Order Edit Modal**
  - Created comprehensive order edit modal accessible by clicking on order cards
  - Modal displays order type (Sur Place / À Emporter)
  - Editable number of people field (click to edit, inline input)
  - Order items grouped by display categories: Entrée, Plat, Dessert, Boisson
  - Category mapping function groups multiple category slugs into display categories:
    - Entrée: entrees, salades
    - Plat: pho, udon, riz, bols-riz-blanc, nouilles-sautees, bo-bun, plaque-chauffante, pimente, soupes-traditionnelles
    - Dessert: desserts
    - Boisson: boissons, vins
  - Save button to persist changes

- **Enhanced Drag and Drop**
  - DINE_IN orders automatically validated when dropped on a table
  - Orders disappear from queue after being assigned to a table
  - Improved visual feedback during drag operations

### Changed
- **Order Queue Display**
  - Removed order ID display (#ea32) from waiter view - simplified interface
  - Replaced order ID with number of people icon and count for DINE_IN orders
  - Compact card design with reduced padding and spacing
  - Cards show up to 2 items with "+X autres" indicator for longer orders
  - Improved visual hierarchy and readability

- **Database Schema**
  - Added `number_of_people INTEGER DEFAULT 1` column to orders table
  - Column includes CHECK constraint to ensure positive values

### Fixed
- **Order Assignment Flow**
  - Fixed drag and drop to properly handle order validation and table assignment
  - Orders now correctly disappear from queue after table assignment

### Database Changes
- Created migration `add_number_of_people_migration.sql` to add `number_of_people` column
- Updated existing orders to have default value of 1

### Files Created
- `add_number_of_people_migration.sql` - Database migration for number_of_people field

### Files Modified
- `components/WaiterView.tsx` - Converted to grid layout, added OrderEditModal, enhanced drag-and-drop, removed order ID display
- `services/menuService.ts` - Added `updateOrderPeopleCount()` and `updateOrder()` functions, updated `dbOrderToFrontend()` mapping
- `services/supabaseClient.ts` - Added `number_of_people` field to Order interface
- `types.ts` - Added `numberOfPeople` field to Order interface
- `changelog.md` - Documented tablet grid layout and order edit modal implementation

## 2026-01-06

### Fixed
- **Order Table Display Issue**
  - Fixed "Table null" display bug when clients create DINE_IN orders without table assignment
  - Updated table number display logic in WaiterView to properly handle `null` values
  - Orders without assigned tables now show "À placer" (To be assigned) instead of "Table null"
  - Fixed display logic to check for `null`, empty string, and `'?'` values consistently

- **Orders Queue Filtering**
  - Fixed issue where client-created orders didn't appear in "Commandes en file" (Orders in queue) section
  - Updated `unassignedOrders` filter to include orders with `null` table numbers
  - Orders from client interface (guest or authenticated) now properly appear in waiter queue for table assignment
  - Filter now correctly identifies unassigned DINE_IN orders: `!tableNumber || tableNumber === '?' || tableNumber === ''`

- **Kitchen View Table Display**
  - Fixed `getTableLabel()` function in KitchenView to handle `null` table numbers
  - Kitchen view now displays "À placer" for orders without assigned tables instead of "Table null"

### Changed
- **Table Assignment UX**
  - Improved visual feedback for orders requiring table assignment
  - Orders list now clearly indicates when table assignment is needed for DINE_IN orders

### Files Modified
- `components/WaiterView.tsx` - Fixed table display logic (line 169) and queue filtering (line 425)
- `components/KitchenView.tsx` - Fixed `getTableLabel()` function to handle null table numbers
- `changelog.md` - Documented table display and queue filtering fixes

## 2026-01-05 (Night)

### Fixed
- **Critical: Infinite Recursion in RLS Policies**
  - Fixed "infinite recursion detected in policy for relation 'profiles'" error (PostgreSQL error code 42P17)
  - Root cause: Dev role policies were querying the `profiles` table to check if user is 'dev', which triggered the same policy again, creating infinite recursion
  - Solution: Created `check_user_role()` SECURITY DEFINER function that bypasses RLS when checking user roles
  - Updated all RLS policies that reference `profiles` table to use `check_user_role()` function instead of direct queries
  - This prevents circular dependencies and allows dev users to authenticate and access the system
  - Created `fix_rls_recursion.sql` migration file for immediate production fix
  - Updated `supabase_migration.sql` to include the fix for future deployments

### Changed
- **RLS Policy Architecture**
  - Replaced all `EXISTS (SELECT 1 FROM profiles WHERE ...)` checks with `check_user_role()` function calls
  - Policies affected: profiles, categories, menu_items, orders, order_items
  - All dev role policies now use the function to avoid recursion
  - Function uses SECURITY DEFINER to run with postgres privileges, bypassing RLS restrictions

### Files Created
- `fix_rls_recursion.sql` - Migration file to fix infinite recursion in production database

### Files Modified
- `supabase_migration.sql` - Added `check_user_role()` function and updated all policies to use it
- `changelog.md` - Documented RLS recursion fix

### Database Changes
- Created `check_user_role(required_role user_role)` function with SECURITY DEFINER
- Dropped and recreated all policies that checked profiles table directly
- Function safely checks user role without triggering RLS policies

## 2026-01-05 (Evening)

### Added
- **Dev Role with Full Access**
  - Created 'dev' role in user_role enum for development and testing purposes
  - Dev role has full access to all database tables (orders, order_items, menu_items, categories, profiles)
  - Dev role can switch between CLIENT, SERVEUR, CUISINE, and ADMIN views simultaneously
  - Dev role can see all orders regardless of creator, enabling real-time order propagation testing
  - Created authentication service (`services/authService.ts`) with functions for dev login/logout
  - Created DevLogin component (`components/DevLogin.tsx`) with email/password login form
  - Login screen shown when not authenticated as dev; app interface shown when authenticated

### Changed
- **Authentication Flow**
  - App now requires dev authentication to access the full interface
  - Role switcher tabs (CLIENT, SERVEUR, CUISINE, ADMIN) are only visible when authenticated as dev
  - Orders are only loaded and subscribed to when authenticated as dev
  - Added sign out button in top bar when authenticated as dev
  - Authentication state is persisted across page reloads

- **Database Schema**
  - Added 'dev' to user_role enum type
  - Updated all RLS policies to include dev role with full access:
    - Dev can SELECT, INSERT, UPDATE, DELETE all orders
    - Dev can SELECT, INSERT, UPDATE, DELETE all order items
    - Dev can SELECT, INSERT, UPDATE, DELETE all menu items
    - Dev can SELECT, INSERT, UPDATE, DELETE all categories
    - Dev can SELECT, UPDATE all profiles
  - Dev role policies ensure complete database access for testing and debugging

### Fixed
- **Order Real-time Propagation**
  - Orders created from CLIENT view now appear instantly in SERVEUR view when authenticated as dev
  - Real-time subscriptions work properly because dev role bypasses RLS restrictions
  - Dev authentication ensures Realtime subscriptions receive all order events

### Database Changes
- Added 'dev' value to user_role enum
- Created comprehensive RLS policies for dev role:
  - "Dev can view all profiles"
  - "Dev can update all profiles"
  - "Dev can create orders"
  - "Dev can view all orders"
  - "Dev can update all orders"
  - "Dev can create order items"
  - "Dev can view all order items"
  - "Dev can update all order items"
  - "Dev can delete order items"
  - "Dev can manage all categories"
  - "Dev can manage all menu items"
- Updated existing policies to include 'dev' role alongside admin/waiter/chef roles

### Files Created
- `services/authService.ts` - Authentication service with signInAsDev, signOut, getCurrentUser, isDevRole functions
- `components/DevLogin.tsx` - Login component for dev authentication

### Files Modified
- `supabase_migration.sql` - Added 'dev' to enum and created comprehensive RLS policies for dev role
- `services/supabaseClient.ts` - Updated UserRole type to include 'dev'
- `App.tsx` - Added authentication state management, conditional rendering based on dev auth, sign out functionality
- `changelog.md` - Documented dev role implementation

### Setup Required
- Create a dev user in Supabase dashboard:
  1. Create user in Authentication > Users
  2. Create corresponding profile in profiles table with role='dev'
  3. Use email/password to login via DevLogin component

## 2026-01-05

### Fixed
- **Session-Based Order Creation for Unauthenticated Users**
  - Replaced anonymous authentication with browser-based session ID storage
  - Fixed "Anonymous sign-ins are disabled" error when creating orders as unauthenticated guest
  - Orders can now be created without Supabase authentication using persistent session IDs stored in localStorage
  - Session IDs persist across browser sessions, allowing users to resume orders after closing/reopening the browser

### Changed
- **Database Schema Updates**
  - Added `session_id` TEXT column to `orders` table (nullable, indexed)
  - Updated RLS policies to allow unauthenticated inserts with `session_id`
  - Modified order SELECT policies to support both authenticated (`created_by`) and session-based (`session_id`) queries
  - Updated order_items policies to allow creation for session-based orders

- **Authentication Flow**
  - Created `services/sessionService.ts` for session ID management
  - Session IDs are generated as UUIDs and stored in localStorage with key `restaurant_session_id`
  - `createOrder()` now uses session ID instead of anonymous authentication
  - `fetchActiveOrder()` queries by `session_id` for unauthenticated users
  - Deprecated `ensureAnonymousAuth()` function (kept for backward compatibility)

### Added
- **Session Management Service**
  - `getOrCreateSessionId()` - Gets existing or creates new session ID
  - `getSessionId()` - Gets current session ID without creating new one
  - `clearSessionId()` - Clears session ID from localStorage
  - Handles localStorage unavailability gracefully

### Database Changes
- Added `session_id` column to `orders` table
- Created index `idx_orders_session_id` for performance
- Updated RLS policies:
  - "Users can create orders" - Allows unauthenticated inserts with `session_id`
  - "Users can view their own orders" - Includes session-based queries
  - "Users can create order items for their orders" - Supports session-based orders
  - "Users can view order items for accessible orders" - Includes session-based order items

### Files Created
- `services/sessionService.ts` - Session ID management utility

### Files Modified
- `supabase_migration.sql` - Added `session_id` column and updated RLS policies
- `services/menuService.ts` - Updated `createOrder()` and `fetchActiveOrder()` to use session IDs
- `services/supabaseClient.ts` - Added `session_id` to Order interface, deprecated `ensureAnonymousAuth()`
- `changelog.md` - Documented session-based authentication implementation

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

