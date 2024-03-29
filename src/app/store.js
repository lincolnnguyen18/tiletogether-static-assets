import { configureStore } from '@reduxjs/toolkit';
import { dashboardReducer } from '../features/Dashboard/dashboardSlice';
import { menuReducer } from '../components/Menu/menuSlice';
import { modalReducer } from '../components/Modal/modalSlice';
import { userReducer } from '../features/User/userSlice';
import { fileReducer } from '../features/File/fileSlice';
import { leftSidebarReducer } from '../features/Editor/leftSidebarSlice';
import { tilesetEditorReducer } from '../features/TilesetEditor/tilesetEditorSlice';
import { tilesetRightSidebarReducer } from '../features/TilesetEditor/rightSidebarSlice';
import { mapEditorReducer } from '../features/MapEditor/mapEditorSlice';

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    menu: menuReducer,
    modal: modalReducer,
    user: userReducer,
    file: fileReducer,
    leftSidebar: leftSidebarReducer,
    tilesetEditor: tilesetEditorReducer,
    mapEditor: mapEditorReducer,
    tilesetRightSidebar: tilesetRightSidebarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
