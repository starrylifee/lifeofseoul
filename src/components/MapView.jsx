import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet'; // Import Leaflet library for custom icons if needed later
import 'leaflet-draw/dist/leaflet.draw.css'; // Import drawing tool CSS
// import 'leaflet/dist/leaflet.css'; // CSS는 index.html에 전역으로 포함됨

// Firebase Imports
import { db } from '../firebase'; // Firestore instance
import { useAuth } from '../contexts/AuthContext'; // Auth context
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Helper component to handle map events
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      // Prevent adding marker if clicking on:
      // 1. Existing interactive map layers (shapes, markers treated by leaflet-draw?)
      // 2. The drawing toolbar
      // 3. Inside a Leaflet popup
      if (e.originalEvent.target.classList.contains('leaflet-interactive') ||
          e.originalEvent.target.closest('.leaflet-draw-toolbar') ||
          e.originalEvent.target.closest('.leaflet-popup')) {
        console.log("Map click ignored (inside popup or control).");
        return; 
      }
      // Only call onMapClick if the click is directly on the map background
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapView({ center = [37.5665, 126.9780], zoom = 11, lessonId = '1', studentId = null, mapConfig = null, activityData = null }) {
  const [markers, setMarkers] = useState([]); // Initialize empty, load from Firestore
  const [shapes, setShapes] = useState([]);   // Initialize empty, load from Firestore
  const [editingMarkerId, setEditingMarkerId] = useState(null);
  const [currentDescription, setCurrentDescription] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('all'); // 'all' 또는 특정 학생 ID
  const [lessonData, setLessonData] = useState(null); // 레슨 데이터 저장
  const markerPopupRef = useRef(); // Ref for marker popups
  const featureGroupRef = useRef(); // Ref for the FeatureGroup containing shapes
  const { currentUser, userRole, classId, isTeacher, isStudent } = useAuth(); // Get current user and role

  // 지도 설정 (mapConfig가 있으면 사용, 없으면 기본값)
  const mapCenter = mapConfig?.center ? [mapConfig.center.lat, mapConfig.center.lng] : center;
  const mapZoom = mapConfig?.zoom || zoom;

  // 레슨 데이터 로드
  useEffect(() => {
    const loadLessonData = async () => {
      try {
        const response = await import(`../lessons/lesson${lessonId}/data.json`);
        setLessonData(response.default);
        console.log("레슨 데이터 로드됨:", response.default);
      } catch (error) {
        console.error("레슨 데이터 로드 실패:", error);
      }
    };
    
    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

  // 교사가 보는 경우 첫 로드 시 학급의 모든 학생 정보를 로드
  useEffect(() => {
    const loadClassStudents = async () => {
      if (isTeacher()) {
        try {
          const studentsQuery = query(
            collection(db, "users"), 
            where("role", "==", "student"), 
            where("classId", "==", classId)
          );
          
          const studentDocs = await getDocs(studentsQuery);
          const studentsData = studentDocs.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            studentNumber: doc.data().studentNumber
          }));
          
          // 학번 순으로 정렬
          studentsData.sort((a, b) => a.studentNumber - b.studentNumber);
          setClassStudents(studentsData);
          
          // 특정 학생이 지정된 경우 해당 학생 선택
          if (studentId) {
            setSelectedStudent(studentId);
          }
        } catch (error) {
          console.error("학급 학생 정보 로드 오류:", error);
        }
      }
    };
    
    if (currentUser) {
      loadClassStudents();
    }
  }, [currentUser, classId, isTeacher, studentId]);

  // Ref to the user's activity document in Firestore
  // Use optional chaining in case currentUser is null during initial load
  const getUserActivityDocRef = (uid) => {
    return uid ? doc(db, "lessons", String(lessonId), "activities", uid) : null;
  };

  const userActivityDocRef = getUserActivityDocRef(currentUser?.uid);

  // --- Firestore Data Loading --- 
  useEffect(() => {
    if (!currentUser) {
      console.log("User not logged in, cannot load data.");
      setMarkers([]);
      setShapes([]);
      return;
    }
    
    // 학생인 경우: 자신의 데이터만 로드
    if (isStudent()) {
      console.log(`Setting up listener for: lessons/${lessonId}/activities/${currentUser.uid}`);
      
      const unsubscribe = onSnapshot(userActivityDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Firestore data received:", data);
          setMarkers(data.markers || []);
          setShapes(data.shapes || []);
        } else {
          console.log("No activity data found for user in this lesson, initializing.");
          // Initialize document if it doesn't exist for this user/lesson
          setDoc(userActivityDocRef, { 
            markers: [], 
            shapes: [], 
            userId: currentUser.uid, 
            lessonId: String(lessonId), 
            createdAt: serverTimestamp(), 
            lastUpdated: serverTimestamp() 
          }, { merge: true });
          setMarkers([]);
          setShapes([]);
        }
      }, (error) => {
        console.error("Error listening to Firestore:", error);
        // TODO: Show error to user
      });
      
      return () => { unsubscribe(); };
    } 
    // 교사인 경우: 선택된 학생 또는 모든 학생의 데이터 로드
    else if (isTeacher()) {
      // 특정 학생의 데이터만 보기
      if (selectedStudent !== 'all') {
        const studentDocRef = getUserActivityDocRef(selectedStudent);
        if (!studentDocRef) return;
        
        console.log(`교사가 학생 데이터 로드: lessons/${lessonId}/activities/${selectedStudent}`);
        
        const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMarkers(data.markers || []);
            setShapes(data.shapes || []);
          } else {
            setMarkers([]);
            setShapes([]);
          }
        }, (error) => {
          console.error("Error listening to student data:", error);
        });
        
        return () => { unsubscribe(); };
      } 
      // 전체 학생 데이터 보기 (모든 학생의 데이터를 병합)
      else {
        const activitiesRef = collection(db, "lessons", String(lessonId), "activities");
        const classStudentsQuery = query(activitiesRef, where("userId", "!=", currentUser.uid));
        
        console.log(`교사가 전체 학급 데이터 로드: lessons/${lessonId}/activities`);
        
        // 복잡한 병합 로직을 위해 한 번 데이터 로드 후 처리
        const fetchAllStudentData = async () => {
          try {
            const querySnapshot = await getDocs(classStudentsQuery);
            
            let allMarkers = [];
            let allShapes = [];
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.markers) allMarkers = [...allMarkers, ...data.markers];
              if (data.shapes) allShapes = [...allShapes, ...data.shapes];
            });
            
            setMarkers(allMarkers);
            setShapes(allShapes);
          } catch (error) {
            console.error("Error loading all student data:", error);
          }
        };
        
        fetchAllStudentData();
        
        // 실시간 업데이트는 복잡해질 수 있으므로 30초마다 갱신 (실제 상황에 맞게 조정)
        const intervalId = setInterval(fetchAllStudentData, 30000);
        
        return () => { clearInterval(intervalId); };
      }
    }
  }, [currentUser, lessonId, isStudent, isTeacher, userActivityDocRef, selectedStudent]);

  // --- Event Handlers with Firestore Integration ---

  const handleMapClick = async (latlng) => {
    // 학생 또는 교사가 자신의 데이터를 추가하는 경우에만 허용
    // 교사가 다른 학생 데이터를 보고 있을 때는 추가 불가
    if (!userActivityDocRef || (isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid)) {
      console.error("Cannot add marker: User not logged in, doc ref missing, or viewing other student's data.");
      return; 
    }

    // Ask for confirmation before adding marker
    if (window.confirm('이 위치에 마커를 추가하시겠습니까?')) {
      const newMarker = {
        id: Date.now(),
        position: [latlng.lat, latlng.lng],
        description: '새로운 표시',
        userId: currentUser.uid 
      };
      // Optimistically update local state
      setMarkers((prevMarkers) => [...prevMarkers, newMarker]); 
      try {
          // Atomically add the new marker to the 'markers' array in Firestore
          await updateDoc(userActivityDocRef, {
              markers: arrayUnion(newMarker),
              lastUpdated: serverTimestamp()
          });
          console.log("New marker saved to Firestore:", newMarker.id);
      } catch (error) {
          console.error("Error saving marker:", error);
          // Revert local state if save fails
          setMarkers((prevMarkers) => prevMarkers.filter(m => m.id !== newMarker.id));
          // TODO: Show error to user
      }
    } else {
      console.log("Marker addition cancelled by user.");
    }
  };

  const handleEditClick = (marker) => {
    // 마커 작성자이거나 교사인 경우에만 수정 허용
    if (marker.userId !== currentUser.uid && !isTeacher()) {
      alert('자신이 생성한 마커만 수정할 수 있습니다.');
      return;
    }
    
    setEditingMarkerId(marker.id);
    setCurrentDescription(marker.description);
  };

  const handleDescriptionChange = (e) => {
    setCurrentDescription(e.target.value);
  };

  const handleSaveDescription = async (markerId) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const currentMarkers = [...markers]; 
    const markerIndex = currentMarkers.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return; 

    const updatedMarker = { ...currentMarkers[markerIndex], description: currentDescription };
    
    const updatedMarkersArray = [
      ...currentMarkers.slice(0, markerIndex),
      updatedMarker,
      ...currentMarkers.slice(markerIndex + 1)
    ];

    // Optimistically update local state first
    setMarkers(updatedMarkersArray);
    setEditingMarkerId(null); 
    setCurrentDescription('');

    try {
        await updateDoc(docRefToUpdate, {
            markers: updatedMarkersArray, 
            lastUpdated: serverTimestamp()
        });
        console.log(`Marker ${markerId} description updated in Firestore`);
        markerPopupRef.current?.closePopup(); // Close popup AFTER successful save
    } catch (error) {
        console.error("Error updating marker description:", error);
        // Revert local state on error
        setMarkers(currentMarkers); 
        // Do not close popup on error, maybe show error inside?
    }
  };

  const handleCancelEdit = () => {
    setEditingMarkerId(null); // Exit editing mode - this will cause re-render
    setCurrentDescription('');
  };

  const handleMarkerDelete = async (markerId) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    // Find the exact marker object to remove (needed for arrayRemove)
    const markerToDelete = markers.find(m => m.id === markerId);
    if (!markerToDelete) return; 
    
    // 마커 작성자이거나 교사인 경우에만 삭제 허용
    if (markerToDelete.userId !== currentUser.uid && !isTeacher()) {
      alert('자신이 생성한 마커만 삭제할 수 있습니다.');
      return;
    }

    // Optimistically update local state
    const previousMarkers = [...markers];
    setMarkers((prevMarkers) => prevMarkers.filter((m) => m.id !== markerId)); 

    try {
        // Atomically remove the marker from the 'markers' array in Firestore
        await updateDoc(docRefToUpdate, {
            markers: arrayRemove(markerToDelete), 
            lastUpdated: serverTimestamp()
        });
        console.log(`Marker ${markerId} deleted from Firestore`);
    } catch (error) {
        console.error("Error deleting marker:", error);
        // Revert local state on error
        setMarkers(previousMarkers);
        // TODO: Show error to user
    }
  };

  // --- Drawing Event Handlers ---
  const _onCreate = async (e) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const { layerType, layer } = e;
    const geojson = layer.toGeoJSON();
    const newShape = {
      id: L.stamp(layer), // Use Leaflet's internal ID
      type: layerType,
      geojson: geojson,
      userId: currentUser.uid,
      // TODO: Add style options
    };
    // Optimistic update
    setShapes((prevShapes) => [...prevShapes, newShape]);
    try {
        await updateDoc(docRefToUpdate, {
            shapes: arrayUnion(newShape),
            lastUpdated: serverTimestamp()
        });
        console.log("Shape saved to Firestore:", newShape.id);
    } catch (error) {
        console.error("Error saving shape:", error);
        setShapes((prevShapes) => prevShapes.filter(s => s.id !== newShape.id));
    }
  };

  const _onEdited = async (e) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const layers = e.layers;
    const currentShapes = [...shapes]; // Backup for revert
    let newShapesArray = [...shapes]; // Array to modify
    
    layers.eachLayer(layer => {
      const id = L.stamp(layer);
      const geojson = layer.toGeoJSON();
      const index = newShapesArray.findIndex(s => s.id === id);
      if (index !== -1) {
          const updatedShape = {
              ...newShapesArray[index], // Preserve existing properties like userId, type
              geojson: geojson,
              // TODO: Update style options if they change
          };
          newShapesArray = [
              ...newShapesArray.slice(0, index),
              updatedShape,
              ...newShapesArray.slice(index + 1)
          ];
      }
    });

    // Optimistic update
    setShapes(newShapesArray);

    try {
        await updateDoc(docRefToUpdate, {
            shapes: newShapesArray,
            lastUpdated: serverTimestamp()
        });
        console.log("Shapes updated in Firestore");
    } catch (error) {
        console.error("Error updating shapes:", error);
        setShapes(currentShapes); // Revert on error
    }
  };

  const _onDeleted = async (e) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const layers = e.layers;
    const deletedShapeIds = [];
    const shapesToRemoveFromFirestore = []; // Need the exact objects for arrayRemove
    const previousShapes = [...shapes]; // Backup for revert

    layers.eachLayer(layer => {
      const id = L.stamp(layer);
      deletedShapeIds.push(id);
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        // 도형 작성자이거나 교사인 경우에만 삭제 허용
        if (shape.userId === currentUser.uid || isTeacher()) {
          shapesToRemoveFromFirestore.push(shape);
        } else {
          alert('자신이 생성한 도형만 삭제할 수 있습니다.');
        }
      }
    });

    // 삭제할 항목이 없으면 종료
    if (shapesToRemoveFromFirestore.length === 0) return;
    
    // Optimistic update
    setShapes((prevShapes) => prevShapes.filter(shape => !deletedShapeIds.includes(shape.id)));

    try {
        // Atomically remove the shapes from the 'shapes' array
        await updateDoc(docRefToUpdate, {
            shapes: arrayRemove(...shapesToRemoveFromFirestore), // Spread syntax for multiple removes
            lastUpdated: serverTimestamp()
        });
        console.log("Shapes deleted from Firestore:", deletedShapeIds);
    } catch (error) {
        console.error("Error deleting shapes:", error);
        setShapes(previousShapes); // Revert on error
    }
  };
  // -----------------------------

  return (
    <div>
      {/* 교사용 학생 선택 드롭다운 */}
      {isTeacher() && classStudents.length > 0 && (
        <div className="mb-4">
          <label htmlFor="studentSelector" className="block mb-2 font-medium">학생 선택:</label>
          <select
            id="studentSelector"
            className="border p-2 rounded w-full"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="all">전체 학생 데이터 보기</option>
            {classStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.studentNumber}번 - {student.email}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Feature Group for Drawings */}
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={_onCreate}
            onEdited={_onEdited}
            onDeleted={_onDeleted}
            draw={{
              rectangle: true,
              polygon: true,
              circle: true,
              circlemarker: false, // Disable circle markers if not needed
              marker: false, // Disable draw tool marker, use map click instead
              polyline: true,
            }}
            edit={{
              featureGroup: featureGroupRef.current, // Necessary for edit handlers
              remove: true,
            }}
          />
          {/* Render shapes loaded from Firestore */}
          {shapes.map(shape => {
             // Use a key based on shape id
             // We need to render shapes manually IF we want custom popups/styles per shape
             // For now, react-leaflet-draw handles rendering within FeatureGroup
             // based on the layers added/updated in useEffect/handlers.
             // If needed, render L.geoJSON(shape.geojson) here with options.
             return null; 
          })}
        </FeatureGroup>

        {/* Render Markers */}
        <MapEvents onMapClick={handleMapClick} />
        
        {/* 레슨 데이터의 초기 마커들 */}
        {lessonData?.initialMarkers?.map((marker) => (
          <Marker key={`initial-${marker.id}`} position={[marker.position.lat, marker.position.lng]}>
            <Popup>
              <div>
                <h4 className="font-bold">{marker.title}</h4>
                <p>{marker.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 주변 도시 마커들 */}
        {lessonData?.surroundingCities?.map((city) => {
          // 색상에 따라 다른 아이콘 생성
          const cityIcon = new L.Icon({
            iconUrl: city.color === '#FFB6C1' 
              ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-pink.png'
              : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          return (
            <Marker 
              key={`city-${city.name}`} 
              position={[city.position.lat, city.position.lng]}
              icon={cityIcon}
            >
              <Popup>
                <div>
                  <h4 className="font-bold">{city.name}</h4>
                  <p>서울의 {city.direction}에 위치</p>
                  <div 
                    className="w-4 h-4 inline-block rounded-full mr-2"
                    style={{ backgroundColor: city.color }}
                  ></div>
                  {city.color === '#FFB6C1' ? '분홍색 표시' : '하늘색 표시'}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 사용자가 추가한 마커들 */}
        {markers.map((marker) => (
          // Only render markers if they have a valid position
          marker.position && marker.position.length === 2 && (
            <Marker key={marker.id} position={marker.position}>
              <Popup ref={markerPopupRef} minWidth={250}>
                {editingMarkerId === marker.id ? (
                  <div>
                    <input
                      type="text"
                      value={currentDescription}
                      onChange={handleDescriptionChange}
                      onClick={(e) => e.stopPropagation()}
                      className="border px-2 py-1 mr-2 w-full mb-1"
                      autoFocus
                    />
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleSaveDescription(marker.id); 
                      }}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-1 text-sm"
                    >저장</button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleCancelEdit(); 
                      }}
                      className="bg-gray-400 text-white px-2 py-1 rounded text-sm"
                    >취소</button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2">{marker.description}</p>
                    {(currentUser && (marker.userId === currentUser.uid || isTeacher())) && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleEditClick(marker); 
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded mr-1 text-sm"
                        >수정</button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleMarkerDelete(marker.id); 
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        >삭제</button>
                      </>
                    )}
                  </div>
                )}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}

export default MapView; 