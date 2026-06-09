from pathlib import Path
from collections import Counter, defaultdict
import yaml


DATA_ROOT = Path(
    r"C:\Users\우지원\Desktop\dog_skin_yolo_seg_dataset_balanced"
)

IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".bmp"]

EXPECTED_CLASS_NAMES = {
    0: "A1_구진_플라크",
    1: "A3_태선화_과다색소침착",
    2: "A4_농포_여드름",
    3: "A5_미란_궤양",
    4: "A6_결절_종괴",
}


def read_label(label_path: Path):
    text = label_path.read_text(encoding="utf-8").strip()

    if text == "":
        return []

    return [line.strip() for line in text.splitlines() if line.strip()]


def parse_label_line(line: str):
    parts = line.split()

    if len(parts) < 7:
        return None, "too_few_values"

    try:
        cls_id = int(float(parts[0]))
    except Exception:
        return None, "invalid_class_id"

    try:
        coords = [float(v) for v in parts[1:]]
    except Exception:
        return None, "invalid_coord_value"

    if len(coords) % 2 != 0:
        return None, "odd_number_of_coords"

    if len(coords) < 6:
        return None, "less_than_3_points"

    for v in coords:
        if v < 0 or v > 1:
            return None, "coord_out_of_range"

    return (cls_id, coords), None


def check_data_yaml():
    print("\n===== data.yaml 확인 =====")

    yaml_path = DATA_ROOT / "data.yaml"

    if not yaml_path.exists():
        print("❌ data.yaml 없음")
        return False

    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    names = data.get("names")

    if names is None:
        print("❌ names 없음")
        return False

    names = {int(k): v for k, v in names.items()}

    print("현재 names:", names)

    if names != EXPECTED_CLASS_NAMES:
        print("❌ 클래스 매핑 다름")
        print("예상:", EXPECTED_CLASS_NAMES)
        return False

    print("✅ data.yaml 정상")
    return True


def check_split(split):
    print(f"\n===== {split} 검사 시작 =====")

    image_dir = DATA_ROOT / "images" / split
    label_dir = DATA_ROOT / "labels" / split

    image_files = []
    for ext in IMAGE_EXTS:
        image_files.extend(image_dir.glob(f"*{ext}"))

    label_files = list(label_dir.glob("*.txt"))

    image_stems = {p.stem for p in image_files}
    label_stems = {p.stem for p in label_files}

    missing_labels = image_stems - label_stems
    missing_images = label_stems - image_stems

    stats = Counter()
    class_counter = Counter()
    errors = Counter()
    error_examples = defaultdict(list)

    print("이미지 수:", len(image_files))
    print("라벨 수:", len(label_files))
    print("이미지만 있고 라벨 없음:", len(missing_labels))
    print("라벨만 있고 이미지 없음:", len(missing_images))

    for label_path in label_files:
        lines = read_label(label_path)

        if len(lines) == 0:
            stats["empty_labels"] += 1
            continue

        stats["positive_labels"] += 1

        for idx, line in enumerate(lines):
            parsed, err = parse_label_line(line)

            if err is not None:
                errors[err] += 1
                if len(error_examples[err]) < 3:
                    error_examples[err].append((str(label_path), idx, line))
                continue

            cls_id, coords = parsed

            if cls_id not in EXPECTED_CLASS_NAMES:
                errors["invalid_class_id_range"] += 1
                if len(error_examples["invalid_class_id_range"]) < 3:
                    error_examples["invalid_class_id_range"].append((str(label_path), idx, line))
                continue

            class_counter[cls_id] += 1
            stats["segments"] += 1

    print("\n----- 라벨 통계 -----")
    print("빈 라벨 이미지:", stats["empty_labels"])
    print("병변 라벨 이미지:", stats["positive_labels"])
    print("총 segment 수:", stats["segments"])

    print("\n----- 클래스별 segment 수 -----")
    for cls_id, name in EXPECTED_CLASS_NAMES.items():
        print(f"{cls_id} {name}: {class_counter[cls_id]}")

    print("\n----- 오류 통계 -----")
    if (
        len(missing_labels) == 0
        and len(missing_images) == 0
        and sum(errors.values()) == 0
    ):
        print("✅ 오류 없음")
        ok = True
    else:
        ok = False
        print("❌ 오류 있음")
        print(errors)

        for err, examples in error_examples.items():
            print(f"\n오류 예시: {err}")
            for ex in examples:
                print(ex)

    return ok


def main():
    print("빠른 5-class segmentation dataset 무결성 검사")
    print("DATA_ROOT:", DATA_ROOT)

    yaml_ok = check_data_yaml()
    train_ok = check_split("train")
    val_ok = check_split("val")

    print("\n===== 최종 결과 =====")

    if yaml_ok and train_ok and val_ok:
        print("✅ 데이터셋 무결성 검사 통과")
        print("이 상태면 학습 시작해도 됩니다.")
    else:
        print("❌ 데이터셋에 문제가 있습니다. 위 오류를 확인하세요.")


if __name__ == "__main__":
    main()