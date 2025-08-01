import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function StudentApprovalPanel() {
  const { currentUser } = useAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());

  // 대기 중인 학생 목록 로드
  const fetchPendingStudents = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("status", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPendingStudents(students);
    } catch (error) {
      console.error('대기 학생 로드 오류:', error);
    }
  };

  // 승인된 학생 목록 로드
  const fetchApprovedStudents = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("teacherId", "==", currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setApprovedStudents(students);
    } catch (error) {
      console.error('승인 학생 로드 오류:', error);
    }
  };

  // 학생 승인
  const approveStudent = async (studentId, studentEmail) => {
    setProcessingIds(prev => new Set(prev).add(studentId));
    
    try {
      await updateDoc(doc(db, "users", studentId), {
        status: 'approved',
        teacherId: currentUser.uid,
        approvedAt: new Date(),
        approvedBy: currentUser.email
      });
      
      // 목록 새로고침
      await Promise.all([fetchPendingStudents(), fetchApprovedStudents()]);
      
      alert(`${studentEmail} 학생이 승인되었습니다!`);
    } catch (error) {
      console.error('승인 오류:', error);
      alert('승인 중 오류가 발생했습니다.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  // 학생 거부
  const rejectStudent = async (studentId, studentEmail) => {
    if (!window.confirm(`${studentEmail} 학생의 가입을 거부하시겠습니까?`)) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(studentId));
    
    try {
      await updateDoc(doc(db, "users", studentId), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: currentUser.email
      });
      
      // 목록 새로고침
      await fetchPendingStudents();
      
      alert(`${studentEmail} 학생의 가입이 거부되었습니다.`);
    } catch (error) {
      console.error('거부 오류:', error);
      alert('거부 중 오류가 발생했습니다.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingStudents(), fetchApprovedStudents()]);
      setLoading(false);
    };
    
    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow">
        <div className="animate-pulse">
          <h3 className="text-xl font-bold mb-4 font-korean">학생 승인 관리</h3>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h3 className="text-xl font-bold mb-6 font-korean">학생 승인 관리</h3>
      
      {/* 대기 중인 학생들 */}
      <div className="mb-8">
        <h4 className="text-lg font-bold mb-4 font-korean text-orange-700">
          🟡 승인 대기 중 ({pendingStudents.length}명)
        </h4>
        
        {pendingStudents.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <span className="text-4xl mb-2 block">✨</span>
            <p className="text-gray-500 font-korean">승인 대기 중인 학생이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStudents.map((student) => (
              <div key={student.id} className="border-2 border-orange-200 bg-orange-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧑‍🎓</span>
                    <div>
                      <p className="font-bold text-gray-800 font-korean">
                        {student.displayName}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {student.email}
                      </p>
                      <p className="text-xs text-gray-500 font-korean">
                        가입일: {student.createdAt?.toDate?.()?.toLocaleDateString?.() || '알 수 없음'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveStudent(student.id, student.email)}
                      disabled={processingIds.has(student.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-korean"
                    >
                      {processingIds.has(student.id) ? '처리 중...' : '✅ 승인'}
                    </button>
                    <button
                      onClick={() => rejectStudent(student.id, student.email)}
                      disabled={processingIds.has(student.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors font-korean"
                    >
                      {processingIds.has(student.id) ? '처리 중...' : '❌ 거부'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 승인된 학생들 */}
      <div>
        <h4 className="text-lg font-bold mb-4 font-korean text-green-700">
          🟢 승인된 학생 ({approvedStudents.length}명)
        </h4>
        
        {approvedStudents.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <span className="text-4xl mb-2 block">👥</span>
            <p className="text-gray-500 font-korean">승인된 학생이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {approvedStudents.map((student) => (
              <div key={student.id} className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                <div className="text-center">
                  <span className="text-2xl mb-2 block">🧑‍🎓</span>
                  <p className="font-bold text-gray-800 font-korean mb-1">
                    {student.displayName}
                  </p>
                  <p className="text-xs text-gray-600 font-mono mb-2">
                    {student.email}
                  </p>
                  <p className="text-xs text-green-600 font-korean">
                    승인일: {student.approvedAt?.toDate?.()?.toLocaleDateString?.() || '알 수 없음'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 새로고침 버튼 */}
      <div className="mt-6 text-center">
        <button
          onClick={() => Promise.all([fetchPendingStudents(), fetchApprovedStudents()])}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-korean"
        >
          🔄 새로고침
        </button>
      </div>
    </div>
  );
}

export default StudentApprovalPanel;