/**
 * Errors for our simulated programming language and runtime.
 * These do not inherit from JS's own Error as they do not need
 * to reveal details of the interpreter/runtime internals.
 */
export class Exception {
  message: string
  data: any[]
  constructor(message: string, ...data: any[]) {
    this.message = message
    this.data = data
  }
}
