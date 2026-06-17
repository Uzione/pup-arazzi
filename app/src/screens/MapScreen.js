import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// 카카오 API 설정
const KAKAO_API_KEY = 'a2b24cecbf7c3fe99fb3fc4c99216c15'; 

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 권한을 허용해야 주변 병원을 찾을 수 있습니다.');
        setLoading(false);
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});

        const initialRegion = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };

        setLocation(initialRegion);
        await searchHospitals(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
      } catch (error) {
        console.log('위치 조회 오류:', error);
        Alert.alert('오류', '현재 위치를 가져오지 못했습니다.');
        setLoading(false);
      }
    })();
  }, []);

  const searchHospitals = async (lat, lng) => {
    setLoading(true);

    try {
      console.log(`요청 좌표: 위도(${lat}), 경도(${lng})`);

      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/keyword.json',
        {
          params: {
            query: '동물병원',
            x: lng,
            y: lat,
            radius: 5000,
            sort: 'distance',
          },
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        }
      );

      console.log('검색 성공! 찾은 병원 개수:', response.data.documents.length);
      setHospitals(response.data.documents);
    } catch (error) {
      console.log(
        '❌ API 에러 상세 원인:',
        error.response ? error.response.data : error.message
      );
      Alert.alert('오류', '동물병원 정보를 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openKakaoMap = (hospital) => {
    if (!hospital.place_url) {
      Alert.alert('안내', '카카오맵 링크가 없습니다.');
      return;
    }

    Linking.openURL(hospital.place_url).catch(() => {
      Alert.alert('오류', '카카오맵을 열 수 없습니다.');
    });
  };

  const formatDistance = (distance) => {
    if (!distance) return '거리 정보 없음';

    const meter = Number(distance);

    if (meter >= 1000) {
      return `${(meter / 1000).toFixed(1)}km`;
    }

    return `${meter}m`;
  };

  return (
    <View style={styles.container}>
      {!location || loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF7F50" />
          <Text style={styles.statusText}>내 위치와 주변 병원을 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={location}
            showsUserLocation={true}
            onPress={() => setSelectedHospital(null)}
          >
            {hospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                coordinate={{
                  latitude: parseFloat(hospital.y),
                  longitude: parseFloat(hospital.x),
                }}
                title={hospital.place_name}
                description={hospital.phone || '전화번호 정보 없음'}
                pinColor="#FF7F50"
                onPress={() => setSelectedHospital(hospital)}
              />
            ))}
          </MapView>

          {!selectedHospital && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                반경 5km 내 {hospitals.length}개의 동물병원을 찾았습니다.
              </Text>
            </View>
          )}

          {selectedHospital && (
            <View style={styles.detailBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={styles.hospitalName}>
                    {selectedHospital.place_name}
                  </Text>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedHospital(null)}
                  >
                    <Text style={styles.closeButtonText}>닫기</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>주소</Text>
                  <Text style={styles.value}>
                    {selectedHospital.road_address_name ||
                      selectedHospital.address_name ||
                      '주소 정보 없음'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>전화번호</Text>
                  <Text style={styles.value}>
                    {selectedHospital.phone || '전화번호 정보 없음'}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>거리</Text>
                  <Text style={styles.value}>
                    {formatDistance(selectedHospital.distance)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>분류</Text>
                  <Text style={styles.value}>
                    {selectedHospital.category_name || '분류 정보 없음'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => openKakaoMap(selectedHospital)}
                >
                  <Text style={styles.mapButtonText}>카카오맵에서 보기</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusText: {
    marginTop: 10,
    color: '#666',
  },

  infoBox: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 15,
    elevation: 5,
    alignItems: 'center',
  },

  infoText: {
    fontWeight: 'bold',
    color: '#333',
  },

  detailBox: {
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    maxHeight: 310,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  hospitalName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 10,
  },

  closeButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  closeButtonText: {
    fontSize: 12,
    color: '#555',
    fontWeight: 'bold',
  },

  row: {
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3,
  },

  value: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  mapButton: {
    marginTop: 10,
    backgroundColor: '#FF7F50',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },

  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});