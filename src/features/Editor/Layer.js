/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useState } from 'react';

export function Layer ({ layer, level = 0, activeLayerId, setActiveLayer = null, rootLayer = null }) {
  const [expanded, setExpanded] = useState(true);

  const layerStyle = css`
    user-select: none;
    display: flex;
    flex-direction: column;
  `;

  const subLayerStyle = css`
    display: ${expanded ? 'flex' : 'none'};
    flex-direction: column;
  `;

  function LayerName () {
    let text;
    if (layer.layers.length > 0) {
      text = `${expanded ? '▼' : '▶'} ${layer.name}`;
    } else {
      text = layer.name;
    }

    const layerNameStyle = css`
      height: 20px;
      padding: 5px 0;
      display: flex;
      align-items: center;
      padding-left: ${level * 20}px;
      background: ${activeLayerId === layer._id ? '#4F4F4F' : 'transparent'};
      
      &:hover {
        background: #4f4f4f;
      }
    `;

    function handleClick () {
      setExpanded(!expanded);
      if (setActiveLayer && layer !== rootLayer) setActiveLayer(layer);
    }

    return (
      <span
        onClick={handleClick}
        css={layerNameStyle}
      >
        {text}
      </span>
    );
  }

  return layer && (
    <div css={layerStyle}>
      <LayerName />
      {expanded && layer.layers.length > 0 && (
        <div css={subLayerStyle}>
          {layer.layers.map((layer, index) => (
            <Layer
              key={index}
              layer={layer}
              level={level + 1}
              activeLayerId={activeLayerId}
              setActiveLayer={setActiveLayer}
            >
              {layer.name}
            </Layer>
          ))}
        </div>
      )}
    </div>
  );
}
