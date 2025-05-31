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

// 특정 레슨에서 별 지급 횟수 확인
export const getStarAttemptsForLesson = async (userId, lessonId) => {
  try {
    const starHistoryQuery = query(
      collection(db, 'starHistory'),
      where('userId', '==', userId),
      where('lessonId', '==', lessonId),
      where('source', 'in', ['quiz', 'perfect_quiz', 'perfect_quiz_retry'])
    );
    const snapshot = await getDocs(starHistoryQuery);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error checking lesson star attempts:', error);
    return 0;
  }
};

// 특정 레슨에서 이미 별을 받았는지 확인 (기존 함수는 호환성을 위해 유지)
export const hasReceivedStarsForLesson = async (userId, lessonId) => {
  const attempts = await getStarAttemptsForLesson(userId, lessonId);
  return attempts > 0;
};

// 별 지급하기 (퀴즈 완료 시 자동) - 공정한 재도전 시스템
export const awardStarsForQuiz = async (userId, lessonId, isPerfectScore = false) => {
  try {
    // 이미 이 레슨에서 별을 받은 횟수 확인
    const attempts = await getStarAttemptsForLesson(userId, lessonId);
    
    if (attempts >= 2) {
      console.log('이미 이 레슨에서 2번의 기회를 모두 사용했습니다.');
      return 0; // 2번 초과 시 지급 안함
    }

    // 첫 번째 시도
    if (attempts === 0) {
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
        attempt: 1,
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
    }
    
    // 두 번째 시도 (재도전) - 첫 번째 시도에서 만점이 아니었던 경우에만 허용
    if (attempts === 1) {
      // 첫 번째 시도에서 만점이었는지 확인
      const starHistoryQuery = query(
        collection(db, 'starHistory'),
        where('userId', '==', userId),
        where('lessonId', '==', lessonId),
        where('source', '==', 'perfect_quiz')
      );
      const snapshot = await getDocs(starHistoryQuery);
      const wasFirstAttemptPerfect = snapshot.docs.length > 0;
      
      if (wasFirstAttemptPerfect) {
        console.log('첫 번째 시도에서 이미 만점을 받았으므로 재도전 기회가 없습니다.');
        return 0;
      }
      
      // 첫 번째 시도에서 만점이 아니었던 경우에만 재도전 허용
      if (isPerfectScore) {
        const starAmount = 1; // 재도전 만점 시 1개 추가 (총 2개가 됨)
        const sourceType = 'perfect_quiz_retry';
        const description = '퀴즈 재도전 만점 완료';
        
        const starRecord = {
          userId,
          lessonId,
          source: sourceType,
          amount: starAmount,
          description,
          teacherId: null,
          timestamp: new Date(),
          attempt: 2,
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
      } else {
        console.log('재도전에서 만점을 받지 못했습니다.');
        return 0;
      }
    }
    
    return 0;
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