import React, { useState } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function RoleSelectionModal({ email, onRoleSet }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  
  const handleRoleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      const updateData = {
        role: selectedRole,
        updatedAt: new Date()
      };

      // 학생인 경우 승인 대기 상태로 설정 (teacherId는 null 유지 → 초대코드 강제 조건 충족)
      if (selectedRole === 'student') {
        updateData.status = 'pending';
        updateData.approvedBy = null;
        updateData.teacherId = null;
      } else {
        updateData.status = 'approved';
      }

      await updateDoc(doc(db, "users", currentUser.uid), updateData);
      onRoleSet(selectedRole);
    } catch (error) {
      console.error('역할 설정 오류:', error);
      alert('역할 설정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl max-w-md w-full mx-4 shadow-friendly">
        <div className="text-center mb-6">
          <span className="text-6xl mb-4 block">🎭</span>
          <h3 className="text-2xl font-bold text-gray-800 mb-2 font-korean">계정 유형 선택</h3>
          <p className="text-gray-600 font-korean">
            <strong className="text-blue-600">{email}</strong><br/>
            어떤 역할로 사용하시겠어요?
          </p>
        </div>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={() => setSelectedRole('teacher')}
            className={`w-full p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
              selectedRole === 'teacher' 
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg' 
                : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            <span className="text-4xl mb-2 block">👩‍🏫</span>
            <span className="font-bold text-lg font-korean block">교사</span>
            <p className="text-sm text-gray-500 mt-2 font-korean">
              • 학생 관리 및 승인<br/>
              • 학습 진행 모니터링<br/>
              • 즉시 사용 가능
            </p>
          </button>
          
          <button
            onClick={() => setSelectedRole('student')}
            className={`w-full p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
              selectedRole === 'student' 
                ? 'border-green-500 bg-green-50 text-green-700 shadow-lg' 
                : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            <span className="text-4xl mb-2 block">🧑‍🎓</span>
            <span className="font-bold text-lg font-korean block">학생</span>
            <p className="text-sm text-gray-500 mt-2 font-korean">
              • 학습 활동 참여<br/>
              • 지도 그리기 및 공유<br/>
              • 교사 승인 후 사용 가능
            </p>
          </button>
        </div>
        
        <button
          onClick={handleRoleSubmit}
          disabled={!selectedRole || isSubmitting}
          className="w-full bg-gradient-to-r from-seoul-500 to-seoul-600 text-white font-bold py-4 px-6 rounded-xl hover:from-seoul-600 hover:to-seoul-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seoul-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              설정 중...
            </span>
          ) : (
            '역할 설정 완료'
          )}
        </button>
      </div>
    </div>
  );
}

export default RoleSelectionModal;