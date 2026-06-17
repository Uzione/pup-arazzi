import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';

export default function HomeScreen({ navigation }) {
  const puddingScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(puddingScale, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.spring(puddingScale, {
          toValue: 1,
          friction: 3,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 타이틀 영역 */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/dog.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />

        <Text style={styles.title}>Pup-arazzi</Text>
        <Text style={styles.subtitle}>우리아이 피부 건강 지킴이</Text>
      </View>

      {/* 메인 기능 버튼들 */}
      <View style={styles.buttonContainer}>
        {/* 가운데 메인 버튼 */}
        <Animated.View
          style={[
            styles.primaryButtonWrapper,
            {
              transform: [{ scale: puddingScale }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              피부 질환{'\n'}분석하기
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 왼쪽 아래 버튼 */}
        <TouchableOpacity 
          style={styles.leftCircleButton}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.85}
        >
          <Text style={styles.leftCircleButtonText}>
            📂 과거 분석{'\n'}기록 보기
          </Text>
        </TouchableOpacity>

        {/* 오른쪽 아래 버튼 */}
        <TouchableOpacity 
          style={styles.rightCircleButton}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.85}
        >
          <Text style={styles.rightCircleButtonText}>
            🏥 주변{'\n'}동물병원 찾기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// UI 디자인(스타일) 설정
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 15,
    backgroundColor: '#FF7F50',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#040404',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: '#373737',
  },

  // 버튼 영역
  buttonContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    alignItems: 'center',
  },

  // 가운데 버튼 애니메이션 감싸는 영역
  primaryButtonWrapper: {
    width: 180,
    height: 180,
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 가운데 메인 원형 버튼
  primaryButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',

    // 살짝 떠 보이는 느낌
    shadowColor: '#FF7F50',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },

  // 왼쪽 아래 원형 버튼
  leftCircleButton: {
    width: 155,
    height: 155,
    borderRadius: 77.5,
    backgroundColor: '#ebebeb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: -60,
    bottom: 10,
  },

  leftCircleButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 23,
    marginLeft: 30,
  },

  // 오른쪽 아래 원형 버튼
  rightCircleButton: {
    width: 155,
    height: 155,
    borderRadius: 77.5,
    backgroundColor: '#ebebeb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -65,
    bottom: 10,
  },

  rightCircleButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 23,
    marginRight: 30,
  },
});