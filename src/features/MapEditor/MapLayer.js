/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import { moveSelectedLayers, selectMapEditorPrimitives, setMapEditorPrimitives, updateAllLayers, updateAllLayersBetween, updateLayer, updateLayerAndItsChildren } from './mapEditorSlice';

const layerStyle = css`
  user-select: none;
  display: flex;
  flex-direction: column;
`;

export function MapLayer ({ layer, parentSelected, level }) {
  const dispatch = useDispatch();
  const primitives = useSelector(selectMapEditorPrimitives);
  const { dragging, lastSelectedLayer, dragStart } = primitives;

  let { name, selected, expanded, type } = layer;

  function handleToggleExpand (e, layer) {
    e.stopPropagation();
    const newLayer = _.cloneDeep(layer);
    newLayer.expanded = !expanded;
    dispatch(updateLayer({ newLayer }));
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
          height: 100%;
          cursor: pointer;
          font-size: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          visibility: ${type === 'group' ? 'visible' : 'hidden'};
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
    if (type !== 'group') return 'background: default;';
    if (parentSelected) return 'background: default;';
    if (!dragging || selected) return 'background: default;';
    return '#efefef';
  }

  function getHoverBorder () {
    if (dragging && (parentSelected || selected)) return 'border: 1px solid transparent;';
    if (dragging && type !== 'group') return 'border-bottom: 1px solid #00b3ff;';
    if (dragging && type === 'group') return 'border: 1px solid #00b3ff;';
    return 'border: 1px solid #c4c4c4;';
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

  // useEffect(() => {
  //   console.log('new lastSelectedLayer!', lastSelectedLayer);
  // }, [lastSelectedLayer]);

  function handleDragStart (e, layer) {
    if (layer.isRootLayer) return;
    // if (lastSelectedLayer && layer._id === lastSelectedLayer._id) return;

    if ((!e.shiftKey && !e.ctrlKey && !e.metaKey) && (!layer.selected || parentSelected)) {
      dispatch(setMapEditorPrimitives({ activeTool: 'select' }));
      dispatch(updateAllLayers({ selected: false }));
      dispatch(setMapEditorPrimitives({ lastSelectedLayer: null }));
    }
    if (!e.shiftKey) {
      const newLayer = _.cloneDeep(layer);
      newLayer.selected = true;
      dispatch(updateLayerAndItsChildren({ newLayer, newAttributes: { selected: true } }));
      dispatch(setMapEditorPrimitives({ lastSelectedLayer: layer }));
    } else if (e.shiftKey && layer._id !== lastSelectedLayer._id) {
      // if select multiple layers then switch to select tool to prevent drawing on multiple layers at once (which isn't possible for now)
      dispatch(setMapEditorPrimitives({ activeTool: 'select' }));
      const startLayer = lastSelectedLayer;
      const endLayer = layer;
      const newAttributes = { selected: true };
      dispatch(updateAllLayersBetween({ startLayer, endLayer, newAttributes }));
      dispatch(setMapEditorPrimitives({ lastSelectedLayer: layer }));
    }
    const dragStart = { x: e.clientX, y: e.clientY };
    dispatch(setMapEditorPrimitives({ dragStart, dragging: true }));
  }

  function handleDragEnd (e, layer) {
    if (dragging && !layer.selected && !parentSelected) {
      const delta = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      if (delta.x !== 0 || delta.y !== 0) {
        dispatch(moveSelectedLayers({ moveToLayer: layer }));
      }
    }
    dispatch(setMapEditorPrimitives({ dragging: false }));
    // console.log('new lastSelectedLayer', layer);
  }

  return layer && (
    <div css={layerStyle}>
      {!layer.isRootLayer && (
        <div
          css={layerNameStyle}
          draggable={false}
          onMouseDown={e => handleDragStart(e, layer)}
          onMouseUp={e => handleDragEnd(e, layer)}
          id={`explorer-${layer._id}`}
        >
          <Arrow />
          {name}
        </div>
      )}
      {expanded && layer.layers.length > 0 && (
        <div css={subLayerStyle}>
          {layer.layers.map((layer, index) => (
            <MapLayer
              key={index}
              layer={layer}
              parentSelected={selected}
              level={level + 1}
            >
              {name}
            </MapLayer>
          ))}
        </div>
      )}
    </div>
  );
}
