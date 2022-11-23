/** @jsx jsx */
// import { useState } from 'react';
import { css, jsx } from '@emotion/react';
import { Textfield, whiteInputStyle } from '../../../components/inputs/Textfield';
import { setModalPrimitives, setModalReactElements } from '../../../components/Modal/modalSlice';
import { modalBodyStyle, modalheaderStyle } from '../../../components/Modal/Modal';
// import { Icon } from '../../../components/Icon';
// import { Badge } from '../../../components/Badge';
import { blackButtonStyle, Button } from '../../../components/inputs/Button';
import { useSelector, useDispatch } from 'react-redux';
import { selectMapEditorErrors, asyncPatchFile, selectMapEditorStatuses } from '../../MapEditor/mapEditorSlice';

export const tagsInputStyle = css`
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    min-height: 48px;
    width: 480px;
    padding: 0 8px;
    border: 1px solid rgb(214, 216, 218);
    border-radius: 6px;
    &:focus-within {
      border: 1px solid #0052cc;
    }
    input {
      flex: 1;
      border: none;
      height: 46px;
      font-size: 14px;
      padding: 4px 0 0 0;
      &:focus {
        outline: transparent;
      }
    }
`;

export const tagStyle = css`
    width: auto;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    padding: 0 8px;
    font-size: 14px;
    list-style: none;
    border-radius: 6px;
    margin: 0 8px 8px 0;
    background: #0052cc;
    .tag-title {
      margin-top: 3px;
    }
    .tag-close-icon {
      display: block;
      width: 16px;
      height: 16px;
      line-height: 16px;
      text-align: center;
      font-size: 14px;
      margin-left: 8px;
      color: #0052cc;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
    }
`;

export const tagsStyle = css`
    display: flex;
    flex-wrap: wrap;
    padding: 0;
    margin: 8px 0 0 0;

`;

export function openPublishModal (dispatch, type, file) {
  dispatch(setModalReactElements({
    header: <PublishModalHeader type={type} />,
    children: <PublishModalBody type={type} file={file} />,
  }));
  dispatch(setModalPrimitives({
    open: true,
    width: 500,
  }));
}

export function PublishModalHeader ({ type }) {
  return (
    <div css={modalheaderStyle}>
      <h1>Publish {type === 'map' ? 'Map' : 'Tileset'}</h1>
    </div>
  );
}
// const TagsInput = props => {
//   const [tags, setTags] = useState(props.tags);
//   const removeTags = indexToRemove => {
//     setTags([...tags.filter((_, index) => index !== indexToRemove)]);
//   };
//   const addTags = event => {
//     if (event.target.value !== '') {
//       setTags([...tags, event.target.value]);
//       props.selectedTags([...tags, event.target.value]);
//       event.target.value = '';
//     }
//   };
//   return (
//       <div css={tagsInputStyle}>
//         <ul id="tags">
//           {tags.map((tag, index) => (
//             <li key={index} css={tagStyle}>
//               <span className='tag-title'>{tag}</span>
//               <span className='tag-close-icon'
//                 onClick={() => removeTags(index)}
//               >
//                 x
//               </span>
//             </li>
//           ))}
//         </ul>
//         <input
//           type="text"
//           onKeyUp={event => event.key === 'Enter' ? addTags(event) : null}
//           placeholder="Press enter to add tags"
//         />
//       </div>
//   );
// };

export function PublishModalBody ({ type, file }) {
  console.log(file);
  const dispatch = useDispatch();
  const statuses = useSelector(selectMapEditorStatuses);
  const errors = useSelector(selectMapEditorErrors);
  const pending = statuses.createFile === 'pending';
  // const [tags, setTags] = useState([]);
  // const removeTags = indexToRemove => {
  //   setTags([...tags.filter((_, index) => index !== indexToRemove)]);
  // };
  // const addTags = event => {
  //   if (event.target.value !== '') {
  //     setTags([...tags, event.target.value]);
  //     // props.selectedTags([...tags, event.target.value]);
  //     event.target.value = '';
  //   }
  // };
  async function onPublish (formData, file) {
    formData.type = type;
    const newPublishedAt = file.publishedAt ? null : true;
    const res = await dispatch(asyncPatchFile({ id: file.id, updates: { publishedAt: newPublishedAt, description: formData.description, tags: formData.tags } }));
    if (res.type === asyncPatchFile.fulfilled.type) {
      dispatch(setModalPrimitives({ open: false }));
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        onPublish(formData, file);
      }}
      css={[modalBodyStyle]}
      noValidate
    >
       <Textfield
        label={type === 'tileset' ? 'Tileset description' : 'Map description'}
        type='text'
        autoFocus
        style={whiteInputStyle}
        name='description'
        disabled={pending}
        errors={errors && errors.description}
      />
     <Textfield
        label={type === 'tileset' ? 'Tileset tags' : 'Map tags'}
        type='text'
        autoFocus
        style={whiteInputStyle}
        name='tags'
        disabled={pending}
        errors={errors && errors.tags}
      />

      {/* <TagsInput selectedTags={selectedTags} tags={['Nodejs', 'MongoDB']}/> */}
{/*
   { <div className="App">
       <div css={tagsInputStyle}>
        <ul id="tags">
          {tags.map((tag, index) => (
            <li key={index} css={tagStyle}>
              <span className='tag-title'>{tag}</span>
              <span className='tag-close-icon'
                onClick={() => removeTags(index)}
              >
                x
              </span>
            </li>
          ))}
        </ul>
        <input
          type="text"
          onKeyUp={event => event.key === 'Enter' ? addTags(event) : null}
          onKeyPress={(e) => { e.target.keyCode === 13 && e.preventDefault(); }}
          placeholder="Press enter to add tags"
        />
      </div>
    </div> } */}
      <Button
        style={blackButtonStyle}
        disabled={pending}
      >
        <span>Publish {type}</span>
      </Button>
    </form>
  );
}
