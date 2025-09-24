import React, { useState, useEffect } from "react";
import axios from "axios";

const MoodSelector = ({ onMoodSelect, selectedMood, className = "" }) => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableMoods();
  }, []);

  const fetchAvailableMoods = async () => {
    try {
      const response = await axios.get("/api/mood-recommend/moods");
      setMoods(response.data.data || []);
    } catch (error) {
      console.error("기분 목록 가져오기 실패:", error);
      // 기본 기분 목록 설정
      setMoods([
        { key: "happy", description: "행복한 기분에 어울리는 달콤하고 즐거운 음식" },
        { key: "excited", description: "신나는 기분에 어울리는 자극적이고 매운 음식" },
        { key: "relaxed", description: "편안한 기분에 어울리는 부드럽고 담백한 음식" },
        { key: "sad", description: "슬픈 기분에 위로가 되는 달콤하고 따뜻한 음식" },
        { key: "stressed", description: "스트레스 해소에 도움이 되는 매운 음식" },
        { key: "tired", description: "피곤한 몸에 에너지를 주는 따뜻하고 영양가 있는 음식" },
        { key: "angry", description: "화가 날 때 해소에 도움이 되는 매운 음식" },
        { key: "neutral", description: "일상적인 기분에 어울리는 담백하고 건강한 음식" },
        { key: "hungry", description: "배고플 때 든든하게 해주는 음식" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (moodKey) => {
    const emojiMap = {
      happy: "😊",
      excited: "🤩",
      relaxed: "😌",
      sad: "😢",
      stressed: "😰",
      tired: "😴",
      angry: "😠",
      neutral: "😐",
      hungry: "🤤"
    };
    return emojiMap[moodKey] || "😊";
  };

  const getMoodLabel = (moodKey) => {
    const labelMap = {
      happy: "행복",
      excited: "신남",
      relaxed: "편안",
      sad: "슬픔",
      stressed: "스트레스",
      tired: "피곤",
      angry: "화남",
      neutral: "평범",
      hungry: "배고픔"
    };
    return labelMap[moodKey] || moodKey;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-4 ${className}`}>
        <div className="text-gray-500">기분 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">오늘의 기분은 어떤가요?</h3>
      <div className="grid grid-cols-3 gap-3">
        {moods.map((mood) => (
          <button
            key={mood.key}
            onClick={() => onMoodSelect(mood.key)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
              ${selectedMood === mood.key
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
              }
            `}
            title={mood.description}
          >
            <div className="text-2xl mb-2">{getMoodEmoji(mood.key)}</div>
            <div className="text-sm font-medium">{getMoodLabel(mood.key)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoodSelector;
