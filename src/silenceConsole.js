// Disable console output in production to hide internal logs from end users
// This file must be imported FIRST before any other modules
if (import.meta.env.PROD) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  // Keep console.error for critical runtime issues
}
