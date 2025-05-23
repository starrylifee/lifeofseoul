import React, { useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { db } from '../firebase';

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
  
  // 관리자 패스워드 설정 (실제로는 환경변수나 보안 방식으로 처리해야 함)
  const ADMIN_PASSWORD = '12345678'; // 예시용 간단한 비밀번호

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

  // 학급 생성
  const createClass = async (e) => {
    e.preventDefault();
    if (!newClass.trim()) {
      setMessage({ text: '학급명을 입력해주세요.', isError: true });
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
    // Firebase 인증을 위한 이메일 형식으로 변환
    const email = `${fullTeacherId}@example.com`;
    
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
        createdAt: new Date()
      });
      
      setMessage({ text: `교사 계정 (${fullTeacherId})이 생성되었습니다.`, isError: false });
      setTeacherId('');
      setTeacherPassword('');
      
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
    
    if (!studentPrefix || studentPrefix.length < 3) {
      setMessage({ text: '학생 계정 접두어를 3자 이상 입력해주세요.', isError: true });
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      let createdCount = 0;
      
      for (let i = 1; i <= 30; i++) {
        const studentNumber = i;
        const fullStudentId = `${selectedClass}-${studentNumber}`;
        const email = `${fullStudentId}@example.com`;
        const password = `${studentPrefix}${studentNumber}`; // 예: student1, student2, ...
        
        try {
          // Firebase Authentication 계정 생성
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const userId = userCredential.user.uid;
          
          // Firestore에 사용자 정보 저장
          await setDoc(doc(db, "users", userId), {
            userId: fullStudentId,
            email,
            role: 'student',
            classId: selectedClass,
            studentNumber,
            createdAt: new Date()
          });
          
          createdCount++;
        } catch (studentError) {
          console.error(`Error creating student ${studentNumber}:`, studentError);
          // 개별 학생 생성 실패 시 계속 진행 (다른 학생 시도)
        }
      }
      
      setMessage({ 
        text: `${selectedClass} 학급의 학생 계정 ${createdCount}개가 생성되었습니다.`, 
        isError: false 
      });
      setStudentPrefix('');
      setLoading(false);
    } catch (error) {
      console.error("Error in student accounts creation process:", error);
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
    } else {
      setMessage({ text: '관리자 비밀번호가 일치하지 않습니다.', isError: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 학급 생성 */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <h3 className="text-lg font-semibold mb-4">학급 생성</h3>
              <form onSubmit={createClass}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newClass">
                    학급명
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="newClass"
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="예: 4학년1반"
                    required
                  />
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
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <h3 className="text-lg font-semibold mb-4">학생 계정 일괄 생성 (1-30번)</h3>
              <form onSubmit={createStudentAccounts}>
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
                    학생 비밀번호 접두어
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="studentPrefix"
                    type="text"
                    value={studentPrefix}
                    onChange={(e) => setStudentPrefix(e.target.value)}
                    placeholder="예: student (student1, student2 형태로 생성됨)"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    학생 계정 ID는 [학급명]-[번호] 형식으로 자동 생성됩니다.<br />
                    비밀번호는 [접두어][번호] 형식으로 생성됩니다.
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                    disabled={loading}
                  >
                    학생 계정 일괄 생성
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPanel; 