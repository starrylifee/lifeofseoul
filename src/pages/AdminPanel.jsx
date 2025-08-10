import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from '../firebase';
import ExcelStudentUploader from '../components/ExcelStudentUploader';
import StudentApprovalPanel from '../components/StudentApprovalPanel';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const { currentUser, isTeacher } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [newInviteCodeQuantity, setNewInviteCodeQuantity] = useState(1);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInviteCodes, setFilteredInviteCodes] = useState([]);

  // 관리자 이메일 화이트리스트 (환경변수 + 기본값)
  const DEFAULT_ADMIN_EMAILS = ['forinnocen@gmail.com'];
  const ENV_ADMINS = (process.env.REACT_APP_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
  const ADMIN_EMAILS = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...ENV_ADMINS]));

  const navigate = useNavigate();

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      // 학생 목록 로드
      await fetchStudents();
      // 가입 코드 로드
      await fetchInviteCodes();
      setLoading(false);
    } catch (error) {
      setError("데이터 로드 중 오류가 발생했습니다: " + error.message);
      setLoading(false);
    }
  };

  // 관리자 액세스 확인: 화이트리스트 관리자만 허용 (교사 차단)
  useEffect(() => {
    const isWhitelistedAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);
    if (!isWhitelistedAdmin) {
      navigate('/');
    } else {
      fetchData();
    }
  }, [navigate, currentUser]);

  // 학생 목록 로드 (관리자: 전체 학생 조회)
  const fetchStudents = async () => {
    try {
      let studentsSnapshot;
      try {
        const q1 = query(
          collection(db, "users"),
          where("role", "==", "student"),
          orderBy("createdAt", "desc")
        );
        studentsSnapshot = await getDocs(q1);
      } catch (e) {
        if (e.code === 'failed-precondition') {
          const q2 = query(
            collection(db, "users"),
            where("role", "==", "student")
          );
          studentsSnapshot = await getDocs(q2);
        } else { throw e; }
      }
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      studentsData.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
        return tb - ta;
      });
      setClassStudents(studentsData);
    } catch (error) {
      console.error("학생 목록 로드 오류:", error);
      throw error;
    }
  };

  // 가입 코드 로드 (관리자: 전체 조회)
  const fetchInviteCodes = async () => {
    try {
      let codesSnapshot;
      try {
        const q1 = query(
          collection(db, "inviteCodes"),
          orderBy("createdAt", "desc")
        );
        codesSnapshot = await getDocs(q1);
      } catch (e) {
        if (e.code === 'failed-precondition') {
          codesSnapshot = await getDocs(collection(db, "inviteCodes"));
        } else { throw e; }
      }
      const codesData = codesSnapshot.docs.map(doc => ({
        code: doc.id,
        ...doc.data()
      }));
      codesData.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.createdAt || 0)).getTime();
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.createdAt || 0)).getTime();
        return tb - ta;
      });
      setInviteCodes(codesData);
      setFilteredInviteCodes(codesData);
    } catch (error) {
      console.error("가입 코드 로드 오류:", error);
      throw error;
    }
  };

  // 가입 코드 생성 (관리자는 필요 없음이지만, 컴포넌트 재사용을 위해 남김 — UI에서 숨김)
  const generateInviteCodes = async () => {
    setIsGeneratingCodes(true);
    setError(null);
    setSuccess(null);
    
    try {
      const quantity = parseInt(newInviteCodeQuantity);
      if (isNaN(quantity) || quantity < 1 || quantity > 50) {
        throw new Error("1에서 50 사이의 숫자를 입력해주세요.");
      }
      
      const generatedCodes = [];
      
      for (let i = 0; i < quantity; i++) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeData = {
          teacherId: currentUser.uid,
          teacherEmail: currentUser.email,
          createdAt: serverTimestamp(),
          used: false,
          usedBy: null,
          usedAt: null
        };
        await setDoc(doc(db, "inviteCodes", code), codeData);
        generatedCodes.push(code);
      }
      
      setSuccess(`${quantity}개의 가입 코드가 생성되었습니다.`);
      await fetchInviteCodes();
      setNewInviteCodeQuantity(1);
    } catch (error) {
      console.error("가입 코드 생성 오류:", error);
      setError("가입 코드 생성 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const deleteInviteCode = async (code) => {
    if (!window.confirm(`가입 코드 ${code}를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, "inviteCodes", code));
      setSuccess(`가입 코드 ${code}가 삭제되었습니다.`);
      await fetchInviteCodes();
    } catch (error) {
      console.error("가입 코드 삭제 오류:", error);
      setError("가입 코드 삭제 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredInviteCodes(inviteCodes);
    } else {
      const lower = term.toLowerCase();
      setFilteredInviteCodes(inviteCodes.filter(c => c.code.includes(lower) || (c.teacherEmail || '').toLowerCase().includes(lower)));
    }
  };

  const renderTabs = () => (
    <div className="mb-6">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button className={`px-4 py-2 border ${selectedTab === 'dashboard' ? 'bg-gray-200' : 'bg-white'}`} onClick={() => setSelectedTab('dashboard')}>대시보드</button>
        <button className={`px-4 py-2 border ${selectedTab === 'students' ? 'bg-gray-200' : 'bg-white'}`} onClick={() => setSelectedTab('students')}>학생 관리</button>
        <button className={`px-4 py-2 border ${selectedTab === 'invite' ? 'bg-gray-200' : 'bg-white'}`} onClick={() => setSelectedTab('invite')}>가입 코드</button>
      </div>
    </div>
  );

  const renderInviteCodes = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">가입 코드 관리</h3>
      
      {/* 관리자 화면: 생성 UI 숨김 */}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="코드 또는 교사 이메일 검색"
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">교사 이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInviteCodes.length > 0 ? (
                filteredInviteCodes.map((code) => (
                  <tr key={code.code}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold">{code.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.used ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          사용됨
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          사용 가능
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.teacherEmail || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.createdAt?.toDate?.().toLocaleDateString?.() || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!code.used && (
                        <button 
                          onClick={() => deleteInviteCode(code.code)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4" colSpan={5}>데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 bg-white rounded-xl shadow">
      <h3 className="text-xl font-bold mb-4">대시보드</h3>
      <p className="text-gray-600">학급/학생, 가입 코드 등을 관리하세요.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {renderTabs()}

      {loading ? (
        <div>로딩 중...</div>) : (
        <>
          {selectedTab === 'dashboard' && renderDashboard()}
          {selectedTab === 'students' && (
            <div className="p-6 bg-white rounded-xl shadow">
              <StudentApprovalPanel />
            </div>
          )}
          {selectedTab === 'invite' && renderInviteCodes()}
        </>
      )}
    </div>
  );
}

export default AdminPanel; 