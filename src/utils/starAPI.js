import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { STAR_SOURCES, createStarRecord } from './starSystem';

// 학생의 총 별 개수 가져오기
export const getStudentStars = async (userId) => {
  try {
    const starDoc = await getDoc(doc(db, 'stars', userId));
    if (starDoc.exists()) {
      return starDoc.data().totalStars || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting student stars:', error);
    return 0;
  }
};

// 학생의 별 기록 가져오기
export const getStudentStarHistory = async (userId) => {
  try {
    const starHistoryQuery = query(
      collection(db, 'starHistory'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(starHistoryQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting star history:', error);
    return [];
  }
};

// 특정 레슨에서 이미 별을 받았는지 확인
export const hasReceivedStarsForLesson = async (userId, lessonId) => {
  try {
    const starHistoryQuery = query(
      collection(db, 'starHistory'),
      where('userId', '==', userId),
      where('lessonId', '==', lessonId),
      where('source', 'in', ['quiz', 'perfect_quiz'])
    );
    const snapshot = await getDocs(starHistoryQuery);
    return snapshot.docs.length > 0;
  } catch (error) {
    console.error('Error checking lesson star history:', error);
    return false;
  }
};

// 별 지급하기 (퀴즈 완료 시 자동) - 만점 시 2개, 일반 완료 시 1개
export const awardStarsForQuiz = async (userId, lessonId, isPerfectScore = false) => {
  try {
    // 이미 이 레슨에서 별을 받았는지 확인
    const alreadyReceived = await hasReceivedStarsForLesson(userId, lessonId);
    if (alreadyReceived) {
      console.log('이미 이 레슨에서 별을 받았습니다.');
      return 0; // 중복 지급 방지
    }

    // 만점 시 2개, 일반 완료 시 1개
    const starAmount = isPerfectScore ? 2 : 1;
    const sourceType = isPerfectScore ? 'perfect_quiz' : 'quiz';
    const description = isPerfectScore ? '퀴즈 만점 완료' : '퀴즈 완료';
    
    const starRecord = {
      userId,
      lessonId,
      source: sourceType,
      amount: starAmount,
      description,
      teacherId: null,
      timestamp: new Date(),
      id: `star_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // 별 기록 추가
    await addDoc(collection(db, 'starHistory'), starRecord);
    
    // 총 별 개수 업데이트
    const currentStars = await getStudentStars(userId);
    await setDoc(doc(db, 'stars', userId), {
      userId,
      totalStars: currentStars + starAmount,
      lastUpdated: new Date()
    }, { merge: true });
    
    return starAmount;
  } catch (error) {
    console.error('Error awarding quiz stars:', error);
    throw error;
  }
};

// 교사가 학생에게 별 지급하기
export const awardStarsByTeacher = async (teacherId, studentId, lessonId, source, reason = '') => {
  try {
    const starRecord = createStarRecord(
      studentId, 
      lessonId, 
      source, 
      source.amount,
      teacherId
    );
    
    // 사유 추가
    if (reason) {
      starRecord.reason = reason;
    }
    
    // 별 기록 추가
    await addDoc(collection(db, 'starHistory'), starRecord);
    
    // 총 별 개수 업데이트
    const currentStars = await getStudentStars(studentId);
    await setDoc(doc(db, 'stars', studentId), {
      userId: studentId,
      totalStars: currentStars + starRecord.amount,
      lastUpdated: new Date()
    }, { merge: true });
    
    return starRecord;
  } catch (error) {
    console.error('Error awarding stars by teacher:', error);
    throw error;
  }
};

// 학급 전체 별 순위 가져오기
export const getClassStarRanking = async (classId) => {
  try {
    // 학급 학생 목록 가져오기
    const studentsQuery = query(
      collection(db, 'users'),
      where('classId', '==', classId),
      where('role', '==', 'student')
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    // 각 학생의 별 개수 가져오기
    const rankings = await Promise.all(
      studentsSnapshot.docs.map(async (studentDoc) => {
        const studentData = studentDoc.data();
        const stars = await getStudentStars(studentDoc.id);
        return {
          userId: studentDoc.id,
          email: studentData.email,
          studentNumber: studentData.studentNumber,
          stars
        };
      })
    );
    
    // 별 개수로 정렬
    return rankings.sort((a, b) => b.stars - a.stars);
  } catch (error) {
    console.error('Error getting class star ranking:', error);
    return [];
  }
};

// 레슨별 별 획득 현황 가져오기
export const getLessonStarProgress = async (userId) => {
  try {
    const starHistoryQuery = query(
      collection(db, 'starHistory'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(starHistoryQuery);
    
    const lessonStars = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!lessonStars[data.lessonId]) {
        lessonStars[data.lessonId] = [];
      }
      lessonStars[data.lessonId].push(data);
    });
    
    return lessonStars;
  } catch (error) {
    console.error('Error getting lesson star progress:', error);
    return {};
  }
}; 