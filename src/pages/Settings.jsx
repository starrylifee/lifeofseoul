import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
import { deleteUser, reauthenticateWithPopup } from 'firebase/auth';
import { doc, deleteDoc, updateDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';

const Settings = () => {
  const { currentUser, userId, classId, studentNumber, isTeacher, isStudent, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [editingClassId, setEditingClassId] = useState(false);
  const [newClassId, setNewClassId] = useState(classId || '');
  const navigate = useNavigate();

  const loadMyInviteCodes = async () => {
    if (!isTeacher()) return;
    try {
      const q = query(collection(db, 'inviteCodes'), where('teacherId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ code: d.id, ...d.data() }))
        .sort((a,b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
          return tb - ta;
        });
      // 단일 코드 정책: 첫 번째 코드만 사용
      setInviteCodes(rows.slice(0,1));
    } catch (e) {
      console.error('내 초대코드 로드 오류:', e);
    }
  };

  useEffect(() => { 
    loadMyInviteCodes(); 
    setNewClassId(classId || '');
  }, [currentUser, classId]);

  // 교사 학급 ID 업데이트 함수
  const handleUpdateClassId = async () => {
    if (!isTeacher() || !newClassId.trim()) {
      alert('학급 ID를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        classId: newClassId.trim(),
        updatedAt: serverTimestamp()
      });
      
      // 초대코드에도 classId 업데이트
      if (inviteCodes.length > 0) {
        const codeRef = doc(db, 'inviteCodes', inviteCodes[0].code);
        await updateDoc(codeRef, {
          classId: newClassId.trim(),
          updatedAt: serverTimestamp()
        });
      }
      
      alert('학급 ID가 성공적으로 업데이트되었습니다!');
      setEditingClassId(false);
      window.location.reload(); // 컨텍스트 새로고침을 위해
    } catch (error) {
      console.error('학급 ID 업데이트 오류:', error);
      alert('학급 ID 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSingleCodeIfNone = async () => {
    if (!isTeacher()) return;
    if (inviteCodes.length > 0) return; // 이미 있음
    try {
      for (let retry = 0; retry < 5; retry++) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const ref = doc(db, 'inviteCodes', code);
        const existsSnap = await getDocs(query(collection(db, 'inviteCodes'), where('__name__', '==', code)));
        if (!existsSnap.empty) continue;
        await setDoc(ref, {
          teacherId: currentUser.uid,
          teacherEmail: currentUser.email,
          createdAt: serverTimestamp()
        });
        await loadMyInviteCodes();
        break;
      }
    } catch (e) {
      console.error('초대코드 생성 오류:', e);
      alert('초대코드 생성 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => { handleGenerateSingleCodeIfNone(); }, [inviteCodes.length]);

  const handleLogout = async () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      setLoading(true);
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('로그아웃 실패:', error);
        alert('로그아웃에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const first = window.confirm(
      '⚠️ 회원탈퇴 확인\n\n' +
      '삭제될 데이터:\n' +
      '• 계정 정보 (이메일, 프로필)\n' +
      '• 학습 진도 및 별 데이터\n' +
      '• 생성한 마커와 댓글\n' +
      (isTeacher() ? '• 초대코드 및 학급 관리 권한\n' : '') +
      '\n정말 탈퇴하시겠습니까?'
    );
    if (!first) return;
    
    const second = window.confirm(
      '최종 확인: 이 작업은 되돌릴 수 없습니다.\n' +
      '계정과 모든 관련 데이터가 영구적으로 삭제됩니다.\n\n' +
      '계속하시겠습니까?'
    );
    if (!second) return;

    setLoading(true);
    try {
      // 재인증 필요
      await reauthenticateWithPopup(auth.currentUser, googleProvider);
      const uid = auth.currentUser.uid;
      
      // 삭제할 데이터 목록
      const deletePromises = [
        deleteDoc(doc(db, 'users', uid)).catch(() => {}),
        deleteDoc(doc(db, 'stars', uid)).catch(() => {})
      ];

      // 교사인 경우 추가 데이터 삭제
      if (isTeacher()) {
        // 초대코드 삭제
        const inviteCodesQuery = query(
          collection(db, 'inviteCodes'),
          where('teacherId', '==', uid)
        );
        const inviteCodesSnapshot = await getDocs(inviteCodesQuery);
        inviteCodesSnapshot.docs.forEach(doc => {
          deletePromises.push(deleteDoc(doc.ref).catch(() => {}));
        });

        // 학급 펫 데이터 삭제 (해당 교사의 학급)
        if (classId) {
          deletePromises.push(
            deleteDoc(doc(db, 'classPets', classId)).catch(() => {})
          );
        }
      }

      // 모든 레슨에서 사용자 데이터 삭제 (1~8차시)
      for (let lessonId = 1; lessonId <= 8; lessonId++) {
        if (classId) {
          deletePromises.push(
            deleteDoc(doc(db, 'lessons', String(lessonId), 'classActivities', classId, 'students', uid)).catch(() => {})
          );
        }
      }

      // 모든 삭제 작업 실행
      await Promise.all(deletePromises);
      
      // 삭제된 계정 기록 생성 (재가입 감지용)
      const deletedAccountRef = doc(db, 'deletedAccounts', uid);
      await setDoc(deletedAccountRef, {
        email: currentUser.email,
        deletedAt: serverTimestamp(),
        role: userRole,
        classId: classId || null
      }).catch(() => {}); // 실패해도 계속 진행
      
      // Firebase Auth 계정 삭제
      await deleteUser(auth.currentUser);
      
      alert('✅ 회원탈퇴가 완료되었습니다.\n그동안 Life of Seoul을 이용해 주셔서 감사합니다.');
      navigate('/login');
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert('보안을 위해 재로그인이 필요합니다. 다시 로그인 후 시도해주세요.');
      } else {
        alert('회원탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 교사용 수업내용 리셋 함수
  const handleResetClassData = async () => {
    if (!isTeacher() || !classId) {
      alert('교사 권한이 필요하고 학급 ID가 설정되어야 합니다.');
      return;
    }

    const confirmFirst = window.confirm(
      '⚠️ 경고: 이 작업은 연결된 모든 학생의 데이터를 초기화합니다.\n\n' +
      '삭제될 데이터:\n' +
      '• 모든 레슨의 마커와 댓글\n' +
      '• 학습 진도율과 완료 상태\n' +
      '• 획득한 별과 펫 레벨\n' +
      '• 학급 통계 데이터\n\n' +
      '정말 계속하시겠습니까?'
    );
    
    if (!confirmFirst) return;

    const confirmSecond = window.confirm(
      '최종 확인: 이 작업은 되돌릴 수 없습니다.\n' +
      `학급 "${classId}"의 모든 수업 데이터를 삭제하시겠습니까?`
    );
    
    if (!confirmSecond) return;

    setLoading(true);
    try {
      // 1. 해당 학급의 모든 학생 조회
      const studentsQuery = query(
        collection(db, 'users'),
        where('classId', '==', classId),
        where('role', '==', 'student')
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentIds = studentsSnapshot.docs.map(doc => doc.id);

      console.log(`${studentIds.length}명의 학생 데이터를 초기화합니다.`);

      // 2. 각 학생의 데이터 초기화
      const deletePromises = [];

      // 2-1. 별 데이터 삭제
      studentIds.forEach(studentId => {
        deletePromises.push(
          deleteDoc(doc(db, 'stars', studentId)).catch(() => {})
        );
      });

      // 2-2. 모든 레슨의 학급 활동 데이터 삭제 (1~8차시)
      for (let lessonId = 1; lessonId <= 8; lessonId++) {
        // 학급 전체 데이터 삭제
        deletePromises.push(
          deleteDoc(doc(db, 'lessons', String(lessonId), 'classActivities', classId)).catch(() => {})
        );
        
        // 각 학생별 데이터 삭제
        studentIds.forEach(studentId => {
          deletePromises.push(
            deleteDoc(doc(db, 'lessons', String(lessonId), 'classActivities', classId, 'students', studentId)).catch(() => {})
          );
        });
      }

      // 2-3. 학급 펫 데이터 삭제
      deletePromises.push(
        deleteDoc(doc(db, 'classPets', classId)).catch(() => {})
      );

      // 2-4. 학생들의 진도 데이터 초기화 (users 컬렉션은 유지하되 진도 관련 필드만 초기화)
      studentIds.forEach(studentId => {
        deletePromises.push(
          updateDoc(doc(db, 'users', studentId), {
            lessonProgress: {},
            totalStars: 0,
            lastLessonCompleted: 0,
            updatedAt: serverTimestamp()
          }).catch(() => {})
        );
      });

      // 모든 삭제 작업 실행
      await Promise.all(deletePromises);

      alert(`✅ 수업내용 리셋이 완료되었습니다.\n${studentIds.length}명의 학생 데이터가 초기화되었습니다.`);
      
    } catch (error) {
      console.error('수업내용 리셋 오류:', error);
      alert('수업내용 리셋 중 오류가 발생했습니다. 일부 데이터가 삭제되지 않았을 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRole = async () => {
    if (!currentUser) return;
    if (!window.confirm('역할 재설정을 진행하면 처음 로그인 시 보이는 역할 선택 모달이 다시 표시됩니다. 진행할까요?')) return;

    setLoading(true);
    try {
      await (async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await import('firebase/firestore').then(async ({ setDoc }) => {
          await setDoc(userDocRef, {
            email: currentUser.email,
            role: 'needs_setup',
            status: 'approved',
            updatedAt: new Date(),
            loginMethod: 'google'
          }, { merge: true });
        });
      })();
      alert('역할 재설정이 완료되었습니다. 다시 로그인하여 역할을 선택해주세요.');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('역할 재설정 실패:', error);
      alert('역할 재설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-korean">
            ⚙️ 설정
          </h1>
          <p className="text-lg text-gray-600 font-korean">
            계정 정보와 앱 설정을 확인하세요
          </p>
        </div>

        {/* 교사 전용: 초대코드 관리 */}
        {isTeacher() && (
          <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🔑 초대코드</h2>
            {inviteCodes.length ? (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-1">반 초대코드</div>
                <div className="text-2xl font-mono font-bold">{inviteCodes[0].code}</div>
                <div className="text-xs text-gray-500 mt-2">이 코드는 여러 학생이 함께 사용할 수 있습니다.</div>
              </div>
            ) : (
              <div className="text-gray-500">초대코드 생성 중...</div>
            )}
          </div>
        )}

        {/* 계정 정보 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">👤 계정 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">이메일</label>
                <div className="text-lg font-medium text-gray-800">{currentUser?.email || 'N/A'}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">사용자 ID</label>
                <div className="text-lg font-medium text-gray-800">{userId || 'N/A'}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">역할</label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isTeacher() 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isTeacher() ? '👨‍🏫 교사' : '🎓 학생'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">학급</label>
                {isTeacher() && editingClassId ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newClassId}
                      onChange={(e) => setNewClassId(e.target.value)}
                      placeholder="예: 4학년5반, 중1-3, 고2-A 등"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateClassId}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditingClassId(false);
                          setNewClassId(classId || '');
                        }}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-800">
                      {classId || (isTeacher() ? '미설정' : 'N/A')}
                    </div>
                    {isTeacher() && (
                      <button
                        onClick={() => setEditingClassId(true)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        ✏️ 편집
                      </button>
                    )}
                  </div>
                )}
                {isTeacher() && !classId && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️ 학급 ID를 설정해야 학생 목록을 볼 수 있습니다.
                  </div>
                )}
              </div>
              
              {isStudent() && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">학생 번호</label>
                  <div className="text-lg font-medium text-gray-800">{studentNumber || 'N/A'}번</div>
                </div>
              )}
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">가입일</label>
                <div className="text-lg font-medium text-gray-800">
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('ko-KR')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 앱 정보 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📱 앱 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">앱 이름</label>
                <div className="text-lg font-medium text-gray-800">Life of Seoul</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">버전</label>
                <div className="text-lg font-medium text-gray-800">v1.0.0</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">개발</label>
                <div className="text-lg font-medium text-gray-800">서울특별시 교육청</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">마지막 업데이트</label>
                <div className="text-lg font-medium text-gray-800">2024.12.31</div>
              </div>
            </div>
          </div>
        </div>

        {/* 권한 및 기능 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🔐 권한 및 기능</h2>
          
          <div className="space-y-4">
            {isTeacher() ? (
              <>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">학급 관리</div>
                      <div className="text-sm text-gray-600">학생 계정 생성 및 관리</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⭐</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">별 지급</div>
                      <div className="text-sm text-gray-600">학생들에게 별 지급</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">진행 현황 조회</div>
                      <div className="text-sm text-gray-600">학급 전체 학습 현황 확인</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🗺️</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">마커 관리</div>
                      <div className="text-sm text-gray-600">학생 마커 삭제 및 관리</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📚</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">수업 참여</div>
                      <div className="text-sm text-gray-600">모든 레슨 접근 및 학습</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📍</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">마커 생성</div>
                      <div className="text-sm text-gray-600">지도에 마커 및 댓글 작성</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎮</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">펫 시스템</div>
                      <div className="text-sm text-gray-600">별 수집 및 펫 키우기</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">친구와 공유</div>
                      <div className="text-sm text-gray-600">다른 학급과 활동 공유</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/help')}
            className="bg-gradient-to-r from-hangang-500 to-hangang-600 text-white font-bold py-4 px-6 rounded-xl hover:from-hangang-600 hover:to-hangang-700 transition-all duration-300 transform hover:scale-105 font-korean"
          >
            ❓ 도움말 보기
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 px-6 rounded-xl hover:from-red-600 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                로그아웃 중...
              </span>
            ) : (
              '🚪 로그아웃'
            )}
          </button>
        </div>

        {/* 교사 전용: 수업 관리 */}
        {isTeacher() && (
          <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🎓 수업 관리</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-korean">
                    <strong>주의:</strong> 수업내용 리셋은 연결된 모든 학생의 학습 데이터를 삭제합니다.
                    이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleResetClassData}
              disabled={loading || !classId}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
            >
              {loading ? '처리 중...' : '🔄 수업내용 리셋 (모든 학생 데이터 초기화)'}
            </button>
            
            {!classId && (
              <p className="text-xs text-red-500 mt-2 text-center">
                학급 ID를 설정해야 이 기능을 사용할 수 있습니다.
              </p>
            )}
          </div>
        )}

        {/* 고급 계정 설정 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">⚙️ 고급 설정</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleResetRole}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
            >
              {loading ? '처리 중...' : '🔁 역할 재설정'}
            </button>

            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
            >
              {loading ? '처리 중...' : '🗑️ 회원탈퇴'}
            </button>
          </div>

          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-korean">
                  <strong>회원탈퇴 시 삭제되는 데이터:</strong><br/>
                  • 계정 정보 및 로그인 권한<br/>
                  • 모든 학습 진도 및 별 데이터<br/>
                  • 생성한 마커, 댓글, 좋아요<br/>
                  {isTeacher() && '• 초대코드 및 학급 관리 권한'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
            <p className="text-gray-600 font-korean">
              💡 <strong>문의사항이 있으신가요?</strong><br/>
              관리자에게 연락하시거나 도움말을 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 