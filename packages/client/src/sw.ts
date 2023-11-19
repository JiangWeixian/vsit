import { NavigationRoute, registerRoute, Route } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

const urlPattern = /^https:\/\/esm\.sh\/.*/i

const navigationRoute = new NavigationRoute(new NetworkFirst({
  cacheName: 'navigations',
}))

const imageAssetRoute = new Route(({ request }) => {
  return urlPattern.test(request.url)
}, new CacheFirst({
  cacheName: 'image-assets',
}))

registerRoute(navigationRoute)
registerRoute(imageAssetRoute)
