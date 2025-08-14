import React from 'react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ADMINISTRATIVE_BOUNDARIES } from '../components/MapView';

function Explore() {
  const center = [37.5665, 126.9780];
  const zoom = 9; // 서울+경기도 범위

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 font-korean">🗺️ 서울 탐험하기</h1>
          <p className="text-gray-600 font-korean">서울과 경기도 범위의 기본 지도를 확인해보세요. (레슨 1의 서울 경계선 표시)</p>
        </div>

        <div className="bg-white rounded-3xl p-2 shadow-soft">
          <div style={{ height: '70vh', borderRadius: '1rem', overflow: 'hidden' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* 서울시 경계선 (레슨1과 동일 스타일로 표시) */}
              <Polygon
                positions={ADMINISTRATIVE_BOUNDARIES.seoul.coordinates}
                pathOptions={{
                  color: ADMINISTRATIVE_BOUNDARIES.seoul.style.color,
                  weight: ADMINISTRATIVE_BOUNDARIES.seoul.style.weight,
                  opacity: ADMINISTRATIVE_BOUNDARIES.seoul.style.opacity,
                  fillColor: ADMINISTRATIVE_BOUNDARIES.seoul.style.fillColor,
                  fillOpacity: 0.15
                }}
              />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Explore;


