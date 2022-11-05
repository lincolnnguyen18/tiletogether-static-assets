/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import {
  moveSelectedLayers,
  selectLastSelectedLayer,
  updateAllLayers,
  updateAllLayersBetween,
  updateLayer,
  setTilesetEditorPrimitives,
  selectPrimitives,
} from '../TilesetEditor/tilesetEditorSlice';

const layerStyle = css`
  user-select: none;
  display: flex;
  flex-direction: column;
`;

export function Layer ({ layer, parentSelected, level }) {
  const dispatch = useDispatch();
  const filePrimitives = useSelector(selectPrimitives);
  const dragging = filePrimitives.dragging;
  const dragStart = filePrimitives.dragStart;
  const lastSelectedLayer = useSelector(selectLastSelectedLayer);

  let { name, visible, selected, expanded } = layer;

  function handleToggleExpand (e, layer) {
    e.stopPropagation();
    const newLayer = _.cloneDeep(layer);
    newLayer.expanded = !layer.expanded;
    dispatch(updateLayer({ newLayer }));
  }

  function handleDragStart (e, layer) {
    if (layer.isRootLayer) return;
    if ((!e.shiftKey && !e.ctrlKey && !e.metaKey) && (!layer.selected || parentSelected)) {
      dispatch(updateAllLayers({ selected: false }));
    }
    if (!e.shiftKey) {
      const newLayer = _.cloneDeep(layer);
      newLayer.selected = true;
      dispatch(updateLayer({ newLayer }));
    }
    if (e.shiftKey && layer._id !== lastSelectedLayer._id) {
      const startLayer = lastSelectedLayer;
      const endLayer = layer;
      const newAttributes = { selected: true };
      dispatch(updateAllLayersBetween({ startLayer, endLayer, newAttributes }));
    }
    const dragStart = { x: e.clientX, y: e.clientY };
    dispatch(setTilesetEditorPrimitives({ dragStart, lastSelectedLayer: null, dragging: true }));
  }

  function handleDragEnd (e, layer) {
    if (dragging && !layer.selected && !parentSelected) {
      const delta = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      if (delta.x !== 0 || delta.y !== 0) {
        dispatch(moveSelectedLayers({ moveToLayer: layer }));
      }
    }
    dispatch(setTilesetEditorPrimitives({ dragging: false, lastSelectedLayer: layer }));
  }

  if (parentSelected) selected = true;

  const subLayerStyle = css`
    display: ${expanded ? 'flex' : 'none'};
    flex-direction: column;
  `;

  function Arrow () {
    return (
      <span
        onMouseUp={e => handleToggleExpand(e, layer)}
        onMouseDown={(e) => e.stopPropagation()}
        css={css`
          width: 30px;
          font-size: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          visibility: ${layer.type === 'group' ? 'visible' : 'hidden'};
        `}
      >
        {expanded ? '▼' : '▶'}
      </span>
    );
  }

  function getBackground () {
    if (selected && !parentSelected) return '#282828';
    if (selected && parentSelected) return '#313131';
    return 'transparent';
  }

  function getHoverBackground () {
    if (layer.type !== 'group') return 'background: default;';
    if (parentSelected) return 'background: default;';
    if (!dragging || layer.selected) return 'background: default;';
    return '#efefef';
  }

  function getHoverBorder () {
    if (dragging && (parentSelected || layer.selected)) return 'border: 1px solid transparent;';
    if (dragging && layer.type !== 'group') return 'border-bottom: 1px solid #00b3ff;';
    if (dragging && layer.type === 'group') return 'border: 1px solid #00b3ff;';
    return 'border: 1px solid #efefef;';
  }

  const layerNameStyle = css`
    height: 20px;
    padding: 5px 0;
    display: flex;
    align-items: center;
    background: ${getBackground()};
    color: white;
    border: 1px solid transparent;
    padding-left: ${level * 20}px;

    &:hover {
      ${getHoverBorder()}
      ${getHoverBackground()};
    }
  `;

  return layer && (
    <div css={layerStyle}>
      {!layer.isRootLayer && (
        <div
          css={layerNameStyle}
          draggable={false}
          onMouseDown={e => handleDragStart(e, layer)}
          onMouseUp={e => handleDragEnd(e, layer)}
        >
          <Arrow />
          {layer.name}
        </div>
      )}
      {expanded && layer.layers.length > 0 && (
        <div css={subLayerStyle}>
          {layer.layers.map((layer, index) => (
            <Layer
              key={index}
              layer={layer}
              parentSelected={selected}
              level={level + 1}
            >
              {layer.name}
            </Layer>
          ))}
        </div>
      )}
    </div>
  );
}
