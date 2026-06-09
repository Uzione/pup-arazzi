import os
import random
import shutil
from pathlib import Path
import yaml
from tqdm import tqdm


# =========================================================
# 1. 경로 설정
# =========================================================

SRC_ROOT = Path(
    r"C:\Users\우지원\Desktop\dog_skin_yolo_seg_dataset"
)

DST_ROOT = Path(
    r"C:\Users\우지원\Desktop\dog_skin_yolo_seg_dataset_balanced"
)

random.seed(42)


# =========================================================
# 2. 기존 class id → 새 class id 매핑
# 기존:
# 0 A1
# 1 A2  ← 제외
# 2 A3
# 3 A4
# 4 A5
# 5 A6
#
# 새:
# 0 A1
# 1 A3
# 2 A4
# 3 A5
# 4 A6
# =========================================================

OLD_TO_NEW_CLASS = {
    0: 0,  # A1 → A1
    2: 1,  # A3 → A3
    3: 2,  # A4 → A4
    4: 3,  # A5 → A5
    5: 4,  # A6 → A6
}

EXCLUDE_CLASS_IDS = {1}  # A2 제외


# =========================================================
# 3. train 유지 비율
# 기존 class id 기준
# =========================================================

CLASS_KEEP_RATIO = {
    0: 0.60,  # A1
    2: 0.40,  # A3
    3: 1.00,  # A4
    4: 1.00,  # A5
    5: 1.00,  # A6
}

ASYMPTOMATIC_KEEP_RATIO = 0.20

IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".bmp"]

NEW_CLASS_NAMES = [
    "A1_구진_플라크",
    "A3_태선화_과다색소침착",
    "A4_농포_여드름",
    "A5_미란_궤양",
    "A6_결절_종괴",
]


# =========================================================
# 4. 유틸 함수
# =========================================================

def safe_link_or_copy(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)

    if dst.exists():
        return

    try:
        os.link(src, dst)
    except Exception:
        shutil.copy2(src, dst)


def find_image_by_stem(image_dir: Path, stem: str):
    for ext in IMAGE_EXTS:
        candidate = image_dir / f"{stem}{ext}"
        if candidate.exists():
            return candidate
    return None


def read_label_lines(label_path: Path):
    if not label_path.exists():
        return []

    text = label_path.read_text(encoding="utf-8").strip()

    if text == "":
        return []

    return [line.strip() for line in text.splitlines() if line.strip()]


def parse_class_ids(label_path: Path):
    lines = read_label_lines(label_path)
    class_ids = []

    for line in lines:
        parts = line.split()
        if len(parts) < 7:
            continue

        try:
            cls_id = int(float(parts[0]))
            class_ids.append(cls_id)
        except Exception:
            continue

    return class_ids


def convert_label_file(label_path: Path):
    """
    기존 6-class segmentation label을 5-class label로 변환.
    A2가 포함된 line은 제거.
    A2만 있는 이미지는 None 반환해서 이미지 자체 제외.
    빈 라벨은 무증상으로 유지 가능.
    """
    lines = read_label_lines(label_path)

    # 빈 라벨 = 무증상
    if len(lines) == 0:
        return ""

    new_lines = []

    for line in lines:
        parts = line.split()

        if len(parts) < 7:
            continue

        try:
            old_cls_id = int(float(parts[0]))
        except Exception:
            continue

        # A2 제외
        if old_cls_id in EXCLUDE_CLASS_IDS:
            continue

        # 새 클래스에 없는 경우 제외
        if old_cls_id not in OLD_TO_NEW_CLASS:
            continue

        new_cls_id = OLD_TO_NEW_CLASS[old_cls_id]

        new_line = " ".join([str(new_cls_id)] + parts[1:])
        new_lines.append(new_line)

    # 기존에 병변 라벨이 있었는데 A2 제거 후 아무것도 안 남으면 이미지 제외
    if len(new_lines) == 0:
        return None

    return "\n".join(new_lines)


def should_keep_train_sample(label_path: Path):
    class_ids = parse_class_ids(label_path)

    # 빈 라벨 = 무증상
    if len(class_ids) == 0:
        return random.random() < ASYMPTOMATIC_KEEP_RATIO

    # A2만 있는 이미지는 제외
    non_a2_class_ids = [cid for cid in class_ids if cid not in EXCLUDE_CLASS_IDS]

    if len(non_a2_class_ids) == 0:
        return False

    # A2와 다른 클래스가 섞여 있으면 A2는 제거하고 나머지 기준으로 유지 판단
    keep_ratio = max(CLASS_KEEP_RATIO.get(cid, 0.0) for cid in non_a2_class_ids)

    return random.random() < keep_ratio


def copy_split(split: str, balance_train: bool):
    src_img_dir = SRC_ROOT / "images" / split
    src_lbl_dir = SRC_ROOT / "labels" / split

    dst_img_dir = DST_ROOT / "images" / split
    dst_lbl_dir = DST_ROOT / "labels" / split

    dst_img_dir.mkdir(parents=True, exist_ok=True)
    dst_lbl_dir.mkdir(parents=True, exist_ok=True)

    label_files = list(src_lbl_dir.glob("*.txt"))

    stats = {
        "total": 0,
        "kept": 0,
        "excluded_a2_only": 0,
        "missing_image": 0,
        "empty_label_kept": 0,
        "positive_label_kept": 0,
        "class_counts": {i: 0 for i in range(len(NEW_CLASS_NAMES))}
    }

    print(f"\n===== {split} 처리 시작 =====")
    print("label files:", len(label_files))

    for label_path in tqdm(label_files, desc=f"Processing {split}"):
        stats["total"] += 1

        stem = label_path.stem
        image_path = find_image_by_stem(src_img_dir, stem)

        if image_path is None:
            stats["missing_image"] += 1
            continue

        # train은 샘플링 적용, val은 전체 유지하되 A2는 제외
        if balance_train:
            keep = should_keep_train_sample(label_path)
        else:
            # val에서도 A2만 있는 이미지는 제외
            class_ids = parse_class_ids(label_path)

            if len(class_ids) == 0:
                keep = True
            else:
                keep = any(cid not in EXCLUDE_CLASS_IDS for cid in class_ids)

        if not keep:
            # A2만 있는 경우 카운트
            class_ids = parse_class_ids(label_path)
            if len(class_ids) > 0 and all(cid in EXCLUDE_CLASS_IDS for cid in class_ids):
                stats["excluded_a2_only"] += 1
            continue

        converted_label = convert_label_file(label_path)

        if converted_label is None:
            stats["excluded_a2_only"] += 1
            continue

        dst_image_path = dst_img_dir / image_path.name
        dst_label_path = dst_lbl_dir / label_path.name

        safe_link_or_copy(image_path, dst_image_path)

        dst_label_path.parent.mkdir(parents=True, exist_ok=True)
        dst_label_path.write_text(converted_label, encoding="utf-8")

        stats["kept"] += 1

        if converted_label.strip() == "":
            stats["empty_label_kept"] += 1
        else:
            stats["positive_label_kept"] += 1

            for line in converted_label.splitlines():
                parts = line.split()
                if len(parts) < 7:
                    continue

                new_cls_id = int(float(parts[0]))

                if new_cls_id in stats["class_counts"]:
                    stats["class_counts"][new_cls_id] += 1

    print(f"\n===== {split} 결과 =====")
    print("전체:", stats["total"])
    print("유지:", stats["kept"])
    print("A2 only 제외:", stats["excluded_a2_only"])
    print("이미지 누락:", stats["missing_image"])
    print("빈 라벨 유지:", stats["empty_label_kept"])
    print("병변 라벨 유지:", stats["positive_label_kept"])

    print("\n새 클래스별 segment 수:")
    for i, name in enumerate(NEW_CLASS_NAMES):
        print(f"{i} {name}: {stats['class_counts'][i]}")

    return stats


def write_data_yaml():
    data_yaml = {
        "path": str(DST_ROOT).replace("\\", "/"),
        "train": "images/train",
        "val": "images/val",
        "names": {i: name for i, name in enumerate(NEW_CLASS_NAMES)}
    }

    yaml_path = DST_ROOT / "data.yaml"

    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(data_yaml, f, allow_unicode=True, sort_keys=False)

    print("\ndata.yaml 생성:", yaml_path)


def main():
    print("A2 제외 5-class YOLO segmentation dataset 생성 시작")
    print("원본:", SRC_ROOT)
    print("출력:", DST_ROOT)

    if not SRC_ROOT.exists():
        print("\n오류: 원본 세그멘테이션 데이터셋 폴더가 없습니다.")
        print("확인 경로:", SRC_ROOT)
        return

    if DST_ROOT.exists():
        print("\n오류: 출력 폴더가 이미 존재합니다.")
        print("먼저 아래 명령어로 삭제하세요.")
        print(f'Remove-Item "{DST_ROOT}" -Recurse -Force')
        return

    print("\n새 클래스:")
    for i, name in enumerate(NEW_CLASS_NAMES):
        print(f"{i}: {name}")

    print("\ntrain 유지 비율:")
    print("A1 60%")
    print("A2 제외")
    print("A3 40%")
    print("A4 100%")
    print("A5 100%")
    print("A6 100%")
    print(f"무증상 {ASYMPTOMATIC_KEEP_RATIO * 100:.0f}%")

    copy_split("train", balance_train=True)
    copy_split("val", balance_train=False)

    write_data_yaml()

    print("\n===== 전체 완료 =====")
    print("5-class dataset:", DST_ROOT)
    print("학습용 data.yaml:", DST_ROOT / "data.yaml")


if __name__ == "__main__":
    main()