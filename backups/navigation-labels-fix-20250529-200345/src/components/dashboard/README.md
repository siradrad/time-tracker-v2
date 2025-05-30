# Dashboard Component Decomposition Plan

This directory contains the decomposed components from the original monolithic Dashboard.jsx file.

## Component Structure

The Dashboard is broken down into the following components:

1. **Dashboard.jsx** - Main container component that:
   - Manages global dashboard state
   - Handles loading of data
   - Conditionally renders either AdminDashboard or UserDashboard based on user role

2. **AdminDashboard/** - Components for the admin view:
   - `AdminDashboard.jsx` - Main admin dashboard container
   - `AdminStats.jsx` - Summary statistics for admin
   - `UserCard.jsx` - Individual user card with stats
   - `UserList.jsx` - List of all users with their summary stats
   - `TimeEntriesList.jsx` - Hierarchical view of time entries

3. **UserDashboard/** - Components for the regular user view:
   - `UserDashboard.jsx` - Main user dashboard container
   - `UserStats.jsx` - Personal stats display
   - `RecentActivity.jsx` - Recent time entries

4. **Reporting/** - Components for the reporting functionality:
   - `ReportingModal.jsx` - The reporting modal with filters
   - `ReportFilters.jsx` - Filter controls for reports
   - `ReportGenerator.jsx` - Logic for generating reports

5. **Shared/** - Reusable components across dashboard views:
   - `DashboardCard.jsx` - Card component with consistent styling
   - `LoadingState.jsx` - Loading indicator
   - `ErrorState.jsx` - Error display
   - `StatItem.jsx` - Individual statistic display

## Data Flow

- Main Dashboard component loads and manages global data
- Data is passed down to child components via props
- Child components emit events up to parent components for actions
- No direct API calls from deeply nested components 