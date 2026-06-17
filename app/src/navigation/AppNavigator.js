import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 각 화면 컴포넌트 불러오기
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import MapScreen from '../screens/MapScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#FF7F50' }, // 헤더 색상 (코랄)
        headerTintColor: '#fff', // 헤더 글자색
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Pup-arazzi' }} 
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ title: '사진 촬영/선택' }} 
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen} 
        options={{ title: '분석 결과' }} 
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: '과거 기록' }} 
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: '주변 동물병원' }} 
      />
    </Stack.Navigator>
  );
}