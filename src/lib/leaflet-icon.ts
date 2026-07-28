// Side-effect import: fixes Leaflet's default marker image paths under a
// bundler. Import once in any client component that renders a <Marker>.
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: (markerIcon2x as { src: string }).src,
  iconUrl: (markerIcon as { src: string }).src,
  shadowUrl: (markerShadow as { src: string }).src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
