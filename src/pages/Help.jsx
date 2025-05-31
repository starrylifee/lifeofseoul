import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Help = () => {
  const { isTeacher, isStudent } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // 교사용 FAQ
  const teacherFaqs = [
    {
      question: "학생 계정은 어떻게 생성하나요?",
      answer: "대시보드의 '학급 관리' 메뉴에서 학생 계정을 일괄 생성할 수 있습니다. 학급명과 학생 수를 입력하면 자동으로 계정이 생성됩니다."
    },
    {
      question: "학생들에게 별은 어떻게 지급하나요?",
      answer: "대시보드의 '별 지급 시스템'에서 학생을 선택하고 지급 사유를 선택하여 별을 지급할 수 있습니다. 교사 보상, 창의적 마커, 적극적 참여 등 다양한 사유가 있습니다."
    },
    {
      question: "학급 진행 현황은 어디서 확인하나요?",
      answer: "대시보드의 '학급 진행 현황' 메뉴에서 전체 학급의 레슨별 진행률, 별 획득 현황, 마커 생성 통계를 확인할 수 있습니다."
    },
    {
      question: "학생이 만든 마커를 삭제할 수 있나요?",
      answer: "네, 지도 화면에서 각 마커의 팝업에서 교사는 학생 마커를 삭제할 수 있습니다. 또한 '모든 마커 초기화' 기능으로 반 전체 마커를 일괄 삭제할 수도 있습니다."
    },
    {
      question: "다른 반의 활동을 볼 수 있나요?",
      answer: "지도 화면에서 다른 반을 선택하여 조회할 수 있지만, 마커 삭제나 수정은 자신의 담임 반에서만 가능합니다."
    }
  ];

  // 학생용 FAQ
  const studentFaqs = [
    {
      question: "별은 어떻게 모을 수 있나요?",
      answer: "수업을 완료하거나, 창의적인 마커를 만들거나, 적극적으로 참여할 때 별을 받을 수 있습니다. 교사가 직접 지급하는 별도 있습니다."
    },
    {
      question: "지도에 마커는 어떻게 추가하나요?",
      answer: "수업 화면의 지도에서 원하는 위치를 클릭하면 마커를 추가할 수 있습니다. 제목, 설명, 사진을 추가하여 나만의 마커를 만들어보세요."
    },
    {
      question: "다른 친구들의 마커에 댓글을 달 수 있나요?",
      answer: "네! 마커를 클릭하면 댓글을 작성할 수 있고, 좋아요도 누를 수 있습니다. 친구들과 소통하며 함께 서울을 탐험해보세요."
    },
    {
      question: "펫은 어떻게 키우나요?",
      answer: "별을 모으면 펫이 자동으로 성장합니다. 더 많은 별을 모을수록 펫의 레벨이 올라가고 다양한 모습으로 변화합니다."
    },
    {
      question: "내 학습 현황은 어디서 확인하나요?",
      answer: "대시보드의 '내 학습 현황' 메뉴에서 레슨별 진행률, 별 획득 히스토리, 마커 생성 기록, 학급 내 순위를 확인할 수 있습니다."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-korean">
            ❓ 도움말
          </h1>
          <p className="text-lg text-gray-600 font-korean">
            Life of Seoul 사용법을 알아보세요
          </p>
        </div>

        {/* 빠른 시작 가이드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🚀 빠른 시작 가이드</h2>
          
          {isTeacher() ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">1. 학급 설정</h3>
                <p className="text-xs text-gray-600 font-korean">관리자 패널에서 학급을 생성하고 학생 계정을 만드세요</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">📚</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">2. 수업 안내</h3>
                <p className="text-xs text-gray-600 font-korean">학생들에게 Life of Seoul 사용법을 안내하세요</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">3. 진행 모니터링</h3>
                <p className="text-xs text-gray-600 font-korean">학급 진행 현황에서 학생들의 학습 상태를 확인하세요</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">⭐</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">4. 별 지급</h3>
                <p className="text-xs text-gray-600 font-korean">학생들의 우수한 활동에 별을 지급하여 동기를 부여하세요</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl mb-2">🏫</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">1. 교실 입장</h3>
                <p className="text-xs text-gray-600 font-korean">대시보드에서 원하는 수업을 선택해 참여하세요</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl mb-2">📍</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">2. 마커 생성</h3>
                <p className="text-xs text-gray-600 font-korean">지도에서 궁금한 장소를 클릭하여 마커를 만들어보세요</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">3. 친구와 소통</h3>
                <p className="text-xs text-gray-600 font-korean">다른 친구들의 마커에 댓글과 좋아요를 남겨보세요</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl mb-2">⭐</div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 font-korean">4. 별 모으기</h3>
                <p className="text-xs text-gray-600 font-korean">수업을 완료하고 별을 모아 펫을 키워보세요</p>
              </div>
            </div>
          )}
        </div>

        {/* 주요 기능 안내 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">✨ 주요 기능</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h3 className="font-bold text-gray-800 font-korean">인터랙티브 지도</h3>
                  <p className="text-sm text-gray-600 font-korean">
                    실제 서울 지도에서 마커를 생성하고 친구들과 공유할 수 있습니다. 
                    각 레슨마다 다른 테마의 지도가 제공됩니다.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📚</span>
                <div>
                  <h3 className="font-bold text-gray-800 font-korean">8차시 수업</h3>
                  <p className="text-sm text-gray-600 font-korean">
                    서울의 다양한 모습을 8개 주제로 나누어 체계적으로 학습할 수 있습니다. 
                    각 수업마다 확인문제도 포함되어 있습니다.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="font-bold text-gray-800 font-korean">별 시스템</h3>
                  <p className="text-sm text-gray-600 font-korean">
                    학습 활동과 창의적인 참여에 따라 별을 획득할 수 있습니다. 
                    별을 모아 펫을 키우고 레벨을 올려보세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">🎮</span>
                <div>
                  <h3 className="font-bold text-gray-800 font-korean">펫 키우기</h3>
                  <p className="text-sm text-gray-600 font-korean">
                    별을 모으면 나만의 펫이 성장합니다. 
                    펫의 성장 과정을 통해 학습 동기를 유지할 수 있습니다.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="font-bold text-gray-800 font-korean">협력 학습</h3>
                  <p className="text-sm text-gray-600 font-korean">
                    같은 반 친구들과 실시간으로 마커를 공유하고, 
                    댓글과 좋아요로 소통할 수 있습니다.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-bold text-gray-800 font-korean">학습 분석</h3>
                  <p className="text-sm text-gray-600 font-korean">
                    개인 학습 현황과 학급 진행률을 시각적으로 확인하여 
                    학습 계획을 세울 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ 섹션 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">
            ❓ 자주 묻는 질문 {isTeacher() ? '(교사용)' : '(학생용)'}
          </h2>
          
          <div className="space-y-4">
            {(isTeacher() ? teacherFaqs : studentFaqs).map((faq, index) => (
              <div key={index} className="border-2 border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800 font-korean">{faq.question}</span>
                  <span className={`transform transition-transform ${
                    openFaq === index ? 'rotate-180' : ''
                  }`}>
                    ⬇️
                  </span>
                </button>
                {openFaq === index && (
                  <div className="p-4 bg-gray-50 border-t-2 border-gray-100">
                    <p className="text-gray-600 font-korean">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 문의 및 지원 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📞 문의 및 지원</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-3 font-korean">🏫 교육청 문의</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>전화:</strong> 02-123-4567</p>
                <p><strong>이메일:</strong> lifeofseoul@sen.go.kr</p>
                <p><strong>운영시간:</strong> 평일 09:00 - 18:00</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-3 font-korean">💻 기술 지원</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>온라인 신고:</strong> support.lifeofseoul.kr</p>
                <p><strong>카카오톡:</strong> @lifeofseoul</p>
                <p><strong>응답시간:</strong> 평균 24시간 이내</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
            <h3 className="font-bold text-gray-800 mb-2 font-korean">⚠️ 주의사항</h3>
            <ul className="text-sm text-gray-600 space-y-1 font-korean">
              <li>• 계정 정보는 타인과 공유하지 마세요</li>
              <li>• 부적절한 내용의 마커나 댓글은 삭제될 수 있습니다</li>
              <li>• 기술적 문제 발생 시 페이지를 새로고침 해보세요</li>
              <li>• 정기 점검 시간: 매주 일요일 02:00 - 04:00</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 