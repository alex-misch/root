package flow

// normalize returns actual steps (without nil values)
func normalize(steps ...Step) []Step {
	if steps == nil || len(steps) == 0 {
		return nil
	}

	new := make([]Step, 0)

	for _, step := range steps {
		if step != nil {
			new = append(new, step)
		}
	}

	if len(new) == 0 {
		return nil
	}

	return new
}
