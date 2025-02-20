import React, { useEffect, useState } from 'react';
import { MapContainer, Polygon,Polyline, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

import roomDataImport from '../data/Room.json';
import exifDataImport from '../data/exif.json';
// Import Leaflet CSS
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
document.head.appendChild(linkElement);

const RoomVisualizer = () => {
  
  const [roomData] = useState<RoomData>(roomDataImport);
  const [exifData] = useState<Record<string, string>>(exifDataImport);
  const [map, setMap] = useState(null);

  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // const response = await window.fs.readFile('Room.json', { encoding: 'utf8' });
        // const data = JSON.parse(response);
        // setRoomData(data);
          
    // Calculate initial rotation based on longest wall
    let longestWall = null;
    let maxLength = 0;
    
    roomData.rooms.forEach(room => {
      room.walls.forEach(wall => {
      if (wall.dimensions[0] > maxLength) {
        maxLength = wall.dimensions[0];
        longestWall = wall;
      }
    });
  });

  if (longestWall) {
    // Extract rotation from transform matrix
    const angle = Math.atan2(longestWall.transform[8], longestWall.transform[0]) * 180 / Math.PI;
    setRotation(angle); // Apply rotation to align the floor plan
  }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);


  const transformPoint = (transform, point) => {
    const x = -(transform[0] * point.x + transform[4] * point.y + transform[8] * point.z + transform[12]);
    const y = -(transform[2] * point.x + transform[6] * point.y + transform[10] * point.z + transform[14]);
    return [y, x];
  };

  const getWallPoints = (wall) => {
    const width = wall.dimensions[0];
    const thickness = 0.1;
    const corners = [
      { x: -width/2, y: -thickness/2, z: 0 },
      { x: width/2, y: -thickness/2, z: 0 },
      { x: width/2, y: thickness/2, z: 0 },
      { x: -width/2, y: thickness/2, z: 0 },
    ];
    return corners.map(corner => transformPoint(wall.transform, corner));
  };

  const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map) {
        map.setView([0, 0], 19);
        const bounds = L.latLngBounds([-5, -5], [5, 5]);
        map.fitBounds(bounds);
        setMap(map);
      }
    }, [map]);
    
    return null;
  };

  if (!roomData) return <div>Loading...</div>;

  const customIcon = new L.Icon({
    iconUrl: 'camera.webp',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <div className="w-full h-140 p-4 bg-white rounded-lg shadow-sm">
      <MapContainer
        center={[0, 0]}
        zoom={19}
        style={{ height: '100%', width: '100%', background: 'white' }}
        zoomControl={true}
        scrollWheelZoom={true}
        whenCreated={setMap}
      >
        <MapController />
        
        {/* Walls */}
        {roomData.rooms.map((room, roomIndex) => (
          <React.Fragment key={roomIndex}>
            {room.walls.map((wall) => (
              <Polygon
                key={wall.identifier}
                positions={getWallPoints(wall)}
                pathOptions={{ color: '#666', weight: 3, fillOpacity: 1 }}
              >
                <Popup>
                  {(wall.dimensions[0] * 3.28084).toFixed(1)}ft
                </Popup>
              </Polygon>
            ))}

            {/* Doors */}
            {room.doors.map((door) => (
              <Polyline
                key={door.identifier}
                positions={getWallPoints(door)}
                pathOptions={{ color: '#000', fillColor: '#000',stroke:true, weight: 2, dashArray:"2", fillOpacity: 1 }}
              />
            ))}

            {/* Windows */}
            {room.windows.map((window) => (
              <Polygon
                key={window.identifier}
                positions={getWallPoints(window)}
                pathOptions={{ color: '#4d94ff', fillColor: '#cce6ff', weight: 3, fillOpacity: 1 }}
              />
            ))}
          </React.Fragment>
        ))}

        {/* Camera Positions */}
        {exifData && Object.entries(exifData).map(([photoId, exifString]) => {
          const arrayMatch = exifString.match(/\[([-\d.]+, [-\d.]+, [-\d.]+)\]$/);
          const rotationMatch = exifString.match(/rotation=\(([-\d.]+)° ([-\d.]+)° ([-\d.]+)°\)/);
          
          if (arrayMatch && rotationMatch) {
            const [x, y, z] = arrayMatch[1].split(', ').map(parseFloat);
            const position = [-z, -x];
            
            return (
              <Marker
                key={photoId}
                position={position}
                icon={customIcon}
              >
                <Popup minWidth={400} maxWidth={800} maxHeight={600}>
                  <img 
                    src={`photos/${photoId}`}
                    alt="Room view"
                    className="w-full h-auto"
                  />
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default RoomVisualizer;