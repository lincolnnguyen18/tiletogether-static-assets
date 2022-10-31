/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { Icon } from './Icon';

export function LoadingIcon ({ iconSize = 26 }) {
  const loadingIconStyle = css`
    transform: rotate(${0}deg);
  `;

  return (
    <Icon
      size={iconSize}
      iconSize={iconSize}
    >
      <span className='icon-refresh' css={loadingIconStyle} />
    </Icon>
  );
}
