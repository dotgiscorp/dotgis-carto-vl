export type Coords = {
    lng: number;
    lat: number;
};

type RgbLegend = {
    r: number;
    g: number;
    b: number;
    a: number;
};

export type Legend = {
    type: string;
    name: string;
    data: Array<{ key: string; value: RgbLegend }>;
};

export type LabelsLayout = {
    textSize: number;
    textFont: string[];
    textLetterSpacing: number;
    textMaxWidth: number;
    textTransform: 'none' | 'uppercase' | 'lowercase';
};

export type LabelsPaint = {
    textColor: string;
};

export type Labels = {
    field: string;
    maxzoom: number;
    minzoom: number;
    layout: Partial<LabelsLayout>;
    paint: Partial<LabelsPaint>;
};

export type Symbols =
    | 'BICYCLE'
    | 'BUILDING'
    | 'BUS'
    | 'CAR'
    | 'CIRCLE'
    | 'CIRCLE_OUTLINE'
    | 'CROSS'
    | 'FLAG'
    | 'HOUSE'
    | 'MARKER'
    | 'MARKER_OUTLINE'
    | 'SQUARE'
    | 'SQUARE_OUTLINE'
    | 'STAR'
    | 'STAR_OUTLINE'
    | 'TRIANGLE'
    | 'TRIANGLE_OUTLINE';

export type SymbolPlacement =
    | 'align_center'
    | 'align_bottom'
    | 'placement(1, 1)'
    | 'placement(0, 0)'
    | 'placement(-1, -1)';

// type GlobalHistogram = { field: string, buckets: number[][] };

export type DynamicVariables = {
    props: { [key: string]: (data: any) => void };
    definition: Array<{ name: string; expression: string; method: string }>;
}[];

export type MapEvents =
    | 'featureClick'
    | 'featureClickOut'
    | 'featureHover'
    | 'featureEnter'
    | 'featureLeave';

export type VizProps =
    | 'color'
    | 'width'
    | 'strokeColor'
    | 'strokeWidth'
    | 'filter'
    | 'symbol'
    | 'symbolPlacement'
    | 'transform'
    | 'order'
    | 'resolution'
    | 'variables';
