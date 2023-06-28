declare module 'body-parser'

declare module 'http' {
  interface IncomingMessage {
    body: { content: string }
  }
}
