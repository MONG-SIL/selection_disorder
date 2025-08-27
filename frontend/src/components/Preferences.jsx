export default function Preferences() {
  return (
    <div>
      <h2>Preferences Page</h2>
      <p>여기에 사용자 취향 설정 UI가 들어갑니다.</p>
    </div>
  );
}

// 사용자 취향을 저장하는 페이지
// 취향은 음식별 리스트가 있고, 각 음식마다 1~5점으로 평가
// 저장된 취향은 /api/user/preferences 로 POST 전송
// 예: { food: "김치찌개", rating: 5 }

// 최초 저장되는 사용자 취향은 사용자 회원가입과 동시에 백엔드에 저장됨

// 취향 설정 페이지에서는 기존에 저장된 취향을 불러와서 표시
// 취향 불러오기: GET /api/user/preferences
// 취향 저장: POST /api/user/preferences { food: "김치찌개", rating: 5 }
// 취향 수정: PUT /api/user/preferences { food: "김치찌개", rating: 4 }
// 취향 삭제: DELETE /api/user/preferences { food: "김치찌개" } 