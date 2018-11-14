const f = `
	window.hidenav = true
	var socket = new WebSocket( 'ws://${ window.SERVER_NAME.replace( /https?:\/\/(.*)(?:\:|$)/, '$1' ) }:9001' );
	socket.onmessage = function(event) {
		if (event.data === 'reload') {
			window.location.reload()
		}
	};
`
