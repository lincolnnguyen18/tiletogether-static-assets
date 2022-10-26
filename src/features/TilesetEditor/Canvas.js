import React, { useState } from 'react';
import { Layer, Stage, Star, Text } from 'react-konva';

function generateShapes () {
  return [...Array(10)].map((_, i) => ({
    id: i.toString(),
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    rotation: Math.random() * 180,
    isDragging: false,
  }));
}

const INITIAL_STATE = generateShapes();

export function Canvas () {
  const [stars, setStars] = useState(INITIAL_STATE);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [stageZoom, setStageZoom] = useState(1);

  const handleDragStart = (e) => {
    const id = e.target.id();
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: star.id === id,
        };
      }),
    );
  };
  const handleDragEnd = () => {
    setStars(
      stars.map((star) => {
        return {
          ...star,
          isDragging: false,
        };
      }),
    );
  };

  async function handleWheel (e) {
    const dx = -e.evt.deltaX * 0.5;
    const dy = -e.evt.deltaY * 0.5;

    // if control not being pressed, pan
    if (!e.evt.ctrlKey) {
      const x = stagePosition.x + dx;
      const y = stagePosition.y + dy;
      setStagePosition({ x, y });
    // else zoom
    } else {
      const oldScale = stageZoom;

      const mousePointTo = {
        x: (e.evt.clientX - stagePosition.x) / oldScale,
        y: (e.evt.clientY - stagePosition.y) / oldScale,
      };

      const direction = -e.evt.deltaY;
      const newScale = oldScale + direction / 200 * oldScale;
      if (newScale < 0.3 || newScale > 2) {
        return;
      }
      setStageZoom(newScale);

      const newPos = {
        x: e.evt.clientX - mousePointTo.x * newScale,
        y: e.evt.clientY - mousePointTo.y * newScale,
      };
      setStagePosition(newPos);
    }
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onWheel={handleWheel}
      x={stagePosition.x}
      y={stagePosition.y}
      scaleX={stageZoom}
      scaleY={stageZoom}
    >
      <Layer>
        <Text text="Try to drag a star" />
        {stars.map((star) => (
          <Star
            key={star.id}
            id={star.id}
            x={star.x}
            y={star.y}
            numPoints={5}
            innerRadius={20}
            outerRadius={40}
            fill="#89b717"
            opacity={0.8}
            draggable
            rotation={star.rotation}
            shadowColor="black"
            shadowBlur={10}
            shadowOpacity={0.6}
            shadowOffsetX={star.isDragging ? 10 : 5}
            shadowOffsetY={star.isDragging ? 10 : 5}
            scaleX={star.isDragging ? 1.2 : 1}
            scaleY={star.isDragging ? 1.2 : 1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Layer>
    </Stage>
  );
}
