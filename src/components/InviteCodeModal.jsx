import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function InviteCodeModal() {
  const { currentUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const codeRef = doc(db, 'inviteCodes', code.trim());
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists()) {
        alert('유효하지 않은 초대코드입니다.');
        setLoading(false);
        return;
      }
      const data = codeSnap.data();
      // 다회 사용 가능 코드: used 체크/업데이트 없음
      // 사용자 문서 업데이트: teacherId, classId, status
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        teacherId: data.teacherId || null,
        classId: data.classId || null,
        status: 'approved',
        approvedBy: data.teacherId || null,
        updatedAt: new Date()
      });
      window.location.reload();
    } catch (e) {
      console.error('초대코드 처리 오류:', e);
      alert('초대코드 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
        <h3 className="text-xl font-bold mb-3">초대코드 입력</h3>
        <p className="text-sm text-gray-600 mb-4">교사로부터 받은 초대코드를 입력해야 사용을 시작할 수 있습니다.</p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6자리 숫자 코드"
          className="w-full border rounded-lg px-3 py-2 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => {}} disabled>
            취소
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:bg-gray-400"
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
          >
            {loading ? '확인 중...' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteCodeModal;