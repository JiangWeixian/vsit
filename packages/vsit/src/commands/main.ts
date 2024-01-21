import { createServer } from 'vite'

import { PluginPreview } from '@/plugins/preview'
import { vsit } from '@/plugins/vsit'

export const main = async () => {
  const server = await createServer({
    configFile: false,
    preview: {
      port: 5173,
      cors: true,
    },
    plugins: [
      vsit(),
      PluginPreview(),
    ],
  })
  await server.listen()
  server.printUrls()
}
