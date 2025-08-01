import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Firebase auth and Firestore instances
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null); // 사용자 ID 상태 추가
  const [userRole, setUserRole] = useState(null); // 'teacher', 'student', 'needs_setup'
  const [classId, setClassId] = useState(null);
  const [studentNumber, setStudentNumber] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [firebaseError, setFirebaseError] = useState(false); // Firebase 연결 오류 상태
  const [showRoleSetup, setShowRoleSetup] = useState(false); // 역할 설정 모달 표시
  
  // 캐싱을 위한 상태 추가
  const [cachedStudents, setCachedStudents] = useState(new Map()); // classId -> students
  const [cachedTeacher, setCachedTeacher] = useState(new Map()); // classId -> teacher
  const [lastCacheTime, setLastCacheTime] = useState(new Map()); // classId -> timestamp

  // 사용자 정보 불러오기 (역할, 학급 등)
  const fetchUserData = async (user) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserId(userData.userId || ''); // 사용자 ID 설정
        setUserRole(userData.role);
        setClassId(userData.classId);
        if (userData.role === 'student') {
          setStudentNumber(userData.studentNumber);
        }
        
        // 역할 설정이 필요한 경우 모달 표시
        if (userData.role === 'needs_setup') {
          setShowRoleSetup(true);
        }

      } else {
        console.log("사용자 문서가 존재하지 않습니다.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setFirebaseError(true);
    }
  };

  // 교사가 자신의 학급 학생들을 조회하는 함수
  const fetchClassStudents = async () => {
    if (!isTeacher() || !classId) {
      return [];
    }

    // 캐시 확인 (5분간 유효)
    const cacheKey = classId;
    const now = Date.now();
    const cacheExpiry = 5 * 60 * 1000; // 5분
    
    if (cachedStudents.has(cacheKey) && lastCacheTime.has(cacheKey)) {
      const timeDiff = now - lastCacheTime.get(cacheKey);
      if (timeDiff < cacheExpiry) {
        console.log(`학생 목록 캐시 사용: ${classId}`);
        return cachedStudents.get(cacheKey);
      }
    }

    try {
      console.log(`학생 목록 새로 로드: ${classId}`);
      const studentsQuery = query(
        collection(db, "users"),
        where("classId", "==", classId),
        where("role", "==", "student"),
        orderBy("studentNumber", "asc")
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 캐시에 저장
      setCachedStudents(prev => new Map(prev).set(cacheKey, students));
      setLastCacheTime(prev => new Map(prev).set(cacheKey, now));

      return students;
    } catch (error) {
      console.error("학급 학생 조회 오류:", error);
      return [];
    }
  };

  // 같은 학급의 교사를 조회하는 함수 (학생용)
  const fetchClassTeacher = async () => {
    if (!isStudent() || !classId) {
      return null;
    }

    // 캐시 확인 (10분간 유효 - 교사 정보는 변경이 적음)
    const cacheKey = classId;
    const now = Date.now();
    const cacheExpiry = 10 * 60 * 1000; // 10분
    
    if (cachedTeacher.has(cacheKey) && lastCacheTime.has(cacheKey)) {
      const timeDiff = now - lastCacheTime.get(cacheKey);
      if (timeDiff < cacheExpiry) {
        console.log(`교사 정보 캐시 사용: ${classId}`);
        return cachedTeacher.get(cacheKey);
      }
    }

    try {
      console.log(`교사 정보 새로 로드: ${classId}`);
      const teacherQuery = query(
        collection(db, "users"),
        where("classId", "==", classId),
        where("role", "==", "teacher")
      );
      
      const teacherSnapshot = await getDocs(teacherQuery);
      let teacher = null;
      
      if (!teacherSnapshot.empty) {
        const teacherData = teacherSnapshot.docs[0].data();
        teacher = {
          id: teacherSnapshot.docs[0].id,
          ...teacherData
        };
      }
      
      // 캐시에 저장
      setCachedTeacher(prev => new Map(prev).set(cacheKey, teacher));
      setLastCacheTime(prev => new Map(prev).set(cacheKey, now));
      
      return teacher;
    } catch (error) {
      console.error("학급 교사 조회 오류:", error);
      return null;
    }
  };

  useEffect(() => {
    // Firebase 연결 시도
    try {
      // Subscribe to auth state changes
      const unsubscribe = onAuthStateChanged(auth, async user => {
        setCurrentUser(user);
        if (user) {
          await fetchUserData(user);
        } else {
          // Reset user data if logged out
          setUserId(null);
          setUserRole(null);
          setClassId(null);
          setStudentNumber(null);
        }
        setLoading(false);

      });

      // Unsubscribe on unmount
      return unsubscribe;
    } catch (error) {
      console.error("Firebase 연결 오류:", error);
      setFirebaseError(true);
      setLoading(false);
      
      // Firebase를 사용할 수 없는 경우 데모 모드로 실행

    }
  }, []);

  const logout = () => {
    if (firebaseError) {
      // Firebase를 사용할 수 없는 경우 로컬에서만 로그아웃
      setCurrentUser(null);
      setUserId(null);
      setUserRole(null);
      setClassId(null);
      setStudentNumber(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  // 교사인지 확인하는 헬퍼 함수
  const isTeacher = () => userRole === 'teacher';
  
  // 특정 학생 번호인지 확인하는 헬퍼 함수
  const isStudent = () => userRole === 'student';
  
  // 같은 학급인지 확인하는 함수
  const isSameClass = (targetClassId) => classId === targetClassId;

  // 역할 설정 완료 핸들러
  const handleRoleSet = (role) => {
    setUserRole(role);
    setShowRoleSetup(false);
  };

  const value = {
    currentUser,
    userId,
    userRole,
    classId,
    studentNumber,
    showRoleSetup,
    isTeacher,
    isStudent,
    isSameClass,
    logout,
    fetchUserData,
    fetchClassStudents,
    fetchClassTeacher,
    handleRoleSet,
    firebaseError
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
} 