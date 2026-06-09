import json
import os
import shutil
from pathlib import Path
from collections import Counter
from PIL import Image
import yaml
from tqdm import tqdm


# =========================================================
# 1. 경로 설정
# =========================================================
# 본인 PC 실제 경로에 맞게 필요하면 수정하세요.
# 기존 구조:
# 1.Training/2_라벨링데이터_240422_add/TL01, TL02
# 2.Validation/2_라벨링데이터_240422_add/VL01

TRAIN_SOURCE_ROOT = Path(
    r"C:\Users\우지원\Desktop\152.반려동물 피부질환 데이터\01.데이터\1.Training\2_라벨링데이터_240422_add"
)

VAL_SOURCE_ROOT = Path(
    r"C:\Users\우지원\Desktop\152.반려동물 피부질환 데이터\01.데이터\2.Validation\2_라벨링데이터_240422_add"
)

OUTPUT_ROOT = Path(
    r"C:\Users\우지원\Desktop\dog_skin_yolo_seg_dataset"
)


# 만약 현재 계정이 wooji / OneDrive 바탕화면이면 위 경로를 예를 들어 이렇게 바꾸세요.
# TRAIN_SOURCE_ROOT = Path(
#     r"C:\Users\wooji\OneDrive\바탕 화면\152.반려동물 피부질환 데이터\01.데이터\1.Training\2_라벨링데이터_240422_add"
# )
# VAL_SOURCE_ROOT = Path(
#     r"C:\Users\wooji\OneDrive\바탕 화면\152.반려동물 피부질환 데이터\01.데이터\2.Validation\2_라벨링데이터_240422_add"
# )
# OUTPUT_ROOT = Path(
#     r"C:\Users\wooji\OneDrive\바탕 화면\dog_skin_yolo_seg_dataset"
# )


# =========================================================
# 2. 클래스 설정
# A7_무증상은 segmentation 검출 클래스에서 제외
# _잔여는 원 클래스에 통합
# =========================================================

CLASS_NAMES = [
    "A1_구진_플라크",
    "A2_비듬_각질_상피성잔고리",
    "A3_태선화_과다색소침착",
    "A4_농포_여드름",
    "A5_미란_궤양",
    "A6_결절_종괴",
]

CLASS_TO_ID = {name: idx for idx, name in enumerate(CLASS_NAMES)}


def normalize_label(label: str):
    """
    JSON label을 최종 6개 질환 클래스로 통합.
    A7_무증상은 None 반환.
    """
    if label is None:
        return None

    label = label.strip()

    if label.startswith("A7") or "무증상" in label:
        return None

    label = label.replace("_잔여", "")

    if label.startswith("A1"):
        return "A1_구진_플라크"
    if label.startswith("A2"):
        return "A2_비듬_각질_상피성잔고리"
    if label.startswith("A3"):
        return "A3_태선화_과다색소침착"
    if label.startswith("A4"):
        return "A4_농포_여드름"
    if label.startswith("A5"):
        return "A5_미란_궤양"
    if label.startswith("A6"):
        return "A6_결절_종괴"

    return None


# =========================================================
# 3. 유틸 함수
# =========================================================

def is_symptomatic_path(path: Path):
    return "유증상" in path.parts


def is_asymptomatic_path(path: Path):
    return "무증상" in path.parts


def parse_resolution(resolution: str):
    """
    예: 1920X1080 또는 1920x1080
    """
    resolution = resolution.replace("x", "X")
    w, h = resolution.split("X")
    return int(w), int(h)


def get_image_size(data, image_path: Path):
    """
    JSON의 resolution 우선 사용.
    실패하면 실제 이미지 크기 사용.
    """
    try:
        return parse_resolution(data["metaData"]["resolution"])
    except Exception:
        with Image.open(image_path) as img:
            return img.size


def clamp01(v):
    return max(0.0, min(1.0, float(v)))


def safe_link_or_copy(src: Path, dst: Path):
    """
    가능하면 하드링크 생성.
    실패하면 복사.
    같은 드라이브에서는 하드링크가 용량을 거의 추가로 쓰지 않음.
    """
    dst.parent.mkdir(parents=True, exist_ok=True)

    if dst.exists():
        return

    try:
        os.link(src, dst)
    except Exception:
        shutil.copy2(src, dst)


def make_unique_image_name(json_path: Path, image_name: str):
    """
    파일명 중복 방지를 위해 TL01/TL02/VL01, 유증상/무증상, 질환폴더명 포함.
    """
    group_name = "UNKNOWN"
    symptom_name = "UNKNOWN"
    disease_folder = json_path.parent.name

    for p in json_path.parts:
        if p in ["TL01", "TL02", "VL01"]:
            group_name = p
        if p in ["유증상", "무증상"]:
            symptom_name = p

    image_path = Path(image_name)

    return f"{group_name}_{symptom_name}_{disease_folder}_{image_path.stem}{image_path.suffix}"


# =========================================================
# 4. Polygon 추출 함수
# =========================================================

def extract_points_from_polygon_location(location_dict):
    """
    AI Hub polygon location 형식:
    {
      "x1": 944, "y1": 326,
      "x2": 942, "y2": 345,
      ...
    }

    반환:
    [(x1,y1), (x2,y2), ...]
    """
    points = []

    idx = 1
    while True:
        x_key = f"x{idx}"
        y_key = f"y{idx}"

        if x_key not in location_dict or y_key not in location_dict:
            break

        x = location_dict[x_key]
        y = location_dict[y_key]

        points.append((float(x), float(y)))
        idx += 1

    # 연속 중복점 제거
    cleaned = []
    for p in points:
        if len(cleaned) == 0 or cleaned[-1] != p:
            cleaned.append(p)

    # 마지막 점이 첫 점과 같으면 제거
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1]:
        cleaned = cleaned[:-1]

    return cleaned


def box_to_polygon_points(x, y, w, h):
    """
    polygon이 없을 때 box를 사각형 polygon으로 fallback.
    """
    return [
        (float(x), float(y)),
        (float(x + w), float(y)),
        (float(x + w), float(y + h)),
        (float(x), float(y + h)),
    ]


def extract_segments_from_json(data):
    """
    JSON에서 segmentation용 polygon annotation 추출.
    반환:
    [
      (label, [(x,y), (x,y), ...]),
      ...
    ]

    우선 polygon을 사용.
    polygon이 전혀 없을 경우에만 box를 사각 polygon으로 fallback.
    """
    segments = []

    # 1) polygon 우선 추출
    for item in data.get("labelingInfo", []):
        if "polygon" not in item:
            continue

        poly_info = item["polygon"]
        raw_label = poly_info.get("label")
        label = normalize_label(raw_label)

        if label is None:
            continue

        for loc in poly_info.get("location", []):
            points = extract_points_from_polygon_location(loc)

            if len(points) >= 3:
                segments.append((label, points))

    # 2) polygon이 없을 경우 box fallback
    if len(segments) == 0:
        for item in data.get("labelingInfo", []):
            if "box" not in item:
                continue

            box_info = item["box"]
            raw_label = box_info.get("label")
            label = normalize_label(raw_label)

            if label is None:
                continue

            for loc in box_info.get("location", []):
                x = loc.get("x")
                y = loc.get("y")
                w = loc.get("width")
                h = loc.get("height")

                if None in [x, y, w, h]:
                    continue

                points = box_to_polygon_points(x, y, w, h)

                if len(points) >= 3:
                    segments.append((label, points))

    return segments


def convert_segment_to_yolo_line(label, points, img_w, img_h):
    """
    YOLO segmentation txt 한 줄 생성:
    class_id x1 y1 x2 y2 ... xn yn

    모든 좌표는 0~1 정규화.
    """
    if label not in CLASS_TO_ID:
        return None

    if len(points) < 3:
        return None

    class_id = CLASS_TO_ID[label]

    values = [str(class_id)]

    for x, y in points:
        nx = clamp01(x / img_w)
        ny = clamp01(y / img_h)

        values.append(f"{nx:.6f}")
        values.append(f"{ny:.6f}")

    # class_id + 최소 3점 x,y = 1 + 6개 이상
    if len(values) < 7:
        return None

    return " ".join(values)


# =========================================================
# 5. split 처리 함수
# =========================================================

def process_split(source_root: Path, split: str):
    """
    source_root 아래 JSON을 모두 탐색해 YOLO segmentation dataset으로 변환.
    split: train 또는 val
    """

    print(f"\n===== {split} 변환 시작 =====")
    print("source:", source_root)

    json_files = list(source_root.rglob("*.json"))
    print(f"{split} JSON 수:", len(json_files))

    image_out_dir = OUTPUT_ROOT / "images" / split
    label_out_dir = OUTPUT_ROOT / "labels" / split

    image_out_dir.mkdir(parents=True, exist_ok=True)
    label_out_dir.mkdir(parents=True, exist_ok=True)

    stats = Counter()
    class_counter = Counter()

    for json_path in tqdm(json_files, desc=f"Processing {split}"):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            image_name = data["metaData"]["Raw data ID"]
            image_path = json_path.parent / image_name

            if not image_path.exists():
                stats["missing_image"] += 1
                continue

            symptomatic = is_symptomatic_path(json_path)
            asymptomatic = is_asymptomatic_path(json_path)

            if not symptomatic and not asymptomatic:
                stats["unknown_path"] += 1
                continue

            unique_image_name = make_unique_image_name(json_path, image_name)

            dst_image_path = image_out_dir / unique_image_name
            dst_label_path = label_out_dir / f"{Path(unique_image_name).stem}.txt"

            # 이미지 하드링크 또는 복사
            safe_link_or_copy(image_path, dst_image_path)

            yolo_lines = []

            # 유증상만 polygon 라벨 생성
            if symptomatic:
                img_w, img_h = get_image_size(data, image_path)
                segments = extract_segments_from_json(data)

                for label, points in segments:
                    line = convert_segment_to_yolo_line(label, points, img_w, img_h)

                    if line is None:
                        stats["invalid_segment"] += 1
                        continue

                    yolo_lines.append(line)
                    class_counter[label] += 1

            # 무증상은 빈 txt 생성
            with open(dst_label_path, "w", encoding="utf-8") as f:
                f.write("\n".join(yolo_lines))

            stats["total"] += 1

            if symptomatic:
                stats["symptomatic"] += 1
            if asymptomatic:
                stats["asymptomatic"] += 1

            if len(yolo_lines) == 0:
                stats["empty_label"] += 1
            else:
                stats["positive_label"] += 1
                stats["segments"] += len(yolo_lines)

        except Exception as e:
            stats["error"] += 1
            print("\n에러:", json_path)
            print(e)

    print(f"\n===== {split} 변환 결과 =====")
    print("전체 처리:", stats["total"])
    print("유증상:", stats["symptomatic"])
    print("무증상:", stats["asymptomatic"])
    print("seg 라벨 있는 이미지:", stats["positive_label"])
    print("빈 라벨 이미지:", stats["empty_label"])
    print("총 segment 수:", stats["segments"])
    print("invalid segment:", stats["invalid_segment"])
    print("이미지 누락:", stats["missing_image"])
    print("경로 불명:", stats["unknown_path"])
    print("에러:", stats["error"])

    print(f"\n===== {split} 클래스별 segment 수 =====")
    for name in CLASS_NAMES:
        print(name, class_counter[name])

    return stats, class_counter


# =========================================================
# 6. main
# =========================================================

def main():
    print("YOLO segmentation 데이터셋 변환 시작")
    print("출력 경로:", OUTPUT_ROOT)

    train_stats, train_class_counter = process_split(TRAIN_SOURCE_ROOT, "train")
    val_stats, val_class_counter = process_split(VAL_SOURCE_ROOT, "val")

    data_yaml = {
        "path": str(OUTPUT_ROOT).replace("\\", "/"),
        "train": "images/train",
        "val": "images/val",
        "names": {i: name for i, name in enumerate(CLASS_NAMES)}
    }

    yaml_path = OUTPUT_ROOT / "data.yaml"

    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(data_yaml, f, allow_unicode=True, sort_keys=False)

    print("\n===== 전체 변환 완료 =====")
    print("YOLO segmentation dataset:", OUTPUT_ROOT)
    print("data.yaml:", yaml_path)

    print("\n최종 클래스:")
    for i, name in enumerate(CLASS_NAMES):
        print(f"{i}: {name}")

    print("\n다음 학습 예시:")
    print(
        f'python train_yolo_seg.py'
    )


if __name__ == "__main__":
    main()