import markdownIt from 'markdown-it'
import {
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from 'solid-js'

import { apis } from '@/lib/apis'

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

export interface Pkg {
  name: string
  version: string
}

interface ReadmeProps {
  pkgs: Pkg[]
}

export const Readme = (props: ReadmeProps) => {
  const [name, setName] = createSignal(props.pkgs[0]?.name)
  const [readme] = createResource(name, apis.third.fetchPkgReadme)
  return (
    <div class="bg-base-300 relative flex h-full flex-col">
      <div class="tabs grow-0 pt-4">
        <For each={props.pkgs}>
          {pkg => (
            <a
              classList={{
                tab: true,
                'tab-sm': true,
                'tab-bordered': true,
                'tab-active': pkg.name === name(),
              }}
              onClick={() => setName(pkg.name)}
            >
              {pkg.name}
            </a>
          )}
        </For>
      </div>
      <Show when={readme.loading}>
        <div class="bg-base-300 absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center">
          <i class="gg-spinner-alt" />
        </div>
      </Show>
      <Switch>
        <Match when={readme()}>
          <article
            class="prose prose-sm bg-base-300 w-full max-w-full grow overflow-auto p-4"
            innerHTML={md.render(readme() ?? '')}
          />
        </Match>
      </Switch>
    </div>
  )
}
