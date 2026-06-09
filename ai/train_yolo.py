import json
from pathlib import Path
from ultralytics import YOLO


# =========================================================
# 1. 기본 경로 설정
# =========================================================

# A2 제외 5-class segmentation dataset
DATA_YAML = r"C:\Users\우지원\Desktop\dog_skin_yolo_seg_dataset_balanced\data.yaml"

# 학습 결과 저장 위치
PROJECT_DIR = r"C:\Users\우지원\Desktop\dog_skin_yolo_project\runs\segment"

# run 이름 prefix
RUN_PREFIX = "dog_skin_5class_yolov8s_seg"

# 학습 상태 저장 파일
STATE_PATH = Path(PROJECT_DIR) / f"{RUN_PREFIX}_state.json"


# =========================================================
# 2. 학습 진행 설정
# =========================================================

# 한 번 실행할 때마다 학습할 epoch 수
CHUNK_EPOCHS = 10

# 최종 목표 epoch
TARGET_TOTAL_EPOCHS = 70


# =========================================================
# 3. 학습 하이퍼파라미터
# =========================================================

IMG_SIZE = 768
BATCH_SIZE = 8

DEVICE = 0
WORKERS = 8

OPTIMIZER = "AdamW"

# 첫 10 epoch 학습률
FIRST_LR = 0.001

# 10 epoch 이후 이어 학습 학습률
CONTINUE_LR = 0.0008


# =========================================================
# 4. 상태 파일 관리
# =========================================================

def load_state():
    """
    이전 chunk 학습 상태 불러오기.
    state 파일이 없으면 처음 학습으로 간주.
    """
    if not STATE_PATH.exists():
        return {
            "completed_epochs": 0,
            "last_weights": None,
            "best_weights": None,
            "chunks": []
        }

    with open(STATE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state):
    """
    현재 학습 상태 저장.
    다음 실행 때 이어 학습에 사용됨.
    """
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def get_next_run_name(next_total_epochs):
    """
    chunk 이름 생성.
    예:
    dog_skin_5class_yolov8s_seg_chunk_010
    dog_skin_5class_yolov8s_seg_chunk_020
    """
    return f"{RUN_PREFIX}_chunk_{next_total_epochs:03d}"


# =========================================================
# 5. Augmentation 설정
# =========================================================

def get_augment_settings(completed_epochs):
    """
    전체 학습 기준:
    1~10 epoch: mosaic=0.2
    11 epoch 이후: mosaic=0.0
    """

    if completed_epochs < 10:
        mosaic_value = 0.2
    else:
        mosaic_value = 0.0

    augment_settings = {
        # 피부질환은 색상과 질감이 중요하므로 색상 증강은 약하게 적용
        "hsv_h": 0.01,
        "hsv_s": 0.25,
        "hsv_v": 0.20,

        # 위치/크기 변형도 약하게 적용
        "degrees": 3.0,
        "translate": 0.03,
        "scale": 0.20,
        "shear": 0.0,
        "perspective": 0.0,

        "flipud": 0.0,
        "fliplr": 0.5,

        # 핵심 설정
        "mosaic": mosaic_value,
        "close_mosaic": 0,

        # 피부질환 segmentation에서는 부자연스러울 수 있으므로 비활성화
        "mixup": 0.0,
        "copy_paste": 0.0,
    }

    return augment_settings, mosaic_value


# =========================================================
# 6. 메인 학습 로직
# =========================================================

def main():
    state = load_state()

    completed_epochs = state["completed_epochs"]

    print("\n========================================")
    print("A2 제외 5-class YOLOv8s-seg Chunk 학습")
    print("========================================")
    print(f"현재 완료 epoch: {completed_epochs}")
    print(f"최종 목표 epoch: {TARGET_TOTAL_EPOCHS}")
    print(f"한 번 실행당 epoch: {CHUNK_EPOCHS}")
    print(f"DATA_YAML: {DATA_YAML}")
    print(f"PROJECT_DIR: {PROJECT_DIR}")
    print(f"STATE_PATH: {STATE_PATH}")

    # 목표 epoch까지 이미 완료된 경우 종료
    if completed_epochs >= TARGET_TOTAL_EPOCHS:
        print("\n이미 목표 epoch까지 학습이 완료되었습니다.")
        print("추가 학습을 원하면 TARGET_TOTAL_EPOCHS 값을 늘리세요.")
        return

    remaining_epochs = TARGET_TOTAL_EPOCHS - completed_epochs
    this_chunk_epochs = min(CHUNK_EPOCHS, remaining_epochs)
    next_total_epochs = completed_epochs + this_chunk_epochs

    run_name = get_next_run_name(next_total_epochs)

    print("\n이번 실행 정보")
    print(f"이번 학습 epoch: {this_chunk_epochs}")
    print(f"이번 실행 후 총 epoch: {next_total_epochs}")
    print(f"run name: {run_name}")

    # =====================================================
    # 시작 모델 결정
    # =====================================================

    if completed_epochs == 0 or state["last_weights"] is None:
        # 첫 실행은 COCO pretrained YOLOv8s-seg에서 시작
        start_model = "yolov8s-seg.pt"
        lr0 = FIRST_LR

        print("\n시작 모델: yolov8s-seg.pt")
        print(f"학습률 lr0: {lr0}")

    else:
        # 이후 실행은 직전 chunk의 last.pt에서 이어서 학습
        start_model = state["last_weights"]
        lr0 = CONTINUE_LR

        print("\n이전 chunk의 last.pt에서 이어 학습")
        print(f"시작 모델: {start_model}")
        print(f"학습률 lr0: {lr0}")

        if not Path(start_model).exists():
            raise FileNotFoundError(f"이전 last.pt 파일을 찾을 수 없습니다: {start_model}")

    # =====================================================
    # Augmentation 결정
    # =====================================================

    augment_settings, mosaic_value = get_augment_settings(completed_epochs)

    print("\nAugmentation 설정")
    print(f"이번 chunk mosaic 값: {mosaic_value}")
    print("1~10 epoch: mosaic=0.2")
    print("11 epoch 이후: mosaic=0.0")

    # =====================================================
    # 모델 로드
    # =====================================================

    model = YOLO(start_model)

    # =====================================================
    # 학습 실행
    # =====================================================

    model.train(
        data=DATA_YAML,

        epochs=this_chunk_epochs,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        device=DEVICE,
        workers=WORKERS,

        optimizer=OPTIMIZER,
        lr0=lr0,
        cos_lr=True,

        # 10 epoch chunk를 끝까지 돌리기 위해 크게 설정
        patience=100,

        # 안정성 우선
        amp=False,
        cache=False,

        project=PROJECT_DIR,
        name=run_name,
        exist_ok=False,

        **augment_settings
    )

    # =====================================================
    # 학습 결과 경로 확인
    # =====================================================

    run_dir = Path(PROJECT_DIR) / run_name
    weights_dir = run_dir / "weights"

    last_pt = weights_dir / "last.pt"
    best_pt = weights_dir / "best.pt"

    if not last_pt.exists():
        raise FileNotFoundError(f"학습은 끝났지만 last.pt를 찾을 수 없습니다: {last_pt}")

    if not best_pt.exists():
        raise FileNotFoundError(f"학습은 끝났지만 best.pt를 찾을 수 없습니다: {best_pt}")

    # =====================================================
    # 상태 업데이트
    # =====================================================

    state["completed_epochs"] = next_total_epochs
    state["last_weights"] = str(last_pt)
    state["best_weights"] = str(best_pt)

    state["chunks"].append({
        "run_name": run_name,
        "epochs": this_chunk_epochs,
        "total_epochs_after_run": next_total_epochs,
        "mosaic": mosaic_value,
        "lr0": lr0,
        "batch": BATCH_SIZE,
        "imgsz": IMG_SIZE,
        "last_weights": str(last_pt),
        "best_weights": str(best_pt),
    })

    save_state(state)

    print("\n========================================")
    print("이번 chunk 학습 완료")
    print("========================================")
    print(f"총 완료 epoch: {state['completed_epochs']}")
    print(f"last.pt: {last_pt}")
    print(f"best.pt: {best_pt}")
    print(f"state 저장 완료: {STATE_PATH}")

    if state["completed_epochs"] < TARGET_TOTAL_EPOCHS:
        print("\n다음에 이 파일을 다시 실행하면 다음 10 epoch가 이어서 학습됩니다.")
    else:
        print("\n목표 epoch까지 학습 완료!")
        print("최종 서버 적용 후보는 마지막 chunk의 best.pt입니다.")
        print("단, 가장 좋은 모델은 각 chunk의 validation mAP를 비교해서 선택하는 것이 좋습니다.")


if __name__ == "__main__":
    main()