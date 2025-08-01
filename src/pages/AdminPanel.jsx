import React, { useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from '../firebase';
import TeacherStarPanel from '../components/TeacherStarPanel';
import ExcelStudentUploader from '../components/ExcelStudentUploader';
import StudentApprovalPanel from '../components/StudentApprovalPanel';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
  const { currentUser, userRole, isTeacher } = useAuth();
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
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  
  const navigate = useNavigate();

  // 관리자 액세스 확인
  useEffect(() => {
    if (!isTeacher()) {
      navigate('/');
    } else {
      fetchData();
    }
  }, []);

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

  // 학생 목록 로드
  const fetchStudents = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("teacherId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      
      const studentsSnapshot = await getDocs(q);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClassStudents(studentsData);
    } catch (error) {
      console.error("학생 목록 로드 오류:", error);
      throw error;
    }
  };

  // 가입 코드 로드
  const fetchInviteCodes = async () => {
    try {
      const q = query(
        collection(db, "inviteCodes"),
        where("teacherId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      
      const codesSnapshot = await getDocs(q);
      const codesData = codesSnapshot.docs.map(doc => ({
        code: doc.id,
        ...doc.data()
      }));
      
      setInviteCodes(codesData);
      setFilteredInviteCodes(codesData);
    } catch (error) {
      console.error("가입 코드 로드 오류:", error);
      throw error;
    }
  };

  // 가입 코드 생성
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
        // 6자리 숫자 코드 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 가입 코드 정보 생성
        const codeData = {
          teacherId: currentUser.uid,
          teacherEmail: currentUser.email,
          createdAt: serverTimestamp(),
          used: false,
          usedBy: null,
          usedAt: null
        };
        
        // Firestore에 저장
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

  // 가입 코드 삭제
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

  // 가입 코드 검색
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredInviteCodes(inviteCodes);
      return;
    }
    
    const filtered = inviteCodes.filter(code => 
      code.code.toLowerCase().includes(term) || 
      (code.usedBy && code.usedBy.toLowerCase().includes(term))
    );
    setFilteredInviteCodes(filtered);
  };

  // 대시보드 탭 내용
  const renderDashboard = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">관리자 대시보드</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl shadow">
          <h4 className="font-bold mb-2">학생 현황</h4>
          <p className="text-2xl">{classStudents.length}명</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow">
          <h4 className="font-bold mb-2">가입 코드</h4>
          <p className="text-2xl">{inviteCodes.filter(code => !code.used).length}개 사용 가능</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow">
          <h4 className="font-bold mb-2">학생 가입</h4>
          <p className="text-2xl">{inviteCodes.filter(code => code.used).length}명 가입 완료</p>
        </div>
      </div>
    </div>
  );

  // 가입 코드 관리 탭 내용
  const renderInviteCodes = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">가입 코드 관리</h3>
      
      {/* 코드 생성 섹션 */}
      <div className="bg-gray-50 p-4 rounded-xl mb-6">
        <h4 className="font-bold mb-2">새 가입 코드 생성</h4>
        <div className="flex items-end space-x-2">
          <div className="flex-grow">
            <label className="block text-sm text-gray-600 mb-1">생성할 코드 개수 (최대 50개)</label>
            <input 
              type="number" 
              min="1" 
              max="50" 
              value={newInviteCodeQuantity} 
              onChange={(e) => setNewInviteCodeQuantity(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isGeneratingCodes}
            />
          </div>
          <button 
            onClick={generateInviteCodes}
            disabled={isGeneratingCodes}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isGeneratingCodes ? "생성 중..." : "코드 생성"}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          * 생성된 코드를 학생들에게 제공하여 가입하도록 안내하세요.
        </p>
      </div>
      
      {/* 성공/오류 메시지 */}
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
      
      {/* 코드 목록 섹션 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h4 className="font-bold">가입 코드 목록</h4>
            <div className="w-1/3">
              <input 
                type="text" 
                placeholder="코드 검색..." 
                value={searchTerm}
                onChange={handleSearch}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코드</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
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
                      {code.used ? code.usedBy : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.createdAt?.toDate().toLocaleDateString() || "-"}
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
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? "검색 결과가 없습니다." : "가입 코드가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 학생 관리 탭 내용
  const renderStudentManagement = () => (
    <div>
      <h3 className="text-xl font-bold mb-4">학생 관리</h3>
      
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classStudents.length > 0 ? (
                classStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.createdAt?.toDate().toLocaleDateString() || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        활성
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.classId || "미지정"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-2">수정</button>
                      <button className="text-red-600 hover:text-red-900">삭제</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    학생이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 메인 렌더링
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">관리자 페이지</h2>
        <p className="text-gray-600">교사용 관리 페이지입니다.</p>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setSelectedTab('dashboard')}
          className={`py-2 px-4 ${selectedTab === 'dashboard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          대시보드
        </button>
        <button 
          onClick={() => setSelectedTab('inviteCodes')}
          className={`py-2 px-4 ${selectedTab === 'inviteCodes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          가입 코드 관리
        </button>
        <button 
          onClick={() => setSelectedTab('students')}
          className={`py-2 px-4 ${selectedTab === 'students' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          학생 관리
        </button>
        <button 
          onClick={() => setSelectedTab('excelUpload')}
          className={`py-2 px-4 ${selectedTab === 'excelUpload' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          엑셀 업로드
        </button>
        <button 
          onClick={() => setSelectedTab('approval')}
          className={`py-2 px-4 ${selectedTab === 'approval' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          학생 승인
        </button>
      </div>
      
      {/* 로딩 상태 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>데이터 로드 중...</p>
        </div>
      ) : (
        <div>
          {selectedTab === 'dashboard' && renderDashboard()}
          {selectedTab === 'inviteCodes' && renderInviteCodes()}
          {selectedTab === 'students' && renderStudentManagement()}
          {selectedTab === 'excelUpload' && <ExcelStudentUploader />}
          {selectedTab === 'approval' && <StudentApprovalPanel />}
        </div>
      )}
    </div>
  );
}

export default AdminPanel; 