import React from 'react';
import { useParams } from 'react-router-dom';

function Classroom() {
  const { classId } = useParams();

  // TODO: Fetch classroom data based on classId
  // TODO: Display combined map view for the class or student list

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">학급 활동 뷰 ({classId || 'N/A'})</h2>
      <p>선택된 학급의 전체 활동 내용을 통합하여 보여줍니다. (교사 기능)</p>
      <div className="mt-4 p-4 border rounded h-[400px] bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">통합 지도 뷰 또는 학생별 진행 상황 표시 영역 (구현 필요)</p>
      </div>
      {/* TODO: Add filtering options or student list */}
    </div>
  );
}

export default Classroom; 