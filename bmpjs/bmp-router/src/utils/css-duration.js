
const getDuration = el => {
  let {transitionDuration} = window.getComputedStyle( el )
  if ( /^[0-9\.]+s?/.test( transitionDuration ) ) {  // seconds
    transitionDuration = 1000 * parseFloat( transitionDuration )
  }
  return parseFloat(transitionDuration)
}

export { getDuration }
