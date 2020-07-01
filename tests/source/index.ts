import { foo } from './foo'
import { bar } from "./bar.js"
import { baz } from './.baz/index'
import pick from 'lodash/pick'
import isRegExp from 'lodash/isRegExp'
import { EventEmitter } from 'events'
export { foo } from './foo'
export { bar } from "./bar.js"
export { baz }
export { Apple, Banana, Cherry } from './multiple-types'

foo()
bar()
baz()

EventEmitter
pick
isRegExp