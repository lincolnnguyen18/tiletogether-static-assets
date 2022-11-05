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

export function Layer ({ layer, parentSelected }) {
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
    console.log(layer.selected);
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
      console.log('dragend!');
      const delta = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      console.log(delta);
      if (delta.x !== 0 || delta.y !== 0) {
        console.log('move!');
        dispatch(moveSelectedLayers({ moveToLayer: layer }));
      }
    }
    dispatch(setTilesetEditorPrimitives({ dragging: false, lastSelectedLayer: layer }));
  }

  if (parentSelected) selected = true;

  const subLayerStyle = css`
    display: ${expanded ? 'flex' : 'none'};
    flex-direction: column;
    padding-left: 20px;
  `;

  function Arrow () {
    return (
      <span
        onMouseUp={e => handleToggleExpand(e, layer)}
        onMouseDown={(e) => e.stopPropagation()}
        css={css`
          cursor: pointer;
          width: 40px;
          font-size: 12px;
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
    if (selected && !parentSelected) return '#fff';
    if (selected && parentSelected) return '#e0e0e0';
    return 'transparent';
  }

  function getHoverBackground () {
    if (layer.type !== 'group') return 'background: default;';
    if (parentSelected) return 'background: default;';
    if (!dragging || layer.selected) return 'background: default;';
    return '#efefef';
  }

  function getHoverBorder () {
    if (selected) return;
    if (dragging && (parentSelected || layer.selected)) return 'border: 1px solid transparent;';
    if (dragging && layer.type !== 'group') return 'border-bottom: 1px solid #efefef;';
    return 'border: 1px solid #efefef;';
  }

  const layerNameStyle = css`
    height: 20px;
    padding: 5px 0;
    display: flex;
    align-items: center;
    background: ${getBackground()};
    color: ${selected ? 'black' : 'white'};
    border: 1px solid transparent;

    &:hover {
      ${getHoverBorder()}
      ${getHoverBackground()};
    }
  `;

  return layer && (
    <div css={layerStyle}>
      <div
        css={layerNameStyle}
        draggable={false}
        onMouseDown={e => handleDragStart(e, layer)}
        onMouseUp={e => handleDragEnd(e, layer)}
      >
        <Arrow />
        {layer.name}
      </div>
      {expanded && layer.layers.length > 0 && (
        <div css={subLayerStyle}>
          {layer.layers.map((layer, index) => (
            <Layer
              key={index}
              layer={layer}
              parentSelected={selected}
            >
              {layer.name}
            </Layer>
          ))}
        </div>
      )}
    </div>
  );
}
