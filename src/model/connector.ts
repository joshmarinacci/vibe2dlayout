import type { Anchor, Point } from './transform'

/** One endpoint of a connector line */
export type ConnectorEndpoint =
  | { kind: 'free'; point: Point }
  | { kind: 'attached'; shapeId: string; anchor: Anchor }

export type ConnectorRouteMode = 'straight' | 'orthogonal' | 'curved'

export interface ConnectorRoute {
  mode: ConnectorRouteMode
  /** Intermediate control points (empty for straight) */
  waypoints: Point[]
}
