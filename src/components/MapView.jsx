import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, FeatureGroup, CircleMarker, Polygon, Polyline } from 'react-leaflet';
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

// 기본 색상 (색상이 지정되지 않은 경우)
const DEFAULT_COLOR = '#808080'; // 회색

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
      [37.596432, 126.797137],
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

// 레슨별 지도 경계 설정
const LESSON_BOUNDS = {
  '1': {
    // 경기도 포함 (서울 + 경기도) - 경계를 좀 더 넓게 설정
    southWest: [36.8, 126.1],
    northEast: [38.4, 128.0],
    minZoom: 8,  // 경기도 전체가 보이는 최소 줌 레벨
    maxZoom: 18  // 최대 줌 레벨
  },
  default: {
    // 서울만 (레슨 2-9) - 서울 주변을 좀 더 여유롭게 설정
    southWest: [37.3, 126.6],
    northEast: [37.8, 127.4],
    minZoom: 10, // 서울 전체가 보이는 최소 줌 레벨
    maxZoom: 18  // 최대 줌 레벨
  }
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

// 커스텀 지도 컨트롤 컴포넌트
const MapControls = ({ map, lessonConfig }) => {
  const handleZoomIn = () => {
    if (map) {
      map.setZoom(Math.min(map.getZoom() + 1, lessonConfig.maxZoom));
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(Math.max(map.getZoom() - 1, lessonConfig.minZoom));
    }
  };

  const handleFitBounds = () => {
    if (map) {
      map.fitBounds([lessonConfig.bounds.southWest, lessonConfig.bounds.northEast]);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map) {
            map.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          alert('현재 위치를 가져올 수 없습니다.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-md transition-colors"
        title="확대"
      >
        <span className="text-lg font-bold">+</span>
      </button>
      <button
        onClick={handleZoomOut}
        className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-md transition-colors"
        title="축소"
      >
        <span className="text-lg font-bold">−</span>
      </button>
      <button
        onClick={handleFitBounds}
        className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-md transition-colors"
        title="전체 보기"
      >
        <span className="text-sm">🗺️</span>
      </button>
      <button
        onClick={handleCurrentLocation}
        className="bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-md transition-colors"
        title="현재 위치"
      >
        <span className="text-sm">📍</span>
      </button>
    </div>
  );
};

// 지도 이벤트 및 참조 관리 컴포넌트
const MapEventHandler = ({ onMapReady, children }) => {
  const map = useMapEvents({
    ready() {
      onMapReady(map);
    }
  });

  return children;
};

function MapView({ center = [37.5665, 126.9780], zoom = 11, lessonId = '1', studentId = null, mapConfig = null, activityData = null }) {
  // 상태 변수들
  const [mapInstance, setMapInstance] = useState(null);
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
  const markerPopupRef = useRef(); // Ref for marker popups
  const featureGroupRef = useRef(); // Ref for the FeatureGroup containing shapes
  
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

  // useCallback으로 함수들을 메모이제이션
  const isTeacher = useCallback(() => {
    return authContext?.isTeacher() || false;
  }, [authContext]);

  const isStudent = useCallback(() => {
    return authContext?.isStudent() || false;
  }, [authContext]);

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
        console.log("레슨 데이터 로드됨:", response.default);
        
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
      console.log("Firebase를 사용할 수 없습니다. 오프라인 모드로 실행합니다.");
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
    
    // 학생인 경우: 자신의 데이터만 로드
    if (isStudent()) {
      console.log(`Setting up listener for: lessons/${lessonId}/classActivities/${classId}/students/${currentUser.uid}`);
      
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
            classId: classId,
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
    // 교사인 경우: 선택된 반의 데이터 로드
    else if (isTeacher()) {
      const targetClassId = selectedClass === 'all' ? classId : selectedClass;
      if (!targetClassId) return;
      
      // 특정 학생의 데이터만 보기
      if (selectedStudent !== 'all') {
        const studentDocRef = getUserActivityDocRef(selectedStudent, targetClassId);
        if (!studentDocRef) return;
        
        console.log(`교사가 학생 데이터 로드: lessons/${lessonId}/classActivities/${targetClassId}/students/${selectedStudent}`);
        
        const unsubscribe = onSnapshot(studentDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const markersWithClass = (data.markers || []).map(marker => ({
              ...marker,
              classId: targetClassId,
              color: marker.color || getUserColor(selectedStudent) || DEFAULT_COLOR
            }));
            setMarkers(markersWithClass);
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
        
        console.log(`교사가 반별 데이터 로드: lessons/${lessonId}/classActivities/${targetClassId}/students`);
        
        // 복잡한 병합 로직을 위해 한 번 데이터 로드 후 처리
        const fetchAllClassData = async () => {
          try {
            const querySnapshot = await getDocs(classActivitiesRef);
            
            let allMarkers = [];
            let allShapes = [];
            
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.markers) {
                const markersWithClass = data.markers.map(marker => ({
                  ...marker,
                  classId: targetClassId,
                  color: getUserColor(currentUser.uid)
                }));
                allMarkers = [...allMarkers, ...markersWithClass];
              }
              if (data.shapes) allShapes = [...allShapes, ...data.shapes];
            });
            
            setMarkers(allMarkers);
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
    console.log("Map clicked:", {
      currentUser: currentUser?.email,
      isStudent: isStudent(),
      isTeacher: isTeacher(),
      userActivityDocRef: !!userActivityDocRef,
      isFirebaseAvailable,
      classId,
      selectedStudent,
      selectedClass
    });

    // Firebase를 사용할 수 없는 경우 로컬에서만 마커 추가
    if (!isFirebaseAvailable) {
      console.log("Firebase를 사용할 수 없습니다. 로컬에서만 마커를 추가합니다.");
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
    }
    
    // 교사인 경우: 다른 학생/반 데이터를 보고 있을 때는 추가 불가
    if (isTeacher() && (selectedStudent !== 'all' || selectedClass !== classId)) {
      console.error("Cannot add marker: Teacher viewing other student's/class data.");
      alert('다른 학생이나 반의 데이터를 보고 있을 때는 마커를 추가할 수 없습니다.');
      return; 
    }

    // Ask for confirmation before adding marker
    const promptText = isStudent() ? 
      '이 위치에 대해 "서울은 ___의 ___쪽에 있습니다" 문장을 작성해주세요:' :
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

  const handleDescriptionChange = (e) => {
    setCurrentDescription(e.target.value);
  };

  const handleSaveDescription = async (markerId) => {
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent, selectedClass)
      : userActivityDocRef;
      
    if (!docRefToUpdate) return;
    
    const currentMarkers = [...markers]; 
    const markerIndex = currentMarkers.findIndex(m => m.id === markerId);
    if (markerIndex === -1) return; 

    const originalMarker = currentMarkers[markerIndex];
    
    // 확장된 데이터 구조로 마커 업데이트
    const updatedMarker = { 
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
    setEditingMarkerId(null); 
    setCurrentDescription('');

    try {
        await updateDoc(docRefToUpdate, {
            markers: updatedMarkersArray, 
            lastUpdated: serverTimestamp()
        });
        console.log(`Marker ${markerId} updated in Firestore`);
        markerPopupRef.current?.closePopup(); // Close popup AFTER successful save
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
    // 교사가 다른 학생 데이터를 수정하는 경우 해당 학생의 docRef를 사용
    const docRefToUpdate = isTeacher() && selectedStudent !== 'all' && selectedStudent !== currentUser.uid 
      ? getUserActivityDocRef(selectedStudent, selectedClass)
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

  console.log("MapView 렌더링 중:", {
    lessonData: lessonData ? "로드됨" : "로딩중",
    mapCenter,
    mapZoom,
    mapBounds,
    markersCount: markers.length,
    initialMarkersCount: lessonData?.initialMarkers?.length || 0,
    surroundingCitiesCount: lessonData?.surroundingCities?.length || 0,
    isFirebaseAvailable,
    currentUser: currentUser?.email || "not logged in",
    authContext: authContext ? "available" : "not available",
    selectedClass,
    allClasses: allClasses.length
  });

  // 학생 조사 자료 팝업 컴포넌트
  const StudentResearchPopup = ({ marker, isEditing, onEdit, onSave, onCancel, onDelete, currentUser, isTeacher }) => {
    const [description, setDescription] = useState(marker.description || '');
    const [title, setTitle] = useState(marker.title || '');
    const [content, setContent] = useState(marker.content || '');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleImageSelect = (e) => {
      const files = Array.from(e.target.files);
      if (files.length + (marker.images?.length || 0) > 5) {
        alert('최대 5개의 이미지만 업로드할 수 있습니다.');
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
        
        await onSave(marker.id, {
          title,
          description,
          content,
          images: [...(marker.images || []), ...imageUrls]
        });
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
        <div className="flex gap-1 flex-wrap">
          {/* 수정/삭제 버튼 */}
          {(currentUser && (marker.userId === currentUser.uid || isTeacher())) && (
            <>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onEdit(marker); 
                }}
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
              >
                ✏️ 수정
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onDelete(marker.id); 
                }}
                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
              >
                🗑️ 삭제
              </button>
            </>
          )}
          
          {/* 상호작용 버튼들 */}
          <button 
            onClick={(e) => e.stopPropagation()}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
          >
            👍 좋아요 {marker.likes || 0}
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
          >
            💬 댓글 {marker.commentCount || 0}
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
          >
            📤 공유
          </button>
        </div>
      </div>
    );
  };

  // 마커 저장 함수 개선 (이미지 포함)
  const handleSaveMarkerWithData = async (markerId, data) => {
    try {
      const markerIndex = markers.findIndex(m => m.id === markerId);
      if (markerIndex === -1) return;

      const updatedMarker = {
        ...markers[markerIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };

      const newMarkers = [...markers];
      newMarkers[markerIndex] = updatedMarker;
      setMarkers(newMarkers);

      // Firebase에 저장
      if (isFirebaseAvailable && currentUser) {
        const docRef = doc(db, 'lessons', lessonId, 'activities', currentUser.uid);
        await updateDoc(docRef, {
          markers: newMarkers,
          lastUpdated: serverTimestamp()
        });
      }

      setEditingMarkerId(null);
      setCurrentDescription('');
    } catch (error) {
      console.error('마커 저장 실패:', error);
    }
  };

  // 지도 준비 완료 핸들러
  const handleMapReady = (map) => {
    setMapInstance(map);
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
      {isStudent() && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          📝 학습 활동: 지도에서 원하는 지역을 클릭하여 "서울은 ___의 ___쪽에 있습니다" 문장을 작성해보세요!
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
          zoomControl={false} // 기본 줌 컨트롤 비활성화
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEventHandler onMapReady={handleMapReady}>
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
            {markers.map((marker) => (
              marker.position && marker.position.length === 2 && (
                <Marker 
                  key={marker.id} 
                  position={marker.position}
                  icon={marker.color ? createClassMarkerIcon(marker.color) : undefined}
                >
                  <Popup ref={markerPopupRef} minWidth={320} maxWidth={400}>
                    <StudentResearchPopup
                      marker={marker}
                      isEditing={editingMarkerId === marker.id}
                      onEdit={handleEditClick}
                      onSave={handleSaveMarkerWithData}
                      onCancel={handleCancelEdit}
                      onDelete={handleMarkerDelete}
                      currentUser={currentUser}
                      isTeacher={isTeacher}
                    />
                  </Popup>
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
              eventHandlers={{
                click: lessonId === '1' ? undefined : (e) => {
                  e.originalEvent.stopPropagation(); // 2~8차시에서는 클릭 이벤트 차단
                }
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
    </div>
  );
}

export default MapView; 