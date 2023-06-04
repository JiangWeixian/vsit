import clsx from 'clsx'
import { useRef, useState } from 'react'

const Home = () => {
  const [type, setType] = useState<'web' | 'node'>('web')
  const contentRef = useRef<HTMLDivElement>(null)
  const [logState, setLogState] = useState<any[]>([])
  const wrapConsole = () => {
    const console = window.console
    const log = console.log
    console.log = (msg, ...args: any[]) => {
      setLogState(prev => prev ? [...prev, msg] : [msg])
      log.apply(console, [msg, ...args])
    }
  }
  const handleClick = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerText
      const script = document.createElement('script')
      script.type = 'module'
      script.innerHTML = content
      const body = document.querySelector('body')
      body?.appendChild(script)
      wrapConsole()
    }
  }
  const handleSwitchType = (type: 'web' | 'node') => {
    setType(type)
  }
  return (
    <div className="h-full bg-base-200">
      <div className="tabs tabs-boxed">
        <a className={clsx('tab', { 'tab-active': type === 'web' })} onClick={() => handleSwitchType('web')}>Web</a>
        <a className={clsx('tab', { 'tab-active': type === 'node' })} onClick={() => handleSwitchType('node')}>Node</a>
      </div>
      <div contentEditable={true} ref={contentRef} className="code-editor">
        <p>{'import { uniq } from "https://esm.sh/lodash-es@4.17.21"'}</p>
        <p>{'const a = uniq([1, 2, 3, 3])'}</p>
        <p>{'console.log(a)'}</p>
      </div>
      <button className="btn" onClick={handleClick}>run</button>
      <pre className="log">
        {logState.map((item, index) => <p key={index}>{JSON.stringify(item, null, 2)}</p>)}
      </pre>
    </div>
  )
}

export default Home
