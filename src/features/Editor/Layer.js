/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useState } from 'react';

const layerStyle = css`
  user-select: none;
  display: flex;
  flex-direction: column;
`;

export function Layer ({ layer }) {
  const [expanded, setExpanded] = useState(true);

  const subLayerStyle = css`
    display: ${expanded ? 'flex' : 'none'};
    flex-direction: column;
    padding-left: 20px;
  `;

  function LayerName () {
    let text;
    if (layer.layers.length > 0) {
      text = `${expanded ? '▼' : '▶'} ${layer.name}`;
    } else {
      text = layer.name;
    }

    const layerNameStyle = css`
      cursor: ${layer.layers.length > 0 ? 'pointer' : 'default'};
      height: 20px;
      padding: 5px 0;
      display: flex;
      align-items: center;
      
      &:hover {
        background: #4f4f4f;
      }
    `;

    return (
      <span
        onClick={() => setExpanded(!expanded)}
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
            <Layer key={index} layer={layer}>
              {layer.name}
            </Layer>
          ))}
        </div>
      )}
    </div>
  );
}
