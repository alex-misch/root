package ci

// describe artifacts and caches by something single
// describe store (session independent and not) - it is difference between artifact and cache
// type Store sync.Map

func ArtifactPath() string {
	return "/artifacts/$sessionId/$jobId"
}

func CachePath() string {
	return "/caches/$jobId"
}
