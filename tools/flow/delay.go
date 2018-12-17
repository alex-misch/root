package flow

// delay is special type that run steps later
// returns some identifier by which we can get the result later (or cannot)
// like concurrent but we will not wait for finishing
type delay []Step
