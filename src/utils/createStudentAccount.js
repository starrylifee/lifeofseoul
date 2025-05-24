import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const createStudentAccount = async (classInfo, studentNumber) => {
  try {
    // 학생 ID 생성 (예: 4학년5반-1)
    const studentId = `${classInfo}-${studentNumber}`;
    const email = `${studentId}@example.com`;
    const password = `student${studentNumber}`; // 초기 비밀번호

    // Firebase Authentication에 계정 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에 학생 정보 저장
    await setDoc(doc(db, "users", user.uid), {
      userId: studentId,
      role: "student",
      class: classInfo,
      studentNumber: studentNumber,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      userId: studentId,
      password: password,
      uid: user.uid
    };
  } catch (error) {
    console.error("Error creating student account:", error);
    return {
      success: false,
      error: error.message
    };
  }
}; 