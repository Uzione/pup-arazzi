import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ResultChecklistPage({
  checklistData,
  answers,
  onAnswer,
}) {
  const questions = checklistData?.questions || [];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>보호자 문진 체크리스트</Text>

      <Text style={styles.checklistDescription}>
        아래 문항마다 반려견의 피부 상태와 더 가까운 설명을 하나씩 선택해
        주세요. 각 문항은 두 선택지 중 하나만 선택할 수 있습니다.
      </Text>

      {questions.map((question, index) => {
        const selectedAnswer = answers[index];

        return (
          <View key={index} style={styles.questionBox}>
            <Text style={styles.questionTitle}>문항 {index + 1}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.optionButton,
                selectedAnswer === 'A' && styles.optionSelected,
              ]}
              onPress={() => onAnswer(index, 'A')}
            >
              <View
                style={[
                  styles.radioCircle,
                  selectedAnswer === 'A' && styles.radioCircleSelected,
                ]}
              >
                {selectedAnswer === 'A' && <View style={styles.radioDot} />}
              </View>

              <Text
                style={[
                  styles.optionText,
                  selectedAnswer === 'A' && styles.optionTextSelected,
                ]}
              >
                {question.a}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.optionButton,
                selectedAnswer === 'B' && styles.optionSelected,
              ]}
              onPress={() => onAnswer(index, 'B')}
            >
              <View
                style={[
                  styles.radioCircle,
                  selectedAnswer === 'B' && styles.radioCircleSelected,
                ]}
              >
                {selectedAnswer === 'B' && <View style={styles.radioDot} />}
              </View>

              <Text
                style={[
                  styles.optionText,
                  selectedAnswer === 'B' && styles.optionTextSelected,
                ]}
              >
                {question.b}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },

  checklistDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 21,
    marginBottom: 16,
  },

  questionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  questionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF7F50',
    marginBottom: 10,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F1F1',
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  optionSelected: {
    backgroundColor: '#FFF4EF',
    borderColor: '#FF7F50',
  },

  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#BBBBBB',
    marginRight: 10,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioCircleSelected: {
    borderColor: '#FF7F50',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF7F50',
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },

  optionTextSelected: {
    fontWeight: '700',
  },
});