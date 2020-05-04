import * as React from 'react';
import carto from '@carto/carto-vl';
import {
  CommonProps,
  OptionalCommonProps,
  SQLLayerProps,
  OptionalSQLLayerProps,
  DynamicSQLLayerProps,
  SQLLayerState as State
} from '../interfaces';
import { VizProps, MapEvents, LabelsLayout, LabelsPaint } from '../types';
import * as GeoJSON from 'geojson';

type Props = CommonProps &
  Partial<OptionalCommonProps> &
  SQLLayerProps &
  Partial<OptionalSQLLayerProps> &
  Partial<DynamicSQLLayerProps>;

export default class SQLLayer extends React.Component<Props, State> {
  public static defaultProps = {
    color: 'rgba(0, 255, 0, .1)',
    strokeColor: 'rgb(0, 255, 0)',
    width: 1,
    strokeWidth: 1,
    filter: '',
    minzoom: 1,
    maxzoom: 22,
    visible: true,
    labels: {
      layout: {
        textSize: 16,
        textFont: ['Open Sans Regular', 'Arial Unicode MS Regular'],
        textLetterSpacing: 0,
        textMaxWidth: 10,
        textTransform: 'none'
      } as LabelsLayout,
      paint: {
        textColor: '#000000'
      } as LabelsPaint
    }
  };

  private onStyleDataChange = () => {
    // if the style of the map has been updated and we don't have layer anymore,
    // add it back to the map and force re-rendering to redraw it
    if (!this.props.mapInstance.getLayer(this.props.name)) {
      this.initialize();
      this.forceUpdate();
    }
  };

  public UNSAFE_componentWillMount() {
    const { mapInstance, query, fields } = this.props;

    fields &&
      fields.map((field: string) => {
        if (!query.includes(field)) {
          throw new Error(
            `Ups! the prop 'query' must includes all the fields you defined in 'fields' prop. Include the prop => ${field}`
          );
        }
      });

    this.initialize();

    mapInstance.on('styledata', this.onStyleDataChange);
  }

  public componentWillUnmount() {
    const { layer } = this.state;
    const { mapInstance } = this.props;

    if (!mapInstance || !mapInstance.getStyle()) {
      return;
    }

    mapInstance.off('styledata', this.onStyleDataChange);

    if (layer) {
      try {
        layer.remove();
      } catch (err) {
        throw new Error(`Could not remove the rendered layer: ${err}`);
      }
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { minzoom, maxzoom } = this.props;

    const {
      query: prevQuery,
      color: prevColor,
      strokeColor: prevStrokeColor,
      strokeWidth: prevStrokeWidth,
      filter: prevFilter,
      visible: prevVisible,
      basemapId: prevBasemapId
    } = prevProps;

    const {
      query: nextQuery,
      color: nextColor,
      strokeColor: nextStrokeColor,
      strokeWidth: nextStrokeWidth,
      filter: nextFilter,
      visible: nextVisible,
      basemapId: nextBasemapId
    } = this.props;

    if (nextBasemapId !== prevBasemapId) {
      this.initialize();
    }

    if (nextQuery !== prevQuery) {
      this._updateQuery(nextQuery);
    }

    if (nextColor !== prevColor) {
      this._updateVizProp('color', nextColor);
    }

    if (nextStrokeColor !== prevStrokeColor) {
      this._updateVizProp('strokeColor', nextStrokeColor);
    }

    if (nextStrokeWidth !== prevStrokeWidth) {
      this._updateVizProp('strokeWidth', nextStrokeWidth);
    }

    if (nextFilter !== prevFilter) {
      this._updateVizProp('filter', `zoom() < ${maxzoom} and zoom() > ${minzoom} ${nextFilter}`);
    }

    if (nextVisible !== prevVisible) {
      this._layerVisiblity(nextVisible);
    }
  }

  private initialize() {
    const {
      mapInstance,
      basemapId,
      name,
      query,
      fields,
      user,
      apiKey,
      color,
      width,
      strokeColor,
      strokeWidth,
      filter,
      minzoom,
      maxzoom,
      visible,
      onLoaded,
      featureClick,
      featureEnter,
      featureLeave,
      onInitialViewportFeatures,
      getLegendData,
      // bridgeProps,
      labels,
      histogramVariables,
      mathVariables,
      globalVariables
    } = this.props;

    const source = new carto.source.SQL(query, {
      username: user,
      apiKey: apiKey
    });

    const viz = new carto.Viz(`
      @v_features: viewportFeatures(${
        fields ? fields.map((field: string) => `$${field}`).toString() : '$cartodb_id'
      }),
      color: ${color},
      strokeColor: ${strokeColor},
      strokeWidth: ${strokeWidth},
      filter: zoom() < ${maxzoom} and zoom() > ${minzoom} ${filter},
      ${width ? `width: ${width},` : ''}
      ${labels && labels.field ? `@v_labels: viewportFeatures($${labels.field}),` : ''}
      ${
        histogramVariables
          ? histogramVariables
              .map((variable: any) => `@${variable.name}: ${variable.expression}`)
              .toString()
          : ''
      }
      ${
        mathVariables
          ? mathVariables
              .map((variable: any) => `@${variable.name}: ${variable.expression}`)
              .toString()
          : ''
      }
      ${
        globalVariables
          ? globalVariables
              .map((variable: any) => `@${variable.name}: ${variable.expression}`)
              .toString()
          : ''
      }
    `);

    const layer = new carto.Layer(name, source, viz);

    this.setState({
      layer: layer,
      viz: viz
    });

    // if (bridgeProps && bridgeProps.length !== 0) {
    //  this._hasBridge(source, bridgeProps);
    //} else {
    layer.addTo(mapInstance, basemapId.includes('carto') ? 'watername_ocean' : basemapId);
    //}

    layer.on('loaded', () => {
      const message = `🤖 layer '${name}' 🤖 was loaded 🤖`;

      if (onLoaded) {
        onLoaded(message);
      }

      if (onInitialViewportFeatures) {
        setTimeout(() => {
          // Should find a solution to get all the Protobuf features
          // Probably getting the tile data replace {x} => 0; {y} => 0; {z} => 0 :S
          onInitialViewportFeatures(layer.viz.variables.v_features.value);
        }, 1000);
      }

      if (getLegendData) {
        if (layer && viz) {
          getLegendData(layer.viz.color.getLegendData());
        }
      }

      if (globalVariables) {
        globalVariables.forEach(
          (variable: any): void => {
            const histogram = layer.viz.variables[variable.name];
            const size = histogram._histogram.size;

            let percentages = {};
            for (let i = 0; i <= size; i++) {
              percentages = { ...percentages, [i]: histogram._histogram.get(i) * 100 || 0 };
            }

            this.props[variable.method](percentages);
          }
        );
      }

      this._layerVisiblity(visible);

      if (labels && labels.field) {
        this._addLabel();
      }
    });

    layer.on('updated', () => {
      if (histogramVariables) {
        histogramVariables.forEach(
          (variable: any): void => {
            const histogram = layer.viz.variables[variable.name];
            const histogramData = histogram.value;

            this.props[variable.method](histogramData);
          }
        );
      }

      let calculation = {};
      if (mathVariables) {
        mathVariables.forEach(
          (variable: any): void => {
            calculation = {
              ...calculation,
              [variable.name]: layer.viz.variables[variable.name].value || 0
            };

            this.props[variable.method](calculation);
          }
        );
      }

      if (labels && labels.field) {
        this._labelsLayerUpdated();
      }
    });

    if (featureClick) {
      this._enableFeatureClickEvent(new carto.Interactivity(layer));
    }

    if (featureEnter) {
      this._enableFeatureEnterEvent(new carto.Interactivity(layer));
    }

    if (featureLeave) {
      this._enableFeatureLeaveEvent(new carto.Interactivity(layer));
    }
  }

  private _addLabel() {
    const { layer } = this.state;
    const { mapInstance, labels } = this.props;

    mapInstance.addSource('labels', { type: 'geojson', data: null });

    mapInstance.addLayer({
      id: 'map-labels',
      type: 'symbol',
      source: 'labels',
      maxzoom: labels.maxzoom,
      minzoom: labels.minzoom,
      layout: {
        'text-field': '{label_field}',
        'text-size': labels.layout.textSize,
        'text-font': labels.layout.textFont,
        'text-letter-spacing': labels.layout.textLetterSpacing,
        'text-max-width': labels.layout.textMaxWidth,
        'text-transform': labels.layout.textTransform
      },
      paint: {
        'text-color': labels.paint.textColor
      }
    });

    layer.addTo(mapInstance);
  }

  private _labelsLayerUpdated() {
    const { viz } = this.state;
    const { mapInstance, labels } = this.props;

    const labelSource = mapInstance.getSource('labels');

    const features = viz.variables.v_labels.value;
    const geojsonFeatures = features.map(
      (feature: any): GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties> => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: (feature.getRenderedCentroid() || [0, 0]) as GeoJSON.Position
        },
        properties: {
          label_field: `${feature.properties[labels.field]}`
        }
      })
    );

    labelSource &&
      labelSource.setData({
        type: 'FeatureCollection',
        features: geojsonFeatures as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]
      });
  }

  private _enableFeatureClickEvent(interactivity: any) {
    let lastClickedFeature = null;
    interactivity.on('featureClick' as MapEvents, (featureEvent: any) => {
      featureEvent.features.forEach((feature: any) => {
        if (!feature) {
          return;
        }
        lastClickedFeature = featureEvent.features[0];
        if (feature.id !== lastClickedFeature) {
          this.props.featureClick(lastClickedFeature, featureEvent.coordinates);
        }
      });
    });
  }

  private _enableFeatureEnterEvent(interactivity: any) {
    interactivity.on('featureEnter' as MapEvents, (featureEvent: any) => {
      featureEvent.features.forEach((feature: any) => {
        if (!feature) {
          return;
        }
        this.props.featureEnter(featureEvent.features[0], featureEvent.coordinates);
      });
    });
  }

  private _enableFeatureLeaveEvent(interactivity: any) {
    interactivity.on('featureLeave' as MapEvents, (featureEvent: any) => {
      featureEvent.features.forEach((feature: any) => {
        if (!feature) {
          return;
        }
        this.props.featureLeave(featureEvent.features[0]);
      });
    });
  }

  private _updateQuery(query: string) {
    const { layer } = this.state;
    const { user, apiKey } = this.props;

    try {
      layer.update(
        new carto.source.SQL(query, {
          username: user,
          apiKey: apiKey
        })
      );
    } catch (err) {
      throw new Error(`Could not update and receive the new Protobuf: ${err}`);
    }
  }

  private _handleError(error: any) {
    const err = `Invalid viz: ${error}:${error.stack}`;
    console.warn(err);
  }

  private _updateVizProp(prop: VizProps, value: string | number) {
    const { viz } = this.state;

    try {
      if (viz) {
        // @ts-ignore
        viz[prop].blendTo(value).catch((error: any) => {
          this._handleError(error);
        });
      }
    } catch (error) {
      this._handleError(error);
    }
  }

  private _layerVisiblity(visiblity: boolean) {
    const { layer } = this.state;

    visiblity ? layer.show() : layer.hide();
  }

  public render() {
    return null as any;
  }
}

// private _hasBridge(source: any, bridgeProps: any) {
//   const { layer } = this.state;
//   const { mapInstance, basemapId } = this.props;

//   let indoorLayer = new VLBridge({
//     carto: carto,
//     map: mapInstance,
//     layer: layer,
//     source: source
//   });

//   for (const bridge of bridgeProps) {
//     let toJoin = {
//       readOnly: false
//     };

//     if (bridge.bucketRanges) {
//       indoorLayer[bridge.type](bridge.ref, bridge.field, Object.assign(toJoin, {bucketRanges: bridge.bucketRanges}));
//     } else {
//       indoorLayer[bridge.type](bridge.ref, bridge.field, toJoin);
//     }
//   }

//   indoorLayer.build();
//   layer.addTo(mapInstance, basemapId.includes('carto') ? 'watername_ocean' : basemapId);
// }
