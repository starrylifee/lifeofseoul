import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Firebase auth and Firestore instances
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null); // 사용자 ID 상태 추가
  const [userRole, setUserRole] = useState(null); // 'teacher' or 'student'
  const [classId, setClassId] = useState(null);
  const [studentNumber, setStudentNumber] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

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
        console.log("User data loaded:", userData);
      } else {
        console.log("No user data found in Firestore");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
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
      console.log("Auth State Changed, Current User:", user?.email);
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  // 교사인지 확인하는 헬퍼 함수
  const isTeacher = () => userRole === 'teacher';
  
  // 특정 학생 번호인지 확인하는 헬퍼 함수
  const isStudent = () => userRole === 'student';
  
  // 같은 학급인지 확인하는 함수
  const isSameClass = (targetClassId) => classId === targetClassId;

  const value = {
    currentUser,
    userId,
    userRole,
    classId,
    studentNumber,
    isTeacher,
    isStudent,
    isSameClass,
    logout,
    fetchUserData
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
} 