# Server

이 폴더는 반려견 피부 병변 탐지를 위한 FastAPI기반 AI 추론 서버 코드를 포함합니다.

모바일 앱에서 반려견 피부 이미지를 업로드하면 서버는 YOLOv8s-seg 모델을 이용하여 피부 병변 후보를 분석하고, 분석 결과를 JSON 형태로 반환합니다.

## 파일 설명

### `server.py`

서버 가동 코드입니다. 앱으로부터 http통신의 POST 방식을 통해 이미지를 전달 받으면 모델 추론 후 결과 이미지와 검출 내용을 앱으로 반환합니다.

### `uploadtest.py`

이미지 업로드를 테스트 합니다.

### `check_raw_bad_images.py`

원본 이미지 중 손상되었거나 OpenCV/Pillow에서 읽을 수 없는 이미지를 검사합니다.

### `train_yolo.py`

YOLOv8s-seg 모델을 10 epoch chunk 방식으로 학습합니다.

## GitHub 제외 항목

다음 항목은 GitHub에 포함하지 않습니다.

- `results/`
- `runs/`
- `.pt` 모델 가중치 파일
