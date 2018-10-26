export default function (e) {
  e.closest = e.closest || function (css) {
      var node = this;

      while (node) {
        if (node.msMatchesSelector) {
          // ie 9-11
          if (node.msMatchesSelector(css)) return node;
          else node = node.parentElement;
        } else if (node.webkitMatchesSelector) {
          // webkit
          if (node.webkitMatchesSelector(css)) return node;
          else node = node.parentElement;
        } else {
          // other
          if (node.matches(css)) return node;
          else node = node.parentElement;
        }
      }
      return null;
    }
 }
