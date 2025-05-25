// 댓글 시스템을 위한 유틸리티 함수들
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 마커 댓글 관련 함수들
 */

// 댓글 추가
export const addComment = async (markerId, userId, userName, userRole, classId, content, images = []) => {
  try {
    const commentData = {
      markerId,
      userId,
      userName,
      userRole,
      classId,
      content,
      images,
      parentId: null, // 대댓글 구현시 사용
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isEdited: false,
      likes: 0,
      likedBy: []
    };

    const commentRef = await addDoc(collection(db, 'comments', markerId, 'entries'), commentData);
    
    // 마커의 댓글 수 증가 (해당 마커가 있는 문서 업데이트 필요)
    // TODO: 마커 댓글 수 업데이트 로직 구현
    
    return commentRef.id;
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    throw error;
  }
};

// 댓글 수정
export const updateComment = async (markerId, commentId, content) => {
  try {
    const commentRef = doc(db, 'comments', markerId, 'entries', commentId);
    await updateDoc(commentRef, {
      content,
      updatedAt: serverTimestamp(),
      isEdited: true
    });
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    throw error;
  }
};

// 댓글 삭제
export const deleteComment = async (markerId, commentId) => {
  try {
    const commentRef = doc(db, 'comments', markerId, 'entries', commentId);
    await deleteDoc(commentRef);
    
    // 마커의 댓글 수 감소
    // TODO: 마커 댓글 수 업데이트 로직 구현
    
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw error;
  }
};

// 댓글 목록 실시간 구독
export const subscribeToComments = (markerId, callback) => {
  const commentsQuery = query(
    collection(db, 'comments', markerId, 'entries'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(commentsQuery, callback);
};

// 댓글 좋아요 토글
export const toggleCommentLike = async (markerId, commentId, userId) => {
  try {
    const commentRef = doc(db, 'comments', markerId, 'entries', commentId);
    
    // TODO: 좋아요 토글 로직 구현
    // 1. 현재 좋아요 상태 확인
    // 2. 좋아요 추가/제거
    // 3. 좋아요 수 업데이트
    
  } catch (error) {
    console.error('댓글 좋아요 토글 오류:', error);
    throw error;
  }
};

/**
 * 이미지 업로드 관련 함수들 (Firebase Storage 사용)
 */
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

// 이미지 업로드
export const uploadImage = async (file, path) => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const imageRef = ref(storage, `${path}/${fileName}`);
    
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName
    };
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
};

// 이미지 삭제
export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    throw error;
  }
};

// 이미지 리사이즈 (클라이언트 사이드)
export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 비율 계산
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blob으로 변환
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 마커 확장 기능 관련 함수들
 */

// 마커 좋아요 토글
export const toggleMarkerLike = async (lessonId, classId, userId, markerId, currentUserId) => {
  try {
    // TODO: 마커 좋아요 토글 로직 구현
    // 1. 해당 마커 문서 찾기
    // 2. 좋아요 배열에서 사용자 추가/제거
    // 3. 좋아요 수 업데이트
    
  } catch (error) {
    console.error('마커 좋아요 토글 오류:', error);
    throw error;
  }
};

// 마커에 이미지 추가
export const addImagesToMarker = async (lessonId, classId, userId, markerId, imageUrls) => {
  try {
    // TODO: 마커 이미지 추가 로직 구현
    // 1. 해당 마커 찾기
    // 2. images 배열에 URL 추가
    // 3. updatedAt 갱신
    
  } catch (error) {
    console.error('마커 이미지 추가 오류:', error);
    throw error;
  }
};

export default {
  addComment,
  updateComment,
  deleteComment,
  subscribeToComments,
  toggleCommentLike,
  uploadImage,
  deleteImage,
  resizeImage,
  toggleMarkerLike,
  addImagesToMarker
}; 