  // 카카오맵 SDK 연동
  // 	위치 권한을 받아 위도·경도 저장
	//	사용자 현재 위치 지도 표시
	//	맛집 키워드로 주변 음식점 검색 → 마커 + 가게 이름 출력

import { useEffect, useState } from "react";

export default function MapView({ lat, lon }) {
  const [kakaoLoaded, setKakaoLoaded] = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;

    // 중복 로딩 방지
    if (window.kakao) {
      setKakaoLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_KEY}&libraries=services`;
    script.async = true;
    script.onload = () => setKakaoLoaded(true);
    document.head.appendChild(script);
  }, [lat, lon]);

  useEffect(() => {
    if (!kakaoLoaded) return;

    const container = document.getElementById("map");
    const options = {
      center: new window.kakao.maps.LatLng(lat, lon),
      level: 3,
    };

    const map = new window.kakao.maps.Map(container, options);

    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lon),
    });
    marker.setMap(map);
  }, [kakaoLoaded, lat, lon]);

  return (
    <div
      id="map"
      style={{ width: "100%", height: "400px", borderRadius: "8px", marginTop: "1rem" }}
    />
  );
}

// 비스니스 심사 신청을 해야해서 앱이 어느정도 완성된 후 다시 연결 시도 ;