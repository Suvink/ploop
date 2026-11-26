import { memo, useEffect, useMemo } from 'react';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { geoEqualEarth, geoPath, type GeoProjection } from 'd3-geo';
import type { MultiLineString } from 'geojson';
import { countryShapes } from '@/data/world';
import { greatCirclePoints, splitAntimeridian } from '@/lib/geo';
import type { Airport } from '@/lib/types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface MapColors {
  background?: string;
  land: string;
  visited: string;
  arc: string;
  dot: string;
  border?: string;
}

export interface MapRoute {
  a: Airport;
  b: Airport;
}

interface Props {
  width: number;
  height?: number;
  visited?: Set<string>;
  routes: MapRoute[];
  dots?: Airport[];
  colors: MapColors;
  /** 'world' shows the whole map; 'routes' zooms to fit the given routes. */
  fit?: 'world' | 'routes';
  animate?: boolean;
  strokeScale?: number;
  /** Draw land as a dot grid instead of solid fills. */
  dotted?: boolean;
}

const routesKey = (routes: MapRoute[]) => routes.map((r) => r.a.iata + r.b.iata).join(',');

type LandPath = { key: string; alpha2: string | null; d: string };
const landCache = new Map<string, LandPath[]>();

const sameSet = (a?: Set<string>, b?: Set<string>) =>
  a === b || (!!a && !!b && a.size === b.size && [...a].every((x) => b.has(x)));

/** Skip re-rendering when the map would look identical (callers often pass fresh arrays). */
function propsEqual(p: Props, n: Props): boolean {
  return (
    p.width === n.width &&
    p.height === n.height &&
    p.fit === n.fit &&
    p.animate === n.animate &&
    p.strokeScale === n.strokeScale &&
    p.dotted === n.dotted &&
    routesKey(p.routes) === routesKey(n.routes) &&
    (p.dots ?? []).map((d) => d.iata).join() === (n.dots ?? []).map((d) => d.iata).join() &&
    sameSet(p.visited, n.visited) &&
    JSON.stringify(p.colors) === JSON.stringify(n.colors)
  );
}

function arcGeometry(r: MapRoute): MultiLineString {
  return {
    type: 'MultiLineString',
    coordinates: splitAntimeridian(greatCirclePoints(r.a, r.b, 64)),
  };
}

function buildProjection(
  width: number,
  height: number,
  fit: 'world' | 'routes',
  routes: MapRoute[],
): GeoProjection {
  const p = geoEqualEarth();
  if (fit === 'routes' && routes.length) {
    // Centre on the routes' mean longitude (handles routes that cross the antimeridian).
    const lons = routes.flatMap((r) => [r.a.lon, r.b.lon]);
    const x = lons.reduce((s, l) => s + Math.cos((l * Math.PI) / 180), 0);
    const y = lons.reduce((s, l) => s + Math.sin((l * Math.PI) / 180), 0);
    const mid = (Math.atan2(y, x) * 180) / Math.PI;
    p.rotate([-mid, 0]);
    const pad = Math.min(width, height) * 0.18;
    p.fitExtent(
      [
        [pad, pad],
        [width - pad, height - pad],
      ],
      { type: 'MultiLineString', coordinates: routes.flatMap((r) => arcGeometry(r).coordinates) },
    );
    // Don't zoom in so far that short hops look like a blur of coastline.
    const maxScale = width * 1.6;
    if (p.scale() > maxScale) {
      const c = p.invert!([width / 2, height / 2])!;
      p.scale(maxScale).translate([width / 2, height / 2]);
      const now = p(c)!;
      const t = p.translate();
      p.translate([t[0] + (width / 2 - now[0]), t[1] + (height / 2 - now[1])]);
    }
  } else {
    p.fitExtent(
      [
        [2, 2],
        [width - 2, height - 2],
      ],
      { type: 'Sphere' },
    );
  }
  return p;
}

function Arc({
  d,
  length,
  color,
  width,
  progress,
}: {
  d: string;
  length: number;
  color: string;
  width: number;
  progress: SharedValue<number> | null;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: progress ? length * (1 - progress.value) : 0,
  }));
  if (!progress)
    return <Path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />;
  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
}

function WorldMapInner({
  width,
  height: h,
  visited,
  routes,
  dots = [],
  colors,
  fit = 'world',
  animate = false,
  strokeScale = 1,
  dotted = false,
}: Props) {
  const height = h ?? Math.round(width * 0.5);
  const projection = useMemo(
    () => buildProjection(width, height, fit, routes),
    [width, height, fit, routes],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const landKey = `${width}x${height}|${fit}|${fit === 'routes' ? routesKey(routes) : ''}`;
  const land = useMemo(() => {
    // Projecting ~180 country outlines is the expensive part; reuse it for identical maps.
    const hit = landCache.get(landKey);
    if (hit) return hit;
    const out = countryShapes().map((s, i) => ({
      // alpha2 isn't unique (Somaliland → SO, N. Cyprus → CY), so include the index.
      key: `${s.alpha2 ?? 'x'}-${i}`,
      alpha2: s.alpha2,
      d: path(s.feature) ?? '',
    }));
    if (landCache.size >= 24) landCache.delete(landCache.keys().next().value as string);
    landCache.set(landKey, out);
    return out;
  }, [path, landKey]);
  const arcs = useMemo(
    () =>
      routes.map((r, i) => {
        const g = arcGeometry(r);
        return {
          key: `${r.a.iata}-${r.b.iata}-${i}`,
          d: path(g) ?? '',
          length: path.measure(g) + 2,
        };
      }),
    [routes, path],
  );
  const points = useMemo(
    () =>
      dots
        .map((a, i) => ({ key: `${a.iata}-${i}`, xy: projection([a.lon, a.lat]) }))
        .filter((p) => p.xy && Number.isFinite(p.xy[0])),
    [dots, projection],
  );

  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) {
      progress.value = 0;
      progress.value = withDelay(
        150,
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [animate, routes, progress]);

  const unit = (width / 360) * strokeScale;
  return (
    <Svg
      width={width}
      height={height}
      accessibilityRole="image"
      accessibilityLabel={`Map with ${routes.length} routes`}
    >
      {colors.background && (
        <Rect x={0} y={0} width={width} height={height} fill={colors.background} />
      )}
      {dotted && (
        <Defs>
          {[
            ['dots-land', colors.land],
            ['dots-visited', colors.visited],
          ].map(([id, color]) => (
            <Pattern key={id} id={id} patternUnits="userSpaceOnUse" width={4} height={4}>
              <Circle cx={2} cy={2} r={1.25} fill={color} />
            </Pattern>
          ))}
        </Defs>
      )}
      <G>
        {land.map((l) => (
          <Path
            key={l.key}
            d={l.d}
            fill={
              l.alpha2 && visited?.has(l.alpha2)
                ? dotted
                  ? 'url(#dots-visited)'
                  : colors.visited
                : dotted
                  ? 'url(#dots-land)'
                  : colors.land
            }
            stroke={colors.border ?? 'none'}
            strokeWidth={colors.border ? 0.4 * unit : 0}
          />
        ))}
      </G>
      <G>
        {arcs.map((a) => (
          <Arc
            key={a.key}
            d={a.d}
            length={a.length}
            color={colors.arc}
            width={Math.max(1.2, 1.5 * unit)}
            progress={animate ? progress : null}
          />
        ))}
      </G>
      <G>
        {points.map((p) => (
          <Circle
            key={p.key}
            cx={p.xy![0]}
            cy={p.xy![1]}
            r={Math.max(1.8, 2.2 * unit)}
            fill={colors.dot}
          />
        ))}
      </G>
    </Svg>
  );
}

export const WorldMap = memo(WorldMapInner, propsEqual);
