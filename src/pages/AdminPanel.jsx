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
  where
} from "firebase/firestore";
import { db } from '../firebase';
import TeacherStarPanel from '../components/TeacherStarPanel';

function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [studentPrefix, setStudentPrefix] = useState('');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts'); // 새로운 탭 상태
  
  // 관리자 패스워드 설정 (실제로는 환경변수나 보안 방식으로 처리해야 함)
  const ADMIN_PASSWORD = '12345678'; // 예시용 간단한 비밀번호

  // 계정 목록 불러오기
  const fetchAccounts = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      
      const teachersList = [];
      const studentsList = [];
      
      usersSnapshot.docs.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        if (userData.role === 'teacher') {
          teachersList.push(userData);
        } else if (userData.role === 'student') {
          studentsList.push(userData);
        }
      });
      
      setTeachers(teachersList.sort((a, b) => a.classId?.localeCompare(b.classId) || a.userId?.localeCompare(b.userId)));
      setStudents(studentsList.sort((a, b) => a.classId?.localeCompare(b.classId) || a.studentNumber - b.studentNumber));
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setMessage({ text: '계정 목록을 불러오는데 실패했습니다: ' + error.message, isError: true });
    }
  };

  // 개별 교사 삭제 (연결된 학생들도 함께 삭제)
  const deleteTeacher = async (teacher) => {
    const confirmMessage = `정말로 "${teacher.userId}" 교사를 삭제하시겠습니까?\n\n⚠️ 이 교사와 연결된 "${teacher.classId}" 학급의 모든 학생 계정도 함께 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '교사 및 연결된 학생 계정 삭제 중...', isError: false });

      // 해당 교사의 학급에 속한 모든 학생 찾기
      const usersCollection = collection(db, "users");
      const studentsQuery = query(usersCollection, where("classId", "==", teacher.classId), where("role", "==", "student"));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      let deletedStudents = 0;
      
      // 학생들 삭제
      for (const studentDoc of studentsSnapshot.docs) {
        await deleteDoc(studentDoc.ref);
        deletedStudents++;
      }
      
      // 교사 삭제
      await deleteDoc(doc(db, "users", teacher.id));
      
      setMessage({ 
        text: `교사 "${teacher.userId}"와 연결된 학생 ${deletedStudents}명이 삭제되었습니다.`, 
        isError: false 
      });
      
      // 목록 새로고침
      fetchAccounts();
      
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setMessage({ 
        text: '교사 삭제 중 오류가 발생했습니다: ' + error.message, 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  // 개별 학생 삭제
  const deleteStudent = async (student) => {
    if (!window.confirm(`정말로 "${student.userId}" 학생을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '학생 계정 삭제 중...', isError: false });

      await deleteDoc(doc(db, "users", student.id));
      
      setMessage({ 
        text: `학생 "${student.userId}"가 삭제되었습니다.`, 
        isError: false 
      });
      
      // 목록 새로고침
      fetchAccounts();
      
    } catch (error) {
      console.error("Error deleting student:", error);
      setMessage({ 
        text: '학생 삭제 중 오류가 발생했습니다: ' + error.message, 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  // 기존 테스트 계정 삭제 함수 (학생 계정만)
  const deleteTestAccounts = async () => {
    if (!window.confirm('정말로 모든 학생 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: '학생 계정 삭제 중...', isError: false });

      // Firestore에서 학생 계정들만 찾기 및 삭제
      const usersCollection = collection(db, "users");
      const studentsQuery = query(usersCollection, where("role", "==", "student"));
      const studentsSnapshot = await getDocs(studentsQuery);
      
      let deletedCount = 0;
      const deletePromises = [];

      studentsSnapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
        deletedCount++;
      });

      await Promise.all(deletePromises);
      
      setMessage({ 
        text: `${deletedCount}개의 학생 계정이 삭제되었습니다.`, 
        isError: false 
      });
      
      // 목록 새로고침
      fetchAccounts();
      
    } catch (error) {
      console.error("Error deleting test accounts:", error);
      setMessage({ 
        text: '학생 계정 삭제 중 오류가 발생했습니다: ' + error.message, 
        isError: true 
      });
    } finally {
      setLoading(false);
    }
  };

  // 학급 목록 불러오기
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const classesCollection = collection(db, "classes");
      const classesSnapshot = await getDocs(classesCollection);
      const classesList = classesSnapshot.docs.map(doc => doc.data().name);
      setClasses(classesList.sort());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setMessage({ text: '학급 목록을 불러오는데 실패했습니다: ' + error.message, isError: true });
      setLoading(false);
    }
  };

  // 학급 생성 (학교-학급 형식)
  const createClass = async (e) => {
    e.preventDefault();
    if (!newClass.trim()) {
      setMessage({ text: '학교-학급명을 입력해주세요.', isError: true });
      return;
    }

    // 학교-학급 형식 검증
    if (!newClass.includes(' ')) {
      setMessage({ text: '학교명과 학급명을 공백으로 구분해서 입력해주세요. (예: 신답초 4학년 5반)', isError: true });
      return;
    }

    try {
      setLoading(true);
      await setDoc(doc(db, "classes", newClass), {
        name: newClass,
        createdAt: new Date()
      });
      setMessage({ text: `${newClass} 학급이 생성되었습니다.`, isError: false });
      setNewClass('');
      fetchClasses();
    } catch (error) {
      console.error("Error creating class:", error);
      setMessage({ text: '학급 생성에 실패했습니다: ' + error.message, isError: true });
      setLoading(false);
    }
  };

  // 교사 계정 생성
  const createTeacherAccount = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setMessage({ text: '학급을 선택해주세요.', isError: true });
      return;
    }
    
    if (!teacherId) {
      setMessage({ text: '교사 아이디를 입력해주세요.', isError: true });
      return;
    }
    
    if (!teacherPassword || teacherPassword.length < 6) {
      setMessage({ text: '비밀번호는 최소 6자 이상이어야 합니다.', isError: true });
      return;
    }

    // 교사 ID는 입력한 그대로 사용
    const fullTeacherId = teacherId;
    // Firebase 인증을 위한 이메일 형식으로 변환 (공백 제거)
    const email = `${fullTeacherId.replace(/\s+/g, '')}@example.com`;
    
    try {
      setLoading(true);
      const auth = getAuth();
      
      // Firebase Authentication 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, teacherPassword);
      const userId = userCredential.user.uid;
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, "users", userId), {
        userId: fullTeacherId,
        email,
        role: 'teacher',
        classId: selectedClass,
        createdAt: new Date(),
        createdBy: 'admin'
      });
      
      setMessage({ text: `교사 계정 (${fullTeacherId})이 생성되었습니다.`, isError: false });
      setTeacherId('');
      setTeacherPassword('');
      
      // 목록 새로고침
      fetchAccounts();
      
      setLoading(false);
    } catch (error) {
      console.error("Error creating teacher account:", error);
      setMessage({ text: '교사 계정 생성에 실패했습니다: ' + error.message, isError: true });
      setLoading(false);
    }
  };

  // 학생 계정 생성 (1번부터 30번)
  const createStudentAccounts = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setMessage({ text: '학급을 선택해주세요.', isError: true });
      return;
    }
    
    // 학교 이니셜 + 학년반 형식 (예: sd45 = 신답초 4학년5반)
    if (!studentPrefix || studentPrefix.length < 4) {
      setMessage({ text: '학생 계정 접두어를 4자 이상 입력해주세요. (예: sd45)', isError: true });
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      
      // Firebase 연결 상태 확인
      console.log("=== Firebase 연결 상태 확인 ===");
      console.log("Auth instance:", auth);
      console.log("Firebase app:", auth.app);
      console.log("DB instance:", db);
      
      let createdCount = 0;
      let errors = [];
      
      console.log("학생 계정 생성 시작:", selectedClass, studentPrefix);
      setMessage({ text: '학생 계정 생성 중... 잠시만 기다려주세요.', isError: false });

      // 5개씩 배치로 나누어 생성 (rate limiting 방지)
      const batchSize = 5;
      const totalStudents = 30;
      
      for (let batch = 0; batch < Math.ceil(totalStudents / batchSize); batch++) {
        const startIndex = batch * batchSize + 1;
        const endIndex = Math.min((batch + 1) * batchSize, totalStudents);
        
        console.log(`배치 ${batch + 1} 시작: 학생 ${startIndex}-${endIndex}번`);
        
        // 배치 내에서 순차적으로 생성
        for (let i = startIndex; i <= endIndex; i++) {
          const studentNumber = i;
          // 새로운 형식: 학교이니셜+학년반-번호 (예: sd45-1)
          const fullStudentId = `${studentPrefix}-${studentNumber}`;
          // 이메일 주소에서 공백 제거
          const email = `${fullStudentId.replace(/\s+/g, '')}@example.com`;
          const password = `student${studentNumber}`;
          
          try {
            console.log(`학생 ${studentNumber} 계정 생성 시도:`, { email, password: password.length + '자리' });
            
            // Firebase Authentication 계정 생성
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            
            console.log(`학생 ${studentNumber} Authentication 성공:`, userId);
            
            // Firestore에 사용자 정보 저장
            const userDoc = {
              userId: fullStudentId,
              email,
              role: 'student',
              classId: selectedClass,
              studentNumber,
              createdAt: new Date(),
              createdBy: 'admin'
            };
            
            console.log(`학생 ${studentNumber} Firestore 저장 시도:`, userDoc);
            await setDoc(doc(db, "users", userId), userDoc);
            console.log(`학생 ${studentNumber} Firestore 저장 성공`);
            
            createdCount++;
            
            // 각 계정 생성 후 잠시 대기 (500ms)
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (studentError) {
            console.error(`학생 ${studentNumber} 생성 실패:`, studentError);
            console.error(`에러 코드: ${studentError.code}`);
            console.error(`에러 메시지: ${studentError.message}`);
            errors.push(`${studentNumber}번 (${studentError.code}): ${studentError.message}`);
          }
        }
        
        // 배치 간 더 긴 대기 (2초)
        if (batch < Math.ceil(totalStudents / batchSize) - 1) {
          console.log(`배치 ${batch + 1} 완료. 2초 대기 후 다음 배치 시작...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log("=== 학생 계정 생성 완료 ===");
      console.log("성공:", createdCount);
      console.log("실패:", errors.length);
      if (errors.length > 0) {
        console.log("실패 상세:", errors);
      }
      
      if (errors.length > 0) {
        setMessage({ 
          text: `${selectedClass} 학급의 학생 계정 ${createdCount}개가 생성되었습니다. 실패: ${errors.length}개\n오류: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`, 
          isError: createdCount === 0 
        });
      } else {
        setMessage({ 
          text: `${selectedClass} 학급의 학생 계정 ${createdCount}개가 모두 성공적으로 생성되었습니다.`, 
          isError: false 
        });
      }
      
      setStudentPrefix('');
      
      // 목록 새로고침
      fetchAccounts();
      
      setLoading(false);
    } catch (error) {
      console.error("=== 학생 계정 생성 프로세스 전체 오류 ===");
      console.error("Error object:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      setMessage({ text: '학생 계정 생성에 실패했습니다: ' + error.message, isError: true });
      setLoading(false);
    }
  };

  // 관리자 인증
  const authorizeAdmin = (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthorized(true);
      fetchClasses();
      fetchAccounts();
    } else {
      setMessage({ text: '관리자 비밀번호가 일치하지 않습니다.', isError: true });
    }
  };

  // 컴포넌트 마운트 시 계정 목록 불러오기
  useEffect(() => {
    if (isAdminAuthorized) {
      fetchAccounts();
    }
  }, [isAdminAuthorized]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">관리자 패널</h2>
      
      {!isAdminAuthorized ? (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h3 className="text-lg font-semibold mb-4">관리자 인증</h3>
          <form onSubmit={authorizeAdmin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="adminPassword">
                관리자 비밀번호
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={loading}
              >
                인증하기
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {message.text && (
            <div className={`p-4 mb-4 rounded ${message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          {/* 탭 메뉴 */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-4 py-2 rounded ${activeTab === 'accounts' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                계정 생성
              </button>
              <button
                onClick={() => setActiveTab('management')}
                className={`px-4 py-2 rounded ${activeTab === 'management' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                계정 관리
              </button>
              <button
                onClick={() => setActiveTab('stars')}
                className={`px-4 py-2 rounded ${activeTab === 'stars' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                ⭐ 별 지급 시스템
              </button>
            </div>
          </div>

          {activeTab === 'accounts' && (
            /* 계정 생성 탭 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 학교-학급 생성 */}
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h3 className="text-lg font-semibold mb-4">학교-학급 생성</h3>
                <form onSubmit={createClass}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newClass">
                      학교-학급명
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="newClass"
                      type="text"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      placeholder="예: 신답초 4학년 5반"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      학교명과 학급명을 공백으로 구분해서 입력하세요.
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      disabled={loading}
                    >
                      학급 생성
                    </button>
                  </div>
                </form>
              </div>

              {/* 교사 계정 생성 */}
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h3 className="text-lg font-semibold mb-4">교사 계정 생성</h3>
                <form onSubmit={createTeacherAccount}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectedClass">
                      학급 선택
                    </label>
                    <select
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="selectedClass"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      required
                    >
                      <option value="">학급을 선택하세요</option>
                      {classes.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teacherId">
                      교사 아이디
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="teacherId"
                      type="text"
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      placeholder="교사 아이디 입력"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      선생님 아이디를 직접 입력하세요. 학급 정보는 별도로 저장됩니다.
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="teacherPassword">
                      교사 비밀번호
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="teacherPassword"
                      type="password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      placeholder="최소 6자리 이상"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      비밀번호는 최소 6자리 이상이어야 합니다.
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      disabled={loading}
                    >
                      교사 계정 생성
                    </button>
                  </div>
                </form>
              </div>

              {/* 학생 계정 생성 */}
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">학생 계정 일괄 생성 (1번 ~ 30번)</h3>
                <form onSubmit={createStudentAccounts}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectedClassForStudents">
                        학급 선택
                      </label>
                      <select
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="selectedClassForStudents"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        required
                      >
                        <option value="">학급을 선택하세요</option>
                        {classes.map((className) => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="studentPrefix">
                        학교 이니셜 + 학년반
                      </label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="studentPrefix"
                        type="text"
                        value={studentPrefix}
                        onChange={(e) => setStudentPrefix(e.target.value)}
                        placeholder="예: sd45 (신답초 4학년5반)"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    학생 계정 ID는 [학교이니셜+학년반]-[번호] 형식으로 생성됩니다. (예: sd45-1)<br />
                    비밀번호는 student[번호] 형식으로 생성됩니다. (예: student1)
                  </p>
                  <div className="flex items-center justify-end">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                      disabled={loading}
                    >
                      학생 계정 일괄 생성 (30개)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'management' && (
            /* 계정 관리 탭 */
            <div className="space-y-6">
              {/* 일괄 삭제 */}
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h3 className="text-lg font-semibold mb-4">일괄 삭제</h3>
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h4 className="text-md font-medium text-red-800 mb-2">⚠️ 위험한 작업</h4>
                  <p className="text-sm text-red-600 mb-3">
                    모든 학생 계정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <button
                    onClick={deleteTestAccounts}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    모든 학생 계정 삭제
                  </button>
                </div>
              </div>

              {/* 교사 계정 관리 */}
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h3 className="text-lg font-semibold mb-4">교사 계정 관리</h3>
                {teachers.length === 0 ? (
                  <p className="text-gray-500">등록된 교사가 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">교사 ID</th>
                          <th className="px-4 py-2 text-left">학급</th>
                          <th className="px-4 py-2 text-left">이메일</th>
                          <th className="px-4 py-2 text-left">생성일</th>
                          <th className="px-4 py-2 text-left">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} className="border-b">
                            <td className="px-4 py-2">{teacher.userId}</td>
                            <td className="px-4 py-2">{teacher.classId}</td>
                            <td className="px-4 py-2">{teacher.email}</td>
                            <td className="px-4 py-2">
                              {teacher.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => deleteTeacher(teacher)}
                                disabled={loading}
                                className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                              >
                                삭제 (학생 포함)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 학생 계정 관리 */}
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h3 className="text-lg font-semibold mb-4">학생 계정 관리</h3>
                {students.length === 0 ? (
                  <p className="text-gray-500">등록된 학생이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">학생 ID</th>
                          <th className="px-4 py-2 text-left">학급</th>
                          <th className="px-4 py-2 text-left">번호</th>
                          <th className="px-4 py-2 text-left">이메일</th>
                          <th className="px-4 py-2 text-left">생성일</th>
                          <th className="px-4 py-2 text-left">작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b">
                            <td className="px-4 py-2">{student.userId}</td>
                            <td className="px-4 py-2">{student.classId}</td>
                            <td className="px-4 py-2">{student.studentNumber}</td>
                            <td className="px-4 py-2">{student.email}</td>
                            <td className="px-4 py-2">
                              {student.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => deleteStudent(student)}
                                disabled={loading}
                                className="bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stars' && (
            /* 별 지급 시스템 탭 */
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-6 border-2 border-yellow-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">⭐ 별 지급 시스템</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h4 className="font-bold text-gray-800">퀴즈 완료</h4>
                    <p className="text-sm text-gray-600">만점 시 2개, 일반 완료 시 1개</p>
                    <p className="text-xs text-gray-500 mt-1">재도전 1번 허용</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🌟</div>
                    <h4 className="font-bold text-gray-800">공정한 재도전</h4>
                    <p className="text-sm text-gray-600">실수자만 재도전 가능</p>
                    <p className="text-xs text-gray-500 mt-1">만점자는 재도전 없음</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <h4 className="font-bold text-gray-800">최대 32개</h4>
                    <p className="text-sm text-gray-600">8개 레슨 × 최대 4개</p>
                    <p className="text-xs text-gray-500 mt-1">퀴즈 3개 + 교사 보상</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-3">🐣 펫 레벨 시스템</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl">🐣</div>
                      <div className="font-medium">서울 새내기</div>
                      <div className="text-xs text-gray-600">0-4개</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl">🦁</div>
                      <div className="font-medium">서울 탐험가</div>
                      <div className="text-xs text-gray-600">5-9개</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl">🎓</div>
                      <div className="font-medium">서울 전문가</div>
                      <div className="text-xs text-gray-600">10-19개</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl">👑</div>
                      <div className="font-medium">서울 마스터</div>
                      <div className="text-xs text-gray-600">20-27개</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-2xl">✨</div>
                      <div className="font-medium">서울 전설</div>
                      <div className="text-xs text-gray-600">28-32개</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 교사용 별 지급 패널 */}
              <TeacherStarPanel lessonId="1" />
              
              <div className="bg-white rounded-3xl p-6 shadow-soft">
                <h4 className="text-lg font-bold text-gray-800 mb-4">📋 사용 가이드</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">1.</span>
                    <span>학생이 퀴즈를 완료하면 자동으로 별이 지급됩니다. (만점 시 2개, 일반 완료 시 1개)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">2.</span>
                    <span>첫 시도에서 실수한 학생만 재도전 기회가 주어집니다. 재도전 만점 시 +1개로 총 2개가 됩니다.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">3.</span>
                    <span>교사는 우수한 활동에 대해 추가 별을 수동으로 지급할 수 있습니다.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">4.</span>
                    <span>별 개수에 따라 펫이 진화하고 새로운 기능이 해제됩니다.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">5.</span>
                    <span>학급 순위를 통해 학생들의 동기를 부여할 수 있습니다.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">6.</span>
                    <span>각 레슨에서는 최대 2번의 기회로 별을 받을 수 있습니다.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel; 