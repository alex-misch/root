import { Service } from 'bmpjs/core'

const jetsmApi = new Service.RestResource({
	host: window.apiGateway || 'http://jetsm.com:3000'
})

const graphApi = new Service.GraphResource({
	host: `${window.SERVER_NAME}/graph/v1`,

})

const Api = {
	graph: graphApi,
	jetsm: jetsmApi,
}

export default Api
