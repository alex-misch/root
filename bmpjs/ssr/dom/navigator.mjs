import UserAgent from "express-useragent"

const Navigator = ({ userAgent }) => {

	const ua = UserAgent.parse(userAgent)
	return {
		appCodeName: ua.browser,
		appName: ua.browser,
		appVersion: ua.source,
		platform: ua.platform,
		product: ua.platform,
		userAgent
	}
}

export { Navigator }
