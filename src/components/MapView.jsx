import { useEffect } from "react";

export default function MapView({ lat, lon }) {
  useEffect(() => {
    if (!window.kakao || !lat || !lon) return;

    const container = document.getElementById("map");
    const options = {
      center: new window.kakao.maps.LatLng(lat, lon),
      level: 4,
    };

    const map = new window.kakao.maps.Map(container, options);

    // ✅ 마커 (현재 위치)
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lon),
    });
    marker.setMap(map);

    // ✅ 주변 음식점 검색
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch("맛집", (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        for (let i = 0; i < data.length; i++) {
          const place = data[i];
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(place.y, place.x),
          });
          marker.setMap(map);

          // 마커 클릭 이벤트
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;">${place.place_name}</div>`,
          });
          window.kakao.maps.event.addListener(marker, "click", () =>
            infowindow.open(map, marker)
          );
        }
      }
    });
  }, [lat, lon]);

  return <div id="map" className="w-full h-80 border rounded"></div>;
}