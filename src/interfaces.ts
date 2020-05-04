import { Position } from 'geojson';
import { Coords, Legend, Labels, DynamicVariables, Symbols, SymbolPlacement } from './types';

export interface CommonProps {
  mapInstance: any;
  basemapId: string;
}

export interface OptionalCommonProps {
  color: string;
  strokeColor: string; // not applicable to lines
  width: number | string; // not applicable to polygons
  strokeWidth: number; // not applicable to lines
  filter: string;
  minzoom: number;
  maxzoom: number;
  visible: boolean;
  onLoaded: (message: string) => void;
}

export interface SQLLayerProps {
  name: string;
  query: string;
  user: string;
  apiKey: string;
}

export interface OptionalSQLLayerProps {
  fields: string[];
  featureClick: (event: any, coords: Coords) => void;
  featureEnter: (event: any, coords: Coords) => void;
  featureLeave: (event: any) => void;
  onInitialViewportFeatures: (event: any) => void;
  getLegendData: (data: Legend) => void;
  histogramVariables: DynamicVariables;
  mathVariables: DynamicVariables;
  globalVariables: DynamicVariables;
  labels: Labels;
  // bridgeProps: any
}

export interface DynamicSQLLayerProps {
  [key: string]: (data: any) => void;
}

export interface IsochroneProps {
  polygonName: string;
  markerName: string;
  markerField: string;
  symbol: Symbols;
  symbolColor: string;
  symbolPlacement: SymbolPlacement;
  symbolWidth: number;
  polygon: Position[][][];
  center: Position;
}

export interface OptionalIsochroneProps {
  polygonClick: (event: any) => void;
  polygonEnter: (event: any, coords: Coords) => void;
  polygonLeave: (event: any) => void;
  markerClick: (event: any) => void;
  markerEnter: (event: any, coords: Coords) => void;
  markerLeave: (event: any) => void;
}

export interface SQLLayerState {
  layer: any;
  viz: any;
}

export interface IsochroneState {
  polygonLayer: any;
  symbolLayer: any;
  polygonViz: any;
  symbolViz: any;
}
