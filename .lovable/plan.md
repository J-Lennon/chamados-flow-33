

## Plan: Real-time UI updates without page refresh

### Problem
1. **Users list**: After creating a user via `CreateUserDialog`, the `UsersManagement` component doesn't refresh its list until manual page reload.
2. **Tickets**: After completing/closing a ticket, the list doesn't update immediately.

### Solution

#### 1. Users: Add `onUserCreated` callback + Realtime subscription

- **`CreateUserDialog`**: Add an `onUserCreated` callback prop. Call it after successful user creation.
- **`UsersManagement`**: Pass `onUserCreated={fetchUsers}` to `CreateUserDialog`. Also add a Supabase Realtime subscription on the `profiles` table to auto-refetch when any profile is inserted/updated/deleted.
- **`Header`**: Also pass `onUserCreated` through to trigger refetch if the user is on the `/users` page — but simpler: the realtime subscription in `UsersManagement` handles it automatically.

#### 2. Tickets: Already has realtime subscription

The `useTickets` hook already subscribes to `postgres_changes` on the `tickets` table and calls `fetchTickets()` on any change. If ticket completion isn't reflecting, it may be a channel naming conflict (multiple instances using the same channel name `"tickets-changes"`). Fix by using a unique channel name per hook instance.

### Technical Changes

| File | Change |
|------|--------|
| `src/components/UsersManagement.tsx` | Add Supabase Realtime subscription on `profiles` table to auto-refetch users on INSERT/UPDATE/DELETE |
| `src/components/CreateUserDialog.tsx` | Add optional `onUserCreated` callback prop, call it on success |
| `src/components/Header.tsx` | No change needed — realtime handles it |
| `src/hooks/useTickets.ts` | Use unique channel name (e.g., with `statusFilter`) to avoid conflicts between multiple hook instances |

### Implementation Details

**UsersManagement realtime subscription:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel("profiles-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
      fetchUsers()
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [isAdmin, isAgent])
```

**useTickets unique channel:**
```typescript
const channel = supabase
  .channel(`tickets-changes-${statusFilter || 'all'}`)
  ...
```

This ensures all data updates reflect immediately without page refresh.

