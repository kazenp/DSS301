# Skill: Drone Delivery DSS Implementation

## Muc tieu
Huong dan code luong hoan chinh cho he thong giao hang bang drone, gom model telemetry va DSS dieu phoi.

## Pham vi
- Phan 1: Machine learning telemetry.
- Phan 2: Decision support system.
- Phan 3: Backend API va giao dien client/admin.

## Nguyen tac thiet ke
- Giua ML va DSS phai tach rieng.
- Model telemetry chi lam nhiem vu du doan.
- DSS su dung output cua model va du lieu nghiep vu de ra quyet dinh.
- Busy day la input cua DSS, khong phai feature bat buoc cho model telemetry.

## Du lieu
### Telemetry
Dung de train model voi cac cot nhu wind speed, battery remaining, actual carry weight, payload type, altitude, distance flown, gps accuracy, obstacles encountered.

### Busy day
Dung de dieu phoi don, kho, drone status, inventory, va order.

## Output can luu
- Model da train.
- Hyperparameters.
- Metrics.
- Prediction results.
- Rule config cua DSS neu co.

## Kieu code can tao
- API load model va predict.
- Admin dashboard xem trang thai va canh bao.
- Client page tao yeu cau giao hang.
- Modules tach rieng cho preprocessing, inference, dispatch decision.

## Thu tu thuc hien
1. Hoan tat notebook train.
2. Luu model va metrics.
3. Tao backend inference.
4. Tao admin/client UI.
5. Tich hop DSS.
6. Test end-to-end.