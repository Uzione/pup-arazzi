from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

from pathlib import Path
import shutil
import uuid
import time
import cv2
import numpy as np


# =========================================================
# 1. FastAPI 앱 생성
# =========================================================

app = FastAPI(
    title="Dog Skin Disease Segmentation API",
    description="반려견 피부 병변 탐지 API",
    version="1.0.0"
)


# =========================================================
# 2. CORS 설정
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# 3. 모델 및 서버 설정
# =========================================================

MODEL_PATH = Path(
#    r"모델 경로를 입력해주세요"
)

# confidence 10% 이상만 검출 후보로 사용
MODEL_CONF = 0.10

# 너무 많은 후보 방지용
MAX_DET = 10

ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp"]


# =========================================================
# 4. 저장 폴더 설정
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "server_uploads"
RESULT_DIR = BASE_DIR / "server_results"

UPLOAD_DIR.mkdir(exist_ok=True)
RESULT_DIR.mkdir(exist_ok=True)


# =========================================================
# 5. 클래스 설정
# A2 제외 5-class 모델 기준
# =========================================================

CLASS_NAMES = {
    0: "A1_구진_플라크",
    1: "A3_태선화_과다색소침착",
    2: "A4_농포_여드름",
    3: "A5_미란_궤양",
    4: "A6_결절_종괴",
}

DISPLAY_NAMES = {
    "A1_구진_플라크": "구진/플라크 범주",
    "A3_태선화_과다색소침착": "태선화/과다색소침착 범주",
    "A4_농포_여드름": "농포/여드름 범주",
    "A5_미란_궤양": "미란/궤양 범주",
    "A6_결절_종괴": "결절/종괴 범주",
}


# =========================================================
# 6. 모델 로드
# =========================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


# =========================================================
# 7. 유틸 함수
# =========================================================

def get_class_name(class_id: int) -> str:
    return CLASS_NAMES.get(class_id, f"class_{class_id}")


def get_display_name(class_name: str) -> str:
    return DISPLAY_NAMES.get(class_name, class_name)


def save_upload_file(upload_file: UploadFile, save_path: Path):
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)


def simplify_mask_points(mask_xy, max_points: int = 100):
    """
    결과 이미지 표시용 내부 mask 좌표 변환.
    응답 JSON에는 포함하지 않음.
    """
    if mask_xy is None:
        return []

    points = mask_xy.tolist()

    if len(points) > max_points:
        step = max(1, len(points) // max_points)
        points = points[::step]

    return [
        [round(float(x), 2), round(float(y), 2)]
        for x, y in points
    ]


def to_public_detection(internal_detection: dict):
    """
    앱 응답용 detection 객체.
    좌표, box, mask 정보는 포함하지 않음.
    """
    return {
        "class_id": internal_detection["class_id"],
        "class_name": internal_detection["class_name"],
        "display_name": internal_detection["display_name"],
        "confidence": internal_detection["confidence"],
        "confidence_percent": internal_detection["confidence_percent"],
    }


def keep_best_per_class(internal_detections):
    """
    같은 class_id가 여러 개 검출되면 confidence가 가장 높은 것 하나만 유지.
    예:
    A6 후보 5개 → A6 최고 confidence 1개만 남김
    """
    best_by_class = {}

    for det in internal_detections:
        class_id = det["class_id"]

        if class_id not in best_by_class:
            best_by_class[class_id] = det
        else:
            if det["confidence"] > best_by_class[class_id]["confidence"]:
                best_by_class[class_id] = det

    unique_detections = list(best_by_class.values())
    unique_detections.sort(key=lambda x: x["confidence"], reverse=True)

    return unique_detections


def draw_top_detection_only(image_path: Path, top_detection: dict, result_path: Path):
    """
    결과 이미지에는 confidence가 가장 높은 후보 1개만 표시.
    응답 JSON에는 좌표를 반환하지 않지만,
    서버 내부에서는 이미지 표시를 위해 box/mask 좌표를 사용.
    """
    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError(f"이미지를 읽을 수 없습니다: {image_path}")

    # 검출 후보가 없으면 원본 이미지를 그대로 결과 이미지로 저장
    if top_detection is None:
        cv2.imwrite(str(result_path), image)
        return

    overlay = image.copy()

    mask_color = (0, 255, 0)
    box_color = (0, 200, 0)

    # -----------------------------------------------------
    # 1) mask 표시
    # -----------------------------------------------------
    mask_points = top_detection.get("_mask_points", [])

    if mask_points and len(mask_points) >= 3:
        pts = np.array(mask_points, dtype=np.int32)

        cv2.fillPoly(overlay, [pts], mask_color)
        image = cv2.addWeighted(overlay, 0.35, image, 0.65, 0)
        cv2.polylines(image, [pts], isClosed=True, color=mask_color, thickness=2)

    # -----------------------------------------------------
    # 2) box 표시
    # -----------------------------------------------------
    box = top_detection.get("_box")

    if box is not None:
        x1 = int(box["x1"])
        y1 = int(box["y1"])
        x2 = int(box["x2"])
        y2 = int(box["y2"])

        cv2.rectangle(image, (x1, y1), (x2, y2), box_color, 3)

        class_name = top_detection.get("class_name", "")
        confidence_percent = top_detection.get("confidence_percent", 0)

        # OpenCV 한글 깨짐 방지: 이미지에는 A번호만 표시
        # 앱 화면에는 JSON의 display_name 사용
        short_label = class_name.split("_")[0] if "_" in class_name else class_name
        label_text = f"{short_label} {confidence_percent:.2f}%"

        text_x = x1
        text_y = max(y1 - 10, 25)

        cv2.putText(
            image,
            label_text,
            (text_x, text_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            box_color,
            2,
            cv2.LINE_AA
        )

    cv2.imwrite(str(result_path), image)


# =========================================================
# 8. 기본 API
# =========================================================

@app.get("/")
def root():
    return {
        "status": "running",
        "message": "Dog Skin Disease API 서버가 실행 중입니다.",
        "model_path": str(MODEL_PATH),
        "model_conf": MODEL_CONF,
        "max_det": MAX_DET,
        "classes": CLASS_NAMES,
        "endpoints": {
            "health": "/health",
            "classes": "/classes",
            "predict": "/predict",
            "result_image": "/result/{filename}",
        }
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "서버 정상 작동 중",
        "model_loaded": True,
        "model_path": str(MODEL_PATH),
        "model_conf": MODEL_CONF,
        "max_det": MAX_DET
    }


@app.get("/classes")
def get_classes():
    return {
        "status": "success",
        "classes": CLASS_NAMES,
        "display_names": DISPLAY_NAMES
    }


# =========================================================
# 9. 이미지 분석 API
# =========================================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    start_time = time.time()

    try:
        # -------------------------------------------------
        # 1) 파일 확장자 검사
        # -------------------------------------------------
        original_filename = file.filename
        file_ext = Path(original_filename).suffix.lower()

        if file_ext not in ALLOWED_EXTENSIONS:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "지원하지 않는 이미지 형식입니다.",
                    "allowed_extensions": ALLOWED_EXTENSIONS
                }
            )

        # -------------------------------------------------
        # 2) 업로드 이미지 저장
        # -------------------------------------------------
        file_id = str(uuid.uuid4())

        input_filename = f"{file_id}{file_ext}"
        input_path = UPLOAD_DIR / input_filename

        save_upload_file(file, input_path)

        # -------------------------------------------------
        # 3) YOLOv8s-seg 추론
        # confidence 15% 이상 후보만 반환
        # -------------------------------------------------
        results = model.predict(
            source=str(input_path),
            conf=MODEL_CONF,
            max_det=MAX_DET,
            save=False,
            verbose=False
        )

        result = results[0]

        boxes = result.boxes
        masks = result.masks

        raw_internal_detections = []

        # -------------------------------------------------
        # 4) 원본 후보 파싱
        # 내부적으로만 좌표 저장
        # -------------------------------------------------
        if boxes is not None and len(boxes) > 0:
            for idx, box in enumerate(boxes):
                class_id = int(box.cls[0].item())
                confidence = float(box.conf[0].item())

                x1, y1, x2, y2 = box.xyxy[0].tolist()

                class_name = get_class_name(class_id)
                display_name = get_display_name(class_name)

                mask_points = []

                if masks is not None and masks.xy is not None:
                    if idx < len(masks.xy):
                        mask_points = simplify_mask_points(masks.xy[idx])

                internal_detection = {
                    "class_id": class_id,
                    "class_name": class_name,
                    "display_name": display_name,
                    "confidence": round(confidence, 4),
                    "confidence_percent": round(confidence * 100, 2),

                    # 내부 이미지 표시용
                    # 응답 JSON에는 포함하지 않음
                    "_box": {
                        "x1": round(float(x1), 2),
                        "y1": round(float(y1), 2),
                        "x2": round(float(x2), 2),
                        "y2": round(float(y2), 2),
                    },
                    "_mask_points": mask_points
                }

                raw_internal_detections.append(internal_detection)

        # -------------------------------------------------
        # 5) 같은 병변 이름/class는 최고 confidence 1개만 유지
        # -------------------------------------------------
        unique_detections = keep_best_per_class(raw_internal_detections)

        has_detection = len(unique_detections) > 0

        if has_detection:
            top_internal = unique_detections[0]
            top_prediction = to_public_detection(top_internal)

            message = (
                f"{top_prediction['display_name']}의 피부 병변 후보가 감지되었습니다. "
                f"신뢰도 {top_prediction['confidence_percent']}%"
            )
        else:
            top_internal = None
            top_prediction = None
            message = "검출된 병변 후보가 없습니다."

        # -------------------------------------------------
        # 6) 결과 이미지 저장
        # 결과 이미지는 top 후보 하나만 표시
        # -------------------------------------------------
        result_filename = f"{file_id}_result.jpg"
        result_path = RESULT_DIR / result_filename

        draw_top_detection_only(
            image_path=input_path,
            top_detection=top_internal,
            result_path=result_path
        )

        # -------------------------------------------------
        # 7) 응답 생성
        # 좌표/box/mask 없음
        # 같은 class는 하나씩만 반환
        # -------------------------------------------------
        predictions = [
            to_public_detection(det)
            for det in unique_detections
        ]

        elapsed_time = round(time.time() - start_time, 3)

        return {
            "status": "success",

            "has_detection": has_detection,
            "message": message,

            # 15% 이상 raw 후보 개수
            "raw_candidates_count": len(raw_internal_detections),

            # 같은 class 중복 제거 후 후보 개수
            "num_predictions": len(predictions),

            # 전체 최고 후보
            "top_prediction": top_prediction,

            # class별 최고 후보만 반환
            "predictions": predictions,

            "input_image": {
                "original_filename": original_filename,
                "saved_filename": input_filename
            },

            "result_image": {
                "filename": result_filename,
                "url": f"/result/{result_filename}"
            },

            "model_conf": MODEL_CONF,
            "max_det": MAX_DET,
            "elapsed_time_sec": elapsed_time
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "서버 내부 오류가 발생했습니다.",
                "detail": str(e)
            }
        )


# =========================================================
# 10. 결과 이미지 조회 API
# =========================================================

@app.get("/result/{filename}")
def get_result_image(filename: str):
    file_path = RESULT_DIR / filename

    if not file_path.exists():
        return JSONResponse(
            status_code=404,
            content={
                "status": "error",
                "message": "결과 이미지를 찾을 수 없습니다."
            }
        )

    return FileResponse(file_path)


# =========================================================
# 11. python server.py로 직접 실행 가능
# =========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
