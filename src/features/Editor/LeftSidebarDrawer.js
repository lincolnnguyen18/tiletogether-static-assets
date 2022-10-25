/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Sidebar } from '../../components/Sidebar';

const leftSidebarDrawerStyle = css`
  left: ${54}px !important;
  background: #3F3F3F !important;
  padding: 48px 24px;
  width: 270px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export function LeftSidebarDrawer ({ open, onClose, style, children }) {
  return (
    <Sidebar
      open={open}
      onClose={onClose}
      style={[leftSidebarDrawerStyle, style]}
    >
      {children}
    </Sidebar>
  );
}
