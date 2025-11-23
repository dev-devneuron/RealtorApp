# Dashboard Modularization Guide

This guide explains how the Dashboard has been modularized into separate tab components.

## Structure

```
components/dashboard/
├── constants.ts          # Shared constants (API_BASE)
├── types.ts             # Shared TypeScript types
├── utils.ts             # Shared utility functions
├── index.ts             # Export all components
├── PropertiesTab.tsx    # Properties tab component ✅
├── RealtorsTab.tsx      # Realtors tab component (TODO)
├── AssignPropertiesTab.tsx  # Assign Properties tab (TODO)
├── ViewAssignmentsTab.tsx   # View Assignments tab (TODO)
├── CallForwardingTab.tsx    # Call Forwarding tab (TODO)
├── PhoneNumbersTab.tsx      # Phone Numbers tab (TODO)
├── BookingsTab.tsx          # Bookings tab (TODO)
├── ChatsTab.tsx             # Call Records tab (TODO)
├── MaintenanceRequestsTab.tsx # Maintenance Requests tab (TODO)
└── TenantsTab.tsx           # Tenants tab (TODO)
```

## Pattern for Creating Tab Components

Each tab component should:

1. **Accept props** for all state and handlers it needs
2. **Be self-contained** - handle its own UI rendering
3. **Use shared utilities** from `utils.ts` and types from `types.ts`
4. **Maintain the same UI** as the original implementation

### Example Component Structure

```tsx
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// ... other imports

interface MyTabProps {
  // All state values needed
  data: any[];
  loading: boolean;
  userType: string | null;
  
  // All handlers needed
  onRefresh: () => void;
  onItemClick: (item: any) => void;
  // ... other handlers
}

export const MyTab = ({
  data,
  loading,
  userType,
  onRefresh,
  onItemClick,
}: MyTabProps) => {
  return (
    <TabsContent value="my-tab">
      {/* Component JSX here */}
    </TabsContent>
  );
};
```

### Steps to Extract a Tab

1. **Identify the tab section** in Dashboard.tsx (look for `<TabsContent value="...">`)
2. **List all dependencies**:
   - State variables used
   - Functions/handlers called
   - Props/data passed
3. **Create the component file** in `components/dashboard/`
4. **Define the props interface** with all needed values
5. **Copy the JSX** from Dashboard.tsx to the component
6. **Replace state/functions** with props
7. **Update Dashboard.tsx** to import and use the component
8. **Pass all required props** from Dashboard to the component

## Current Status

- ✅ **PropertiesTab** - Extracted and working
- ⏳ **Other tabs** - To be extracted following the same pattern

## Next Steps

1. Extract remaining tabs one by one
2. Update Dashboard.tsx to use all tab components
3. Remove unused code from Dashboard.tsx
4. Test all functionality

