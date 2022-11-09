/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Fragment, useEffect } from 'react';
import { Navbar } from '../Dashboard/Navbar/Navbar';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { asyncGetFiles, asyncGetFileToView, selectFileStatuses } from '../File/fileSlice';
import { FileInfo } from './FileInfo';
import { CommentSection } from './CommentSection';
import { File } from '../File/File';
import { getSubtext, loadMoreButtonStyle } from '../Dashboard/Dashboard';
import { Button, transparentButtonStyle } from '../../components/inputs/Button';
import { NotFound } from './NotFound';
import { AddComment } from './AddComment';
import { selectUser } from '../User/userSlice';

const fileViewerStyle = css`
  display: flex;
  max-width: 1753px;
  height: calc(100% - var(--navbar-height));
  margin: 0 auto;
  padding: 0 20px;
  justify-content: center;
  gap: 20px;
`;

const leftSideStyle = css`
  width: 100%;
  padding-bottom: 20px;
  height: fit-content;
`;

const rightSideStyle = css`
  flex-shrink: 0;
  width: 425px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: fit-content;
  padding-bottom: 20px;
  
  .load-more-container {
    display: flex;
    justify-content: center;
  }
`;

const canvasStyle = css`
  background: var(--file-background);
  width: 100%;
  height: fit-content;
  min-height: 300px;
  max-height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
  image-rendering: pixelated;
  object-fit: contain;
`;

export function FileViewer () {
  const { id } = useParams();
  const dispatch = useDispatch();
  const fileSlice = useSelector((state) => state.file);
  const userSlice = useSelector((state) => state.user);
  const file = fileSlice.file;
  const user = useSelector(selectUser);
  const noMoreFiles = fileSlice.primitives.noMoreFiles;
  const files = fileSlice.files;
  const statuses = useSelector(selectFileStatuses);

  useEffect(() => {
    dispatch(asyncGetFileToView({ id }));
    dispatch(asyncGetFiles({ location, getRecommended: id }));
  }, [id]);

  let content;

  if (statuses.getFileToView !== 'rejected') {
    content = (
      <Fragment>
        <Navbar />
        {file && file.likes && files && files.length > 0 && (
          <div css={fileViewerStyle}>
            <div css={leftSideStyle}>
              <img src='/mock-data/file-image.png' css={canvasStyle} />
              <FileInfo />
              <AddComment />
              <CommentSection />
            </div>
            <div css={rightSideStyle}>
              {files.map((file, index) => (
                <File
                  key={index}
                  imageUrl='/mock-data/file-image.png'
                  title={file.name}
                  subtext={getSubtext(user && user.username === file.username
                    ? 'your-files'
                    : 'file-viewer', file)}
                  liked={userSlice.primitives.user && file.likes && file.likes.find(like => like.username === user.username) != null}
                  id={file._id || file.id}
                  type={file.type}
                  maxNameWidth={260}
                />
              ))}
              {!noMoreFiles && (
                <div className={'load-more-container'}>
                  <Button
                    style={[transparentButtonStyle, loadMoreButtonStyle]}
                    onClick={() => dispatch(asyncGetFiles({ location, loadMore: true, getRecommendation: id }))}
                  >
                    <span className='text'>{statuses.getFiles === 'pending' ? 'Loading...' : 'Load More'}</span>
                    <span className='icon-more' />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Fragment>
    );
  } else {
    content = (
      <NotFound />
    );
  }

  return content;
}
