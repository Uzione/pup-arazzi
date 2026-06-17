import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const LESION_INFO = {
  구진: {
    risk: '중간',
    riskColor: '#FB8C00',
    backgroundColor: '#FFF3E0',
    description:
      '피부 위로 작게 솟아오른 병변으로, 알레르기·염증·감염 등 다양한 원인으로 나타날 수 있습니다. 지속되거나 퍼지면 진료를 권장하며, 피부질환은 겉모습이 비슷해 정확한 원인 확인에는 수의학적 검사가 필요할 수 있습니다.',
  },

  플라크: {
    risk: '중간',
    riskColor: '#FB8C00',
    backgroundColor: '#FFF3E0',
    description:
      '피부 표면에 넓고 판처럼 보이는 병변으로, 만성 염증, 알레르기, 감염 등과 관련될 수 있으습니다. 크기가 커지거나 가려움이 동반되면 진료를 권장드립나다.',
  },

  태선화: {
    risk: '중간',
    riskColor: '#FB8C00',
    backgroundColor: '#FFF3E0',
    description:
      '피부가 두꺼워지고 거칠어지는 만성 피부 변화입니다. 반복적인 긁기, 핥기, 만성 염증과 관련될 수 있어 오래 지속되면 진료가 필요합니다.',
  },

  과색소침착: {
    risk: '낮음',
    riskColor: '#43A047',
    backgroundColor: '#E8F5E9',
    description:
      '피부색이 짙어지는 변화로, 단독으로는 응급 가능성이 낮지만 만성 피부염이나 반복 자극과 관련될 수 있습니다. 가려움, 냄새, 탈모, 두꺼워짐이 동반되면 진료를 권장합니다.',
  },

  과다색소침착: {
    risk: '낮음',
    riskColor: '#43A047',
    backgroundColor: '#E8F5E9',
    description:
      '피부색이 짙어지는 변화로, 단독으로는 응급 가능성이 낮지만 만성 피부염이나 반복 자극과 관련될 수 있습니다. 가려움, 냄새, 탈모, 두꺼워짐이 동반되면 진료를 권장드립니다.',
  },

  농포: {
    risk: '높음',
    riskColor: '#E53935',
    backgroundColor: '#FFEBEE',
    description:
      '고름이 찬 병변으로, 세균성 피부감염인 농피증에서 구진이나 농포가 흔히 나타날 수 있습니다. 퍼지거나 통증, 진물, 악취가 있으면 빠른 진료를 권장합니다.',
  },

  여드름: {
    risk: '중간',
    riskColor: '#FB8C00',
    backgroundColor: '#FFF3E0',
    description:
      '모낭 주변에 생기는 작은 염증성 병변으로, 단발성이고 가벼우면 경과 관찰이 가능하지만, 반복되거나 고름·붉어짐·통증이 있으면 감염 가능성이 있어 진료를 권장합니다.',
  },

  코메도: {
    risk: '중간',
    riskColor: '#FB8C00',
    backgroundColor: '#FFF3E0',
    description:
      '모낭 주변에 생기는 작은 염증성 병변으로, 단발성이고 가벼우면 경과 관찰이 가능하지만, 반복되거나 고름·붉어짐·통증이 있으면 감염 가능성이 있어 진료를 권장한다.',
  },

  미란: {
    risk: '높음',
    riskColor: '#E53935',
    backgroundColor: '#FFEBEE',
    description:
      '피부 표면이 얕게 벗겨진 손상성 병변입니다. 핥기, 긁기, 감염, 염증 등으로 악화될 수 있으므로 진물이나 통증이 있으면 빠른 진료를 권장합니다. 피부 손상 병변은 감염으로 진행될 수 있습니다.',
  },

  궤양: {
    risk: '매우 높음',
    riskColor: '#B71C1C',
    backgroundColor: '#FFCDD2',
    description:
      '피부가 더 깊게 손상된 열린 상처 형태의 병변으로, 통증, 출혈, 진물, 감염 위험이 있으므로 빠른 수의사 진료가 필요합니다. 궤양은 악화되거나 감염될 수 있습니다.',
  },

  결절: {
    risk: '높음',
    riskColor: '#E53935',
    backgroundColor: '#FFEBEE',
    description:
      '피부나 피하에 만져지는 덩어리성 병변으로, 염증, 낭종, 감염, 종양 등 다양한 원인이 가능하며 겉모습만으로 원인 구분이 어렵기 때문에 진료를 권장드립니다.',
  },

  종괴: {
    risk: '매우 높음',
    riskColor: '#B71C1C',
    backgroundColor: '#FFCDD2',
    description:
      '혹이나 덩어리 형태의 병변으로, 양성 변화부터 종양성 병변까지 가능성이 다양합니다. 새로 생겼거나 커지거나 터지거나 피가 나면 반드시 진료를 권장합니다. 피부 병변의 원인에는 종양도 포함될 수 있어 검사가 필요할 수 있습니다.',
  },
};

const getLesionInfo = (lesionName) => {
  if (!lesionName) {
    return {
      risk: '확인 필요',
      riskColor: '#777777',
      backgroundColor: '#EEEEEE',
      description:
        '최종 추정 병변 정보를 확인하기 어렵습니다. 증상이 지속되거나 악화되면 수의사 상담을 권장합니다.',
    };
  }

  if (LESION_INFO[lesionName]) {
    return LESION_INFO[lesionName];
  }

  if (lesionName.includes('구진')) return LESION_INFO.구진;
  if (lesionName.includes('플라크')) return LESION_INFO.플라크;
  if (lesionName.includes('태선화')) return LESION_INFO.태선화;
  if (
    lesionName.includes('과색소') ||
    lesionName.includes('과다색소')
  ) {
    return LESION_INFO.과다색소침착;
  }
  if (lesionName.includes('농포')) return LESION_INFO.농포;
  if (
    lesionName.includes('여드름') ||
    lesionName.includes('코메도')
  ) {
    return LESION_INFO['여드름/코메도'];
  }
  if (lesionName.includes('미란')) return LESION_INFO.미란;
  if (lesionName.includes('궤양')) return LESION_INFO.궤양;
  if (lesionName.includes('결절')) return LESION_INFO.결절;
  if (lesionName.includes('종괴')) return LESION_INFO.종괴;

  return {
    risk: '확인 필요',
    riskColor: '#777777',
    backgroundColor: '#EEEEEE',
    description:
      '해당 병변은 보호자 관찰 정보와 AI 분석 결과를 함께 참고해야 합니다. 정확한 원인 확인을 위해 수의사 상담을 권장합니다.',
  };
};

export default function ResultScorePage({
  modelConfidence,
  roundedChecklistScore,
  roundedFinalScore,
  severityInfo,
  selectedLesionName,
  lesionACount,
  lesionBCount,
  checklistLength,
  notice,
  onSaveHistory,
  onRetry,
  onGoHome,
}) {
  const lesionInfo = getLesionInfo(selectedLesionName);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>종합 가능성 점수</Text>

        <View style={styles.finalLesionBox}>
          <Text style={styles.finalLesionLabel}>최종 추정 병변</Text>

          <Text style={styles.finalLesionName}>
            {selectedLesionName}
          </Text>

          <View
            style={[
              styles.riskBadge,
              { backgroundColor: lesionInfo.riskColor },
            ]}
          >
            <Text style={styles.riskBadgeText}>
              병원 방문 권장도 {lesionInfo.risk}
            </Text>
          </View>

        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>AI 신뢰도</Text>
            <Text style={styles.scoreValue}>{modelConfidence}%</Text>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>문진 점수</Text>
            <Text style={styles.scoreValue}>{roundedChecklistScore}%</Text>
          </View>
        </View>

        <View
          style={[
            styles.finalScoreBox,
            { backgroundColor: severityInfo.backgroundColor },
          ]}
        >
          <Text style={styles.finalScoreLabel}>최종 가능성 점수</Text>

          <Text style={[styles.finalScoreValue, { color: severityInfo.color }]}>
            {roundedFinalScore}%
          </Text>

          <View
            style={[
              styles.severityBadge,
              { backgroundColor: severityInfo.color },
            ]}
          >
            <Text style={styles.severityBadgeText}>
              종합 위험도 {severityInfo.label}
            </Text>
          </View>

          <Text style={styles.severityDescription}>
            {severityInfo.description}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.noticeBox,
          { backgroundColor: lesionInfo.backgroundColor },
        ]}
      >
        <Text style={[styles.noticeTitle, { color: lesionInfo.riskColor }]}>
          {selectedLesionName} 안내
        </Text>

        <Text style={styles.noticeRiskText}>
         병원 방문 권장도: {lesionInfo.risk}
        </Text>

        <Text style={styles.noticeText}>
          {lesionInfo.description}
        </Text>

        <Text style={styles.noticeSubText}>
          본 결과는 AI 이미지 분석과 보호자 문진을 종합한 참고용 정보이며,
          정확한 진단과 치료 여부는 수의사 상담을 통해 확인해야 합니다.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={onSaveHistory}>
          <Text style={styles.saveButtonText}>진단 기록 저장하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
          <Text style={styles.primaryButtonText}>다시 분석하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onGoHome}>
          <Text style={styles.secondaryButtonText}>홈으로 이동</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 14,
  },

  finalLesionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
  },

  finalLesionLabel: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 5,
  },

  finalLesionName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF7F50',
    marginBottom: 8,
    textAlign: 'center',
  },

  riskBadge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 8,
  },

  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  scoreRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  scoreItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  scoreLabel: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 4,
  },

  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },

  finalScoreBox: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 4,
  },

  finalScoreLabel: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
  },

  finalScoreValue: {
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  severityBadge: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 10,
  },

  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  severityDescription: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 21,
  },

  noticeBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },

  noticeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  noticeRiskText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 8,
  },

  noticeText: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 21,
    marginBottom: 8,
  },

  noticeSubText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },

  buttonContainer: {
    marginTop: 4,
  },

  saveButton: {
    backgroundColor: '#333333',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  primaryButton: {
    backgroundColor: '#FF7F50',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  secondaryButton: {
    backgroundColor: '#EEEEEE',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '700',
  },
});