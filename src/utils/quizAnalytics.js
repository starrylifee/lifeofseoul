import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// 특정 학급의 모든 퀴즈 데이터 가져오기
export const getClassQuizData = async (classId, fetchClassStudents) => {
  try {
    // 해당 학급의 모든 학생 찾기 (AuthContext의 fetchClassStudents 사용)
    let students = [];
    if (fetchClassStudents && typeof fetchClassStudents === 'function') {
      // AuthContext의 fetchClassStudents 함수 사용
      students = await fetchClassStudents();
      console.log('AuthContext에서 가져온 학생 목록:', students.length, '명');
    } else {
      // 기존 방식으로 Firestore에서 직접 쿼리
      const studentsQuery = query(
        collection(db, 'users'),
        where('classId', '==', classId),
        where('role', '==', 'student')
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Firestore에서 직접 가져온 학생 목록:', students.length, '명');
    }

    // 모든 레슨의 퀴즈 데이터 수집
    const allQuizData = {};
    
    // 레슨 1-8까지 확인 (총 8차시)
    for (let lessonId = 1; lessonId <= 8; lessonId++) {
      const lessonData = {
        students: [],
        questions: []
      };

      // 각 학생의 해당 레슨 퀴즈 결과 가져오기
      for (const student of students) {
        try {
          const activityRef = doc(db, 'lessons', lessonId.toString(), 'activities', student.id);
          const activityDoc = await getDoc(activityRef);
          
          if (activityDoc.exists()) {
            const data = activityDoc.data();
            lessonData.students.push({
              studentId: student.id,
              studentName: student.name || student.email,
              answers: data.answers || {},
              questionsCompleted: data.questionsCompleted || 0,
              totalQuestions: data.totalQuestions || 0,
              completedAt: data.completedAt
            });
          }
        } catch (error) {
          console.error(`Error fetching lesson ${lessonId} data for student ${student.id}:`, error);
        }
      }

      // 레슨 설정에서 문제 정보 가져오기 (클라이언트 사이드에서 처리)
      allQuizData[lessonId] = lessonData;
    }

    return {
      students,
      quizData: allQuizData
    };
  } catch (error) {
    console.error('Error fetching class quiz data:', error);
    throw error;
  }
};

// 문항별 정답률 계산
export const calculateQuestionStats = (quizData, lessonConfig) => {
  if (!lessonConfig?.questions || !quizData?.students) {
    return [];
  }

  return lessonConfig.questions.map(question => {
    const totalAttempts = quizData.students.length;
    const correctAnswers = quizData.students.filter(student => 
      student.answers[question.id] === question.answer
    ).length;
    
    const correctRate = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    
    return {
      questionId: question.id,
      question: question.question,
      correctAnswer: question.answer,
      options: question.options,
      totalAttempts,
      correctAnswers,
      correctRate: Math.round(correctRate * 10) / 10,
      isWeakPoint: correctRate < 60 // 60% 미만을 취약점으로 분류
    };
  });
};

// 학생별 성과 분석
export const calculateStudentPerformance = (student, allQuizData, allLessonConfigs) => {
  const performance = {
    studentId: student.studentId,
    studentName: student.studentName,
    totalLessons: 0,
    completedLessons: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    weakQuestions: [],
    strongQuestions: []
  };

  Object.keys(allQuizData).forEach(lessonId => {
    const lessonData = allQuizData[lessonId];
    const studentData = lessonData.students.find(s => s.studentId === student.studentId);
    const lessonConfig = allLessonConfigs[lessonId];
    
    if (studentData && lessonConfig?.questions) {
      performance.totalLessons++;
      if (studentData.answers && Object.keys(studentData.answers).length > 0) {
        performance.completedLessons++;
        
        lessonConfig.questions.forEach(question => {
          performance.totalQuestions++;
          const studentAnswer = studentData.answers[question.id];
          const isCorrect = studentAnswer === question.answer;
          
          if (isCorrect) {
            performance.correctAnswers++;
            performance.strongQuestions.push({
              lessonId,
              questionId: question.id,
              question: question.question
            });
          } else {
            performance.weakQuestions.push({
              lessonId,
              questionId: question.id,
              question: question.question,
              studentAnswer,
              correctAnswer: question.answer
            });
          }
        });
      }
    }
  });

  performance.averageScore = performance.totalQuestions > 0 
    ? Math.round((performance.correctAnswers / performance.totalQuestions) * 100 * 10) / 10
    : 0;

  return performance;
};

// 학급 전체 통계
export const calculateClassStats = (allQuizData, allLessonConfigs) => {
  const stats = {
    totalStudents: 0,
    totalLessons: Object.keys(allQuizData).length,
    averageClassScore: 0,
    mostDifficultQuestions: [],
    easiestQuestions: [],
    lessonCompletionRates: {}
  };

  // 모든 학생 수집
  const allStudents = new Set();
  Object.values(allQuizData).forEach(lessonData => {
    lessonData.students.forEach(student => {
      allStudents.add(student.studentId);
    });
  });
  stats.totalStudents = allStudents.size;

  // 레슨별 완료율 계산
  Object.keys(allQuizData).forEach(lessonId => {
    const lessonData = allQuizData[lessonId];
    const completedCount = lessonData.students.filter(s => 
      s.answers && Object.keys(s.answers).length > 0
    ).length;
    
    stats.lessonCompletionRates[lessonId] = {
      completed: completedCount,
      total: stats.totalStudents,
      rate: stats.totalStudents > 0 ? Math.round((completedCount / stats.totalStudents) * 100) : 0
    };
  });

  // 전체 문항 난이도 분석
  const allQuestionStats = [];
  Object.keys(allQuizData).forEach(lessonId => {
    const lessonConfig = allLessonConfigs[lessonId];
    if (lessonConfig?.questions) {
      const questionStats = calculateQuestionStats(allQuizData[lessonId], lessonConfig);
      questionStats.forEach(stat => {
        allQuestionStats.push({
          ...stat,
          lessonId
        });
      });
    }
  });

  // 가장 어려운/쉬운 문제 찾기
  allQuestionStats.sort((a, b) => a.correctRate - b.correctRate);
  stats.mostDifficultQuestions = allQuestionStats.slice(0, 5);
  stats.easiestQuestions = allQuestionStats.slice(-5).reverse();

  // 전체 평균 점수 계산
  const totalCorrect = allQuestionStats.reduce((sum, stat) => sum + stat.correctAnswers, 0);
  const totalAttempts = allQuestionStats.reduce((sum, stat) => sum + stat.totalAttempts, 0);
  stats.averageClassScore = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100 * 10) / 10 : 0;

  return stats;
};
