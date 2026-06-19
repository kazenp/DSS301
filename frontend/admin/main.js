document.addEventListener('DOMContentLoaded', () => {
    const busyDayToggle = document.getElementById('busyDayToggle');
    const dronesContainer = document.getElementById('dronesContainer');
    const ordersTableBody = document.getElementById('ordersTableBody');
    const refreshDronesBtn = document.getElementById('refreshDrones');
    const refreshOrdersBtn = document.getElementById('refreshOrders');

    const BACKEND_URL = 'http://localhost:8000/api/v1';

    // 1. Fetch system status (Busy Day Mode)
    async function fetchSystemStatus() {
        try {
            const response = await fetch(`${BACKEND_URL}/admin/status`);
            if (response.ok) {
                const data = await response.json();
                busyDayToggle.checked = data.busy_day;
            }
        } catch (error) {
            console.error('Error fetching admin status:', error);
        }
    }

    // 2. Update Busy Day Mode
    busyDayToggle.addEventListener('change', async () => {
        try {
            await fetch(`${BACKEND_URL}/admin/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    busy_day: busyDayToggle.checked,
                    system_status: 'active'
                })
            });
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('Failed to update system status.');
            // Revert state
            busyDayToggle.checked = !busyDayToggle.checked;
        }
    });

    // 3. Fetch Drone fleet status
    async function fetchDrones() {
        dronesContainer.innerHTML = '<p class="loading-text">Updating fleet status...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/drones/`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const drones = await response.json();
            dronesContainer.innerHTML = '';
            
            if (drones.length === 0) {
                dronesContainer.innerHTML = '<p class="loading-text">No drones registered.</p>';
                return;
            }

            drones.forEach(drone => {
                const card = document.createElement('div');
                card.className = 'drone-card';
                card.innerHTML = `
                    <div class="drone-info">
                        <h4>${drone.drone_id.toUpperCase()}</h4>
                        <p>Battery: ${drone.battery}% | Payload: ${drone.current_payload ? drone.current_payload + ' kg' : 'None'}</p>
                    </div>
                    <span class="drone-badge ${drone.status}">${drone.status.toUpperCase()}</span>
                `;
                dronesContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching drones:', error);
            dronesContainer.innerHTML = '<p class="loading-text" style="color:#ef4444">Failed to fetch fleet status.</p>';
        }
    }

    // 4. Fetch Orders
    async function fetchOrders() {
        ordersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading active orders...</td></tr>';
        try {
            const response = await fetch(`${BACKEND_URL}/orders/`);
            if (!response.ok) throw new Error('Failed to fetch');
            
            const orders = await response.json();
            ordersTableBody.innerHTML = '';
            
            if (orders.length === 0) {
                ordersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders found. Use the client interface to create requests.</td></tr>';
                return;
            }

            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${order.client_name}</strong></td>
                    <td>${order.destination}</td>
                    <td>${order.weight} kg (${order.payload_type})</td>
                    <td>${order.distance} km</td>
                    <td><span class="status-badge ${order.status}">${order.status.toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-small btn-secondary evaluate-btn" data-id="${order.id}">Evaluate DSS</button>
                    </td>
                `;
                ordersTableBody.appendChild(row);
            });

            // Bind click to evaluate buttons
            document.querySelectorAll('.evaluate-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-id');
                    runDssEvaluation(orderId, e.target);
                });
            });

        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state" style="color:#ef4444">Failed to load orders from server.</td></tr>';
        }
    }

    // 5. Run DSS Evaluation for a specific order (Simulated flight)
    async function runDssEvaluation(orderId, buttonElement) {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Evaluating...';
        
        try {
            // Get order details
            const orderRes = await fetch(`${BACKEND_URL}/orders/${orderId}`);
            if (!orderRes.ok) throw new Error('Order not found');
            const order = await orderRes.json();

            // Simulate flight conditions
            const simulatedTelemetry = {
                wind_speed: Math.round((Math.random() * 15) * 10) / 10,
                battery_remaining: Math.round((60 + Math.random() * 40)),
                actual_carry_weight: order.weight,
                payload_type: order.payload_type,
                altitude: 120.0,
                distance_flown: order.distance,
                gps_accuracy: 1.5,
                obstacles_encountered: Math.floor(Math.random() * 2)
            };

            // Call DSS evaluation API
            const dssResponse = await fetch(`${BACKEND_URL}/predict/dss-evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telemetry: simulatedTelemetry,
                    busy_day: busyDayToggle.checked
                })
            });

            if (!dssResponse.ok) throw new Error('DSS evaluation failed');
            const result = await dssResponse.json();

            // Update status badge on row
            const statusCell = buttonElement.parentElement.previousElementSibling;
            const statusClass = result.dss_approved ? 'approved' : 'rejected';
            const statusText = result.final_status;
            
            statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            
            alert(`DSS Assessment for Order from ${order.client_name}:\n\n` + 
                  `Decision: ${statusText}\n` + 
                  `Model Success Prob: ${(result.prediction.success_probability * 100).toFixed(1)}%\n` + 
                  `Telemetry Environment:\n` + 
                  ` - Wind Speed: ${simulatedTelemetry.wind_speed} m/s\n` + 
                  ` - Drone Battery: ${simulatedTelemetry.battery_remaining}%\n` + 
                  `Reason: ${result.decision_reason}`);

        } catch (error) {
            console.error('Error evaluating DSS:', error);
            alert('Failed to execute DSS check: ' + error.message);
        } finally {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Evaluate DSS';
        }
    }

    // Refresh handlers
    refreshDronesBtn.addEventListener('click', fetchDrones);
    refreshOrdersBtn.addEventListener('click', fetchOrders);

    // Initial loads
    fetchSystemStatus();
    fetchDrones();
    fetchOrders();
});
