import React, { Fragment, useEffect } from 'react';

function focusNextElement (foward) {
  // add all elements we want to include in our selection
  const focusableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
  if (document.activeElement && document.activeElement.parentElement) {
    const focusable = Array.prototype.filter.call(document.activeElement.parentElement.querySelectorAll(focusableElements),
      function (element) {
        // check for visibility while always include the current activeElement
        return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement;
      });
    const index = focusable.indexOf(document.activeElement);

    if (index > -1) {
      const nextElement = focusable[index + 1] || focusable[0];
      const prevElement = focusable[index - 1] || focusable[focusable.length - 1];
      if (foward) {
        nextElement.focus();
      } else {
        prevElement.focus();
      }
    }
  }
}

function onKeydown (e) {
  if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
    e.preventDefault();
    focusNextElement(false);
  } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
    e.preventDefault();
    focusNextElement(true);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    window.closeMenu();
  }
}

export function TabbableItems ({ open, onClose, children }) {
  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', onKeydown);
      window.closeMenu = onClose;
    } else {
      window.removeEventListener('keydown', onKeydown);
      delete window.closeMenu;
      document.body.focus();
    }
  }, [open]);

  return (
    <Fragment>
      {children}
    </Fragment>
  );
}
