export type MapMarkerKind = "pickup" | "driver" | "selected";

export type MapMarkerData = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  kind: MapMarkerKind;
};

export type TripMapProps = { markers: MapMarkerData[]; height?: number };