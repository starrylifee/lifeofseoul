import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, FeatureGroup, CircleMarker, Polygon, Polyline, Tooltip } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet'; // Import Leaflet library for custom icons if needed later
import 'leaflet-draw/dist/leaflet.draw.css'; // Import drawing tool CSS
// import 'leaflet/dist/leaflet.css'; // CSS는 index.html에 전역으로 포함됨

// Firebase Imports
import { db, storage } from '../firebase'; // Firestore instance
import { useAuth } from '../contexts/AuthContext'; // Auth context
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, serverTimestamp, collection, getDocs, query, where, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 기본 색상 (색상이 지정되지 않은 경우)
const DEFAULT_COLOR = '#808080'; // 회색

// 차시별 마커 안내 문구 (가이드 활동용)
const LESSON_MARKER_PROMPTS = {
  '1': '지도에서 원하는 지역을 클릭하여 "우리 집은 서울 ○○구에 있습니다" 또는 "○○시는 서울의 ○○쪽에 있습니다"라고 적어보세요:',
  '2': '하천이나 다리 위치를 클릭하여 "우리 집 근처에는 ○○천이 흐릅니다" 또는 "○○대교는 ○○구와 ○○구를 연결합니다"라고 적어보세요:',
  '3': '지하철역이나 도로를 클릭하여 "○○역 주변의 특징" 또는 "우리 집에서 학교까지 가는 교통수단"을 적어보세요:',
  '4': '교통시설(기차역, 공항, 버스터미널) 위치를 클릭하여 "○○에서 어디로 갈 수 있는지" 또는 "가족여행 때 이용한 교통수단 경험"을 적어보세요:',
  '5': '행정기관(구청, 주민센터 등) 위치를 클릭하여 "○○에서 하는 일" 또는 "가족과 방문한 행정기관 경험"을 적어보세요:',
  '6': '문화시설(박물관, 공연장, 문화거리 등) 위치를 클릭하여 "○○에서 할 수 있는 활동" 또는 "가족과 방문한 문화시설 경험"을 적어보세요:',
  '7': '궁궐 위치를 클릭하여 "가장 가보고 싶은 궁궐과 그 이유" 또는 "방문했던 궁궐에서 인상 깊었던 것"을 적어보세요:',
  '8': '성문이나 성곽 위치를 클릭하여 "가장 가보고 싶은 성문과 그 이유" 또는 "성곽길을 걸어본 경험"을 적어보세요:'
};

// 행정구역 경계 데이터 (레슨 1용)
const ADMINISTRATIVE_BOUNDARIES = {
  seoul: {
    // 사용자 제공 매우 상세한 서울시 경계 좌표 (300+ 점)
    coordinates: [
      [37.555244, 126.764313],
      [37.561854, 126.775561],
      [37.568259, 126.775302],
      [37.569181, 126.781604],
      [37.573766, 126.782477],
      [37.575559, 126.787519],
      [37.577607, 126.790030],
      [37.581349, 126.791490],
      [37.585284, 126.795141],
      [37.585361, 126.797186],
      [37.588293, 126.800934],
      [37.591302, 126.799182],
      [37.593886, 126.798500],
      [37.601639, 126.799961],
      [37.604917, 126.802395],
      [37.595206, 126.817459],
      [37.572061, 126.853536],
      [37.578312, 126.875558],
      [37.586172, 126.877510],
      [37.594092, 126.886959],
      [37.588647, 126.887115],
      [37.590132, 126.899453],
      [37.592704, 126.898849],
      [37.595196, 126.901816],
      [37.602845, 126.900089],
      [37.603898, 126.902171],
      [37.611266, 126.900089],
      [37.618563, 126.903544],
      [37.621896, 126.907087],
      [37.628034, 126.908814],
      [37.632980, 126.906334],
      [37.635891, 126.911338],
      [37.638732, 126.909965],
      [37.644308, 126.912003],
      [37.649007, 126.904784],
      [37.644729, 126.913996],
      [37.646307, 126.924138],
      [37.650375, 126.930250],
      [37.651322, 126.935963],
      [37.657353, 126.941366],
      [37.659176, 126.947655],
      [37.655108, 126.951198],
      [37.655354, 126.954166],
      [37.652444, 126.957089],
      [37.633261, 126.963334],
      [37.629823, 126.959923],
      [37.636733, 126.984725],
      [37.655880, 126.979632],
      [37.664365, 126.988091],
      [37.666924, 126.993893],
      [37.679474, 126.992299],
      [37.684381, 127.001599],
      [37.684591, 127.008464],
      [37.691601, 127.007711],
      [37.693318, 127.009837],
      [37.696612, 127.009616],
      [37.701308, 127.015506],
      [37.700993, 127.027597],
      [37.691811, 127.032557],
      [37.695140, 127.043010],
      [37.692232, 127.045490],
      [37.694019, 127.048634],
      [37.685818, 127.051602],
      [37.691320, 127.060769],
      [37.694825, 127.063382],
      [37.693739, 127.072860],
      [37.695946, 127.081010],
      [37.690199, 127.085173],
      [37.688902, 127.095625],
      [37.679228, 127.091949],
      [37.669027, 127.096068],
      [37.658229, 127.091329],
      [37.652619, 127.093986],
      [37.648130, 127.092525],
      [37.644448, 127.095005],
      [37.644659, 127.107229],
      [37.641152, 127.111215],
      [37.632208, 127.111569],
      [37.627613, 127.105944],
      [37.621650, 127.103951],
      [37.619966, 127.105723],
      [37.620878, 127.110373],
      [37.619265, 127.115688],
      [37.616914, 127.117105],
      [37.604600, 127.117947],
      [37.599582, 127.113606],
      [37.594037, 127.116175],
      [37.593371, 127.113075],
      [37.583509, 127.108734],
      [37.580115, 127.102816],
      [37.578934, 127.102937],
      [37.576107, 127.101043],
      [37.573361, 127.100902],
      [37.572195, 127.102131],
      [37.572307, 127.103179],
      [37.571477, 127.104226],
      [37.560937, 127.101003],
      [37.556417, 127.104891],
      [37.557072, 127.107148],
      [37.558509, 127.109525],
      [37.558269, 127.110291],
      [37.558972, 127.112205],
      [37.558477, 127.113857],
      [37.556800, 127.113937],
      [37.556816, 127.115267],
      [37.563380, 127.122742],
      [37.567564, 127.133258],
      [37.568379, 127.148691],
      [37.578854, 127.166642],
      [37.579029, 127.170470],
      [37.581137, 127.177099],
      [37.578997, 127.176595],
      [37.578391, 127.175346],
      [37.574820, 127.175577],
      [37.571907, 127.177724],
      [37.568830, 127.179194],
      [37.565043, 127.179694],
      [37.560952, 127.181855],
      [37.555917, 127.181620],
      [37.552922, 127.181297],
      [37.551733, 127.182855],
      [37.550672, 127.182958],
      [37.546616, 127.182679],
      [37.545252, 127.183502],
      [37.546546, 127.181341],
      [37.546616, 127.179268],
      [37.545217, 127.175563],
      [37.545485, 127.171931],
      [37.544762, 127.169799],
      [37.545193, 127.167006],
      [37.544261, 127.166785],
      [37.544972, 127.163125],
      [37.533652, 127.153480],
      [37.531822, 127.153847],
      [37.528580, 127.152686],
      [37.522202, 127.147658],
      [37.521899, 127.145585],
      [37.519602, 127.144688],
      [37.516045, 127.145305],
      [37.515602, 127.140542],
      [37.513748, 127.143174],
      [37.512780, 127.143277],
      [37.512453, 127.141292],
      [37.510471, 127.140880],
      [37.510237, 127.140204],
      [37.508546, 127.139851],
      [37.506704, 127.141365],
      [37.505502, 127.140924],
      [37.504359, 127.144012],
      [37.503263, 127.145379],
      [37.503170, 127.147717],
      [37.504569, 127.150187],
      [37.502971, 127.152039],
      [37.501863, 127.156420],
      [37.503041, 127.157641],
      [37.502295, 127.158758],
      [37.501303, 127.159331],
      [37.501024, 127.160449],
      [37.500055, 127.161302],
      [37.496533, 127.159567],
      [37.494410, 127.159875],
      [37.490024, 127.157376],
      [37.489814, 127.158376],
      [37.484109, 127.148790],
      [37.482289, 127.147525],
      [37.477249, 127.147070],
      [37.477295, 127.144320],
      [37.475312, 127.143585],
      [37.473993, 127.143409],
      [37.474658, 127.132764],
      [37.472383, 127.132485],
      [37.471333, 127.132750],
      [37.469839, 127.131912],
      [37.468427, 127.132632],
      [37.467786, 127.130677],
      [37.468626, 127.126751],
      [37.469629, 127.124913],
      [37.467482, 127.124972],
      [37.466642, 127.124340],
      [37.462209, 127.117370],
      [37.458696, 127.116782],
      [37.460494, 127.112856],
      [37.461066, 127.113209],
      [37.462092, 127.104403],
      [37.461206, 127.104550],
      [37.456199, 127.098742],
      [37.456071, 127.093670],
      [37.453608, 127.092582],
      [37.452919, 127.090876],
      [37.448811, 127.088245],
      [37.445057, 127.087772],
      [37.444180, 127.084239],
      [37.441440, 127.082030],
      [37.442207, 127.072221],
      [37.441533, 127.071479],
      [37.438884, 127.071983],
      [37.437410, 127.073872],
      [37.436413, 127.073046],
      [37.435825, 127.071232],
      [37.434130, 127.071393],
      [37.432213, 127.070535],
      [37.430467, 127.071082],
      [37.430288, 127.070846],
      [37.430944, 127.070020],
      [37.430492, 127.068904],
      [37.430740, 127.068314],
      [37.430109, 127.066522],
      [37.429087, 127.065514],
      [37.429197, 127.064355],
      [37.429862, 127.063293],
      [37.430177, 127.060815],
      [37.429734, 127.059656],
      [37.430160, 127.057735],
      [37.428550, 127.052103],
      [37.430331, 127.049871],
      [37.430748, 127.047532],
      [37.433636, 127.046395],
      [37.434326, 127.044753],
      [37.435331, 127.044174],
      [37.437410, 127.041331],
      [37.437938, 127.041202],
      [37.438398, 127.040054],
      [37.438441, 127.037125],
      [37.439131, 127.035762],
      [37.440979, 127.035290],
      [37.445775, 127.038284],
      [37.446371, 127.037307],
      [37.447385, 127.037576],
      [37.448015, 127.037232],
      [37.448501, 127.037425],
      [37.448850, 127.037876],
      [37.452197, 127.035827],
      [37.452606, 127.034851],
      [37.453160, 127.035001],
      [37.453364, 127.035548],
      [37.454054, 127.035730],
      [37.454131, 127.036342],
      [37.455119, 127.037168],
      [37.456464, 127.036835],
      [37.457946, 127.035065],
      [37.460186, 127.034979],
      [37.461234, 127.033799],
      [37.464086, 127.034700],
      [37.465644, 127.031696],
      [37.465346, 127.029443],
      [37.463311, 127.029550],
      [37.461275, 127.027984],
      [37.460092, 127.028349],
      [37.459657, 127.026364],
      [37.458312, 127.026364],
      [37.457264, 127.022759],
      [37.456276, 127.021386],
      [37.455799, 127.019229],
      [37.456148, 127.017330],
      [37.454888, 127.014959],
      [37.455518, 127.010893],
      [37.464069, 127.004477],
      [37.465882, 127.004777],
      [37.467722, 127.003619],
      [37.467185, 126.996720],
      [37.461914, 126.996709],
      [37.461556, 126.993233],
      [37.457221, 126.986463],
      [37.456949, 126.981753],
      [37.455944, 126.982215],
      [37.454437, 126.974576],
      [37.449531, 126.970402],
      [37.446294, 126.964072],
      [37.442094, 126.964437],
      [37.440808, 126.963557],
      [37.440356, 126.962827],
      [37.440433, 126.959931],
      [37.439155, 126.958944],
      [37.438721, 126.955113],
      [37.439360, 126.952345],
      [37.437179, 126.945179],
      [37.437537, 126.941391],
      [37.435867, 126.940318],
      [37.436063, 126.938677],
      [37.439164, 126.937228],
      [37.440186, 126.937926],
      [37.445399, 126.930770],
      [37.446379, 126.930287],
      [37.448576, 126.930190],
      [37.450288, 126.928366],
      [37.449377, 126.928227],
      [37.448432, 126.926424],
      [37.445910, 126.923184],
      [37.442605, 126.921071],
      [37.440561, 126.920127],
      [37.439956, 126.919086],
      [37.440152, 126.916114],
      [37.438729, 126.912198],
      [37.437102, 126.911050],
      [37.436233, 126.911179],
      [37.433933, 126.909265],
      [37.434121, 126.903032],
      [37.435901, 126.902817],
      [37.439275, 126.898761],
      [37.439505, 126.899974],
      [37.445638, 126.897109],
      [37.445774, 126.895543],
      [37.447461, 126.894717],
      [37.448108, 126.896090],
      [37.452844, 126.893998],
      [37.452035, 126.892571],
      [37.452324, 126.889781],
      [37.454896, 126.888998],
      [37.456310, 126.886337],
      [37.457673, 126.885833],
      [37.459155, 126.886337],
      [37.459496, 126.885425],
      [37.460816, 126.886187],
      [37.460969, 126.888923],
      [37.462945, 126.887088],
      [37.462553, 126.885157],
      [37.464682, 126.882850],
      [37.466002, 126.884599],
      [37.485253, 126.871821],
      [37.486079, 126.872926],
      [37.485228, 126.874407],
      [37.486700, 126.875394],
      [37.488548, 126.876885],
      [37.488420, 126.872872],
      [37.489782, 126.870469],
      [37.491910, 126.869375],
      [37.493579, 126.870265],
      [37.495264, 126.868087],
      [37.494311, 126.866574],
      [37.491229, 126.864182],
      [37.490463, 126.861865],
      [37.485960, 126.857498],
      [37.485458, 126.855191],
      [37.482708, 126.853582],
      [37.481575, 126.850900],
      [37.482018, 126.846876],
      [37.473748, 126.845036],
      [37.475000, 126.842698],
      [37.475434, 126.838320],
      [37.474404, 126.834758],
      [37.475715, 126.834941],
      [37.477222, 126.833235],
      [37.477733, 126.831765],
      [37.477018, 126.829447],
      [37.476294, 126.829040],
      [37.476311, 126.824255],
      [37.475332, 126.821787],
      [37.476371, 126.821326],
      [37.476396, 126.819083],
      [37.473382, 126.817549],
      [37.474796, 126.814760],
      [37.478116, 126.817260],
      [37.478065, 126.818279],
      [37.481905, 126.820103],
      [37.485455, 126.819427],
      [37.487703, 126.823557],
      [37.490308, 126.821648],
      [37.493287, 126.814610],
      [37.494470, 126.814309],
      [37.496462, 126.813022],
      [37.497347, 126.814073],
      [37.498284, 126.814277],
      [37.497696, 126.816133],
      [37.499254, 126.819684],
      [37.501305, 126.819899],
      [37.502157, 126.821562],
      [37.507604, 126.822291],
      [37.508506, 126.827044],
      [37.510455, 126.826958],
      [37.510574, 126.824072],
      [37.514429, 126.824341],
      [37.516208, 126.823182],
      [37.520033, 126.825693],
      [37.523046, 126.825264],
      [37.525054, 126.826616],
      [37.525854, 126.828182],
      [37.528917, 126.828322],
      [37.529921, 126.825532],
      [37.534907, 126.821906],
      [37.540658, 126.822088],
      [37.540788, 126.812522],
      [37.543705, 126.807265],
      [37.542829, 126.801665],
      [37.541409, 126.799766],
      [37.537810, 126.799197],
      [37.536023, 126.794702],
      [37.539758, 126.793704],
      [37.541409, 126.795013],
      [37.542013, 126.791837],
      [37.543808, 126.791869],
      [37.546053, 126.787492],
      [37.546755, 126.777726],
      [37.549077, 126.775247],
      [37.548558, 126.771557],
      [37.551892, 126.767952],
      [37.555380, 126.764819],
      [37.557378, 126.773252],
      [37.555244, 126.764313]  // 첫 번째 좌표로 복귀하여 닫힌 다각형 완성
    ],
    style: {
      color: '#FF0000',     // 빨간색 테두리
      weight: 4,
      opacity: 0.9,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      dashArray: '10, 5'    // 점선 효과 추가
    },
    name: '서울특별시'
  },
  gyeonggiCities: [
    {
      name: '수원시',
      center: [37.2636, 127.0286],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '성남시', 
      center: [37.4449, 127.1388],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '고양시',
      center: [37.6584, 126.832],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '용인시',
      center: [37.2410, 127.1776],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '부천시',
      center: [37.5036, 126.766],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '안산시',
      center: [37.3236, 126.8219],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '안양시',
      center: [37.3943, 126.9568],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '남양주시',
      center: [37.6362, 127.2165],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '화성시',
      center: [37.1996, 126.8312],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '파주시',
      center: [37.7598, 126.7804],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '의정부시',
      center: [37.7381, 127.0473],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    },
    {
      name: '시흥시',
      center: [37.3801, 126.8031],
      style: { color: '#0066CC', weight: 2, opacity: 0.6, fillOpacity: 0.05 }
    }
  ]
};



// 레슨별 지도 설정
const LESSON_MAP_CONFIGS = {
  '1': {
    center: [37.5665, 126.9780],
    zoom: 10,
    minZoom: 9,
    maxZoom: 14,
    bounds: {
      southWest: [37.2, 126.5],
      northEast: [37.9, 127.3]
    },
    description: '서울+경기도 (방위 학습용)'
  },
  '2': {
    center: [37.5665, 126.9780],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    bounds: {
      southWest: [37.4, 126.7],
      northEast: [37.7, 127.2]
    },
    description: '서울시 (한강과 하천)'
  },
  '3': {
    center: [37.5665, 126.9780],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    bounds: {
      southWest: [37.4, 126.7],
      northEast: [37.7, 127.2]
    },
    description: '서울시 (도로와 지하철)'
  },
  '4': {
    center: [37.5665, 126.9780],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    bounds: {
      southWest: [37.4, 126.7],
      northEast: [37.7, 127.2]
    },
    description: '서울시 (교통의 중심지)'
  },
  '5': {
    center: [37.5665, 126.9780],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    bounds: {
      southWest: [37.4, 126.7],
      northEast: [37.7, 127.2]
    },
    description: '서울시 (행정의 중심지)'
  },
  '6': {
    center: [37.5665, 126.9780],
    zoom: 11,
    minZoom: 10,
    maxZoom: 16,
    bounds: {
      southWest: [37.4, 126.7],
      northEast: [37.7, 127.2]
    },
    description: '서울시 (문화의 중심지)'
  },
  '7': {
    center: [37.5665, 126.9780],
    zoom: 12,
    minZoom: 11,
    maxZoom: 16,
    bounds: {
      southWest: [37.5, 126.8],
      northEast: [37.6, 127.1]
    },
    description: '서울시 중심부 (궁궐)'
  },
  '8': {
    center: [37.5665, 126.9780],
    zoom: 12,
    minZoom: 11,
    maxZoom: 16,
    bounds: {
      southWest: [37.5, 126.8],
      northEast: [37.6, 127.1]
    },
    description: '서울시 중심부 (한양도성)'
  }
};

// Helper component to handle map events
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      // 클릭 제한 완화 - 라인 클릭 시에도 마커 추가 가능하도록 수정
      // 팝업과 툴바 클릭만 제외
      if (e.originalEvent.target.closest('.leaflet-draw-toolbar') ||
          e.originalEvent.target.closest('.leaflet-popup') ||
          e.originalEvent.target.closest('.leaflet-marker-icon')) {
        return; 
      }
      // 라인과 폴리곤, 지도 배경 클릭 시 마커 추가 허용
      onMapClick(e.latlng);
    },
  });
  return null;
}



// 지도 이벤트 및 참조 관리 컴포넌트
const MapEventHandler = ({ onMapReady, children }) => {
  const map = useMapEvents({
    ready() {
      onMapReady(map);
    }
  });

  return children;
};

// 사용자 정의 지도 컨트롤 컴포넌트
const MapControls = ({ map }) => {
  if (!map) return null;
  
  const handleZoomIn = () => {
    map.zoomIn();
  };
  
  const handleZoomOut = () => {
    map.zoomOut();
  };
  
  const handleCenter = () => {
    map.setView(map.options.center, map.options.zoom);
  };

  return (
    <div className="map-controls">
      <button onClick={handleZoomIn} className="map-control-button" title="확대">+</button>
      <button onClick={handleZoomOut} className="map-control-button" title="축소">−</button>
      <button onClick={handleCenter} className="map-control-button" title="중심으로">🗺️</button>
    </div>
  );
};

function MapView({ center = [37.5665, 126.9780], zoom = 11, lessonId = '1', studentId = null, mapConfig = null, activityData = null, currentStep = null }) {
  // 상태 변수들
  const [lessonData, setLessonData] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [editingMarkerId, setEditingMarkerId] = useState(null);
  const [currentDescription, setCurrentDescription] = useState('');
  const [userColors, setUserColors] = useState({});
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false); // Firebase 연결 상태
  const [mapInstance, setMapInstance] = useState(null); // 지도 인스턴스 참조
  const markerPopupRef = useRef(); // Ref for marker popups
  const featureGroupRef = useRef(); // Ref for the FeatureGroup containing shapes
  
  // 선택된 마커와 모달 상태
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view' 또는 'edit'
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  // 이미지 업로드 관련 상태 추가
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Auth 컨텍스트를 항상 호출 (Hook 규칙 준수)
  const authContext = useAuth();
  const currentUser = authContext?.currentUser || null;
  const classId = authContext?.classId || null;
  
  // Firebase 연결 상태 확인
  useEffect(() => {
    try {
      if (authContext && !authContext.firebaseError) {
        setIsFirebaseAvailable(true);
      } else {
        setIsFirebaseAvailable(false);
        console.log("Firebase 인증을 사용할 수 없습니다. 오프라인 모드로 실행합니다.");
      }
    } catch (error) {
      console.log("Firebase 인증을 사용할 수 없습니다. 오프라인 모드로 실행합니다.");
      setIsFirebaseAvailable(false);
    }
  }, [authContext]);

  // 교사/학생 권한 상태 관리
  const [userRole, setUserRole] = useState('unknown'); // 'teacher', 'student', 'unknown'
  
  // 사용자 권한 확인 및 설정
  useEffect(() => {
    if (!currentUser || !authContext) {
      setUserRole('unknown');
      return;
    }
    
    // 권한 확인 로직
    try {
      if (typeof authContext.isTeacher === 'function' && authContext.isTeacher()) {
        setUserRole('teacher');
        console.log("교사 권한이 확인되었습니다:", currentUser.email);
      } else if (typeof authContext.isStudent === 'function' && authContext.isStudent()) {
        setUserRole('student');
        console.log("학생 권한이 확인되었습니다:", currentUser.email);
      } else {
        // userType 필드로 직접 확인 (대체 방법)
        const userType = authContext.userType || currentUser.userType;
        if (userType === 'teacher') {
          setUserRole('teacher');
          console.log("교사 권한이 확인되었습니다 (userType 필드):", currentUser.email);
        } else if (userType === 'student') {
          setUserRole('student');
          console.log("학생 권한이 확인되었습니다 (userType 필드):", currentUser.email);
        } else {
          console.log("권한을 확인할 수 없습니다. 관리자에게 문의하세요:", currentUser.email);
          setUserRole('unknown');
        }
      }
    } catch (error) {
      console.error("권한 확인 중 오류 발생:", error);
      setUserRole('unknown');
    }
  }, [currentUser, authContext]);
  
  // 편의 함수
  const isTeacher = () => userRole === 'teacher';
  const isStudent = () => userRole === 'student';

  // 사용자 색상 정보 로드
  useEffect(() => {
    const loadUserColors = async () => {
      if (!isFirebaseAvailable || !currentUser) return;
      
      try {
        // 현재 레슨에 참여한 모든 사용자의 색상 정보 로드
        const usersQuery = query(collection(db, "users"));
        const userDocs = await getDocs(usersQuery);
        
        const colorsMap = {};
        userDocs.docs.forEach(doc => {
          const userData = doc.data();
          const userId = doc.id;
          
          // 개인 색상이 있으면 우선 사용, 없으면 반 색상 사용
          const userColor = userData.personalColor || userData.classColor || DEFAULT_COLOR;
          colorsMap[userId] = userColor;
        });
        
        setUserColors(colorsMap);
      } catch (error) {
        console.error("사용자 색상 정보 로드 오류:", error);
      }
    };
    
    loadUserColors();
  }, [currentUser, isFirebaseAvailable]);

  // 사용자별 색상 가져오기
  const getUserColor = useCallback((userId) => {
    return userColors[userId] || DEFAULT_COLOR;
  }, [userColors]);

  // 레슨별 지도 설정 적용
  const lessonConfig = LESSON_MAP_CONFIGS[lessonId] || LESSON_MAP_CONFIGS['1'];
  const mapCenter = center || lessonConfig.center;
  const mapZoom = zoom || lessonConfig.zoom;
  const mapMinZoom = lessonConfig.minZoom;
  const mapMaxZoom = lessonConfig.maxZoom;
  const mapBounds = lessonConfig.bounds;

  // 레슨 데이터 로드
  useEffect(() => {
    const loadLessonData = async () => {
      try {
        const response = await import(`../lessons/lesson${lessonId}/data.json`);
        setLessonData(response.default);

        
        // 레슨 초기 데이터를 지도에 적용
        if (response.default) {
          // 초기 마커가 있으면 추가
          if (response.default.initialMarkers) {
            setMarkers(prev => {
              const existingIds = prev.map(m => m.id);
              const newMarkers = response.default.initialMarkers.filter(m => !existingIds.includes(m.id));
              return [...prev, ...newMarkers.map(marker => ({
                ...marker,
                id: marker.id || Date.now().toString(),
                isInitial: true // 초기 마커 표시
              }))];
            });
          }
          
          // 초기 도형이 있으면 추가  
          if (response.default.initialShapes) {
            setShapes(prev => {
              const existingIds = prev.map(s => s.id);
              const newShapes = response.default.initialShapes.filter(s => !existingIds.includes(s.id));
              return [...prev, ...newShapes.map(shape => ({
                ...shape,
                id: shape.id || Date.now().toString(),
                isInitial: true // 초기 도형 표시
              }))];
            });
          }
        }
      } catch (error) {
        console.error("레슨 데이터 로드 실패:", error);
      }
    };
    
    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

  // Ref to the user's activity document in Firestore - 반별 구조로 변경
  const getUserActivityDocRef = useCallback((uid, targetClassId = null) => {
    const userClassId = targetClassId || classId;
    return (uid && userClassId && isFirebaseAvailable) ? 
      doc(db, "lessons", String(lessonId), "classActivities", userClassId, "students", uid) : null;
  }, [lessonId, classId, isFirebaseAvailable]);

  const userActivityDocRef = getUserActivityDocRef(currentUser?.uid);

  // 학생 문서 초기화 - 문서가 없을 경우 빈 문서 생성
  useEffect(() => {
    const initializeStudentDocument = async () => {
      if (!isFirebaseAvailable || !currentUser || !userActivityDocRef || !isStudent()) return;
      
      try {
        // 문서 존재 여부 확인
        const docSnap = await getDoc(userActivityDocRef);
        
        // 문서가 없으면 초기화
        if (!docSnap.exists()) {
          await setDoc(userActivityDocRef, { 
            markers: [], 
            shapes: [], 
            userId: currentUser.uid,
            classId: classId,
            lessonId: String(lessonId), 
            createdAt: serverTimestamp(), 
            lastUpdated: serverTimestamp() 
          });
          console.log("학생 활동 문서 초기화 완료:", lessonId, classId, currentUser.uid);
        }
      } catch (error) {
        console.error("학생 문서 초기화 오류:", error);
      }
    };
    
    initializeStudentDocument();
  }, [currentUser, userActivityDocRef, isFirebaseAvailable, isStudent, lessonId, classId]);

  // 교사용: 전체 반 목록 로드
  useEffect(() => {
    const loadAllClasses = async () => {
      if (isFirebaseAvailable && isTeacher()) {
        try {
          const usersQuery = query(
            collection(db, "users"), 
            where("role", "==", "student")
          );
          
          const userDocs = await getDocs(usersQuery);
          const classes = new Set();
          
          userDocs.docs.forEach(doc => {
            const userData = doc.data();
            if (userData.classId) {
              classes.add(userData.classId);
            }
          });
          
          setAllClasses(Array.from(classes).sort());
        } catch (error) {
          console.error("전체 반 목록 로드 오류:", error);
        }
      }
    };
    
    if (currentUser && isFirebaseAvailable) {
      loadAllClasses();
    }
  }, [currentUser, isTeacher, isFirebaseAvailable]);

  // 교사가 보는 경우 첫 로드 시 학급의 모든 학생 정보를 로드
  useEffect(() => {
    const loadClassStudents = async () => {
      if (isFirebaseAvailable && isTeacher()) {
        const targetClassId = selectedClass === 'all' ? classId : selectedClass;
        if (!targetClassId) return;
        
        try {
          const studentsQuery = query(
            collection(db, "users"), 
            where("role", "==", "student"), 
            where("classId", "==", targetClassId)
          );
          
          const studentDocs = await getDocs(studentsQuery);
          const studentsData = studentDocs.docs.map(doc => ({
            id: doc.id,
            email: doc.data().email,
            studentNumber: doc.data().studentNumber,
            classId: doc.data().classId
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
    
    if (currentUser && isFirebaseAvailable) {
      loadClassStudents();
    }
  }, [currentUser, classId, isTeacher, studentId, selectedClass, isFirebaseAvailable]);

  // --- Firestore Data Loading --- 
  useEffect(() => {
    // Firebase를 사용할 수 없는 경우 빈 배열로 초기화하고 종료
    if (!isFirebaseAvailable) {
      setMarkers([]);
      setShapes([]);
      return;
    }

    if (!currentUser) {
      console.log("User not logged in, cannot load data.");
      setMarkers([]);
      setShapes([]);
      return;
    }
    
    // 중복 마커 제거 유틸리티 함수
    const removeDuplicateMarkers = (markers) => {
      const seen = new Set();
      return markers.filter(marker => {
        if (!marker.id) return true; // ID가 없는 경우 보존
        if (seen.has(marker.id)) return false; // 이미 본 ID면 제외
        seen.add(marker.id); // ID 추적
        return true;
      });
    };
    
    // 학생인 경우: 자신의 데이터와 반 전체 데이터 모두 로드 (수정된 부분)
    if (isStudent()) {
      // 학생 자신의 데이터 불러오기
      const unsubscribe = onSnapshot(userActivityDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const myMarkers = (data.markers || []).map(marker => ({
            ...marker,
            isOwnMarker: true, // 자신의 마커 표시
            color: marker.color || getUserColor(currentUser.uid) || DEFAULT_COLOR
          }));
          
          // 반 전체 데이터 불러오기 함수
          const loadClassData = async () => {
            try {
              const classActivitiesRef = collection(db, "lessons", String(lessonId), "classActivities", classId, "students");
              const querySnapshot = await getDocs(classActivitiesRef);
              
              let allClassMarkers = [];
              // 중복 ID 추적을 위한 Set
              const markerIds = new Set(myMarkers.map(m => m.id));
              
              querySnapshot.forEach((doc) => {
                // 자신의 데이터는 제외
                if (doc.id === currentUser.uid) return;
                
                const data = doc.data();
                if (data.markers) {
                  // 중복되지 않은 마커만 추가
                  const uniqueMarkers = data.markers.filter(marker => !markerIds.has(marker.id));
                  
                  // 사용된 ID 추적
                  uniqueMarkers.forEach(marker => markerIds.add(marker.id));
                  
                  const classMarkersWithUser = uniqueMarkers.map(marker => ({
                    ...marker,
                    isOwnMarker: false, // 다른 학생의 마커
                    color: marker.color || getUserColor(doc.id) || DEFAULT_COLOR,
                    // 명시적으로 댓글 데이터를 보존하여 매핑
                    comments: marker.comments || [],
                    commentCount: marker.commentCount || (marker.comments ? marker.comments.length : 0),
                    // 모든 마커 메타데이터 보존
                    likes: marker.likes || 0,
                    likedBy: marker.likedBy || []
                  }));
                  allClassMarkers = [...allClassMarkers, ...classMarkersWithUser];
                }
              });
              
              console.log(`로드된 마커: 내 마커 ${myMarkers.length}개, 다른 학생 마커 ${allClassMarkers.length}개`);
              
              // 자신의 마커와 반 전체 마커 결합 (중복 제거 로직 추가)
              const combinedMarkers = [...myMarkers, ...allClassMarkers];
              const uniqueMarkers = removeDuplicateMarkers(combinedMarkers);
              setMarkers(uniqueMarkers);
              setShapes(data.shapes || []);
            } catch (error) {
              console.error("반 전체 데이터 로드 오류:", error);
              // 실패 시 자신의 마커만 표시
              setMarkers(removeDuplicateMarkers(myMarkers));
              setShapes(data.shapes || []);
            }
          };
          
          // 초기 로드
          loadClassData();
          
          // 실시간 업데이트는 복잡해질 수 있으므로 30초마다 갱신 (실제 상황에 맞게 조정)
          const intervalId = setInterval(loadClassData, 15000);
          
          return () => { 
            clearInterval(intervalId); 
          };
        } else {
          setMarkers([]);
          setShapes([]);
        }
      }, (error) => {
        console.error("Error listening to Firestore:", error);
      });
      
      return () => { unsubscribe(); };
    } 
    // 교사인 경우: 선택된 반의 데이터 로드
    else if (isTeacher()) {
      // 교사의 경우 selectedClass가 'all'이면 첫 번째 반을 선택하거나 모든 반을 보여줌
      let targetClassId;
      if (selectedClass === 'all') {
        // 교사가 'all'을 선택했을 때는 첫 번째 반을 기본으로 선택
        if (allClasses.length > 0) {
          targetClassId = allClasses[0]; // allClasses[0].id가 아니라 allClasses[0]
        } else {
          // 반 목록이 없으면 교사의 classId 사용 (있는 경우)
          targetClassId = classId;
        }
      } else {
        targetClassId = selectedClass;
      }
      
      if (!targetClassId) {
        console.log("교사 모드: 표시할 반이 선택되지 않았습니다.");
        return;
      }
      
      console.log(`교사 모드: ${targetClassId} 반의 데이터를 로드합니다.`, { allClasses, selectedClass });
      
      // 특정 학생의 데이터만 보기
      if (selectedStudent !== 'all') {
        const studentDocRef = getUserActivityDocRef(selectedStudent, targetClassId);
        if (!studentDocRef) return;
        
        const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const markersWithClass = (data.markers || []).map(marker => ({
              ...marker,
              classId: targetClassId,
              color: marker.color || getUserColor(selectedStudent) || DEFAULT_COLOR
            }));
            // 중복 제거 로직 추가
            setMarkers(removeDuplicateMarkers(markersWithClass));
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
      // 전체 학생 데이터 보기 (해당 반의 모든 학생 데이터를 병합)
      else {
        const classActivitiesRef = collection(db, "lessons", String(lessonId), "classActivities", targetClassId, "students");
        
        // 복잡한 병합 로직을 위해 한 번 데이터 로드 후 처리
        const fetchAllClassData = async () => {
          try {
            console.log("fetchAllClassData 시작:", { targetClassId, lessonId });
            const querySnapshot = await getDocs(classActivitiesRef);
            
            console.log("Firestore 쿼리 결과:", querySnapshot.size, "개 문서");
            
            let allMarkers = [];
            let allShapes = [];
            
            // 중복 ID 추적을 위한 Set
            const markerIds = new Set();
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              console.log(`학생 ${doc.id} 데이터:`, { 
                markersCount: data.markers?.length || 0, 
                shapesCount: data.shapes?.length || 0 
              });
              
              if (data.markers) {
                // 중복되지 않은 마커만 추가
                const uniqueMarkers = data.markers.filter(marker => !markerIds.has(marker.id));
                
                // 사용된 ID 추적
                uniqueMarkers.forEach(marker => markerIds.add(marker.id));
                
                const markersWithClass = uniqueMarkers.map(marker => ({
                  ...marker,
                  classId: targetClassId,
                  userId: doc.id, // 학생 ID 보존
                  color: marker.color || getUserColor(doc.id) || DEFAULT_COLOR,
                  // 명시적으로 댓글 데이터를 보존하여 매핑
                  comments: marker.comments || [],
                  commentCount: marker.commentCount || (marker.comments ? marker.comments.length : 0),
                  // 모든 마커 메타데이터 보존
                  likes: marker.likes || 0,
                  likedBy: marker.likedBy || []
                }));
                allMarkers = [...allMarkers, ...markersWithClass];
              }
              if (data.shapes) allShapes = [...allShapes, ...data.shapes];
            });
            
            console.log(`교사 모드 - 로드된 마커: ${allMarkers.length}개`, allMarkers);
            
            // 중복 제거 로직 추가
            setMarkers(removeDuplicateMarkers(allMarkers));
            setShapes(allShapes);
          } catch (error) {
            console.error("Error loading class data:", error);
          }
        };
        
        fetchAllClassData();
        
        // 실시간 업데이트는 복잡해질 수 있으므로 30초마다 갱신 (실제 상황에 맞게 조정)
        const intervalId = setInterval(fetchAllClassData, 30000);
        
        return () => { clearInterval(intervalId); };
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, lessonId, isStudent, isTeacher, userActivityDocRef, selectedStudent, selectedClass, getUserColor, isFirebaseAvailable]);

  // --- Event Handlers with Firestore Integration ---

  const handleMapClick = async (latlng) => {
    // 기초배움 단계(step 1)에서는 학생의 마커 추가를 무반응으로 처리
    if (currentStep === 1 && isStudent()) {
      // 아무 반응 없이 그냥 리턴 (알람도 없음)
      return;
    }

    // 가이드 활동 단계(step 2)에서만 마커 추가 허용
    if (currentStep !== 2) {
      // 교사는 모든 단계에서 마커 추가 가능하도록 예외 처리
      if (!isTeacher()) {
        // 미션 단계(step 3)에서도 학생 마커 추가 허용
        if (currentStep !== 3) {
          alert('마커 추가는 "가이드 활동"과 "미션" 단계에서만 가능합니다.');
          return;
        }
      }
    }

    // Firebase를 사용할 수 없는 경우 로컬에서만 마커 추가
    if (!isFirebaseAvailable) {
      if (window.confirm('이 위치에 마커를 추가하시겠습니까? (오프라인 모드 - 저장되지 않습니다)')) {
        const newMarker = {
          id: Date.now(),
          position: [latlng.lat, latlng.lng],
          title: '새로운 표시 (오프라인)',
          description: '오프라인 모드에서 생성된 마커',
          content: '',
          images: [],
          userId: 'offline-user',
          classId: classId || 'offline-class',
          color: DEFAULT_COLOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEditable: true,
          commentCount: 0
        };
        setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
      }
      return;
    }

    // 사용자가 로그인되어 있지 않으면 마커 추가 불가
    if (!currentUser) {
      console.error("Cannot add marker: User not logged in.");
      alert('로그인이 필요합니다.');
      return; 
    }

    // 학생인 경우: 자신의 데이터에만 추가 가능
    if (isStudent()) {
      if (!userActivityDocRef) {
        console.error("Cannot add marker: Student doc ref missing.");
        alert('학생 데이터 참조를 찾을 수 없습니다.');
        return;
      }
      
      // 문서가 존재하는지 확인하고, 없으면 초기화
      try {
        const docSnap = await getDoc(userActivityDocRef);
        if (!docSnap.exists()) {
          await setDoc(userActivityDocRef, { 
            markers: [], 
            shapes: [], 
            userId: currentUser.uid,
            classId: classId,
            lessonId: String(lessonId), 
            createdAt: serverTimestamp(), 
            lastUpdated: serverTimestamp() 
          });
          console.log("마커 추가 전 문서 초기화 완료");
        }
      } catch (error) {
        console.error("마커 추가 전 문서 확인/초기화 오류:", error);
        alert('데이터 초기화에 실패했습니다. 다시 시도해 주세요.');
        return;
      }
    }
    
    // 교사인 경우: 다른 학생/반 데이터를 보고 있을 때는 추가 불가
    if (isTeacher() && (selectedStudent !== 'all' || selectedClass !== classId)) {
      console.error("Cannot add marker: Teacher viewing other student's/class data.");
      alert('다른 학생이나 반의 데이터를 보고 있을 때는 마커를 추가할 수 없습니다.');
      return; 
    }

    // 차시별 맞춤 안내 문구 + 공통 안내문구 추가
    const promptText = isStudent() ? 
      (LESSON_MARKER_PROMPTS[lessonId] || '이 위치에 대한 설명을 작성해주세요:') + '\n\n아래 칸에 번호를 적어주세요. 추가된 마커를 수정해서 내용을 미션에 맞게 채워보세요.' :
      '이 위치에 마커를 추가하시겠습니까?';
      
    const description = prompt(promptText);
    if (description) {
      const markerId = `marker_${Date.now()}_${currentUser.uid}`;
      const newMarker = {
        id: markerId,
        position: [latlng.lat, latlng.lng],
        title: description.length > 50 ? description.substring(0, 50) + '...' : description, // 제목 (50자 제한)
        description: description, // 기본 설명 (하위 호환성을 위해 유지)
        content: '', // 상세 내용 (추후 확장)
        images: [], // 첨부 이미지 URL 배열
        userId: currentUser.uid,
        userName: currentUser.email.split('@')[0], // 사용자 표시명
        classId: classId,
        color: getUserColor(currentUser.uid),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEditable: true, // 작성자 수정 가능
        commentCount: 0, // 댓글 수 (캐시용)
        // 추후 확장 필드들
        tags: [], // 태그 배열
        isPublic: true, // 공개 여부
        likes: 0, // 좋아요 수
        likedBy: [] // 좋아요한 사용자 배열
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
    }
  };

  // 마커 선택 핸들러 - 마커 클릭 시 모달 열기
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setModalMode('view');
    setEditTitle(marker.title || '');
    setEditDescription(marker.description || '');
    setEditContent(marker.content || '');
    // 이미지 URL 배열도 상태에 저장
    setSelectedImages([]);
    setShowModal(true);
  };
  
  // 모달 닫기 처리
  const handleCloseModal = () => {
    setShowModal(false);
    // 약간의 지연 후 선택된 마커 초기화 (애니메이션을 위해)
    setTimeout(() => {
      setSelectedMarker(null);
      setEditingMarkerId(null);
      setModalMode('view');
    }, 200);
  };

  // 모달에서 편집 모드로 전환
  const handleEditMode = () => {
    // 작성자 또는 교사만 수정 가능하도록 체크
    if (selectedMarker && selectedMarker.userId !== currentUser?.uid && !isTeacher()) {
      alert('자신이 작성한 마커만 수정할 수 있습니다.');
      return;
    }
    
    // 교사가 다른 학생의 마커를 수정할 때 확인
    if (selectedMarker && selectedMarker.userId !== currentUser?.uid && isTeacher()) {
      if (!window.confirm('교사 권한으로 이 마커를 수정하시겠습니까?')) {
        return;
      }
    }
    
    setModalMode('edit');
    setEditTitle(selectedMarker?.title || '');
    setEditDescription(selectedMarker?.description || '');
    setEditContent(selectedMarker?.content || '');
  };

  // 모달에서 마커 삭제
  const handleModalDelete = () => {
    if (!selectedMarker) return;
    
    // 권한 확인 및 로그
    console.log("마커 삭제 시도:", {
      userRole,
      isTeacherResult: isTeacher(),
      markerId: selectedMarker.id,
      markerUserId: selectedMarker.userId,
      currentUserId: currentUser?.uid
    });
    
    // 작성자 또는 교사만 삭제 가능하도록 체크
    if (selectedMarker.userId !== currentUser?.uid && !isTeacher()) {
      alert('자신이 작성한 마커만 삭제할 수 있습니다.');
      return;
    }
    
    // 교사인 경우 학생 마커도 삭제 가능
    const isOwner = selectedMarker.userId === currentUser?.uid;
    const hasTeacherPermission = isTeacher();
    
    // 교사가 학생 마커 삭제 시 확인 메시지
    const confirmMessage = hasTeacherPermission && !isOwner
      ? '교사 권한으로 이 학생 마커를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      : '정말로 이 마커를 삭제하시겠습니까?';
    
    if(window.confirm(confirmMessage)) {
      try {
        handleMarkerDelete(selectedMarker.id);
        handleCloseModal();
        console.log("마커 삭제 성공!");
      } catch (error) {
        console.error("마커 삭제 중 오류:", error);
        alert('마커 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 모달에서 마커 저장
  const handleModalSave = async () => {
    try {
      // 로딩 상태 표시
      setIsUploading(true);

      let imageUrls = [];
      // 이미지 파일이 선택되었다면 업로드
      if (selectedFiles && selectedFiles.length > 0) {
        imageUrls = await uploadImagesToStorage(selectedFiles, selectedMarker.id);
      }

      const updateData = {
        title: editTitle,
        description: editDescription,
        content: editContent,
        // 기존 이미지와 새 이미지 URL 합치기
        images: [...(selectedMarker.images || []), ...imageUrls]
      };
      
      await handleSaveDescription(selectedMarker.id, updateData);
      setModalMode('view');
      handleCloseModal();
    } catch (error) {
      console.error('마커 저장 오류:', error);
      alert('마커 저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (marker) => {
    // 마커 작성자이거나 교사인 경우에만 수정 허용
    if (marker.userId !== currentUser.uid && !isTeacher()) {
      alert('자신이 생성한 마커만 수정할 수 있습니다.');
      return;
    }
    
    // 작성자가 아닌 교사가 수정하려고 할 때 경고
    if (marker.userId !== currentUser.uid && isTeacher()) {
      const confirmEdit = window.confirm(
        '다른 사용자의 마커를 수정하시겠습니까?\n교육 목적으로만 사용해주세요.'
      );
      if (!confirmEdit) return;
    }
    
    setEditingMarkerId(marker.id);
    // 현재는 description만 수정, 추후 title, content 등도 수정 가능하도록 확장
    setCurrentDescription(marker.description || marker.title || '');
  };



  const handleSaveDescription = async (markerId, updateData = null) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent, selectedClass)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const currentMarkers = [...markers]; 
    const markerIndex = currentMarkers.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return; 

    const originalMarker = currentMarkers[markerIndex];
    
    // updateData가 제공된 경우 (편집 모드에서 호출) 또는 기본 description 업데이트
    const updatedMarker = updateData ? {
      ...originalMarker,
      ...updateData,
      title: updateData.title || (updateData.description && updateData.description.length > 50 ? updateData.description.substring(0, 50) + '...' : updateData.description) || originalMarker.title,
      updatedAt: new Date().toISOString(),
      // 수정자 정보 추가 (작성자가 아닌 경우)
      ...(originalMarker.userId !== currentUser.uid && {
        lastEditedBy: currentUser.uid,
        lastEditedByName: currentUser.email.split('@')[0],
        isEdited: true
      })
    } : {
      ...originalMarker, 
      title: currentDescription.length > 50 ? currentDescription.substring(0, 50) + '...' : currentDescription,
      description: currentDescription,
      updatedAt: new Date().toISOString(),
      // 수정자 정보 추가 (작성자가 아닌 경우)
      ...(originalMarker.userId !== currentUser.uid && {
        lastEditedBy: currentUser.uid,
        lastEditedByName: currentUser.email.split('@')[0],
        isEdited: true
      })
    };
    
    const updatedMarkersArray = [
      ...currentMarkers.slice(0, markerIndex),
      updatedMarker,
      ...currentMarkers.slice(markerIndex + 1)
    ];

    // Optimistically update local state first
    setMarkers(updatedMarkersArray);
    
    // 기본 모드에서만 편집 상태 초기화
    if (!updateData) {
      setEditingMarkerId(null); 
      setCurrentDescription('');
    }

    try {
        await updateDoc(docRefToUpdate, {
            markers: updatedMarkersArray, 
            lastUpdated: serverTimestamp()
        });
        console.log(`Marker ${markerId} updated in Firestore`);
        if (markerPopupRef.current?.closePopup) {
          markerPopupRef.current.closePopup(); // Close popup AFTER successful save
        }
    } catch (error) {
        console.error("Error updating marker:", error);
        // Revert local state on error
        setMarkers(currentMarkers); 
        alert('마커 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelEdit = () => {
    setEditingMarkerId(null); // Exit editing mode - this will cause re-render
    setCurrentDescription('');
  };

  const handleMarkerDelete = async (markerId) => {
    console.log("마커 삭제 함수 호출:", markerId);
    
    try {
      // 삭제할 마커 찾기
      const markerToDelete = markers.find(m => m.id === markerId);
      if (!markerToDelete) {
        console.error("삭제할 마커를 찾을 수 없습니다.");
        return;
      }
      
      // 권한 검사 개선 - 교사는 모든 마커 삭제 가능
      const isOwner = markerToDelete.userId === currentUser?.uid;
      const hasTeacherRole = userRole === 'teacher';
      
      console.log("마커 삭제 권한 검사:", { isOwner, hasTeacherRole });
      
      if (!isOwner && !hasTeacherRole) {
        alert('자신이 생성한 마커만 삭제할 수 있습니다.');
        return;
      }
      
      // 마커 소유자의 문서 참조 가져오기
      let docRefToUpdate;
      
      if (hasTeacherRole && !isOwner) {
        // 교사가 학생 마커 삭제 - 해당 학생의 문서 참조 가져오기
        docRefToUpdate = doc(db, "lessons", String(lessonId), "classActivities", classId, "students", markerToDelete.userId);
        console.log("교사가 학생 마커 삭제:", { markerUserId: markerToDelete.userId, docRef: !!docRefToUpdate });
      } else {
        // 자신의 마커 삭제
        docRefToUpdate = userActivityDocRef;
        console.log("자신의 마커 삭제:", { docRef: !!docRefToUpdate });
      }
      
      if (!docRefToUpdate) {
        console.error("문서 참조를 가져올 수 없습니다.");
        alert('문서 참조를 가져올 수 없습니다.');
        return;
      }
  
      // Optimistically update local state
      const previousMarkers = [...markers];
      setMarkers((prevMarkers) => prevMarkers.filter((m) => m.id !== markerId));
  
      // Firestore에서 삭제
      console.log("Firestore 업데이트 시도:", {
        docRefPath: docRefToUpdate.path,
        markerIdToDelete: markerId
      });
      
      // 안전한 방법으로 마커 업데이트
      const currentDoc = await getDoc(docRefToUpdate);
      if (currentDoc.exists()) {
        const docData = currentDoc.data();
        const updatedMarkers = (docData.markers || []).filter(m => m.id !== markerId);
        
        await updateDoc(docRefToUpdate, {
          markers: updatedMarkers,
          lastUpdated: serverTimestamp()
        });
        
        console.log(`Marker ${markerId} deleted from Firestore successfully`);
      } else {
        throw new Error("문서가 존재하지 않습니다");
      }
    } catch (error) {
      console.error("마커 삭제 중 오류:", error);
      alert(`마커 삭제 중 오류가 발생했습니다: ${error.message}`);
      
      // 실패 시 상태 복원
      const previousMarkers = [...markers];
      setMarkers(previousMarkers);
    }
  };

  // --- Drawing Event Handlers ---
  const _onCreate = async (e) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent, selectedClass)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const { layerType, layer } = e;
    const geojson = layer.toGeoJSON();
    const newShape = {
      id: L.stamp(layer), // Use Leaflet's internal ID
      type: layerType,
      geojson: geojson,
      userId: currentUser.uid,
      classId: classId,
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
      ? getUserActivityDocRef(selectedStudent, selectedClass)
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
      ? getUserActivityDocRef(selectedStudent, selectedClass)
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

  // 반별 색상으로 마커 아이콘 생성
  const createClassMarkerIcon = (color) => {
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10.5 12.5 28.5 12.5 28.5S25 23 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
          <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
        </svg>
      `)}`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
  };



  // 좋아요 기능
  const handleLike = async (markerId) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const markerIndex = markers.findIndex(m => m.id === markerId);
      if (markerIndex === -1) return;

      const marker = markers[markerIndex];
      const likedBy = marker.likedBy || [];
      const hasLiked = likedBy.includes(currentUser.uid);
      
      // 좋아요 상태 업데이트 - likedBy 배열 기반으로 처리
      const updatedLikedBy = hasLiked 
        ? likedBy.filter(uid => uid !== currentUser.uid)
        : [...likedBy, currentUser.uid];
      
      const updatedMarker = {
        ...marker,
        // 좋아요 수는 항상 likedBy 배열의 길이로 설정
        likes: updatedLikedBy.length,
        likedBy: updatedLikedBy,
        updatedAt: new Date().toISOString()
      };

      const newMarkers = [...markers];
      newMarkers[markerIndex] = updatedMarker;
      setMarkers(newMarkers);

      // 선택된 마커를 업데이트하여 UI 갱신
      if(selectedMarker && selectedMarker.id === markerId) {
        setSelectedMarker(updatedMarker);
      }

      // Firebase에 저장
      if (isFirebaseAvailable) {
        // 1. 자신의 문서에 저장
        const docRefToUpdate = userActivityDocRef;
        if (docRefToUpdate) {
          await updateDoc(docRefToUpdate, {
            markers: newMarkers,
            lastUpdated: serverTimestamp()
          });
          console.log("좋아요 업데이트 완료:", updatedMarker.likes);
        }
        
        // 2. 마커 주인의 문서에도 좋아요 상태 업데이트 (다른 학생의 마커인 경우)
        if (marker.userId !== currentUser.uid) {
          // 마커 작성자의 문서 경로 생성
          const markerOwnerDocRef = doc(db, "lessons", String(lessonId), "classActivities", marker.classId, "students", marker.userId);
          
          try {
            // 마커 주인의 문서에서 최신 데이터 가져오기
            const ownerDocSnap = await getDoc(markerOwnerDocRef);
            
            if (ownerDocSnap.exists()) {
              const ownerData = ownerDocSnap.data();
              const ownerMarkers = ownerData.markers || [];
              
              // 해당 마커 찾기
              const ownerMarkerIndex = ownerMarkers.findIndex(m => m.id === markerId);
              
              if (ownerMarkerIndex !== -1) {
                // 마커 주인의 문서에서 해당 마커 가져오기
                const ownerMarker = ownerMarkers[ownerMarkerIndex];
                const ownerLikedBy = ownerMarker.likedBy || [];
                
                // 좋아요 상태 업데이트
                const updatedOwnerLikedBy = hasLiked
                  ? ownerLikedBy.filter(uid => uid !== currentUser.uid)
                  : [...ownerLikedBy, currentUser.uid];
                
                // 업데이트된 마커 생성
                const updatedOwnerMarker = {
                  ...ownerMarker,
                  likes: updatedOwnerLikedBy.length,
                  likedBy: updatedOwnerLikedBy,
                  updatedAt: new Date().toISOString()
                };
                
                // 마커 주인의 마커 배열 업데이트
                const updatedOwnerMarkers = [
                  ...ownerMarkers.slice(0, ownerMarkerIndex),
                  updatedOwnerMarker,
                  ...ownerMarkers.slice(ownerMarkerIndex + 1)
                ];
                
                // 마커 주인의 문서 업데이트
                await updateDoc(markerOwnerDocRef, {
                  markers: updatedOwnerMarkers,
                  lastUpdated: serverTimestamp()
                });
                
                console.log("마커 주인 문서의 좋아요 업데이트 완료:", updatedOwnerMarker.likes);
              } else {
                console.error("마커 주인의 문서에서 해당 마커를 찾을 수 없습니다");
              }
            } else {
              console.error("마커 주인의 문서가 존재하지 않습니다");
            }
          } catch (ownerError) {
            console.error("마커 주인 문서 업데이트 오류:", ownerError);
          }
        }
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 댓글 기능 (실제 저장 및 표시)
  const handleComment = (markerId) => {
    try {
      // 현재 사용자 로그인 확인
      if (!currentUser) {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
        return;
      }

      const comment = prompt('댓글을 입력하세요:');
      if (comment && comment.trim()) {
        const markerIndex = markers.findIndex(m => m.id === markerId);
        if (markerIndex === -1) return;

        const marker = markers[markerIndex];
        
        // 고유한 댓글 ID 생성 - 더 안전한 형식으로 생성
        const uniqueId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${currentUser.uid.substring(0, 6)}`;
        
        // 새 댓글 객체 생성
        const newComment = {
          id: uniqueId,
          text: comment.trim(),
          userId: currentUser.uid,
          userName: currentUser.email ? currentUser.email.split('@')[0] : '익명',
          createdAt: new Date().toISOString(),
          likes: 0,
          likedBy: []
        };
        
        // 기존 댓글 배열에 새 댓글 추가
        const existingComments = marker.comments || [];
        const updatedComments = [...existingComments, newComment];
        
        // 마커 업데이트
        const updatedMarker = {
          ...marker,
          comments: updatedComments,
          commentCount: updatedComments.length,
          updatedAt: new Date().toISOString()
        };

        // 마커 배열 업데이트
        const newMarkers = [...markers];
        newMarkers[markerIndex] = updatedMarker;
        setMarkers(newMarkers);

        // 선택된 마커를 업데이트하여 UI 갱신
        if(selectedMarker && selectedMarker.id === markerId) {
          setSelectedMarker(updatedMarker);
        }

        // Firebase에 저장
        if (isFirebaseAvailable) {
          // 1. 먼저 자신의 문서에 댓글 저장 (댓글 작성자 본인)
          const docRefToUpdate = userActivityDocRef;
          
          if (docRefToUpdate) {
            updateDoc(docRefToUpdate, {
              markers: newMarkers,
              lastUpdated: serverTimestamp()
            }).then(() => {
              console.log("내 문서에 댓글이 성공적으로 저장되었습니다.");
            }).catch((error) => {
              console.error("댓글 저장 실패:", error);
            });
          }
          
          // 2. 마커 주인의 문서에도 댓글 저장 (다른 학생의 마커에 댓글을 달았을 경우)
          if (marker.userId !== currentUser.uid) {
            console.log("다른 학생의 마커에 댓글 저장 시도:", marker.userId);
            
            // 마커 작성자의 문서 경로 생성
            const markerOwnerDocRef = doc(db, "lessons", String(lessonId), "classActivities", marker.classId, "students", marker.userId);
            
            // 마커 주인의 문서에서 데이터 가져오기
            getDoc(markerOwnerDocRef).then((docSnap) => {
              if (docSnap.exists()) {
                const ownerData = docSnap.data();
                const ownerMarkers = ownerData.markers || [];
                
                // 해당 마커 찾기
                const ownerMarkerIndex = ownerMarkers.findIndex(m => m.id === markerId);
                
                if (ownerMarkerIndex !== -1) {
                  // 마커 주인의 문서에서 해당 마커 업데이트
                  const ownerMarker = ownerMarkers[ownerMarkerIndex];
                  const ownerComments = ownerMarker.comments || [];
                  
                  // 새 댓글 추가
                  const updatedOwnerComments = [...ownerComments, newComment];
                  
                  // 마커 업데이트
                  const updatedOwnerMarker = {
                    ...ownerMarker,
                    comments: updatedOwnerComments,
                    commentCount: updatedOwnerComments.length,
                    updatedAt: new Date().toISOString()
                  };
                  
                  // 마커 배열 업데이트
                  const updatedOwnerMarkers = [
                    ...ownerMarkers.slice(0, ownerMarkerIndex),
                    updatedOwnerMarker,
                    ...ownerMarkers.slice(ownerMarkerIndex + 1)
                  ];
                  
                  // 마커 주인의 문서 업데이트
                  updateDoc(markerOwnerDocRef, {
                    markers: updatedOwnerMarkers,
                    lastUpdated: serverTimestamp()
                  }).then(() => {
                    console.log("마커 주인의 문서에 댓글이 성공적으로 저장되었습니다.");
                  }).catch((error) => {
                    console.error("마커 주인의 문서에 댓글 저장 실패:", error);
                  });
                } else {
                  console.error("마커 주인의 문서에서 해당 마커를 찾을 수 없습니다.", markerId);
                  console.log("마커 주인의 마커 ID들:", ownerMarkers.map(m => m.id));
                }
              } else {
                console.error("마커 주인의 문서가 존재하지 않습니다.");
              }
            }).catch((error) => {
              console.error("마커 주인의 문서 조회 실패:", error);
            });
          }
        }
      }
    } catch (error) {
      console.error('댓글 처리 실패:', error);
      alert('댓글 처리에 실패했습니다.');
    }
  };
  
  // 댓글 좋아요 기능
  const handleCommentLike = (markerId, commentId) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      const markerIndex = markers.findIndex(m => m.id === markerId);
      if (markerIndex === -1) return;

      const marker = markers[markerIndex];
      const comments = [...(marker.comments || [])];
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex === -1) return;
      
      const comment = comments[commentIndex];
      const likedBy = comment.likedBy || [];
      const hasLiked = likedBy.includes(currentUser.uid);
      
      // 좋아요 상태 업데이트
      const updatedComment = {
        ...comment,
        likes: hasLiked ? Math.max(0, (comment.likes || 1) - 1) : (comment.likes || 0) + 1,
        likedBy: hasLiked 
          ? likedBy.filter(uid => uid !== currentUser.uid)
          : [...likedBy, currentUser.uid]
      };
      
      comments[commentIndex] = updatedComment;
      
      // 마커 업데이트
      const updatedMarker = {
        ...marker,
        comments: comments,
        updatedAt: new Date().toISOString()
      };
      
      // 마커 배열 업데이트
      const newMarkers = [...markers];
      newMarkers[markerIndex] = updatedMarker;
      setMarkers(newMarkers);
      
      // 선택된 마커를 업데이트하여 UI 갱신
      if(selectedMarker && selectedMarker.id === markerId) {
        setSelectedMarker(updatedMarker);
      }
      
      // Firebase에 저장
      if (isFirebaseAvailable) {
        // 1. 자신의 문서에서 좋아요 업데이트
        const docRefToUpdate = userActivityDocRef;
          
        if (docRefToUpdate) {
          updateDoc(docRefToUpdate, {
            markers: newMarkers,
            lastUpdated: serverTimestamp()
          }).then(() => {
            console.log("내 문서에서 댓글 좋아요가 성공적으로 업데이트되었습니다.");
          }).catch((error) => {
            console.error("댓글 좋아요 업데이트 실패:", error);
          });
        }
        
        // 2. 마커 주인의 문서에서도 좋아요 업데이트 (다른 학생의 마커에 달린 댓글인 경우)
        if (marker.userId !== currentUser.uid) {
          // 마커 작성자의 문서 경로 생성
          const markerOwnerDocRef = doc(db, "lessons", String(lessonId), "classActivities", marker.classId, "students", marker.userId);
          
          // 마커 주인의 문서에서 데이터 가져오기
          getDoc(markerOwnerDocRef).then((docSnap) => {
            if (docSnap.exists()) {
              const ownerData = docSnap.data();
              const ownerMarkers = ownerData.markers || [];
              
              // 해당 마커 찾기
              const ownerMarkerIndex = ownerMarkers.findIndex(m => m.id === markerId);
              
              if (ownerMarkerIndex !== -1) {
                // 마커 주인의 문서에서 해당 마커 업데이트
                const ownerMarker = ownerMarkers[ownerMarkerIndex];
                const ownerComments = ownerMarker.comments || [];
                
                // 해당 댓글 찾기
                const ownerCommentIndex = ownerComments.findIndex(c => c.id === commentId);
                
                if (ownerCommentIndex !== -1) {
                  // 댓글 좋아요 업데이트
                  const ownerComment = ownerComments[ownerCommentIndex];
                  const ownerLikedBy = ownerComment.likedBy || [];
                  const ownerHasLiked = ownerLikedBy.includes(currentUser.uid);
                  
                  // 좋아요 상태 업데이트 (이 부분은 항상 위의 로직과 동일하게 유지)
                  const updatedOwnerComment = {
                    ...ownerComment,
                    likes: ownerHasLiked ? Math.max(0, (ownerComment.likes || 1) - 1) : (ownerComment.likes || 0) + 1,
                    likedBy: ownerHasLiked 
                      ? ownerLikedBy.filter(uid => uid !== currentUser.uid)
                      : [...ownerLikedBy, currentUser.uid]
                  };
                  
                  // 새로운 댓글 배열 생성
                  const updatedOwnerComments = [
                    ...ownerComments.slice(0, ownerCommentIndex),
                    updatedOwnerComment,
                    ...ownerComments.slice(ownerCommentIndex + 1)
                  ];
                  
                  // 마커 업데이트
                  const updatedOwnerMarker = {
                    ...ownerMarker,
                    comments: updatedOwnerComments,
                    updatedAt: new Date().toISOString()
                  };
                  
                  // 마커 배열 업데이트
                  const updatedOwnerMarkers = [
                    ...ownerMarkers.slice(0, ownerMarkerIndex),
                    updatedOwnerMarker,
                    ...ownerMarkers.slice(ownerMarkerIndex + 1)
                  ];
                  
                  // 마커 주인의 문서 업데이트
                  updateDoc(markerOwnerDocRef, {
                    markers: updatedOwnerMarkers,
                    lastUpdated: serverTimestamp()
                  }).then(() => {
                    console.log("마커 주인의 문서에서 댓글 좋아요가 성공적으로 업데이트되었습니다.");
                  }).catch((error) => {
                    console.error("마커 주인의 문서에서 댓글 좋아요 업데이트 실패:", error);
                  });
                } else {
                  console.error("마커 주인의 문서에서 해당 댓글을 찾을 수 없습니다.");
                }
              } else {
                console.error("마커 주인의 문서에서 해당 마커를 찾을 수 없습니다.");
              }
            } else {
              console.error("마커 주인의 문서가 존재하지 않습니다.");
            }
          }).catch((error) => {
            console.error("마커 주인의 문서 조회 실패:", error);
          });
        }
      }
    } catch (error) {
      console.error('댓글 좋아요 처리 실패:', error);
    }
  };
  
  // 댓글 삭제 기능
  const handleDeleteComment = (markerId, commentId) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      const markerIndex = markers.findIndex(m => m.id === markerId);
      if (markerIndex === -1) return;

      const marker = markers[markerIndex];
      const comments = [...(marker.comments || [])];
      const commentIndex = comments.findIndex(c => c.id === commentId);
      
      if (commentIndex === -1) return;
      
      const comment = comments[commentIndex];
      
      // 댓글 작성자 또는 교사만 삭제 가능
      const userIsTeacher = isTeacher();
      console.log("삭제 권한 확인:", { userIsTeacher, commentUserId: comment.userId, currentUserId: currentUser.uid });
      
      if (comment.userId !== currentUser.uid && !userIsTeacher) {
        alert('자신이 작성한 댓글만 삭제할 수 있습니다.');
        return;
      }
      
      // 교사가 다른 학생의 댓글을 삭제할 때 확인 메시지 변경
      const confirmMessage = userIsTeacher && comment.userId !== currentUser.uid
        ? '교사 권한으로 이 댓글을 삭제하시겠습니까?'
        : '이 댓글을 삭제하시겠습니까?';
      
      if (!window.confirm(confirmMessage)) return;
      
      // 댓글 삭제
      const updatedComments = comments.filter(c => c.id !== commentId);
      
      // 마커 업데이트
      const updatedMarker = {
        ...marker,
        comments: updatedComments,
        commentCount: updatedComments.length,
        updatedAt: new Date().toISOString()
      };
      
      // 마커 배열 업데이트
      const newMarkers = [...markers];
      newMarkers[markerIndex] = updatedMarker;
      setMarkers(newMarkers);
      
      // 선택된 마커를 업데이트하여 UI 갱신
      if(selectedMarker && selectedMarker.id === markerId) {
        setSelectedMarker(updatedMarker);
      }
      
      // Firebase에 저장
      if (isFirebaseAvailable) {
        // 1. 자신의 문서에서 댓글 삭제
        const docRefToUpdate = userActivityDocRef;
          
        if (docRefToUpdate) {
          updateDoc(docRefToUpdate, {
            markers: newMarkers,
            lastUpdated: serverTimestamp()
          }).then(() => {
            console.log("내 문서에서 댓글이 성공적으로 삭제되었습니다.");
          }).catch((error) => {
            console.error("댓글 삭제 실패:", error);
          });
        }
        
        // 2. 마커 주인의 문서에서도 댓글 삭제 (다른 학생의 마커에 달린 댓글인 경우)
        if (marker.userId !== currentUser.uid) {
          // 마커 작성자의 문서 경로 생성
          const markerOwnerDocRef = doc(db, "lessons", String(lessonId), "classActivities", marker.classId, "students", marker.userId);
          
          // 마커 주인의 문서에서 데이터 가져오기
          getDoc(markerOwnerDocRef).then((docSnap) => {
            if (docSnap.exists()) {
              const ownerData = docSnap.data();
              const ownerMarkers = ownerData.markers || [];
              
              // 해당 마커 찾기
              const ownerMarkerIndex = ownerMarkers.findIndex(m => m.id === markerId);
              
              if (ownerMarkerIndex !== -1) {
                // 마커 주인의 문서에서 해당 마커 업데이트
                const ownerMarker = ownerMarkers[ownerMarkerIndex];
                const ownerComments = ownerMarker.comments || [];
                
                // 댓글 삭제
                const updatedOwnerComments = ownerComments.filter(c => c.id !== commentId);
                
                // 마커 업데이트
                const updatedOwnerMarker = {
                  ...ownerMarker,
                  comments: updatedOwnerComments,
                  commentCount: updatedOwnerComments.length,
                  updatedAt: new Date().toISOString()
                };
                
                // 마커 배열 업데이트
                const updatedOwnerMarkers = [
                  ...ownerMarkers.slice(0, ownerMarkerIndex),
                  updatedOwnerMarker,
                  ...ownerMarkers.slice(ownerMarkerIndex + 1)
                ];
                
                // 마커 주인의 문서 업데이트
                updateDoc(markerOwnerDocRef, {
                  markers: updatedOwnerMarkers,
                  lastUpdated: serverTimestamp()
                }).then(() => {
                  console.log("마커 주인의 문서에서 댓글이 성공적으로 삭제되었습니다.");
                }).catch((error) => {
                  console.error("마커 주인의 문서에서 댓글 삭제 실패:", error);
                });
              } else {
                console.error("마커 주인의 문서에서 해당 마커를 찾을 수 없습니다.");
              }
            } else {
              console.error("마커 주인의 문서가 존재하지 않습니다.");
            }
          }).catch((error) => {
            console.error("마커 주인의 문서 조회 실패:", error);
          });
        }
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 공유 기능
  const handleShare = (marker) => {
    if (navigator.share) {
      navigator.share({
        title: marker.title || '서울 지도 마커',
        text: marker.description,
        url: window.location.href
      });
    } else {
      // 클립보드에 복사
      const shareText = `${marker.title || '서울 지도 마커'}: ${marker.description}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('마커 정보가 클립보드에 복사되었습니다.');
      }).catch(() => {
        alert('공유 기능을 사용할 수 없습니다.');
      });
    }
  };

  // 학생 조사 자료 팝업 컴포넌트
  const StudentResearchPopup = ({ marker, isEditing, onEdit, onSave, onCancel, onDelete, currentUser, isTeacher }) => {
    const [description, setDescription] = useState(marker.description || '');
    const [title, setTitle] = useState(marker.title || '');
    const [content, setContent] = useState(marker.content || '');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    


    const handleImageSelect = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 1) {
        alert('이미지는 1개만 업로드할 수 있습니다.');
        e.target.value = ''; // 파일 선택 초기화
        return;
      }
      if (files.length + (marker.images?.length || 0) > 1) {
        alert('이미지는 최대 1개만 업로드할 수 있습니다. 기존 이미지를 삭제 후 시도해주세요.');
        e.target.value = ''; // 파일 선택 초기화
        return;
      }
      setSelectedImages(files);
    };

    const handleSaveWithImages = async () => {
      setUploading(true);
      try {
        // 실제 구현에서는 Firebase Storage에 이미지 업로드
        // 현재는 임시로 파일명만 저장
        const imageUrls = selectedImages.map(file => `temp_${file.name}`);
        
        // onSave 함수 호출
        await onSave(marker.id, {
          title,
          description,
          content,
          images: [...(marker.images || []), ...imageUrls]
        });
        
        // 편집 모드 종료
        onCancel();
      } catch (error) {
        console.error('저장 실패:', error);
        alert('저장에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    };

    if (isEditing) {
      return (
        <div className="w-80 max-w-sm">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              placeholder="조사 장소 제목"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">위치 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-16 resize-none"
              placeholder="서울은 ___의 ___쪽에 있습니다"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">조사 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-20 resize-none"
              placeholder="이 장소에 대해 조사한 내용을 자세히 적어보세요"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">사진 추가</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full text-xs"
            />
            {selectedImages.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {selectedImages.length}개 파일 선택됨
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSaveWithImages}
              disabled={uploading}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
            >
              {uploading ? '저장 중...' : '저장'}
            </button>
            <button 
              onClick={onCancel}
              className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
            >
              취소
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-80 max-w-sm">
        {/* 제목 */}
        {marker.title && (
          <div className="mb-2">
            <h4 className="font-bold text-lg text-gray-800">{marker.title}</h4>
          </div>
        )}
        
        {/* 위치 설명 */}
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs text-blue-600 font-medium mb-1">📍 위치 관계</div>
          <p className="text-sm font-medium text-gray-700">{marker.description}</p>
        </div>
        
        {/* 조사 내용 */}
        {marker.content && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
            <div className="text-xs text-green-600 font-medium mb-1">📝 조사 내용</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{marker.content}</p>
          </div>
        )}
        
        {/* 이미지 갤러리 */}
        {marker.images && marker.images.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 font-medium mb-2">📷 조사 사진 ({marker.images.length}개)</div>
            <div className="grid grid-cols-2 gap-2">
              {marker.images.slice(0, 4).map((imageUrl, index) => (
                <div key={index} className="aspect-square bg-gray-200 rounded border flex items-center justify-center">
                  <span className="text-xs text-gray-500">사진 {index + 1}</span>
                </div>
              ))}
              {marker.images.length > 4 && (
                <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                  <span className="text-xs text-gray-500">+{marker.images.length - 4}개</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 작성자 정보 */}
        <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center mb-1">
            <div 
              className="w-3 h-3 rounded-full mr-2 border border-gray-300"
              style={{ backgroundColor: marker.color || DEFAULT_COLOR }}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              {marker.classId} - {marker.userName || '익명'}
            </span>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>작성: {new Date(marker.createdAt).toLocaleString('ko-KR')}</div>
            {marker.updatedAt && marker.updatedAt !== marker.createdAt && (
              <div>수정: {new Date(marker.updatedAt).toLocaleString('ko-KR')}</div>
            )}
          </div>
        </div>
        

        
        {/* 상호작용 버튼들 */}
        <div className="flex gap-1 flex-wrap" style={{ position: 'relative', zIndex: 1000 }}>
          {/* 수정/삭제 버튼 */}
          {(currentUser && (marker.userId === currentUser.uid || isTeacher())) && (
            <>
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  e.stopImmediatePropagation();
                  alert('수정 버튼 클릭됨!');
                  onEdit(marker); 
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 font-medium"
                style={{ 
                  position: 'relative', 
                  zIndex: 1001, 
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  minWidth: '60px',
                  minHeight: '32px'
                }}
              >
                ✏️ 수정
              </button>
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  e.stopImmediatePropagation();
                  alert('삭제 버튼 클릭됨!');
                  onDelete(marker.id); 
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 font-medium"
                style={{ 
                  position: 'relative', 
                  zIndex: 1001, 
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  minWidth: '60px',
                  minHeight: '32px'
                }}
              >
                🗑️ 삭제
              </button>
            </>
          )}
          
          {/* 상호작용 버튼들 */}
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              handleLike(marker.id); 
            }}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              marker.likedBy?.includes(currentUser?.uid) 
                ? 'bg-green-600 text-white' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            style={{ 
              position: 'relative', 
              zIndex: 1001, 
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          >
            👍 좋아요 {marker.likes || 0}
          </button>
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              handleComment(marker.id); 
            }}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
            style={{ 
              position: 'relative', 
              zIndex: 1001, 
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          >
            💬 댓글 {marker.commentCount || 0}
          </button>
          <button 
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              handleShare(marker); 
            }}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
            style={{ 
              position: 'relative', 
              zIndex: 1001, 
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          >
            📤 공유
          </button>
        </div>
      </div>
    );
  };



  // 지도 준비 완료 핸들러
  const handleMapReady = (map) => {
    // 지도 인스턴스 저장
    setMapInstance(map);
  };

  // 이미지 업로드 함수
  const uploadImagesToStorage = async (files, markerId) => {
    if (!files || files.length === 0) return [];

    try {
      const imageUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop();
        const fileName = `markers/${markerId}/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        
        // 파일 업로드
        await uploadBytes(storageRef, file);
        
        // 다운로드 URL 가져오기
        const downloadUrl = await getDownloadURL(storageRef);
        imageUrls.push(downloadUrl);
        
        console.log(`이미지 ${i+1}/${files.length} 업로드 완료:`, downloadUrl);
      }
      
      return imageUrls;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // 이미지를 1개로 제한
    if (files.length > 1) {
      alert('이미지는 1개만 업로드할 수 있습니다.');
      e.target.value = ''; // 파일 선택 초기화
      return;
    }
    
    // 이미 이미지가 있는 경우 확인
    const currentImages = selectedMarker?.images || [];
    if (files.length + currentImages.length > 1) {
      alert('이미지는 최대 1개만 업로드할 수 있습니다. 기존 이미지를 삭제 후 시도해주세요.');
      e.target.value = ''; // 파일 선택 초기화
      return;
    }
    
    setSelectedFiles(files);
  };

  return (
    <div>
      {/* 디버깅용 정보 표시 */}
      <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
        📍 지도 정보: 레슨 {lessonId} | 중심: [{mapCenter[0]}, {mapCenter[1]}] | 줌: {mapZoom} | 
        범위: {lessonConfig.description} | 줌 제한: {mapMinZoom}~{mapMaxZoom} |
        초기마커: {lessonData?.initialMarkers?.length || 0}개
        {lessonId === '1' && <span> | 경기도 도시: {lessonData?.surroundingCities?.length || 0}개</span>}
      </div>
      

      
      {/* Firebase 연결 상태 표시 */}
      {!isFirebaseAvailable && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          ⚠️ 오프라인 모드: Firebase 연결을 사용할 수 없습니다. 일부 기능이 제한됩니다.
        </div>
      )}
      
      {/* 교사용 반별 선택 드롭다운 */}
      {isTeacher() && allClasses.length > 0 && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="classSelector" className="block mb-2 font-medium">반 선택:</label>
            <select
              id="classSelector"
              className="border p-2 rounded w-full"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent('all'); // 반이 바뀌면 학생 선택 초기화
              }}
            >
              <option value="all">내 담당반 ({classId})</option>
              {allClasses.map(cls => (
                <option key={cls} value={cls}>
                  {cls} {cls === classId ? '(내 반)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* 학생 선택 드롭다운 */}
          {classStudents.length > 0 && (
            <div>
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
        </div>
      )}
      
      {/* 반별 색상 범례 (교사용) */}
      {isTeacher() && selectedClass !== 'all' && classStudents.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded">
          <h4 className="font-medium mb-2">학생별 마커 색상:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {classStudents.map(student => (
              <div key={student.id} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2 border border-gray-400"
                  style={{ backgroundColor: getUserColor(student.id) }}
                ></div>
                <span>{student.studentNumber}번</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 학습 활동 안내 (학생용) */}
      {isStudent() && currentStep === 1 && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          📚 기초배움: 교사의 설명을 들으며 지도를 관찰해보세요. 이 단계에서는 마커 추가가 제한됩니다.
        </div>
      )}
      
      {isStudent() && currentStep === 2 && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          📝 가이드 활동: {LESSON_MARKER_PROMPTS[lessonId]?.replace(':', '') || '지도에서 원하는 지역을 클릭하여 미션을 수행해보세요!'}
        </div>
      )}
      
      {isStudent() && currentStep === 3 && (
        <div className="mb-4 p-3 bg-purple-100 border border-purple-400 text-purple-700 rounded">
          🎯 미션: 구체적인 미션을 수행해보세요. 마커를 추가하고 수정할 수 있습니다.
        </div>
      )}
      
      {/* 마커 추가 불가 안내 (가이드 활동과 미션 단계가 아닐 때) */}
      {isStudent() && currentStep !== 2 && currentStep !== 3 && currentStep !== 1 && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-400 text-gray-700 rounded">
          ℹ️ 현재 단계에서는 마커 추가가 제한됩니다. 교사의 안내에 따라 학습해보세요.
        </div>
      )}
      
      {/* 지도 컨테이너 - 높이와 너비를 명시적으로 설정 */}
      <div style={{ height: '600px', width: '100%', border: '1px solid #ccc', position: 'relative' }}>
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          scrollWheelZoom={true}
          minZoom={mapMinZoom}
          maxZoom={mapMaxZoom}
          maxBounds={[mapBounds.southWest, mapBounds.northEast]}
          maxBoundsViscosity={0.5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEventHandler onMapReady={handleMapReady}>
            {/* 사용자 정의 맵 컨트롤 */}
            {mapInstance && <MapControls map={mapInstance} />}
            
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
                  circlemarker: false,
                  marker: false,
                  polyline: true,
                }}
                edit={{
                  featureGroup: featureGroupRef.current,
                  remove: true,
                }}
              />
            </FeatureGroup>

            {/* Render Markers */}
            <MapEvents onMapClick={handleMapClick} />
            
            {/* 레슨 데이터의 초기 마커들 (교사 예시) */}
            {lessonData?.initialMarkers?.map((marker) => (
              <Marker key={`initial-${marker.id}`} position={[marker.position.lat, marker.position.lng]}>
                <Popup>
                  <div>
                    <h4 className="font-bold text-blue-600">{marker.title}</h4>
                    <p>{marker.description}</p>
                    <small className="text-gray-500">교사 예시 마커</small>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 레슨 데이터의 초기 도형들 (교사 예시) */}
            {lessonData?.initialShapes?.map((shape) => {
              if (shape.type === 'polyline') {
                // 폴리라인의 중간 지점 계산
                const midIndex = Math.floor(shape.positions.length / 2);
                const midPosition = shape.positions[midIndex];
                
                return (
                  <React.Fragment key={`initial-shape-${shape.id}`}>
                    <Polyline
                      positions={shape.positions.map(pos => [pos.lat, pos.lng])}
                      pathOptions={{
                        color: shape.color || '#dc2626',
                        weight: shape.weight || 3,
                        opacity: 0.8
                      }}
                    >
                      <Popup>
                        <div>
                          <h4 className="font-bold text-purple-600">{shape.title}</h4>
                          <p>{shape.description}</p>
                          <small className="text-gray-500">교사 예시 도형</small>
                        </div>
                      </Popup>
                    </Polyline>
                    
                    {/* 폴리라인 중간에 라벨 마커 추가 */}
                    <Marker
                      position={[midPosition.lat, midPosition.lng]}
                      icon={new L.DivIcon({
                        html: `<div style="
                          background: white; 
                          color: black; 
                          padding: 4px 8px; 
                          border-radius: 6px; 
                          font-size: 14px; 
                          font-weight: bold; 
                          white-space: nowrap;
                          border: 2px solid ${shape.color || '#dc2626'};
                          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                          display: inline-block;
                          min-width: fit-content;
                        ">${shape.title}</div>`,
                        className: 'polyline-label',
                        iconSize: [null, null],
                        iconAnchor: [0, 0]
                      })}
                    >
                      <Popup>
                        <div>
                          <h4 className="font-bold text-purple-600">{shape.title}</h4>
                          <p>{shape.description}</p>
                          <small className="text-gray-500">교사 예시 도형</small>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              } else if (shape.type === 'polygon') {
                // 폴리곤의 중심점 계산 (간단한 평균값 사용)
                const centerLat = shape.positions.reduce((sum, pos) => sum + pos.lat, 0) / shape.positions.length;
                const centerLng = shape.positions.reduce((sum, pos) => sum + pos.lng, 0) / shape.positions.length;
                
                return (
                  <React.Fragment key={`initial-shape-${shape.id}`}>
                    <Polygon
                      positions={shape.positions.map(pos => [pos.lat, pos.lng])}
                      pathOptions={{
                        color: shape.color || '#dc2626',
                        weight: shape.weight || 2,
                        opacity: 0.8,
                        fillColor: shape.fillColor || shape.color || '#dc2626',
                        fillOpacity: shape.fillOpacity || 0.2
                      }}
                    >
                      <Popup>
                        <div>
                          <h4 className="font-bold text-purple-600">{shape.title}</h4>
                          <p>{shape.description}</p>
                          <small className="text-gray-500">교사 예시 도형</small>
                        </div>
                      </Popup>
                    </Polygon>
                    
                    {/* 폴리곤 중심에 라벨 마커 추가 */}
                    <Marker
                      position={[centerLat, centerLng]}
                      icon={new L.DivIcon({
                        html: `<div style="
                          background: white; 
                          color: black; 
                          padding: 4px 8px; 
                          border-radius: 6px; 
                          font-size: 13px; 
                          font-weight: bold; 
                          white-space: nowrap;
                          border: 2px solid ${shape.color || '#dc2626'};
                          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                          opacity: 0.9;
                          display: inline-block;
                          min-width: fit-content;
                        ">${shape.title}</div>`,
                        className: 'polygon-label',
                        iconSize: [null, null],
                        iconAnchor: [0, 0]
                      })}
                    >
                      <Popup>
                        <div>
                          <h4 className="font-bold text-purple-600">{shape.title}</h4>
                          <p>{shape.description}</p>
                          <small className="text-gray-500">교사 예시 도형</small>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              }
              return null;
            })}

            {/* 주변 도시 마커들 (교사 예시) */}
            {lessonData?.surroundingCities?.map((city) => {
              const isTransparent = city.fillColor === 'transparent';
              return (
                <CircleMarker 
                  key={`city-${city.name}`} 
                  center={[city.position.lat, city.position.lng]}
                  radius={15}
                  pathOptions={{
                    color: city.color || '#1E90FF',
                    fillColor: isTransparent ? 'transparent' : (city.color === '#FFB6C1' ? '#FFB6C1' : '#87CEEB'),
                    fillOpacity: isTransparent ? 0 : 0.8,
                    weight: 3
                  }}
                >
                  <Popup>
                    <div>
                      <h4 className="font-bold">{city.name}</h4>
                      <p>서울의 {city.direction}에 위치</p>
                      <div 
                        className="w-4 h-4 inline-block rounded-full mr-2 border border-gray-300"
                        style={{ 
                          backgroundColor: isTransparent ? 'transparent' : city.color,
                          borderColor: city.color || '#1E90FF'
                        }}
                      ></div>
                      {city.color === '#FFB6C1' ? '분홍색 표시' : 
                       isTransparent ? '파란색 테두리 (경기도)' : '하늘색 표시'}
                      <br />
                      <small className="text-gray-500">교사 예시 마커</small>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* 사용자가 추가한 마커들 (학생 활동) */}
            {[...new Map(markers.map(marker => [marker.id, marker])).values()]
              .filter(marker => {
                // 기초배움 단계(step 1)에서는 학생이 추가한 마커 숨김
                if (currentStep === 1 && !marker.isInitial) {
                  // 교사는 모든 마커를 볼 수 있음
                  if (isTeacher()) return true;
                  // 학생은 자신과 다른 학생의 마커 모두 숨김
                  return false;
                }
                // 가이드 활동(step 2)과 미션(step 3) 단계에서는 모든 마커 표시
                return true;
              })
              .map((marker) => (
              marker.position && marker.position.length === 2 && (
                <Marker 
                  key={marker.id} 
                  position={marker.position}
                  icon={marker.color ? createClassMarkerIcon(marker.color) : undefined}
                  eventHandlers={{
                    click: () => handleMarkerClick(marker)
                  }}
                >
                  <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                    {marker.title || '마커 정보 보기'}
                  </Tooltip>
                </Marker>
              )
            ))}

            {/* 서울시 경계 - 모든 레슨에서 표시 */}
            <Polygon
              positions={ADMINISTRATIVE_BOUNDARIES.seoul.coordinates}
              pathOptions={{
                ...ADMINISTRATIVE_BOUNDARIES.seoul.style,
                fillOpacity: lessonId === '1' ? 0.15 : 0 // 1차시에서만 내부 색깔 표시
              }}
            >
              {/* 1차시에서만 팝업 표시 */}
              {lessonId === '1' && (
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-red-600">{ADMINISTRATIVE_BOUNDARIES.seoul.name}</h3>
                    <p className="text-sm text-gray-600">대한민국의 수도</p>
                    <p className="text-xs text-gray-500">빨간색 경계로 표시</p>
                    <div className="mt-2 text-xs text-gray-600">
                      <div>• 면적: 약 605㎢</div>
                      <div>• 인구: 약 950만 명</div>
                      <div>• 25개 자치구</div>
                    </div>
                  </div>
                </Popup>
              )}
            </Polygon>

            {/* 레슨 1에서만 경기도 도시들 표시 */}
            {lessonId === '1' && lessonData?.surroundingCities?.map((city) => {
              const isTransparent = city.fillColor === 'transparent';
              return (
                <CircleMarker 
                  key={`city-${city.name}`} 
                  center={[city.position.lat, city.position.lng]}
                  radius={15}
                  pathOptions={{
                    color: city.color || '#1E90FF',
                    fillColor: isTransparent ? 'transparent' : (city.color === '#FFB6C1' ? '#FFB6C1' : '#87CEEB'),
                    fillOpacity: isTransparent ? 0 : 0.8,
                    weight: 3
                  }}
                >
                  <Popup>
                    <div>
                      <h4 className="font-bold">{city.name}</h4>
                      <p>서울의 {city.direction}에 위치</p>
                      <div 
                        className="w-4 h-4 inline-block rounded-full mr-2 border border-gray-300"
                        style={{ 
                          backgroundColor: isTransparent ? 'transparent' : city.color,
                          borderColor: city.color || '#1E90FF'
                        }}
                      ></div>
                      {city.color === '#FFB6C1' ? '분홍색 표시' : 
                       isTransparent ? '파란색 테두리 (경기도)' : '하늘색 표시'}
                      <br />
                      <small className="text-gray-500">교사 예시 마커</small>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapEventHandler>
        </MapContainer>
      </div>
      
      {/* 마커 정보 모달 - 완전히 새로 구현 */}
      {showModal && selectedMarker && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {modalMode === 'edit' ? '마커 수정' : (selectedMarker.title || '마커 정보')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            
            {/* 모달 내용 */}
            {modalMode === 'edit' ? (
              // 편집 모드
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치 설명</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">조사 내용</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 h-32"
                  />
                </div>
                
                {/* 이미지 업로드 섹션 추가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사진 추가 (최대 1개)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {selectedFiles.length}개 파일 선택됨
                    </div>
                  )}
                  
                  {/* 기존 이미지 표시 */}
                  {selectedMarker?.images && selectedMarker.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">기존 이미지:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMarker.images.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={url} 
                              alt={`이미지 ${idx+1}`} 
                              className="h-16 w-16 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleModalSave}
                    disabled={isUploading}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isUploading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => setModalMode('view')}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              // 보기 모드
              <div>
                {/* 위치 설명 */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-600 font-medium mb-1">📍 위치 관계</div>
                  <p className="text-gray-700">{selectedMarker.description}</p>
                </div>
                
                {/* 조사 내용 */}
                {selectedMarker.content && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-600 font-medium mb-1">📝 조사 내용</div>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMarker.content}</p>
                  </div>
                )}
                
                {/* 이미지 표시 개선 */}
                {selectedMarker.images && selectedMarker.images.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 font-medium mb-2">📷 조사 사진</div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMarker.images.map((imageUrl, index) => (
                        <a 
                          key={index} 
                          href={imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block"
                        >
                          <img 
                            src={imageUrl} 
                            alt={`이미지 ${index+1}`} 
                            className="w-full h-32 object-cover rounded border border-gray-300 hover:border-blue-500 transition-colors"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 작성자 정보 */}
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="flex items-center mb-1">
                    <div 
                      className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: selectedMarker.color || DEFAULT_COLOR }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedMarker.classId} - {selectedMarker.userName || '익명'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>작성: {new Date(selectedMarker.createdAt).toLocaleString('ko-KR')}</div>
                    {selectedMarker.updatedAt && selectedMarker.updatedAt !== selectedMarker.createdAt && (
                      <div>수정: {new Date(selectedMarker.updatedAt).toLocaleString('ko-KR')}</div>
                    )}
                  </div>
                </div>
                
                {/* 상호작용 버튼들 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* 수정/삭제 버튼 */}
                  {(currentUser && (selectedMarker.userId === currentUser.uid || isTeacher())) && (
                    <>
                      <button 
                        onClick={() => handleEditMode()}
                        className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 font-medium"
                      >
                        ✏️ 수정
                      </button>
                      <button 
                        onClick={() => handleModalDelete()}
                        className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 font-medium"
                      >
                        🗑️ 삭제
                      </button>
                    </>
                  )}
                  
                  {/* 좋아요 버튼 */}
                  <button 
                    onClick={() => handleLike(selectedMarker.id)}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      selectedMarker.likedBy?.includes(currentUser?.uid) 
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    👍 좋아요 {selectedMarker.likes || 0}
                  </button>
                  
                  {/* 댓글 버튼 */}
                  <button 
                    onClick={() => handleComment(selectedMarker.id)}
                    className="bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600"
                  >
                    💬 댓글 {selectedMarker.commentCount || 0}
                  </button>
                  
                  {/* 공유 버튼 */}
                  <button 
                    onClick={() => handleShare(selectedMarker)}
                    className="bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600"
                  >
                    📤 공유
                  </button>
                </div>
                
                {/* 댓글 목록 */}
                {selectedMarker.comments && selectedMarker.comments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">💬 댓글 ({selectedMarker.comments.length})</h4>
                    <div className="space-y-3">
                      {selectedMarker.comments.map((comment) => (
                        <div key={comment.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleCommentLike(selectedMarker.id, comment.id)}
                                className="text-xs text-gray-500 hover:text-green-600"
                              >
                                👍 {comment.likes || 0}
                              </button>
                              {(comment.userId === currentUser?.uid || isTeacher()) && (
                                <button 
                                  onClick={() => handleDeleteComment(selectedMarker.id, comment.id)}
                                  className="text-xs text-gray-500 hover:text-red-600"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm mt-1">{comment.text}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(comment.createdAt).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView; 