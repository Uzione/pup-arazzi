import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
  predictDogSkinDisease,
  getFullResultImageUrl,
} from '../services/api';

export default function CameraScreen({ navigation }) {
  // 선택된 이미지 URI 저장
  const [imageUri, setImageUri] = useState(null);

  // 분석 요청 중 로딩 상태
  const [loading, setLoading] = useState(false);

  // =====================================================
  // 1. 카메라 촬영 함수
  // =====================================================
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '카메라 접근 권한을 허용해야 사진을 찍을 수 있습니다.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('카메라 실행 오류:', error);
      Alert.alert('오류', '카메라를 실행하는 중 문제가 발생했습니다.');
    }
  };

  // =====================================================
  // 2. 갤러리 이미지 선택 함수
  // =====================================================
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '권한 필요',
          '사진첩 접근 권한을 허용해야 이미지를 불러올 수 있습니다.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('갤러리 선택 오류:', error);
      Alert.alert('오류', '갤러리에서 이미지를 불러오는 중 문제가 발생했습니다.');
    }
  };

  // =====================================================
  // 3. 분석 요청 함수
  // api.js의 predictDogSkinDisease() 사용
  // =====================================================
  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert('이미지 없음', '분석할 이미지를 먼저 선택해 주세요.');
      return;
    }

    setLoading(true);

    try {
      // FastAPI /predict로 이미지 업로드 및 YOLO 분석 요청
      const data = await predictDogSkinDisease(imageUri, 0.25);

      console.log('분석 결과:', data);

      // 서버 결과 이미지 URL 생성
      const resultImageUrl = getFullResultImageUrl(data.result_image?.url);

      // ResultScreen으로 결과 전달
      navigation.navigate('Result', {
        imageUri,
        result: data,
        resultImageUrl,
      });
    } catch (error) {
      console.log('분석 요청 오류:', error);

      Alert.alert(
        '분석 실패',
        error.message ||
          '이미지를 분석하는 중 문제가 발생했습니다. 서버 상태를 확인해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        정확한 분석을 위해 반려견의 환부가 밝고 선명하게 보이도록 사진을 준비해 주세요.
      </Text>

      {/* 이미지 미리보기 영역 */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>선택된 사진이 없습니다.</Text>
        )}
      </View>

      {/* 카메라/갤러리 버튼 영역 */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabledButton]}
          onPress={takePhoto}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📷 사진 촬영</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabledButton]}
          onPress={pickImage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🖼️ 갤러리 선택</Text>
        </TouchableOpacity>
      </View>

      {/* 이미지가 선택되었을 때만 분석 버튼 표시 */}
      {imageUri && (
        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.disabledButton]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.loadingText}>분석 중...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeButtonText}>
              🚀 이 사진으로 분석하기
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },

  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 22,
  },

  imageContainer: {
    width: 250,
    height: 250,
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  placeholderText: {
    color: '#999999',
    fontSize: 14,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#EEEEEE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },

  buttonText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },

  analyzeButton: {
    width: '100%',
    backgroundColor: '#FF7F50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  analyzeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.7,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});