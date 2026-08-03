// Side-effect import: fixes Leaflet's default marker image paths under a
// bundler. Import once in any client component that renders a <Marker>.
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Webpack returns a StaticImageData object ({ src }); Turbopack returns the
// URL string directly. Support both so the icon URLs are never undefined.
const assetUrl = (img: string | { src: string }): string =>
  typeof img === "string" ? img : img.src;

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl: assetUrl(markerIcon2x),
  iconUrl: assetUrl(markerIcon),
  shadowUrl: assetUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
