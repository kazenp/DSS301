# Backend Requirements for Drone Delivery DSS System

## 1. Purpose
The backend is the core of the drone delivery system. It receives delivery requests, manages drones and orders, runs the model, applies DSS rules, and provides data for the frontend dashboard.

## 2. Core Responsibilities
- Handle authentication and authorization.
- Manage users, orders, drones, telemetry, assignments, and logs.
- Call the prediction model service or module.
- Apply DSS logic for drone selection.
- Provide APIs for customer and dispatcher screens.
- Support real-time or near real-time updates.

## 3. User Roles
- Customer: creates requests and views order status.
- Dispatcher: reviews recommendations and assigns drones.
- Admin: manages system data and audits.
- Internal service: telemetry ingestion and model inference.

## 4. Main Backend Modules
- Auth module.
- User module.
- Order module.
- Drone module.
- Telemetry module.
- Prediction module.
- DSS module.
- Assignment module.
- Notification module.
- Audit log module.

## 5. Authentication and Access Control
- Login and token issuing.
- Role-based access control.
- Protect customer, dispatcher, and admin endpoints.
- Support secure session or JWT-based auth.
- Log important access events.

## 6. Order Management
- Create order.
- Read order list and order detail.
- Update order status.
- Cancel order if allowed.
- Store delivery location, time, notes, and priority.
- Keep status history for every order.

## 7. Drone Management
- Create, update, and read drone records.
- Store drone status, battery, payload capacity, base location, and current location.
- Mark drone as available, busy, charging, maintenance, or offline.
- Support drone availability queries.
- Keep drone history if status changes.

## 8. Telemetry Management
- Receive drone telemetry data.
- Store battery, GPS, speed, altitude, and connection status.
- Detect abnormal or missing telemetry.
- Expose latest drone state for frontend.
- Keep telemetry history for analytics and debugging.

## 9. Prediction Model Integration
- Prepare input features from order and drone data.
- Call the trained model or model service.
- Receive prediction result such as risk, ETA, or suitability score.
- Return model output in a structured format.
- Handle model timeout and failure gracefully.

## 10. DSS Logic
- Apply business rules after model output.
- Filter out invalid drones.
- Rank eligible drones.
- Explain why one drone is recommended.
- Support manual override by dispatcher.
- Store DSS decision trace.

## 11. Assignment Workflow
- Recommend a drone for each order.
- Assign a drone to an order.
- Reassign when needed.
- Release drone when delivery fails or ends.
- Prevent double assignment conflicts.
- Record who made the assignment and when.

## 12. Notification and Events
- Send order status updates.
- Send dispatcher alerts for low battery or failed assignment.
- Send system alerts for critical errors.
- Support event-based updates for frontend.
- Keep notification history if needed.

## 13. API Requirements
- Provide REST APIs with clear naming.
- Use consistent request and response formats.
- Use pagination for lists.
- Support filtering and search.
- Return helpful error messages.
- Version APIs if needed.

## 14. Data Requirements
- Store users, orders, drones, telemetry, predictions, DSS decisions, assignments, notifications, and audits.
- Use timestamps for every important event.
- Keep history, not only latest state.
- Ensure database relations are clean and stable.

## 15. Logging and Audit
- Log requests, errors, and important actions.
- Track which dispatcher assigned which drone.
- Track model output and DSS final choice.
- Support debugging for failed delivery flows.
- Avoid noisy logs for normal traffic.

## 16. Error Handling
- Validate all input data.
- Return structured validation errors.
- Handle model failure.
- Handle unavailable drone.
- Handle concurrent assignment conflicts.
- Handle missing telemetry safely.

## 17. Security Requirements
- Secure all sensitive endpoints.
- Validate tokens and roles.
- Sanitize user input.
- Do not expose internal model details unnecessarily.
- Protect admin actions with stronger authorization.

## 18. Testing Scope
- Unit test business logic.
- Test DSS rules.
- Test model integration.
- Test order creation and assignment.
- Test role-based authorization.
- Test telemetry ingestion.
- Test error scenarios.

## 19. Definition of Done
- Backend can create and manage orders.
- Backend can manage drones and telemetry.
- Backend can return model output.
- Backend can produce DSS recommendation.
- Backend can assign drones safely.
- Backend can support frontend dashboard data.
- Backend handles normal and failure cases reliably.