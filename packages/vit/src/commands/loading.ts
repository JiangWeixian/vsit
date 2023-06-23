import consola from 'consola'
import ora from 'ora'

const spinner = ora('Loading')

interface Options {
  text?: string
}

export const loading = (
  ms = 1000,
  { text = 'bin-template' }: Options = { text: 'bin-template' },
) => {
  try {
    spinner.text = text
    spinner.start()
    setTimeout(() => {
      spinner.stop()
      console.log('💅')
    }, ms)
  } catch (e) {
    consola.error(e)
  }
}
