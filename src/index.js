import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  // when needed, comment when developing, uncomment when committing
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,

  // when needed, uncomment when developing, comment when committing
  // using strictmode causes double render which can sometimes be a problem
  // <BrowserRouter>
  //   <Provider store={store}>
  //     <App />
  //   </Provider>
  // </BrowserRouter>,
);
