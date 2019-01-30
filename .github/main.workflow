workflow "New workflow" {
  on = "push"
  resolves = ["build", "deploy"]
}

action "test" {
  uses = "docker://golang"
  runs = "go test"
}

action "build" {
  uses = "docker://golang"
  runs = "go build"
}

action "deploy" {
  uses = "docker://golang"
  needs = ["test", "build"]
}
