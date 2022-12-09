import React from 'react';
import {Dimensions} from 'react-native';
import AdjustablePolygon, {
  CornerUpdateHandler,
  InitialValues,
} from './AdjustablePolygon';

const App = () => {
  const initialValues: InitialValues = {
    topLeft: {
      x: 100,
      y: 300,
    },
    topRight: {
      x: 300,
      y: 300,
    },
    bottomRight: {
      x: 300,
      y: 600,
    },
    bottomLeft: {
      x: 100,
      y: 600,
    },
  };
  const {width, height} = Dimensions.get('screen');

  const handleCornerUpdate: CornerUpdateHandler = corner => {
    console.log(
      corner.position,
      ' corner updated',
      corner.point.x,
      corner.point.y,
    );
  };

  return (
    <AdjustablePolygon
      onCornerUpdate={handleCornerUpdate}
      initialValues={initialValues}
      width={width}
      height={height}
    />
  );
};

export default App;
