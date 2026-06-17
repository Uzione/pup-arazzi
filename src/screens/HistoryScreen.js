import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getDiagnosisHistory,
  deleteDiagnosisHistoryById,
  clearDiagnosisHistory,
} from '../services/storage';

const VISIT_RECOMMENDATION_BY_LESION = {
  구진: {
    label: '중간',
    color: '#FB8C00',
    backgroundColor: '#FFF3E0',
  },
  플라크: {
    label: '중간',
    color: '#FB8C00',
    backgroundColor: '#FFF3E0',
  },
  태선화: {
    label: '중간',
    color: '#FB8C00',
    backgroundColor: '#FFF3E0',
  },
  과색소침착: {
    label: '낮음',
    color: '#43A047',
    backgroundColor: '#E8F5E9',
  },
  과다색소침착: {
    label: '낮음',
    color: '#43A047',
    backgroundColor: '#E8F5E9',
  },
  농포: {
    label: '높음',
    color: '#E53935',
    backgroundColor: '#FFEBEE',
  },
  여드름: {
    label: '중간',
    color: '#FB8C00',
    backgroundColor: '#FFF3E0',
  },
  '여드름/코메도': {
    label: '중간',
    color: '#FB8C00',
    backgroundColor: '#FFF3E0',
  },
  미란: {
    label: '높음',
    color: '#E53935',
    backgroundColor: '#FFEBEE',
  },
  궤양: {
    label: '매우 높음',
    color: '#B71C1C',
    backgroundColor: '#FFCDD2',
  },
  결절: {
    label: '높음',
    color: '#E53935',
    backgroundColor: '#FFEBEE',
  },
  종괴: {
    label: '매우 높음',
    color: '#B71C1C',
    backgroundColor: '#FFCDD2',
  },
};

const getVisitRecommendationInfo = (lesionName, fallbackLabel) => {
  if (!lesionName) {
    return {
      label: fallbackLabel || '확인 필요',
      color: '#777777',
      backgroundColor: '#EEEEEE',
    };
  }

  if (VISIT_RECOMMENDATION_BY_LESION[lesionName]) {
    return VISIT_RECOMMENDATION_BY_LESION[lesionName];
  }

  if (lesionName.includes('구진')) {
    return VISIT_RECOMMENDATION_BY_LESION.구진;
  }

  if (lesionName.includes('플라크')) {
    return VISIT_RECOMMENDATION_BY_LESION.플라크;
  }

  if (lesionName.includes('태선화')) {
    return VISIT_RECOMMENDATION_BY_LESION.태선화;
  }

  if (
    lesionName.includes('과색소') ||
    lesionName.includes('과다색소')
  ) {
    return VISIT_RECOMMENDATION_BY_LESION.과다색소침착;
  }

  if (lesionName.includes('농포')) {
    return VISIT_RECOMMENDATION_BY_LESION.농포;
  }

  if (
    lesionName.includes('여드름') ||
    lesionName.includes('코메도')
  ) {
    return VISIT_RECOMMENDATION_BY_LESION['여드름/코메도'];
  }

  if (lesionName.includes('미란')) {
    return VISIT_RECOMMENDATION_BY_LESION.미란;
  }

  if (lesionName.includes('궤양')) {
    return VISIT_RECOMMENDATION_BY_LESION.궤양;
  }

  if (lesionName.includes('결절')) {
    return VISIT_RECOMMENDATION_BY_LESION.결절;
  }

  if (lesionName.includes('종괴')) {
    return VISIT_RECOMMENDATION_BY_LESION.종괴;
  }

  return {
    label: fallbackLabel || '확인 필요',
    color: '#777777',
    backgroundColor: '#EEEEEE',
  };
};

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});

  const loadHistory = async () => {
    const data = await getDiagnosisHistory();
    setHistory(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const toggleChecklistSummary = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';

    const date = new Date(isoString);

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');

    return `${year}.${month}.${day} ${hour}:${minute}`;
  };

  const handleDelete = (id) => {
    Alert.alert(
      '기록 삭제',
      '이 진단 기록을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const updatedHistory = await deleteDiagnosisHistoryById(id);
            setHistory(updatedHistory);

            setExpandedItems((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (history.length === 0) {
      Alert.alert('알림', '삭제할 진단 기록이 없습니다.');
      return;
    }

    Alert.alert(
      '전체 기록 삭제',
      '모든 진단 기록을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: async () => {
            await clearDiagnosisHistory();
            setHistory([]);
            setExpandedItems({});
          },
        },
      ]
    );
  };

  const getSelectedAnswerText = (question, answer) => {
    if (!answer) return '미응답';

    if (answer === 'A') {
      return question?.a || '병변 1 선택';
    }

    if (answer === 'B') {
      return question?.b || '병변 2 선택';
    }

    if (answer === 'yes') {
      return '예';
    }

    if (answer === 'no') {
      return '아니오';
    }

    return '미응답';
  };

  const getAnswerLabel = (answer) => {
    if (answer === 'A') return '병변 1';
    if (answer === 'B') return '병변 2';
    if (answer === 'yes') return '예';
    if (answer === 'no') return '아니오';
    return '미응답';
  };

  const getMessageWithFinalScore = (message, item) => {
  if (!message) {
    return '저장된 메시지가 없습니다.';
  }

  const finalScore = Number(item.finalScore ?? 0).toFixed(1);

  const cleanedMessage = String(message)
    .replace(
      /신뢰도\s*[:：]?\s*\d+(\.\d+)?%/g,
      `신뢰도 ${finalScore}%`
    )
    .replace(/검출\s*\d+개/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleanedMessage || '저장된 메시지가 없습니다.';
};

  const renderChecklistSummary = (item) => {
  const checklist = item.checklist || [];

  const isPairChecklist =
    Array.isArray(checklist) &&
    checklist.length > 0 &&
    typeof checklist[0] === 'object';

  if (!checklist || checklist.length === 0) {
    return (
      <Text style={styles.emptyChecklistText}>
        저장된 문진 응답이 없습니다.
      </Text>
    );
  }

  return checklist.map((question, index) => {
    const answer = item.answers?.[index];

    if (isPairChecklist) {
      return (
        <View key={index} style={styles.answerItem}>
          <Text style={styles.answerQuestion}>
            문항 {index + 1}
          </Text>

          <Text style={styles.optionLine} numberOfLines={3}>
            병변 1: {question.a}
          </Text>

          <Text style={styles.optionLine} numberOfLines={3}>
            병변 2: {question.b}
          </Text>

          <View style={styles.selectedAnswerBox}>
            <Text
              style={[
                styles.answerText,
                answer === 'A'
                  ? styles.yesText
                  : answer === 'B'
                  ? styles.noText
                  : styles.noneText,
              ]}
            >
              선택: {getAnswerLabel(answer)}
            </Text>

            <Text style={styles.selectedAnswerText} numberOfLines={3}>
              {getSelectedAnswerText(question, answer)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View key={index} style={styles.answerItem}>
        <Text style={styles.answerQuestion} numberOfLines={2}>
          {index + 1}. {question}
        </Text>

        <Text
          style={[
            styles.answerText,
            answer === 'yes'
              ? styles.yesText
              : answer === 'no'
              ? styles.noText
              : styles.noneText,
          ]}
        >
          {getAnswerLabel(answer)}
        </Text>
      </View>
    );
  });
};

  const renderHistoryItem = ({ item }) => {
  const isExpanded = !!expandedItems[item.id];

  const lesionName = item.selectedLesionName || '최종 병변 정보 없음';

  const visitRecommendation = getVisitRecommendationInfo(
    item.selectedLesionName,
    item.severityLabel
  );

  return (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggleChecklistSummary(item.id)}
      >
        <View style={styles.contentRow}>
          {item.resultImageUrl ? (
            <Image
              source={{ uri: item.resultImageUrl }}
              style={styles.thumbnail}
            />
          ) : item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.emptyThumbnail}>
              <Text style={styles.emptyThumbnailText}>이미지 없음</Text>
            </View>
          )}

          <View style={styles.infoArea}>
            <Text style={styles.diseaseName}>
              {lesionName}
            </Text>

            {item.matchedDiseaseName && (
              <Text style={styles.categoryText}>
                AI 분류: {item.matchedDiseaseName}
              </Text>
            )}
            <Text style={styles.messageText} numberOfLines={2}>
            {getMessageWithFinalScore(item.message, item)}
            </Text>

            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: visitRecommendation.color },
                ]}
              >
                <Text style={styles.severityBadgeText}>
                  병원 방문 권장도 {visitRecommendation.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.checklistDetailArea}>
          {renderChecklistSummary(item)}
        </View>
      )}
    </View>
  );
};

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <Text style={styles.title}>과거 진단 기록</Text>
        <Text style={styles.subtitle}>
          저장된 AI 분석 및 문진 결과를 확인할 수 있습니다.
        </Text>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAll}
        >
          <Text style={styles.clearButtonText}>전체 기록 삭제</Text>
        </TouchableOpacity>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            저장된 진단 기록이 없습니다.
          </Text>
          <Text style={styles.emptyDescription}>
            분석 결과 화면에서 진단 기록을 저장하면 이곳에 표시됩니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  headerArea: {
    padding: 18,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
    marginBottom: 10,
  },

  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  clearButtonText: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '700',
  },

  listContent: {
    padding: 14,
    paddingTop: 6,
    paddingBottom: 30,
  },

  historyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  dateText: {
    fontSize: 12,
    color: '#777777',
    fontWeight: '600',
  },

  deleteButton: {
    backgroundColor: '#FFECEC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 12,
    fontWeight: 'bold',
  },

  contentRow: {
    flexDirection: 'row',
  },

  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
    marginRight: 10,
  },

  emptyThumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  emptyThumbnailText: {
    fontSize: 11,
    color: '#999999',
  },

  infoArea: {
    flex: 1,
  },

  diseaseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },

  categoryText: {
    fontSize: 11,
    color: '#FF7F50',
    fontWeight: '700',
    marginBottom: 3,
  },

  messageText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
    marginBottom: 6,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 3,
  },

  severityBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },



  checklistDetailArea: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  answerItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 6,
  },

  answerQuestion: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 16,
    marginBottom: 4,
    fontWeight: '700',
  },

  optionLine: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 15,
    marginBottom: 2,
  },

  selectedAnswerBox: {
    backgroundColor: '#FFF4EF',
    borderRadius: 8,
    padding: 7,
    marginTop: 5,
  },

  answerText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  selectedAnswerText: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 15,
  },

  yesText: {
    color: '#FF7F50',
  },

  noText: {
    color: '#555555',
  },

  noneText: {
    color: '#999999',
  },

  emptyChecklistText: {
    fontSize: 12,
    color: '#888888',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 21,
  },
});