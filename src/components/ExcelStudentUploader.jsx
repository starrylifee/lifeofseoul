import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function ExcelStudentUploader() {
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // 임시 비밀번호 생성
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // 엑셀 파일 읽기
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 데이터 검증 및 변환
        const validStudents = jsonData
          .map((row, index) => {
            const email = row['이메일'] || row['email'] || row['Email'];
            const name = row['이름'] || row['name'] || row['Name'] || row['성명'];
            const studentNumber = row['번호'] || row['number'] || row['학번'] || index + 1;

            if (!email) {
              return { error: `${index + 1}행: 이메일이 없습니다.` };
            }

            if (!email.includes('.sen.es.kr')) {
              return { error: `${index + 1}행: 서울시 교육청 이메일이 아닙니다. (${email})` };
            }

            return {
              email,
              name: name || email.split('@')[0],
              studentNumber,
              tempPassword: generateTempPassword()
            };
          })
          .filter(student => !student.error);

        const errors = jsonData
          .map((row, index) => {
            const email = row['이메일'] || row['email'] || row['Email'];
            if (!email) return `${index + 1}행: 이메일이 없습니다.`;
            if (!email.includes('.sen.es.kr')) return `${index + 1}행: 서울시 교육청 이메일이 아닙니다.`;
            return null;
          })
          .filter(error => error);

        setPreviewData({ students: validStudents, errors });
        setShowPreview(true);

      } catch (error) {
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다: ' + error.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 학생 계정 생성
  const createStudentAccounts = async () => {
    setIsUploading(true);
    const results = [];

    for (const student of previewData.students) {
      try {
        // Firebase Authentication에 계정 생성
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          student.email, 
          student.tempPassword
        );

        // Firestore에 사용자 정보 저장
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: student.email,
          role: 'student',
          teacherId: currentUser.uid,
          studentNumber: student.studentNumber,
          displayName: student.name,
          schoolDomain: student.email.split('@')[1],
          tempPassword: student.tempPassword,
          createdAt: new Date(),
          passwordChanged: false,
          loginMethod: 'email'
        });

        results.push({
          success: true,
          email: student.email,
          name: student.name,
          tempPassword: student.tempPassword
        });

      } catch (error) {
        results.push({
          success: false,
          email: student.email,
          name: student.name,
          error: error.message
        });
      }
    }

    setResults(results);
    setIsUploading(false);
    setShowPreview(false);
  };

  // 결과 다운로드 (CSV)
  const downloadResults = () => {
    const csvContent = [
      '이메일,이름,상태,임시비밀번호,오류',
      ...results.map(result => 
        `${result.email},${result.name},${result.success ? '성공' : '실패'},${result.tempPassword || ''},${result.error || ''}`
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `학생계정생성결과_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h3 className="text-xl font-bold mb-4 font-korean">엑셀 파일로 학생 계정 생성</h3>
      
      {/* 파일 업로드 */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <div className="mb-4">
            <span className="text-4xl">📄</span>
          </div>
          <p className="text-gray-600 mb-4 font-korean">
            학생 목록이 포함된 엑셀 파일을 업로드하세요
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 cursor-pointer transition-colors font-korean"
          >
            엑셀 파일 선택
          </label>
        </div>
        
        <div className="mt-4 text-sm text-gray-500 font-korean">
          <p><strong>엑셀 파일 형식:</strong></p>
          <ul className="list-disc list-inside mt-2">
            <li>이메일 열: "이메일", "email", "Email" 중 하나</li>
            <li>이름 열: "이름", "name", "Name", "성명" 중 하나 (선택사항)</li>
            <li>번호 열: "번호", "number", "학번" 중 하나 (선택사항)</li>
            <li>이메일은 반드시 @*.sen.es.kr 형식이어야 합니다</li>
          </ul>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <h4 className="text-lg font-bold mb-4 font-korean">미리보기 및 확인</h4>
            
            {previewData.errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-bold text-red-700 mb-2">오류 목록:</p>
                <ul className="text-sm text-red-600">
                  {previewData.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mb-4">
              <p className="font-korean">
                <strong>생성될 계정 수:</strong> {previewData.students.length}개
              </p>
            </div>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 font-korean">이메일</th>
                    <th className="border border-gray-200 px-4 py-2 font-korean">이름</th>
                    <th className="border border-gray-200 px-4 py-2 font-korean">번호</th>
                    <th className="border border-gray-200 px-4 py-2 font-korean">임시비밀번호</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.students.slice(0, 10).map((student, index) => (
                    <tr key={index}>
                      <td className="border border-gray-200 px-4 py-2 text-sm">{student.email}</td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">{student.name}</td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">{student.studentNumber}</td>
                      <td className="border border-gray-200 px-4 py-2 text-sm font-mono">{student.tempPassword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.students.length > 10 && (
                <p className="text-sm text-gray-500 mt-2 font-korean">
                  ...외 {previewData.students.length - 10}개 계정
                </p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={createStudentAccounts}
                disabled={isUploading}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 font-korean"
              >
                {isUploading ? '생성 중...' : '계정 생성'}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 font-korean"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold font-korean">생성 결과</h4>
            <button
              onClick={downloadResults}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-korean"
            >
              결과 다운로드 (CSV)
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-green-50 rounded">
              <p className="font-bold text-green-700 font-korean">성공</p>
              <p className="text-2xl text-green-700">{results.filter(r => r.success).length}개</p>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <p className="font-bold text-red-700 font-korean">실패</p>
              <p className="text-2xl text-red-700">{results.filter(r => !r.success).length}개</p>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-2 mb-1 rounded ${
                result.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className="font-mono text-sm">
                  {result.email} ({result.name})
                </span>
                {result.success ? (
                  <span className="text-green-700 ml-2 font-korean">
                    성공 - 임시비밀번호: {result.tempPassword}
                  </span>
                ) : (
                  <span className="text-red-700 ml-2 font-korean">
                    실패: {result.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExcelStudentUploader;