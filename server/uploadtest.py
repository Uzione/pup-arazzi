import requests
from pathlib import Path
import json


# =====================================================
# 1. 설정
# =====================================================

# SERVER_URL = "서버 주소를 입력하세요"

# IMAGE_PATH = r"테스트할 이미지 경로를 입력하세요"


# =====================================================
# 2. 이미지 업로드 함수
# =====================================================

def upload_image(image_path: str):
    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(f"이미지 파일을 찾을 수 없습니다: {image_path}")

    url = f"{SERVER_URL}/predict"

    ext = image_path.suffix.lower()

    if ext in [".jpg", ".jpeg"]:
        mime_type = "image/jpeg"
    elif ext == ".png":
        mime_type = "image/png"
    elif ext == ".bmp":
        mime_type = "image/bmp"
    else:
        raise ValueError(f"지원하지 않는 이미지 확장자입니다: {ext}")

    with open(image_path, "rb") as f:
        files = {
            "file": (
                image_path.name,
                f,
                mime_type
            )
        }

        response = requests.post(url, files=files)

    print("\n===== HTTP 응답 정보 =====")
    print("status_code:", response.status_code)
    print("content-type:", response.headers.get("content-type"))

    try:
        data = response.json()
    except Exception:
        print("\n===== 서버 원본 응답 TEXT =====")
        print(response.text)
        raise RuntimeError("서버 응답을 JSON으로 파싱하지 못했습니다.")

    if response.status_code != 200:
        print("\n===== 서버 오류 응답 JSON =====")
        print(json.dumps(data, ensure_ascii=False, indent=2))
        raise RuntimeError("이미지 업로드 실패")

    return data


# =====================================================
# 3. 결과 이미지 다운로드 함수
# =====================================================

def download_result_image(result_data):
    result_image = result_data.get("result_image")

    if not result_image:
        print("\n결과 이미지 정보가 없습니다.")
        return None

    result_url = result_image.get("url")

    if not result_url:
        print("\n결과 이미지 URL이 없습니다.")
        return None

    full_url = SERVER_URL + result_url

    save_dir = Path("downloaded_results")
    save_dir.mkdir(exist_ok=True)

    filename = result_image.get("filename", "result.jpg")
    save_path = save_dir / filename

    response = requests.get(full_url)

    if response.status_code != 200:
        print("\n결과 이미지 다운로드 실패")
        print("status_code:", response.status_code)
        print("response text:", response.text)
        return None

    with open(save_path, "wb") as f:
        f.write(response.content)

    return save_path


# =====================================================
# 4. 실행
# =====================================================

def main():
    print("이미지 업로드 시작")
    print("서버:", SERVER_URL)
    print("이미지:", IMAGE_PATH)

    result = upload_image(IMAGE_PATH)

    # =================================================
    # 서버에서 반환한 JSON 그대로 출력
    # =================================================
    print("\n===== 서버 반환 JSON 전체 =====")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # =================================================
    # 결과 이미지 다운로드
    # =================================================
    save_path = download_result_image(result)

    if save_path:
        print("\n===== 결과 이미지 저장 완료 =====")
        print(save_path.resolve())


if __name__ == "__main__":
    main()
