import { defineConfig } from 'vitest/config'
import {probeDirective} from 'vitest-probe'

export default defineConfig({
  test: { environment: 'node' },
  plugins: [
    probeDirective.vite({ 
      directive: '#vitest_probe',
      include: 'src/features'
    })
  ]
})