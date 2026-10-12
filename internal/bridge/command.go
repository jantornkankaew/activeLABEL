package bridge

import (
	"bytes"
	"context"
	"errors"
	"os"
	"os/exec"
	"time"
)

type boundedOutput struct {
	bytes.Buffer
	limit int
}

func (b *boundedOutput) Write(p []byte) (int, error) {
	if b.Len()+len(p) > b.limit {
		return 0, errors.New("native printer command output exceeds limit")
	}
	return b.Buffer.Write(p)
}
func nativeCommand(timeout time.Duration, path string, args ...string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	cmd := exec.CommandContext(ctx, path, args...)
	cmd.Env = append(os.Environ(), "LC_ALL=C", "LANG=C")
	out := boundedOutput{limit: 256 * 1024}
	errout := boundedOutput{limit: 4096}
	cmd.Stdout = &out
	cmd.Stderr = &errout
	err := cmd.Run()
	if ctx.Err() != nil {
		err = ctx.Err()
	}
	return out.String(), errout.String(), err
}
