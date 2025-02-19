import React, { useState, useEffect } from 'react';
import { MapContainer, ImageOverlay, Polygon, CircleMarker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import roomDataImport from '../data/Room.json';
import exifDataImport from '../data/exif.json';
// Avoid the default marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null,
  iconUrl: null,
  shadowUrl: null,
});

const RoomVisualizer = () => {
  const [roomData] = useState<RoomData>(roomDataImport);
  const [exifData] = useState<Record<string, string>>(exifDataImport);

  // Convert room coordinates to Leaflet coordinates
  const transformToLeaflet = (transform, point) => {
    const x = transform[0] * point.x + transform[4] * point.y + transform[8] * point.z + transform[12];
    const y = -(transform[2] * point.x + transform[6] * point.y + transform[10] * point.z + transform[14]);
    return [y, x]; // Leaflet uses [lat, lng] format
  };

  const getWallCoordinates = (wall) => {
    const width = wall.dimensions[0];
    const corners = [
      { x: -width/2, y: 0, z: 0 },
      { x: width/2, y: 0, z: 0 }
    ];
    return corners.map(corner => transformToLeaflet(wall.transform, corner));
  };

  if (!roomData) return <div>Loading...</div>;

  // Calculate bounds for the map
  const allPoints = roomData.rooms[0].walls.flatMap(wall => getWallCoordinates(wall));
  const bounds = L.latLngBounds(allPoints);
  bounds.extend(bounds.pad(0.5)); // Add some padding

  return (
    <div className="w-full h-96 rounded-lg border border-gray-200 bg-white overflow-hidden">
      <MapContainer
        bounds={bounds}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Walls */}
        {roomData.rooms[0].walls.map((wall, index) => {
          const coordinates = getWallCoordinates(wall);
          return (
            <Polyline
              key={wall.identifier}
              positions={coordinates}
              pathOptions={{
                color: '#666',
                weight: 5
              }}
            >
            </Polyline>
          );
        })}

        {/* Camera Positions */}
        {exifData && Object.entries(exifData).map(([key, value]) => {
          const translationMatch = value.match(/translation=\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/);
          const rotationMatch = value.match(/rotation=\(([-\d.]+)° ([-\d.]+)° ([-\d.]+)°\)/);
          
          if (translationMatch && rotationMatch) {
            const [_, x, y, z] = translationMatch;
            const [__, rotX, rotY, rotZ] = rotationMatch;
            const position = [-parseFloat(z), parseFloat(x)];
            
            // Calculate direction vector using Y rotation (pan angle)
            const rotYRad = (parseFloat(rotY) * Math.PI) / 180;
            const directionLength = 0.15;
            const endPoint = [
              position[0] - Math.cos(rotYRad) * directionLength,
              position[1] + Math.sin(rotYRad) * directionLength
            ];
            
            return (
              <React.Fragment key={key}>
                <CircleMarker
                  center={position}
                  radius={5}
                  pathOptions={{
                    color: '#ff4081',
                    fillColor: '#ff4081',
                    fillOpacity: 1
                  }}
                />
                <Polyline
                  positions={[position, endPoint]}
                  pathOptions={{
                    color: '#ff4081',
                    weight: 2
                  }}
                />
              </React.Fragment>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default RoomVisualizer;