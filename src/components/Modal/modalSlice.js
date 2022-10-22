import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

const initialState = {
  primitives: {
    open: false,
    width: 300,
  },
  reactElements: {
    children: null,
    header: null,
  },
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    setModalPrimitives: (state, action) => {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    setModalReactElements: (state, action) => {
      _.assign(state.reactElements, action.payload);
    },
  },
});

export const { setModalPrimitives, setModalReactElements } = modalSlice.actions;

export const modalReducer = modalSlice.reducer;
