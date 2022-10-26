/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Navbar } from '../Dashboard/Navbar/Navbar';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getFileToView } from '../File/fileSlice';
import { FileDescriber } from '../../components/FileDescriber';

const fileViewerStyle = css`
  padding: 0 20px 8px 90px;
  display: flex;
`;

const filePanelStyle = css`
  flex: 3;
  margin: 5px;
  height: 100%;
`;

const fileRecomStyle = css`
  flex: 1;
  margin: 5px;
  height: 100%;
`;

const canvasStyle = css`
  width: 100%;
  aspect-ratio: 270 / 170;
  background: white;
`;

const imageStyle = css`
  object-fit: contain;
  width: 100%;
`;

export function FileViewer () {
  const { id } = useParams();
  // const location = useLocation();
  const dispatch = useDispatch();
  // const pathname = location.pathname;
  const fileSlice = useSelector((state) => state.file);
  const userSlice = useSelector((state) => state.user);
  const file = fileSlice.file;
  const username = userSlice.primitives.user && userSlice.primitives.user.username;

  useEffect(() => {
    dispatch(getFileToView({ id }));
  }, []);

  return (
    <Fragment>
      <Navbar />
      {file && (
        <div css={fileViewerStyle}>
          <div css={filePanelStyle}>
            <div css={canvasStyle}>
              <img src='/mock-data/file-image.png' css={imageStyle}/>
            </div>
            <FileDescriber
              authorUserName={file.authorUserName}
              filename={file.name}
              views={1000}
              publisDate={file.createdAt}
              likes={file.likeCount}
              description='Sample Description'
              tags={file.tags}
              type={file.type}
              dimension={file.tileDimension}
              liked={file.likes.some(l => l.username === username)}
            />
          </div>
          <div css={fileRecomStyle}>
            <h1>Recommendation</h1>
          </div>
        </div>
      )}
    </Fragment>
  );
}
