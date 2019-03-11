
const secs = ms => `${ parseFloat(ms/1000).toFixed(3) }s`
const currentTime = () => (new Date()).getTime()
const start = currentTime()

export const timeStamp = (s = start) => secs(currentTime() - s)
