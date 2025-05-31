import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

// 학생 활동 데이터 가져오기
export const getStudentActivity = async (lessonId, userId) => {
  try {
    const activityRef = doc(db, 'lessons', lessonId, 'activities', userId);
    const activityDoc = await getDoc(activityRef);
    
    if (activityDoc.exists()) {
      return { id: activityDoc.id, ...activityDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting student activity:', error);
    throw error;
  }
};

// 학생 활동 데이터 저장하기
export const saveStudentActivity = async (lessonId, userId, activityData) => {
  try {
    const activityRef = doc(db, 'lessons', lessonId, 'activities', userId);
    
    // 활동 기록이 이미 있는지 확인
    const activityDoc = await getDoc(activityRef);
    
    if (activityDoc.exists()) {
      // 기존 기록 업데이트
      await updateDoc(activityRef, activityData);
    } else {
      // 새로운 기록 생성
      await setDoc(activityRef, {
        ...activityData,
        createdAt: new Date(),
        userId,
        lessonId,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving student activity:', error);
    throw error;
  }
};

// 레슨 단계 완료 상태 업데이트
export const updateLessonProgress = async (lessonId, userId, stepIndex, isCompleted) => {
  try {
    const activityRef = doc(db, 'lessons', lessonId, 'activities', userId);
    const activityDoc = await getDoc(activityRef);
    
    let progressData = {};
    
    if (activityDoc.exists()) {
      progressData = activityDoc.data().progress || {};
    }
    
    // 해당 단계 완료 상태 업데이트
    progressData[`step${stepIndex}`] = isCompleted;
    
    if (activityDoc.exists()) {
      await updateDoc(activityRef, { 
        progress: progressData,
        updatedAt: new Date()
      });
    } else {
      await setDoc(activityRef, {
        userId,
        lessonId,
        createdAt: new Date(),
        updatedAt: new Date(),
        progress: progressData
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

// 학급 학생 목록 가져오기
export const getClassStudents = async (classId) => {
  try {
    console.log('getClassStudents 호출됨, classId:', classId);
    
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('classId', '==', classId)
    );
    
    console.log('Firestore 쿼리 실행 중...');
    const studentDocs = await getDocs(studentsQuery);
    console.log('쿼리 결과 문서 수:', studentDocs.docs.length);
    
    const students = studentDocs.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      return data;
    });
    
    // 클라이언트에서 studentNumber로 정렬
    students.sort((a, b) => {
      const numA = a.studentNumber || 0;
      const numB = b.studentNumber || 0;
      return numA - numB;
    });
    
    console.log('최종 학생 목록 (정렬됨):', students.length, '명');
    return students;
  } catch (error) {
    console.error('Error getting class students:', error);
    console.error('에러 코드:', error.code);
    console.error('에러 메시지:', error.message);
    throw error;
  }
};

// 학급 전체 활동 데이터 가져오기
export const getClassLessonActivities = async (classId, lessonId) => {
  try {
    // 1. 해당 학급 학생 목록 가져오기
    const students = await getClassStudents(classId);
    
    // 2. 각 학생의 레슨 활동 데이터 가져오기
    const activitiesPromises = students.map(async (student) => {
      const activity = await getStudentActivity(lessonId, student.id);
      return {
        studentId: student.id,
        studentNumber: student.studentNumber,
        activity: activity || null
      };
    });
    
    return Promise.all(activitiesPromises);
  } catch (error) {
    console.error('Error getting class lesson activities:', error);
    throw error;
  }
}; 