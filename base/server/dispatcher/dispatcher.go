package dispatcher

// WORKER is nil value, just null object in the queue for channel blocking when all workers busy
var WORKER = struct{}{}

// Task is abstract job
// something that the worker can do
type Task interface {
	Solve()
}

type Dispatcher chan struct{}

// New returns new Dispatcher instance with all channels linked
// with buffered waiting channel of MaxWorkers ( cap(Dispatcher) == Dispatcher )
func New(MaxWorkers int) Dispatcher {
	return make(chan struct{}, MaxWorkers)
}

func (d Dispatcher) Prepare() {
	n := cap(d)

	d.Add(n)      // fill the pool of workers
	StartupLog(n) // log about dispatcher status
}

// Wait waits for nearest freed resource in channel (blocking operation)
// this will block until all workers is idle
func (d Dispatcher) Wait() {
	<-d
}

// Do send task to worker's task channel
// then worker registered back to pool of free resources
func (d Dispatcher) Do(task Task) {
	if task == nil {
		// idle
		d.Add(1) // return worker to pool
	}

	go func() {
		// we have received some task to solve!
		task.Solve()
		// attach worker back to pool
		d.Add(1)
	}()
}

// AddWorker adds worker to channel
// This means that free resources have appeared in the resource pool
// and tasks can be performed.
func (d Dispatcher) Add(n int) {
	// NOTE: if n > left places - this operation will hung
	// TODO: maybe throw error pool full?
	for i := 0; i < n; i++ {
		d <- WORKER
	}
}
