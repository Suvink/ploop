import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import atlas from '../../assets/data/countries-110m.json';
import isoNumeric from '../../assets/data/iso-numeric.json';

type Props = { name: string };

const topo = atlas as unknown as Topology<{ countries: GeometryCollection<Props> }>;
const table = isoNumeric as Record<string, string>;

export interface CountryShape {
  alpha2: string | null;
  feature: Feature<Geometry, Props>;
}

let cache: CountryShape[] | null = null;

/** Country features with ISO alpha-2 codes, parsed once. */
export function countryShapes(): CountryShape[] {
  if (cache) return cache;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, Props>;
  cache = fc.features.map((f) => ({
    alpha2: (f.id != null ? table[String(f.id)] : table[`name:${f.properties.name}`]) ?? null,
    feature: f,
  }));
  return cache;
}
