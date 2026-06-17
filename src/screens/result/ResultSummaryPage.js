import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ResultSummaryPage({
  resultImageUrl,
  result,
  hasDetection,
  modelConfidence,
  message,
  detections,
}) {
  const visibleDetections = detections.slice(0, 3);
  const hiddenDetectionCount = Math.max(detections.length - 3, 0);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.screenTitle}>AI 피부 분석 결과</Text>

      {/* 분석 요약 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>분석 요약</Text>

        <Text
          style={[
            styles.resultTitle,
            hasDetection ? styles.detectedText : styles.notDetectedText,
          ]}
        >
          {hasDetection
            ? 'AI 탐지 결과 이미지의 표시 영역에서 병변이 검출되었습니다.'
            : '뚜렷한 병변이 검출되지 않았습니다.'}
            
        </Text>


        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>AI 신뢰도</Text>
            <Text style={styles.metaValue}>
              {hasDetection ? `${modelConfidence}%` : '-'}
            </Text>
          </View>


          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>소요 시간</Text>
            <Text style={styles.metaValue}>
              {result?.elapsed_time_sec ? `${result.elapsed_time_sec}초` : '-'}
            </Text>
          </View>
        </View>
      </View>

      {/* AI 탐지 결과 이미지 */}
      <View style={styles.imageCard}>
        <Text style={styles.sectionTitle}>AI 탐지 결과 이미지</Text>

        {resultImageUrl ? (
          <Image
            source={{ uri: resultImageUrl }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.emptyImageBox}>
            <Text style={styles.emptyImageText}>결과 이미지가 없습니다</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },

  summaryCard: {
    backgroundColor: '#FFF4EF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD6C8',
  },

  summaryLabel: {
    fontSize: 13,
    color: '#FF7F50',
    fontWeight: '700',
    marginBottom: 5,
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 23,
    marginBottom: 20,
  },

  detectedText: {
    color: '#333333',
  },

  notDetectedText: {
    color: '#666666',
  },

  messageText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: 'row',
    gap: 6,
  },

  metaItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  metaLabel: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 3,
  },

  metaValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
  },

  imageCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },

  resultImage: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
  },

  emptyImageBox: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyImageText: {
    color: '#999999',
    fontSize: 14,
  },

  detailCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 12,
    flexShrink: 1,
  },

  detectionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  detectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  detectionRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF7F50',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 12,
  },

  detectionTextBox: {
    flex: 1,
  },

  detectionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },

  detectionClassName: {
    fontSize: 11,
    color: '#888888',
    marginTop: 1,
  },

  detectionConfidence: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF7F50',
    marginLeft: 8,
  },

  moreDetectionText: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    marginTop: 1,
  },

  emptyText: {
    fontSize: 13,
    color: '#777777',
    lineHeight: 20,
  },
});