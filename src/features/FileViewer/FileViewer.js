/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Navbar } from '../Dashboard/Navbar/Navbar';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getFileToView } from '../File/fileSlice';
import { FileInfo } from './FileInfo';
import { Grid } from '../../components/Grid';
import { Button, transparentButtonStyle } from '../../components/inputs/Button';
import { File } from '../File/File';
import { loadMoreButtonStyle, loadMoreContainerStyle, getSubtext } from '../Dashboard/Dashboard';
import { getMoreRecommendation, getRecommendation } from './FileViewerSlice';
import { CommentSection } from './CommentSection';

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
`;

const imageStyle = css`
  object-fit: contain;
  width: 100%;
  image-rendering: pixelated;
`;

const gridStyle = css`
  padding: 0 20px 8px 20px;
  max-width: 400px;
  margin: 0 auto;
`;

export function FileViewer () {
  const { id } = useParams();
  // const location = useLocation();
  const dispatch = useDispatch();
  // const pathname = location.pathname;
  const fileSlice = useSelector((state) => state.file);
  const userSlice = useSelector((state) => state.user);
  const fileViewerSlice = useSelector((state) => state.fileViewer);
  const file = fileSlice.file;
  const username = userSlice.primitives.user && userSlice.primitives.user.username;
  const files = fileViewerSlice.files;
  const pending = fileViewerSlice.pending;

  useEffect(() => {
    dispatch(getFileToView({ id }));
    dispatch(getRecommendation({ id }));
  }, [id]);

  return (
    <Fragment>
      <Navbar />
      {file && file.likes && (
        <div css={fileViewerStyle}>
          <div css={filePanelStyle}>
            <div css={canvasStyle}>
              <img src='/mock-data/file-image.png' css={imageStyle}/>
            </div>
            <FileInfo
              authorUserName={file.authorUsername}
              filename={file.name}
              type={file.type}
              dimension={file.tileDimension}
              width={file.width}
              height={file.height}
              publishDate={file.publishedAt}
              views={file.views}
              likes={file.likeCount}
              liked={file.likes.some(l => l.username === username)}
              description={file.description}
              tagStr={file.tags}
            />
            <CommentSection
              authorUserName={file.authorUsername}
              comments={file.comments}
            />
          </div>
          <div css={fileRecomStyle}>
            <Grid itemWidth={400} gap={8} style={gridStyle}>
              {files.map((file, index) => (
                <File
                  key={index}
                  imageUrl='/mock-data/file-image.png'
                  title={file.name}
                  subtext={getSubtext(username === file.username ? 'your-files' : 'file-viewer', file)}
                  liked={userSlice.primitives.user && file.likes && file.likes.find(like => like.username === userSlice.primitives.user.username) != null}
                  id={file._id}
                  type={file.type}
                  maxNameWidth={260}
                />
              ))
              }
            </Grid>
            {fileViewerSlice.lastFile != null && (
              <div css={loadMoreContainerStyle}>
                <Button
                  style={[transparentButtonStyle, loadMoreButtonStyle]}
                  onClick={() => dispatch(getMoreRecommendation({ id, continuationToken: JSON.stringify(fileViewerSlice.lastFile) }))}
                >
                  <span className='text'>{pending.includes('getMoreFiles') ? 'Loading...' : 'Load More'}</span>
                  <span className='icon-more' />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
}
