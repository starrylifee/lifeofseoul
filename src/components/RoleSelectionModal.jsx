import React, { useState } from 'react';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function RoleSelectionModal({ email, onRoleSet }) {
  const [selectedRole, setSelectedRole] = useState('');
  const [classId, setClassId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: 역할 선택, 2: 교사 학급 입력
  const { currentUser } = useAuth();
  
  const handleRoleSelect = () => {
    if (!selectedRole) return;
    
    if (selectedRole === 'teacher') {
      setStep(2); // 교사인 경우 학급 입력 단계로
    } else {
      handleFinalSubmit(); // 학생인 경우 바로 완료
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updateData = {
        role: selectedRole,
        updatedAt: new Date()
      };

      // 학생인 경우 승인 대기 상태로 설정
      if (selectedRole === 'student') {
        updateData.status = 'pending';
        updateData.approvedBy = null;
        updateData.teacherId = null;
        updateData.classId = 'unassigned';
      } 
      // 교사인 경우 학급 ID와 함께 설정
      else if (selectedRole === 'teacher') {
        if (!classId.trim()) {
          alert('학급 ID를 입력해주세요.');
          setIsSubmitting(false);
          return;
        }
        updateData.status = 'approved';
        updateData.classId = classId.trim();
      }

      // 사용자 정보 업데이트
      await updateDoc(doc(db, "users", currentUser.uid), updateData);

      // 교사인 경우 초대코드 자동 생성 (classId 포함)
      if (selectedRole === 'teacher') {
        await generateInviteCodeWithClass(currentUser.uid, currentUser.email, classId.trim());
      }

      onRoleSet(selectedRole);
    } catch (error) {
      console.error('역할 설정 오류:', error);
      alert('역할 설정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 교사용 초대코드 생성 (classId 포함)
  const generateInviteCodeWithClass = async (teacherUid, teacherEmail, classId) => {
    try {
      for (let i = 0; i < 5; i++) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeRef = doc(db, 'inviteCodes', code);
        
        // 중복 확인
        const existingCodes = await getDocs(
          query(collection(db, 'inviteCodes'), where('__name__', '==', code))
        );
        if (!existingCodes.empty) continue;
        
        // 초대코드 생성 (classId 포함)
        await setDoc(codeRef, {
          teacherId: teacherUid,
          teacherEmail: teacherEmail,
          classId: classId,
          createdAt: serverTimestamp()
        });
        
        console.log(`초대코드 생성 완료: ${code} (학급: ${classId})`);
        break;
      }
    } catch (error) {
      console.error('초대코드 생성 오류:', error);
      // 초대코드 생성 실패해도 계정 설정은 완료
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl max-w-md w-full mx-4 shadow-friendly">
        {step === 1 ? (
          // 1단계: 역할 선택
          <>
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
                  • 학급 설정 필요
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
                  • 초대코드 입력 필요
                </p>
              </button>
            </div>
            
            <button
              onClick={handleRoleSelect}
              disabled={!selectedRole || isSubmitting}
              className="w-full bg-gradient-to-r from-seoul-500 to-seoul-600 text-white font-bold py-4 px-6 rounded-xl hover:from-seoul-600 hover:to-seoul-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seoul-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
            >
              다음 단계
            </button>
          </>
        ) : (
          // 2단계: 교사 학급 입력
          <>
            <div className="text-center mb-6">
              <span className="text-6xl mb-4 block">🏫</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-2 font-korean">학급 정보 입력</h3>
              <p className="text-gray-600 font-korean">
                담당하실 학급 ID를 입력해주세요.<br/>
                <span className="text-sm text-gray-500">예: 4학년5반, 중1-3, 고2-A</span>
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                학급 ID
              </label>
              <input
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="예: 4학년5반"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-korean"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 font-korean">
                💡 이 학급 ID로 초대코드가 생성되어 학생들과 연결됩니다.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="flex-1 bg-gray-500 text-white font-bold py-4 px-6 rounded-xl hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-korean"
              >
                이전
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!classId.trim() || isSubmitting}
                className="flex-1 bg-gradient-to-r from-seoul-500 to-seoul-600 text-white font-bold py-4 px-6 rounded-xl hover:from-seoul-600 hover:to-seoul-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seoul-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    설정 중...
                  </span>
                ) : (
                  '설정 완료'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoleSelectionModal;