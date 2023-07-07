import { createServer } from 'vite'

import { PluginPreview } from '@/plugins/preview'
import { PluginVit } from '@/plugins/vsit'

export const main = async () => {
  const server = await createServer({
    configFile: false,
    preview: {
      port: 5173,
      cors: true,
    },
    plugins: [
      PluginVit(),
      PluginPreview(),
    ],
  })
  await server.listen()
  server.printUrls()
}
