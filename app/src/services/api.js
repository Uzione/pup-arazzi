// src/services/api.js

// 현재 PC Wi-Fi IPv4 주소
// PC IP가 바뀌면 이 값만 수정하면 됩니다.
export const API_BASE_URL = 'http://10.22.3.19:8000';

/**
 * 이미지 URI에서 파일명을 추출합니다.
 */
const getFileName = (uri) => {
  const uriParts = uri.split('/');
  const fileName = uriParts[uriParts.length - 1];

  if (fileName && fileName.includes('.')) {
    return fileName;
  }

  return `dog_skin_${Date.now()}.jpg`;
};

/**
 * 이미지 URI에서 MIME 타입을 추정합니다.
 */
const getMimeType = (uri) => {
  const extension = uri.split('.').pop().toLowerCase();

  if (extension === 'png') return 'image/png';
  if (extension === 'bmp') return 'image/bmp';
  if (extension === 'jpeg') return 'image/jpeg';
  if (extension === 'jpg') return 'image/jpeg';

  return 'image/jpeg';
};

/**
 * 서버 상태 확인 API
 */
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '서버 상태 확인 실패');
    }

    return data;
  } catch (error) {
    console.log('서버 상태 확인 오류:', error);
    throw error;
  }
};

/**
 * YOLO 피부 병변 분석 API
 *
 * 현재 서버는 confidence 값을 앱에서 받지 않습니다.
 * 서버 내부의 MODEL_CONF 값으로 모든 후보를 거의 다 반환합니다.
 *
 * FastAPI /predict 엔드포인트로 이미지를 업로드합니다.
 */
export const predictDogSkinDisease = async (imageUri) => {
  try {
    const fileName = getFileName(imageUri);
    const fileType = getMimeType(imageUri);

    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: fileType,
    });

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,

      // React Native에서 FormData 전송 시 Content-Type을 직접 지정하지 않는 것이 안전합니다.
      // boundary 값은 fetch가 자동으로 설정합니다.
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.log('JSON 파싱 실패:', text);
      throw new Error('서버 응답을 JSON으로 변환하지 못했습니다.');
    }

    if (!response.ok) {
      throw new Error(data.message || '이미지 분석 요청 실패');
    }

    return data;
  } catch (error) {
    console.log('피부 병변 분석 API 오류:', error);
    throw error;
  }
};

/**
 * 서버에서 반환한 결과 이미지 상대 경로를 전체 URL로 변환합니다.
 *
 * 예:
 * /result/abc_result.jpg
 * → http://10.53.190.76:8000/result/abc_result.jpg
 */
export const getFullResultImageUrl = (resultImageUrl) => {
  if (!resultImageUrl) return null;

  if (resultImageUrl.startsWith('http')) {
    return resultImageUrl;
  }

  return `${API_BASE_URL}${resultImageUrl}`;
};

/**
 * 서버에 로드된 클래스 목록 조회
 */
export const getDiseaseClasses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/classes`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '클래스 목록 조회 실패');
    }

    return data;
  } catch (error) {
    console.log('클래스 목록 조회 오류:', error);
    throw error;
  }
};