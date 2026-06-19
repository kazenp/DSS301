\# Drone Delivery DSS + ML System



\## Muc tieu

Xay dung mot prototype he thong giao hang bang drone gom 2 tang:

\- Tang ML: train mo hinh telemetry de du doan uncertainty / flight outcome.

\- Tang DSS: dieu phoi don, drone, va quyen quyet dinh van hanh.



\## Cau truc de code

\- `notebooks/w5.ipynb`: train va danh gia model telemetry.

\- `models/`: luu file model da train.

\- `backend/`: API nhan input va tra ket qua du doan.

\- `frontend/client/`: trang khach hang tao don.

\- `frontend/admin/`: trang admin dieu phoi.

\- `data/`: chua dataset mau va file mapping.

\- `docs/`: tai lieu mo ta luong he thong.



\## Luong tong the

1\. Client tao yeu cau giao hang.

2\. Admin xem don va trang thai drone.

3\. Backend goi model telemetry de lay prediction.

4\. DSS dung prediction + luat nghiep vu de ra quyet dinh.

5\. He thong hien thi ket qua va canh bao.



\## Model ML

\- Model chinh: Logistic Regression.

\- Model doi chieu: Random Forest.

\- Input: wind speed, battery, payload, altitude, distance, GPS, obstacles.

\- Output: completed / non-completed hoac risk score.



\## Vai tro cua Busy Day

Busy day khong nhung vao model telemetry chinh. No duoc dung o tang DSS de dieu chinh quyet dinh, uu tien va trang thai dieu phoi.



\## Quy uoc file output

\- `output/logistic\_pipeline.pkl`: model chinh da luu.

\- `output/random\_forest\_pipeline.pkl`: model doi chieu.

\- `output/hyperparameters.csv`: thong so train.

\- `output/model\_results.csv`: ket qua danh gia.

\- `output/test\_predictions.csv`: du doan tren tap test.



\## Cong viec tiep theo

\- Tao backend API load model.

\- Tao trang admin.

\- Tao trang client.

\- Ket noi DB neu can.

\- Tich hop DSS vao backend.

