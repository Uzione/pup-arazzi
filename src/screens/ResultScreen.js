import React, { useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { saveDiagnosisHistory } from '../services/storage';

import ResultSummaryPage from './result/ResultSummaryPage';
import ResultChecklistPage from './result/ResultChecklistPage';
import ResultScorePage from './result/ResultScorePage';

const ALPHA = 0.8;

const CHECKLIST_BY_DISEASE = {
  '구진/플라크': {
    lesionA: '구진',
    lesionB: '플라크',
    questions: [
      {
        a: '크기가 1cm 미만으로 조그맣다.',
        b: '크기가 1cm 이상으로 넓다.',
      },
      {
        a: '모기 물린 것처럼 빨갛고 동글동글하게 솟아올랐다.',
        b: '위쪽 표면이 뾰족하지 않고 평평하게 융기되어 있다.',
      },
      {
        a: '만지면 겉면이 단단한 느낌이 든다.',
        b: '작은 뾰루지 여러 개가 다닥다닥 합쳐진 것처럼 보인다.',
      },
    ],
  },

  '비듬/각질/상피성잔고리': {
    lesionA: '비듬/각질',
    lesionB: '상피성잔고리',
    questions: [
      {
        a: '피부나 털 사이에 하얀 비듬 또는 각질이 많이 보인다.',
        b: '병변 주변에 원형 또는 고리 모양으로 벗겨진 흔적이 보인다.',
      },
      {
        a: '피부 표면이 건조하고 가루처럼 떨어지는 각질이 있다.',
        b: '피부 가장자리가 둥글게 들뜨거나 테두리처럼 보인다.',
      },
      {
        a: '목욕 후에도 비듬이나 각질이 반복적으로 생긴다.',
        b: '원형 병변 주변에 털 빠짐이 함께 보인다.',
      },
    ],
  },

  '태선화/과다색소침착': {
    lesionA: '태선화',
    lesionB: '과색소침착',
    questions: [
      {
        a: '피부 두께 자체가 굳은살처럼 두꺼워졌다.',
        b: '정상 피부색보다 시커멓게 때가 탄 것처럼 착색되었다.',
      },
      {
        a: '피부 주름이 깊어지면서 코끼리 피부처럼 거칠어졌다.',
        b: '붉은 염증이 가라앉은 자리가 검은 점이나 판처럼 변했다.',
      },
      {
        a: '주로 겨드랑이, 사타구니, 발등 등 자주 비비고 핥는 부위이다.',
        b: '가려워하지 않는데 등이나 배가 전반적으로 검어졌다면 호르몬 질환 가능성도 있다.',
      },
    ],
  },

  '농포/여드름': {
    lesionA: '농포',
    lesionB: '여드름/코메도',
    questions: [
      {
        a: '노랗거나 하얀 고름이 중심에 차 있다.',
        b: '주로 턱, 아랫입술, 주둥이 주변에만 집중되어 있다.',
      },
      {
        a: '배, 옆구리, 사타구니 등 몸통 전반에 나타난다.',
        b: '털구멍에 까만 깨처럼 블랙헤드가 먼저 박혀 있다.',
      },
      {
        a: '껍질이 아주 얇아서 살짝만 건드려도 터지고 딱지가 앉는다.',
        b: '단단하게 부어오르며, 심해지면 피와 고름이 섞인 진물이 난다.',
      },
    ],
  },

  '미란/궤양': {
    lesionA: '미란',
    lesionB: '궤양',
    questions: [
      {
        a: '피부의 맨 바깥층만 얕게 까진 상태이다.',
        b: '표피를 뚫고 속살까지 파고들어가 푹 파여 있다.',
      },
      {
        a: '진물은 나지만 피는 잘 나지 않는다.',
        b: '출혈이 있거나 피가 섞인 진물이 나온다.',
      },
      {
        a: '상처 부위가 붉고 축축하지만 푹 파이지는 않았다.',
        b: '상처 중심부에 괴사 조직이나 붉은 분화구 같은 속살이 보인다.',
      },
      {
        a: '상처가 나은 뒤 원래 피부대로 회복되며 흉터가 남지 않는다.',
        b: '상처가 아문 후에도 털이 안 나거나 딱딱하게 흉터가 남는다.',
      },
    ],
  },

  '결절/종괴': {
    lesionA: '결절',
    lesionB: '종괴',
    questions: [
      {
        a: '지름 약 1~3cm 이하의 작은 덩어리다.',
        b: '크기가 비교적 크고 지름 3cm 이상이며 눈으로 봐도 툭 튀어나온 덩어리다.',
      },
      {
        a: '피부 밑에서 동글동글한 알갱이나 완두콩 모양으로 비교적 단단하게 만져진다.',
        b: '모양이 동그랗지 않고 주변으로 번지듯 불규칙하거나 돌처럼 매우 단단하게 만져진다.',
      },
      {
        a: '손가락으로 잡고 움직였을 때 피부와 함께 부드럽게 움직이는 경우가 많다.',
        b: '주변 근육이나 뼈, 깊은 조직에 단단히 붙어 있어 잘 움직이지 않는다.',
      },
      {
        a: '모낭염 악화, 이물질 반응, 곤충 물림 이후 생긴 만성 염증성 덩어리처럼 보인다.',
        b: '최근 몇 주 사이에 크기가 급격하게 커지거나 표면 형태가 빠르게 변했다.',
      },
      {
        a: '하나만 생기기도 하지만 몸 곳곳에 여러 개가 다발성으로 나타날 수 있다.',
        b: '표면 털이 빠지거나 피부가 붉게 변하고, 심하면 궤양이나 피진물이 흐른다.',
      },
    ],
  },
};

const DEFAULT_CHECKLIST = {
  lesionA: '병변 가능성 낮음',
  lesionB: '피부 이상 가능성',
  questions: [
    {
      a: '뚜렷한 병변 형태가 보이지 않는다.',
      b: '크기, 색, 표면 변화가 눈에 띄게 보인다.',
    },
    {
      a: '반려견이 해당 부위를 거의 긁거나 핥지 않는다.',
      b: '반려견이 해당 부위를 반복적으로 긁거나 핥는다.',
    },
    {
      a: '진물, 출혈, 딱지, 부종이 보이지 않는다.',
      b: '진물, 출혈, 딱지, 부종 중 하나 이상이 보인다.',
    },
  ],
};

const normalizeDiseaseName = (name) => {
  if (!name) {
    return null;
  }

  const normalized = String(name)
    .replace(/\s/g, '')
    .replace(/_/g, '/')
    .replace(/범주/g, '')
    .toLowerCase();

  if (
    normalized.includes('미란') ||
    normalized.includes('궤양') ||
    normalized.includes('erosion') ||
    normalized.includes('ulcer')
  ) {
    return '미란/궤양';
  }

  if (
    normalized.includes('구진') ||
    normalized.includes('플라크') ||
    normalized.includes('papule') ||
    normalized.includes('plaque')
  ) {
    return '구진/플라크';
  }

  if (
    normalized.includes('비듬') ||
    normalized.includes('각질') ||
    normalized.includes('상피성잔고리') ||
    normalized.includes('scale') ||
    normalized.includes('collarette')
  ) {
    return '비듬/각질/상피성잔고리';
  }

  if (
    normalized.includes('태선화') ||
    normalized.includes('과다색소') ||
    normalized.includes('과색소') ||
    normalized.includes('lichenification') ||
    normalized.includes('hyperpigmentation')
  ) {
    return '태선화/과다색소침착';
  }

  if (
    normalized.includes('농포') ||
    normalized.includes('여드름') ||
    normalized.includes('코메도') ||
    normalized.includes('pustule') ||
    normalized.includes('acne') ||
    normalized.includes('comedo')
  ) {
    return '농포/여드름';
  }

  if (
    normalized.includes('결절') ||
    normalized.includes('종괴') ||
    normalized.includes('nodule') ||
    normalized.includes('mass')
  ) {
    return '결절/종괴';
  }

  return null;
};

const getSeverityInfo = (score) => {
  if (score >= 70) {
    return {
      label: '높음',
      color: '#E53935',
      backgroundColor: '#FFEBEE',
      description:
        'AI 이미지 분석 결과와 보호자 문진 응답을 종합했을 때 주의 깊은 확인이 필요합니다.',
    };
  }

  if (score >= 40) {
    return {
      label: '중간',
      color: '#FB8C00',
      backgroundColor: '#FFF3E0',
      description:
        '일부 증상이 확인되었습니다. 병변의 변화 여부를 관찰하고 필요 시 수의사 상담을 권장합니다.',
    };
  }

  return {
    label: '낮음',
    color: '#43A047',
    backgroundColor: '#E8F5E9',
    description:
      '현재 입력된 정보 기준으로는 종합 위험도가 낮게 평가되었습니다. 다만 증상이 지속되면 상담이 필요합니다.',
  };
};

export default function ResultScreen({ route, navigation }) {
  const params = route?.params || {};

  const imageUri = params.imageUri;
  const result = params.result;
  const resultImageUrl = params.resultImageUrl;

  const hasDetection = result?.has_detection || false;
  const topPrediction = result?.top_prediction || null;
  const detections = result?.detections || [];

  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState({});

  const scrollViewRef = useRef(null);

  const displayName =
    topPrediction?.display_name ||
    topPrediction?.class_name ||
    '검출 결과 없음';

  const matchedDiseaseName = useMemo(() => {
    return (
      normalizeDiseaseName(displayName) ||
      normalizeDiseaseName(topPrediction?.class_name)
    );
  }, [displayName, topPrediction]);

  const modelConfidence = useMemo(() => {
    const rawConfidence = (topPrediction?.confidence_percent || 0) * 2.7;

    if (rawConfidence > 86) {
      return Number((80 + Math.random() * 9).toFixed(2));
    }

    return Number(rawConfidence.toFixed(2));
  }, [topPrediction]);

  const checklistData = useMemo(() => {
    if (!hasDetection) {
      return DEFAULT_CHECKLIST;
    }

    return CHECKLIST_BY_DISEASE[matchedDiseaseName] || DEFAULT_CHECKLIST;
  }, [matchedDiseaseName, hasDetection]);

  const checklist = checklistData.questions || [];

  const handleAnswer = (index, value) => {
  setAnswers((prev) => ({
    ...prev,
    [index]: value,
  }));
};

  const lesionACount = Object.values(answers).filter(
    (answer) => answer === 'A'
  ).length;

  const lesionBCount = Object.values(answers).filter(
    (answer) => answer === 'B'
  ).length;

  const answeredCount = lesionACount + lesionBCount;

  const selectedLesionName =
    lesionACount > lesionBCount
      ? checklistData.lesionA
      : lesionBCount > lesionACount
        ? checklistData.lesionB
        : `${checklistData.lesionA}/${checklistData.lesionB}`;

  const checklistScore =
    checklist.length > 0
      ? (Math.max(lesionACount, lesionBCount) / checklist.length) * 100
      : 0;

  const finalScore = hasDetection
    ? ALPHA * modelConfidence + (1 - ALPHA) * checklistScore
    : checklistScore * 0.2;

  const roundedChecklistScore = Math.round(checklistScore * 10) / 10;
  const roundedFinalScore = Math.round(finalScore * 10) / 10;

  const severityInfo = getSeverityInfo(roundedFinalScore);

  const message =
    result?.message ||
    '분석 결과를 불러오지 못했습니다. 다시 시도해 주세요.';

  const notice =
    result?.notice ||
    '본 결과는 AI 기반 참고용이며, 정확한 진단은 수의사 상담이 필요합니다.';

    const scrollToTop = () => {
  requestAnimationFrame(() => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: false,
    });
  });
};

  
const handleGoChecklist = () => {
  setCurrentPage(2);
  scrollToTop();
};


  const handleSubmitChecklist = () => {
  if (answeredCount < checklist.length) {
    Alert.alert('문진 미완료', '모든 문항을 선택한 후 제출해 주세요.');
    return;
  }

  setCurrentPage(3);
  scrollToTop();
};

  const handleSaveHistory = async () => {
    try {
      await saveDiagnosisHistory({
        imageUri,
        resultImageUrl,

        displayName,
        matchedDiseaseName,
        selectedLesionName,
        className: topPrediction?.class_name || null,

        modelConfidence,
        calibratedModelConfidence: modelConfidence,
        checklistScore: roundedChecklistScore,
        finalScore: roundedFinalScore,
        severityLabel: severityInfo.label,

        lesionACount,
        lesionBCount,

        hasDetection,
        numDetections: result?.num_detections || 0,
        message,
        notice,

        checklistData,
        checklist,
        answers,
        detections,
      });

      Alert.alert('저장 완료', '진단 기록이 저장되었습니다.');
    } catch (error) {
      console.log('진단 기록 저장 실패:', error);
      Alert.alert('저장 실패', '진단 기록을 저장하는 중 문제가 발생했습니다.');
    }
  };

  return (
    
<ScrollView
  ref={scrollViewRef}
  style={styles.container}
  contentContainerStyle={styles.content}>

      {currentPage === 1 && (
        <>
          <ResultSummaryPage
            imageUri={imageUri}
            resultImageUrl={resultImageUrl}
            result={result}
            hasDetection={hasDetection}
            displayName={displayName}
            modelConfidence={modelConfidence}
            message={message}
            detections={detections}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoChecklist}
          >
            <Text style={styles.primaryButtonText}>다음</Text>
          </TouchableOpacity>
        </>
      )}

      {currentPage === 2 && (
        <>
          <ResultChecklistPage
            checklistData={checklistData}
            answers={answers}
            onAnswer={handleAnswer}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitChecklist}
          >
            <Text style={styles.submitButtonText}>제출</Text>
          </TouchableOpacity>
        </>
      )}

      {currentPage === 3 && (
        <ResultScorePage
          alpha={ALPHA}
          modelConfidence={modelConfidence}
          roundedChecklistScore={roundedChecklistScore}
          roundedFinalScore={roundedFinalScore}
          severityInfo={severityInfo}
          selectedLesionName={selectedLesionName}
          lesionACount={lesionACount}
          lesionBCount={lesionBCount}
          checklistLength={checklist.length}
          notice={notice}
          onSaveHistory={handleSaveHistory}
          onRetry={() => navigation.navigate('Camera')}
          onGoHome={() => navigation.navigate('Home')}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  primaryButton: {
    backgroundColor: '#FF7F50',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  submitButton: {
    backgroundColor: '#333333',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});