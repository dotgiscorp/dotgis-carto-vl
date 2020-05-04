import React from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import { SQLLayer } from '@dotgis/carto-vl';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiZG90Z2lzIiwiYSI6ImNqeTV0emx3MDBhZXAzb3IycGxwNHgxb3QifQ.cm7eJy05QPha8mjMO8bz9g';

const QUERY = `SELECT cartodb_id, the_geom, the_geom_webmercator, name, year, count, mass FROM meteorites WHERE mass > 1000`;
const COLOR = alpha => `opacity(turquoise, ${alpha})`;
const DELAY = 150;

function App() {
  const [mapObject, setMap] = React.useState();
  const [featuresEntered, setFeaturesEntered] = React.useState();
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const map = new Map({
      container: 'map-container',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [0, 15],
      zoom: 1.5
    });

    setMap(map);
  }, []);

  const hanleFeatureEnter = feature => {
    if (featuresEntered) {
      featuresEntered.color.reset();
    }

    setFeaturesEntered(feature);

    feature.color.blendTo(COLOR(1), DELAY);
  };

  const hanleFeatureLeave = feature => {
    feature.color.reset(DELAY);
  };

  const getViewportCount = ({count}) => {
    setCount(count);
  };

  const mathVariables = {
    props: {
      onMathCalculationsViewport: data => getViewportCount(data)
    },
    definition: [
      {
        name: 'count',
        expression: `viewportCount()`,
        method: 'onMathCalculationsViewport'
      }
    ]
  };

  return (
    <div id="map-container">
      {mapObject && (
        <SQLLayer
          key="sql-layer"
          mapInstance={mapObject}
          basemapId="waterway-label"
          name="meteorites-layer"
          query={QUERY}
          fields={['cartodb_id', 'name', 'year', 'count', 'mass']}
          user="dotgis"
          apiKey="default_public"
          width="(sqrt($mass) / 25) + 3"
          color={COLOR(0.8)}
          strokeWidth={0}
          {...mathVariables.props}
          mathVariables={mathVariables.definition}
          featureEnter={(feature, coords) => hanleFeatureEnter(feature)}
          featureLeave={(feature) => hanleFeatureLeave(feature)}
        />
      )}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.25rem', color: '#fff', zIndex: 1 }}>
        <span>viewport count: </span> {count}
      </div>
    </div>
  ) 
}

export default App;
