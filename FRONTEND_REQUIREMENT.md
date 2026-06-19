# Frontend Requirements for Drone Delivery DSS System

## 1. Purpose
This frontend is the operation layer for the drone delivery system. It must help customers create delivery requests and help dispatchers review model output, view the dashboard, and assign the right drone.

## 2. User Roles
- Customer: creates delivery requests and tracks order status.
- Dispatcher: reviews recommendations, monitors drones, and assigns/reassigns drones.
- Admin: manages master data, system settings, and audit logs.

## 3. Main Frontend Areas
- Customer pages.
- Dispatcher dashboard.
- Drone monitoring view.
- Order monitoring view.
- System alerts and logs.
- Authentication and role-based access.

## 4. Customer Features
- Request delivery form.
- Order history page.
- Order detail page.
- Live order status view.
- Clear error messages and success messages.

## 5. Dispatcher Dashboard Features
- List of pending orders.
- List of drones with current status.
- Model output panel.
- DSS recommendation panel.
- Assignment actions: assign, reassign, reject, override.
- Audit history of decisions.

## 6. Drone Monitoring UI
- Drone list with battery, location, status, payload capacity, and availability.
- Map view showing drone positions.
- Live updates when telemetry changes.
- Warning state for low battery, offline drone, or maintenance.

## 7. Order Monitoring UI
- Order queue with filter by status.
- Order detail modal or detail page.
- Timeline of order progress.
- Estimated time of arrival.
- Delivery failure reasons when available.

## 8. Model and DSS Display
- Show model input summary when needed.
- Show predicted score / risk / ETA.
- Show why a drone was recommended.
- Show hard-rule blocks such as low battery, overload, or unavailable drone.
- Keep the DSS output explainable for dispatchers.

## 9. Required Screens
- Login page.
- Customer dashboard.
- New request page.
- Dispatcher dashboard.
- Drone detail page.
- Order detail page.
- Admin settings page.
- Audit log page.

## 10. Required UI Components
- Top navigation bar.
- Sidebar for dispatcher and admin.
- Status cards.
- Tables with sorting and filtering.
- Map component.
- Modal dialogs.
- Toast notifications.
- Loading skeletons.

## 11. Frontend Data Needs
- Auth data.
- Orders list and order detail.
- Drone list and drone detail.
- Prediction output.
- DSS recommendation.
- Real-time telemetry updates.
- Notification events.

## 12. API Integration Rules
- Use a separate API client layer.
- Handle loading, success, and error states.
- Do not hardcode backend data.
- Use environment variables for API base URL.
- Support token-based auth if enabled.

## 13. Real-Time Behavior
- Poll or subscribe for drone status updates.
- Refresh dashboard automatically.
- Update order status without full page reload.
- Show alerts for critical drone events.

## 14. UX Rules
- Keep dispatcher flow fast and minimal.
- Make important statuses visible first.
- Use color carefully for status indicators.
- Avoid clutter in the main dashboard.
- Show confirm dialogs before manual override.

## 15. Validation Rules
- Validate form inputs before submit.
- Show inline validation errors.
- Validate required fields, location, and delivery notes.
- Prevent duplicate requests caused by double click.

## 16. State Management
- Keep auth state globally.
- Keep order and drone state in a shared store or query layer.
- Separate UI state from server state.
- Cache lists when needed.

## 17. Testing Scope
- Test page rendering.
- Test form validation.
- Test role-based access.
- Test assignment flow.
- Test dashboard rendering with mock API responses.

## 18. Definition of Done
- Customer can create and track an order.
- Dispatcher can see model output and DSS recommendation.
- Dispatcher can assign a drone from the dashboard.
- Drone and order statuses update correctly.
- UI works for normal, loading, empty, and error states.