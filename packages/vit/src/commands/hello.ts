import consola from 'consola'
import inquirer from 'inquirer'
import pc from 'picocolors'

const words = ['world', '𝔴𝔬𝔯𝔩𝔡', '🅦🅞🅡🅛🅓', '𝚠𝚘𝚛𝚕𝚍']

export const hello = async (word: string) => {
  if (word) {
    console.log(`${pc.bgBlue('hello world')}`)
    return
  }
  try {
    const answers = await inquirer.prompt<{ word: string }>([
      {
        type: 'list',
        name: 'word',
        message: 'Please pick a word',
        choices: words.map((k) => {
          return {
            name: k,
            value: k,
          }
        }),
      },
    ])
    console.log(`${pc.bgBlue(pc.black(' info '))} ${answers.word}`)
  } catch (e) {
    consola.error(e)
  }
}
