// Manual ambient declarations for federated remote modules, instead of the
// federation plugin's `dts: true` live type-hint fetching. That feature
// needs the remote's dev server running just to typecheck the Host, which
// is exactly the kind of fragility to avoid in a demo-reliability-first
// project — these two lines are simpler and don't depend on anything being
// up.
declare module 'main_app/MainAppRoutes' {
  import type { ComponentType } from 'react'
  const MainAppRoutes: ComponentType
  export default MainAppRoutes
}

declare module 'ai_control_tower/ControlTowerRoutes' {
  import type { ComponentType } from 'react'
  const ControlTowerRoutes: ComponentType
  export default ControlTowerRoutes
}
