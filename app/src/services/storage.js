import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'PUP_ARAZZI_DIAGNOSIS_HISTORY';

/**
 * 전체 진단 기록 불러오기
 */
export const getDiagnosisHistory = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);

    if (!jsonValue) {
      return [];
    }

    return JSON.parse(jsonValue);
  } catch (error) {
    console.log('진단 기록 불러오기 오류:', error);
    return [];
  }
};

/**
 * 진단 기록 저장
 */
export const saveDiagnosisHistory = async (historyItem) => {
  try {
    const previousHistory = await getDiagnosisHistory();

    const newHistoryItem = {
  id: `${Date.now()}`,
  createdAt: new Date().toISOString(),

  imageUri: historyItem.imageUri || null,
  resultImageUrl: historyItem.resultImageUrl || null,

  displayName: historyItem.displayName || '검출 결과 없음',
  matchedDiseaseName: historyItem.matchedDiseaseName || null,
  selectedLesionName: historyItem.selectedLesionName || null,
  className: historyItem.className || null,

  modelConfidence: historyItem.modelConfidence || 0,
  calibratedModelConfidence:
    historyItem.calibratedModelConfidence ?? historyItem.modelConfidence ?? 0,

  checklistScore: historyItem.checklistScore || 0,
  finalScore: historyItem.finalScore || 0,
  severityLabel: historyItem.severityLabel || '알 수 없음',

  lesionACount: historyItem.lesionACount || 0,
  lesionBCount: historyItem.lesionBCount || 0,

  hasDetection: historyItem.hasDetection || false,
  numDetections: historyItem.numDetections || 0,
  message: historyItem.message || '',
  notice: historyItem.notice || '',

  checklistData: historyItem.checklistData || null,
  checklist: historyItem.checklist || [],
  answers: historyItem.answers || {},
  detections: historyItem.detections || [],
};

    const updatedHistory = [newHistoryItem, ...previousHistory];

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    return newHistoryItem;
  } catch (error) {
    console.log('진단 기록 저장 오류:', error);
    throw error;
  }
};

/**
 * 특정 진단 기록 삭제
 */
export const deleteDiagnosisHistoryById = async (id) => {
  try {
    const previousHistory = await getDiagnosisHistory();

    const updatedHistory = previousHistory.filter((item) => item.id !== id);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    return updatedHistory;
  } catch (error) {
    console.log('진단 기록 삭제 오류:', error);
    throw error;
  }
};

/**
 * 전체 진단 기록 삭제
 */
export const clearDiagnosisHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.log('전체 진단 기록 삭제 오류:', error);
    throw error;
  }
};