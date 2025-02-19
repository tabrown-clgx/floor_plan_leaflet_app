import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

import roomDataImport from '../data/Room.json';
import exifDataImport from '../data/exif.json';
const RoomVisualizer = () => {
  
  const [scale, setScale] = useState(50);
  const [offset, setOffset] = useState({ x: 200, y: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [roomData] = useState<RoomData>(roomDataImport);
  const [exifData] = useState<Record<string, string>>(exifDataImport);

  const applyTransform = (transform, point) => {
    const x = -(transform[0] * point.x + transform[4] * point.y + transform[8] * point.z + transform[12]);
    const y = transform[1] * point.x + transform[5] * point.y + transform[9] * point.z + transform[13];
    const z = transform[2] * point.x + transform[6] * point.y + transform[10] * point.z + transform[14];
    return { x: x, y: -z };
  };

  const getWallVertices = (wall) => {
    const width = wall.dimensions[0];
    const corners = [
      { x: -width/2, y: 0, z: 0 },
      { x: width/2, y: 0, z: 0 },
    ];
    return corners.map(corner => applyTransform(wall.transform, corner));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset({
        x: offset.x + dx,
        y: offset.y + dy
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(scale * zoomFactor);
  };

  const handleZoomIn = () => setScale(scale * 1.2);
  const handleZoomOut = () => setScale(scale * 0.8);

  if (!roomData) return <div>Loading...</div>;

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Interactive Room Layout</h2>
          <div className="flex gap-2">
            <button 
              className="p-2 rounded hover:bg-gray-100"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button 
              className="p-2 rounded hover:bg-gray-100"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <div className="p-2" title="Click and drag to pan">
              <Move size={20} />
            </div>
          </div>
        </div>
      </div>
      <div 
        className="border rounded p-4 cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg 
          width="100%" 
          height="400"
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
        >
          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* Grid */}
            <defs>
              <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#eee" strokeWidth="0.02"/>
              </pattern>
            </defs>
            <rect x="-5" y="-5" width="10" height="10" fill="url(#grid)" />
            
            {/* Coordinate axes */}
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#ccc" strokeWidth="0.05"/>
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#ccc" strokeWidth="0.05"/>

            {/* All Room Walls */}
            {roomData.rooms.map((room, roomIndex) => (
              <g key={`room-${roomIndex}`}>
                {room.walls.map((wall) => {
                  const vertices = getWallVertices(wall);
                  const [start, end] = vertices;
                  
                  const centerX = (start.x + end.x) / 2;
                  const centerY = (start.y + end.y) / 2;
                  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
                  const wallThickness = 0.1;

                  return (
                    <g key={wall.identifier}>
                      <g transform={`rotate(${angle} ${centerX} ${centerY})`}>
                        <rect
                          x={centerX - wall.dimensions[0]/2}
                          y={centerY - wallThickness/2}
                          width={wall.dimensions[0]}
                          height={wallThickness}
                          fill="#666"
                          stroke="#333"
                          strokeWidth="0.02"
                        />
                      </g>
                      
                      <g>
                        <text
                          x={centerX}
                          y={centerY + 0.3}
                          fontSize="0.2"
                          textAnchor="middle"
                          fill="#666"
                        >
                          {(wall.dimensions[0] * 3.28084).toFixed(1)}ft
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Doors */}
                {room.doors.map((door) => {
                  const vertices = getWallVertices(door);
                  const [start, end] = vertices;
                  
                  const centerX = (start.x + end.x) / 2;
                  const centerY = (start.y + end.y) / 2;
                  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
                  const doorThickness = 0.15;

                  return (
                    <g key={door.identifier} transform={`rotate(${angle} ${centerX} ${centerY})`}>
                      <rect
                        x={centerX - door.dimensions[0]/2}
                        y={centerY - doorThickness/2}
                        width={door.dimensions[0]}
                        height={doorThickness}
                        fill="white"
                        stroke="#666"
                        strokeWidth="0.02"
                      />
                    </g>
                  );
                })}

                {/* Windows */}
                {room.windows.map((window) => {
                  const vertices = getWallVertices(window);
                  const [start, end] = vertices;
                  
                  const centerX = (start.x + end.x) / 2;
                  const centerY = (start.y + end.y) / 2;
                  const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
                  const windowThickness = 0.15;

                  return (
                    <g key={window.identifier} transform={`rotate(${angle} ${centerX} ${centerY})`}>
                      <rect
                        x={centerX - window.dimensions[0]/2}
                        y={centerY - windowThickness/2}
                        width={window.dimensions[0]}
                        height={windowThickness}
                        fill="#cce6ff"
                        stroke="#4d94ff"
                        strokeWidth="0.02"
                      />
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Camera Positions */}
            {exifData && Object.entries(exifData).map(([photoId, exifString]) => {
              const arrayMatch = exifString.match(/\[([-\d.]+, [-\d.]+, [-\d.]+)\]$/);
              const rotationMatch = exifString.match(/rotation=\(([-\d.]+)° ([-\d.]+)° ([-\d.]+)°\)/);
              
              if (arrayMatch && rotationMatch) {
                const [x, y, z] = arrayMatch[1].split(', ').map(parseFloat);
                const [__, rotX, yRotation, rotZ] = rotationMatch;
                
                const camX = -x;
                const camZ = -z;
                
                // Calculate direction vector for arrow
                // Add 180 degrees to flip direction for top view
                const rotYRad = (parseFloat(yRotation) + 180) * Math.PI / 180;
                const directionLength = 0.5;
                const dirX = -Math.sin(rotYRad) * directionLength;
                const dirZ = -Math.cos(rotYRad) * directionLength;
                
                const startX = camX;
                const startY = camZ;
                const endX = camX + dirX;
                const endY = camZ + dirZ;
                
                return (
                  <g key={photoId}>
                    <g 
                      onClick={() => {
                        const popup = window.open('', 'Photo', 'width=800,height=600');
                        popup.document.write(`
                          <html>
                            <head>
                              <title>Room Photo</title>
                              <style>
                                body { 
                                  margin: 0; 
                                  display: flex; 
                                  justify-content: center; 
                                  align-items: center; 
                                  background: #000;
                                  height: 100vh;
                                }
                                img { 
                                  max-width: 100%; 
                                  max-height: 100vh;
                                  object-fit: contain;
                                }
                              </style>
                            </head>
                            <body>
                              <img src="/photos/${photoId}" alt="Room view" />
                            </body>
                          </html>
                        `);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle
                        cx={camX}
                        cy={camZ}
                        r="0.1"
                        fill="#ff4081"
                        stroke="none"
                      />
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#ff4081"
                        strokeWidth="0.05"
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  </g>
                );
              }
              return null;
            })}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="4"
                refX="5"
                refY="2"
                orient="auto"
              >
                <polygon
                  points="0 0, 6 2, 0 4"
                  fill="#ff4081"
                />
              </marker>
            </defs>

          </g>
        </svg>
      </div>
    </div>
  );
};

export default RoomVisualizer;