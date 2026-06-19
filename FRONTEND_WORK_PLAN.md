# Frontend Work Plan for Drone Delivery DSS System

## Goal

Build the frontend that supports customers and dispatchers in the drone delivery system, with clear visibility of orders, drones, model output, and DSS recommendations.

## Work Items

### 1. Project Setup

- Create the frontend project structure.
- Set up routing.
- Set up shared layout components.
- Set up API client configuration.
- Add environment variable support.

### 2. Authentication and Roles

- Build login screen.
- Store auth token securely.
- Load current user profile after login.
- Redirect users based on role.
- Hide admin features from customer accounts.

### 3. Customer Flow

- Build delivery request form.
- Add validation for required fields.
- Show success/failure feedback after submit.
- Build order history page.
- Build order detail page.
- Show delivery status timeline.

### 4. Dispatcher Flow

- Build dispatcher dashboard shell.
- Show pending orders.
- Show drone availability list.
- Show model output card.
- Show DSS recommendation card.
- Add assign / reassign / reject / override actions.

### 5. Drone Monitoring

- Build drone table with filters.
- Show battery, status, payload, and location.
- Build drone detail panel.
- Add map view for active drones.
- Add warning states for low battery and offline drones.

### 6. Order Monitoring

- Build order list with status filters.
- Show order detail panel.
- Show ETA and delivery path summary when available.
- Show error state if delivery fails.

### 7. Dashboard UI

- Create KPI cards.
- Create charts or summary widgets if needed.
- Add tabs or sections for orders, drones, and logs.
- Add refresh behavior for live updates.
- Keep the interface clean for dispatcher use.

### 8. Model and DSS UI

- Display model prediction results.
- Display recommendation explanation.
- Show constraints used by DSS.
- Show why a drone was accepted or rejected.
- Make the output easy for humans to understand.

### 9. Notifications and Alerts

- Add toast notifications.
- Add alert banners for critical events.
- Add confirmation dialogs for dangerous actions.
- Add empty-state UI.
- Add loading skeletons.

### 10. API Integration

- Create reusable API functions.
- Handle loading and error states everywhere.
- Centralize request headers and auth token injection.
- Normalize API response shapes for UI use.
- Handle API timeouts and retry messages.

### 11. Testing and Polish

- Test each screen with mock data.
- Test role-based visibility.
- Test order creation.
- Test assignment workflow.
- Fix layout issues and responsiveness.

## Priority Order

1. Auth and routing.
2. Customer order pages.
3. Dispatcher dashboard.
4. Drone monitoring.
5. Model and DSS display.
6. Notifications and polish.
7. Testing.

## Expected Output for Frontend Developer

- A working customer flow.
- A working dispatcher dashboard.
- A clear model/DSS results panel.
- A usable drone assignment interface.
- A UI that can connect cleanly to backend APIs.
