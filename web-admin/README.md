# MindFlow Admin Web Portal

This is the secure, central administration dashboard for the MindFlow Mindfulness Research Study. Built with React, Vite, TypeScript, and Tailwind CSS, it enables researchers to review participant records, analyze aggregated wellness statistics, and perform system actions.

---

## Key Features

1.  **Analytical Monitoring Dashboard**:
    *   Visual representation of participant progress and completion compliance using interactive graphs (Recharts).
    *   Summary analytics showing overall stress scores (PSS-10), wellbeing indexes (WEMWBS-14), and mindfulness facets (FFMQ-15).
2.  **User Profile Management**:
    *   Provision, update, and search participant records.
    *   Manage specific Research IDs, assign experimental vs. control groups, and update emails or credentials.
3.  **Audit Logs & Submissions**:
    *   Audit logs for user check-ins (Daily Sliders, questionnaires, and Weekly Whispers audio records).
    *   Secure access to voice diary uploads.

---

## Technology Stack

*   **Runtime & Bundler**: Vite (React + TypeScript fast refreshing)
*   **Styling**: Tailwind CSS, Tailwind Animate
*   **UI Components**: Radix UI primitives (Dropdown, Dialog, Select, Progress, Tabs, etc.)
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **Authentication & Services**: Supabase JS SDK

---

## Getting Started

### Prerequisites
*   Node.js v20.x (LTS) or higher
*   A running MindFlow Express Backend service

### 1. Installation
Navigate to the directory and install dependencies:
```bash
cd web-admin
npm install
```

### 2. Configure Environment
Create a .env file in the root of web-admin/ (copy .env.example as a template):
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-api-key
# VITE_API_BASE_URL=http://localhost:3000/api   # optional, this is the default
```

### 3. Run Development Server
Start the local server:
```bash
npm run dev
```
The site will run at http://localhost:5173.

### 4. Build for Production
To build static production files inside the dist/ directory:
```bash
npm run build
```
To preview the compiled production build locally:
```bash
npm run preview
```

---

## Directory Layout

```
web-admin/
├── src/
│   ├── components/      # Common UI parts (Cards, Modal dialogs, ErrorBoundary)
│   ├── hooks/           # User authentication hooks
│   ├── lib/             # Utility clients (Supabase setup, helpers)
│   ├── pages/           # Screen views (LoginPage, AdminDashboard, LandingPage)
│   ├── types/           # TS Interfaces
│   ├── App.tsx          # Main entry routing (react-router-dom)
│   └── main.tsx         # Virtual DOM renderer mount point
├── index.html           # Document shell
├── tailwind.config.js   # Style design token configurations
└── vite.config.ts       # Bundler configs
```


MINDFLOW ADMIN PORTAL - COMPREHENSIVE AUDIT REPORT
   ===================================================

   CRITICAL ISSUES (Must Fix)
   ==========================

   1. ENVIRONMENT VARIABLE MISCONFIGURATION (BLOCKS APP STARTUP)
      Location: .env file vs supabaseClient.ts
      Issue:
      - .env contains: SUPABASE_URL, SUPABASE_ANON_KEY
      - Code expects: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
      - Vite only exposes env vars prefixed with VITE_ to client code
      Impact: Application will fail to initialize with "Missing Supabase Environment Variables"
      Fix: Rename env variables in .env:
           SUPABASE_URL → VITE_SUPABASE_URL
           SUPABASE_ANON_KEY → VITE_SUPABASE_ANON_KEY

   2. PAGINATION BUG - DATA OVERLOAD
      Location: AdminDashboard.tsx, lines 408-410
      Code:
      ```
      const paginatedData = searchQuery
          ? filteredTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
          : filteredTableData;  // BUG: Returns ALL data when no search!
      ```
      Issue: Without search query, ALL records display on single page (instead of 50-record pages)
      Impact: High - Can cause performance issues with large tables, breaks UX
      Fix: Always slice data:
      ```
      const paginatedData = filteredTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
      ```

   HIGH PRIORITY ISSUES
   ====================

   3. DEAD CODE - UNUSED API CLIENT
      Location: src/lib/api.ts (122 lines, 44 exported methods)
      Issue:
      - ApiClient class with comprehensive methods (getDashboardSummary, submitDailyEntry, uploadWeeklyAudio, etc.)
      - Never imported or used anywhere in the codebase
      - Defined for Node.js backend but all admin operations use Supabase directly
      Impact: Code bloat, confusion for new developers, maintenance burden
      Recommendation:
      - Delete api.ts OR
      - Document why it exists and under what conditions it should be used
      - Current usage pattern: Direct Supabase queries via AdminDashboard.tsx

   4. POOR TYPE SAFETY
      Location: AdminDashboard.tsx (throughout)
      Issues:
      - Line 61: const [tableData, setTableData] = useState<any[]>([]);
      - Lines 69-74: analyticsData uses any[] for all 6 data types
      - Lines 84-89: analyticsCache.current same issue
      - Lines 110-111: recentSubmissions and chartData as any[]
      - Lines 116-117: selectedRow and formValues loose types
      - Lines 173+: err caught as any (17+ instances)
      Impact: Lost IDE autocomplete, runtime errors harder to catch, unmaintainable
      Recommendation: Define interfaces for:
      ```
      interface DailySlider { id: string; user_id: string; mood: number; stress_level: number; created_at: string; ... }
      interface AnalyticsData { dailySliders: DailySlider[]; voiceRecordings: VoiceRecording[]; ... }
      interface TableRow { [key: string]: unknown; }
      ```

   MEDIUM PRIORITY ISSUES
   ======================

   5. MISSING useCallback MEMOIZATION
      Location: AdminDashboard.tsx, lines 123-135 and 136-139
      Issue: useEffect hooks call functions (loadAnalyticsData, loadTableData) without including them in dependency arrays
      - Line 131: loadAnalyticsData() called but not in deps
      - Line 137: loadTableData() called but not in deps
      Current: Dependencies = [selectedTable, activeTab, analyticsTimeframe]
      Impact: Potential stale closures, ESLint warnings if strict mode enabled
      Fix: Wrap functions in useCallback:
      ```
      const loadAnalyticsData = useCallback(async (timeframe) => { ... }, []);
      const loadTableData = useCallback(async (page) => { ... }, []);
      ```

   6. ACCESSIBILITY GAPS
      Location: Multiple files
      Issues:
      - Only 3 aria-hidden attributes on decorative elements
      - No role attributes on custom components (sidebar, modal dialogs)
      - Search input (line 980) lacks descriptive label
      - Table headers missing scope="col" attributes
      - Color-only status indicators (green pulse for online status, red delete button)
      Impact: Screen reader users miss semantic structure, WCAG 2.1 AA violations
      Fixes:
      - Add role="navigation" to sidebar
      - Add role="complementary" to cards
      - Add scope="col" to table headers
      - Use text+color for status indicators

   7. COMPONENT COMPLEXITY / MONOLITHIC DESIGN
      Location: AdminDashboard.tsx (1207 lines!)
      Metrics:
      - 29 state hooks (useState, useRef, useCallback needed)
      - 3 major tabs (overview, tables, analytics) in one component
      - Mixed concerns: data loading, CRUD operations, analytics, export, search
      Impact: Hard to test, maintain, debug; performance issues with re-renders
      Recommendation: Refactor into:
      - OverviewTab.tsx
      - TablesTab.tsx (with TableList, TableEditor, TableExport sub-components)
      - AnalyticsTab.tsx (with AnalyticsChart, EngagementIndex sub-components)
      - Move CRUD logic to useCRUD hook

   8. MISSING FORM VALIDATION
      Location: CrudModal.tsx, AdminDashboard.tsx (lines 225-255, 257-292)
      Issue:
      - No client-side validation before submit
      - No required field highlighting
      - No error messages for invalid inputs
      - Type coercion happens silently (line 234-239)
      Impact: Bad UX, silent failures, data quality issues
      Fix: Integrate react-hook-form validation with Zod schemas:
      ```
      const schema = z.object({
          user_id: z.string().uuid(),
          stress_level: z.number().min(1).max(5),
          ...
      });
      ```

   9. RACE CONDITION RISK - CONCURRENT TABLE UPDATES
      Location: AdminDashboard.tsx (lines 225-255, 257-292)
      Issue:
      - Creating/updating records doesn't check for conflicts
      - No optimistic updates or cache invalidation
      - If two users edit same record, last write wins
      Impact: Data loss, confusion
      Recommendation: Implement:
      - Optimistic updates with rollback
      - Conflict detection on update
      - Last-modified timestamp validation

   10. ANALYTICS CACHE IMPLEMENTATION
       Location: AdminDashboard.tsx, lines 83-90 and 127-132
       Issue: useRef-based cache persists across tab switches but has no invalidation
       - Cache never cleared when data might have changed
       - Stale data shown until user manually switches timeframe
       Impact: Admin sees outdated analytics
       Fix: Add cache invalidation on data mutations or implement proper React Query

   MINOR ISSUES / IMPROVEMENTS
   ===========================

   11. MISSING ERROR BOUNDARIES FOR ASYNC OPERATIONS
       Location: Various data loading functions
       - fetchOverviewMetrics (line 190-205)
       - loadTableData (line 207-223)
       - loadAnalyticsData (line 140-178)
       All catch errors and toast but no persistent error state
       Issue: User sees brief toast, then component continues with stale data
       Fix: Add error state to each data-loading operation

   12. INCONSISTENT SEARCH BEHAVIOR
       Location: AdminDashboard.tsx, lines 384-402
       Issue:
       - Special search logic for tables with user_id (line 389-392)
       - Special logic for profiles table (line 393-396)
       - Generic fallback (line 399-401)
       - Confusing when search column isn't obvious
       Impact: Users confused why search works differently per table
       Fix: Add searchColumn description to TABLES_CONFIG

   13. DATE/TIME INCONSISTENCY IN EXPORTS
       Location: AdminDashboard.tsx, lines 318-331
       Issue: Export filter checks multiple date columns: created_at, updated_at, event_date, published_at
       - Different tables use different column names
       - Fall-through logic unclear
       Impact: Confusing which dates are actually used for filtering
       Recommendation: Add explicit date_column field to TableConfig

   14. MISSING LOADING STATE ON BUTTONS
       Location: CrudModal.tsx
       Issue: Create/Edit buttons have no loading indicator during submit
       - User might click multiple times thinking first click didn't work
       - No visual feedback
       Impact: Poor UX
       Fix: Pass loading prop to buttons in modal footer

   15. NO INPUT SANITIZATION
       Location: CrudModal.tsx, AdminDashboard.tsx
       Issue: String inputs not validated for length or special characters
       - Could allow XSS in text fields (though Supabase SQL prevents injection)
       - No max-length attributes on inputs
       Impact: Data quality issues
       Fix: Add maxLength to Input components, validate in onSubmit

   16. AVATAR FALLBACK HARDCODED
       Location: AdminDashboard.tsx, line 618
       ```
       <AvatarFallback className="text-white text-[10px] font-bold">U</AvatarFallback>
       ```
       Issue: Always shows "U" instead of user initials
       Impact: All avatars look identical, no visual differentiation
       Fix: Extract user initials from username

   17. TIME DISPLAY LOCALE INCONSISTENCY
       Location: Multiple locations
       - Lines 625-626: Uses localeString with custom options
       - Line 904: Uses simple toLocaleDateString
       - Line 761: Uses custom time format logic
       Issue: Inconsistent time formatting across app
       Impact: Confusing UX
       Fix: Create timeFormat utility function, use consistently

   18. MISSING USER CONFIRMATION DIALOGS
       Location: AdminDashboard.tsx, line 296
       Issue: Uses native confirm() which is ugly and not styled
       Impact: Breaks design consistency
       Fix: Create ConfirmDialog component using Radix Dialog

   PERFORMANCE CONSIDERATIONS
   ==========================

   19. NO PAGINATION FOR ANALYTICS DATA
       Location: AdminDashboard.tsx, lines 154-170
       Issue: Loads ALL records for all analytics tables (daily_sliders, voice_recordings, questionnaires, etc.)
       - No limit clause
       - If study has thousands of participants, this downloads everything
       Impact: Slow analytics tab, high bandwidth
       Fix: Add time-based filtering to each analytics query

   20. UNOPTIMIZED RE-RENDERS
       Location: AdminDashboard.tsx
       Issue: Component re-renders whenever any state changes
       - 29 state hooks = 29 potential render triggers
       - selectedTable object might cause unnecessary re-renders of tables list
       Recommendation: Use useCallback memoization, consider React.memo for sub-components

   SECURITY NOTES (LOW RISK)
   =========================

   21. SUPABASE RLS DEPENDENCY
       - All security relies on Supabase Row Level Security policies
       - No additional server-side authorization checks
       - If RLS is misconfigured, admin portal is exposed
       Recommendation: Document RLS policy requirements in README

   22. SESSION MANAGEMENT
       - Relies entirely on Supabase session tokens
       - No session timeout implementation
       - No logout on inactivity
       Recommendation: Implement session timeout on inactivity

   DEAD/UNUSED CODE
   ================

   23. Unused Imports Check:
       - api.ts: 122 lines of code that's never imported
       - No other obvious unused exports found

   CONFIGURATION ISSUES
   ====================

   24. VITE_API_BASE_URL UNUSED
       Location: .env.example and api.ts
       Issue: API_BASE_URL defined in api.ts but api.ts itself is never used
       Impact: Confusing - appears to support backend API but doesn't
       Fix: Either remove or actually use the API client

   ===============================================
   SUMMARY
   ===============================================

   Total Issues Found: 24
   - Critical (blocks functionality): 2
   - High Priority (major issues): 4
   - Medium Priority (should fix): 5
   - Minor (nice to have): 9
   - Security/Performance notes: 2
   - Configuration: 2