document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    const resultsCard = document.getElementById('resultsCard');
    
    const dssStatusBadge = document.getElementById('dssStatusBadge');
    const successProb = document.getElementById('successProb');
    const riskLevel = document.getElementById('riskLevel');
    const decisionReason = document.getElementById('decisionReason');
    const decisionBox = document.querySelector('.decision-reason-box');

    const BACKEND_URL = 'http://localhost:8000/api/v1';

    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show spinner and disable button
        btnSpinner.classList.remove('hidden');
        submitBtn.disabled = true;
        
        // Read input data
        const clientName = document.getElementById('clientName').value;
        const destination = document.getElementById('destination').value;
        const distance = parseFloat(document.getElementById('distance').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const payloadType = document.getElementById('payloadType').value;

        // Generate telemetry data (simulated environment values for DSS check)
        const simulatedTelemetry = {
            wind_speed: Math.round((Math.random() * 15) * 10) / 10, // 0 - 15 m/s
            battery_remaining: Math.round((70 + Math.random() * 30)), // 70% - 100%
            actual_carry_weight: weight,
            payload_type: payloadType,
            altitude: 120.0, // typical flight altitude in m
            distance_flown: distance,
            gps_accuracy: Math.round((1.0 + Math.random() * 2.0) * 10) / 10, // 1.0 - 3.0 (meters)
            obstacles_encountered: Math.floor(Math.random() * 4) // 0 to 3 obstacles
        };

        try {
            // First, check with DSS API
            const response = await fetch(`${BACKEND_URL}/predict/dss-evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telemetry: simulatedTelemetry,
                    busy_day: false // default on client side, managed by admin status
                })
            });

            if (!response.ok) {
                throw new Error('API server returned an error');
            }

            const data = await response.json();
            
            // Show results card
            resultsCard.classList.remove('hidden');
            
            // Update UI components
            const prob = data.prediction.success_probability;
            successProb.textContent = `${(prob * 100).toFixed(1)}%`;
            riskLevel.textContent = prob > 0.8 ? 'LOW' : (prob > 0.6 ? 'MEDIUM' : 'HIGH');
            
            if (prob > 0.8) {
                riskLevel.style.color = '#10b981';
            } else if (prob > 0.6) {
                riskLevel.style.color = '#f59e0b';
            } else {
                riskLevel.style.color = '#ef4444';
            }

            decisionReason.textContent = data.decision_reason;
            
            // Update status badges and border colors
            if (data.dss_approved) {
                dssStatusBadge.textContent = 'APPROVED';
                dssStatusBadge.className = 'status-badge approved';
                decisionBox.className = 'decision-reason-box approved';
            } else {
                dssStatusBadge.textContent = 'REJECTED';
                dssStatusBadge.className = 'status-badge rejected';
                decisionBox.className = 'decision-reason-box rejected';
            }

            // Create the order on the backend as well
            await fetch(`${BACKEND_URL}/orders/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_name: clientName,
                    destination: destination,
                    weight: weight,
                    payload_type: payloadType,
                    distance: distance
                })
            });

        } catch (error) {
            console.error('Error submitting order:', error);
            alert('Failed to connect to backend server. Make sure the FastAPI app is running on port 8000.');
        } finally {
            btnSpinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });
});
