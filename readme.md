# AI Model

이 폴더는 반려견 피부 병변 탐지를 위한 YOLOv8s-seg 모델 학습 및 데이터셋 처리 코드를 포함합니다.

## 사용 모델

- YOLOv8s-seg
- 입력 이미지 크기: 768
- Batch size: 8
- Optimizer: AdamW
- 학습 방식: 10 epoch 단위 chunk 학습

## 사용 데이터셋

- Ai-Hub 반려동물 피부 질환 데이터
- link : https://aihub.or.kr/aihubdata/data/view.do?srchOptnCnd=OPTNCND001&currMenu=115&topMenu=100&searchKeyword=%EB%B0%98%EB%A0%A4&aihubDataSe=data&dataSetSn=561

## 최종 클래스

| ID | Class |
|---:|---|
| 0 | A1_구진_플라크 |
| 1 | A3_태선화_과다색소침착 |
| 2 | A4_농포_여드름 |
| 3 | A5_미란_궤양 |
| 4 | A6_결절_종괴 |

A2_비듬_각질_상피성잔고리 클래스는 최종 segmentation 학습 대상에서 제외했습니다.

## 파일 설명

### `prepare_yolo_dataset.py`

원본 AI Hub JSON 라벨 데이터를 YOLO segmentation 형식으로 변환합니다.

### `make_dataset_balanced.py`

A2를 제외한 5-class segmentation dataset을 생성하고, 클래스 불균형을 완화합니다.

### `check_raw_bad_images.py`

원본 이미지 중 손상되었거나 OpenCV/Pillow에서 읽을 수 없는 이미지를 검사합니다.

### `train_yolo.py`

YOLOv8s-seg 모델을 10 epoch chunk 방식으로 학습합니다.

## GitHub 제외 항목

다음 항목은 GitHub에 포함하지 않습니다.

- 원본 데이터셋
- YOLO 데이터셋
- `runs/`
- `.pt` 모델 가중치 파일
