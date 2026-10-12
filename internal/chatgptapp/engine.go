package chatgptapp

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"os/exec"
	"sync"
	"time"
)

type Engine interface {
	Process(context.Context, string, map[string]any) (map[string]any, error)
}

type NodeEngine struct {
	Node, Worker string
	slots        chan struct{}
	once         sync.Once
}
type limitedOutput struct{ bytes.Buffer }

func (b *limitedOutput) Write(p []byte) (int, error) {
	if b.Len()+len(p) > 2_000_000 {
		return 0, errors.New("engine response too large")
	}
	return b.Buffer.Write(p)
}
func (e *NodeEngine) Process(ctx context.Context, operation string, input map[string]any) (map[string]any, error) {
	e.once.Do(func() { e.slots = make(chan struct{}, 4) })
	select {
	case e.slots <- struct{}{}:
		defer func() { <-e.slots }()
	default:
		return nil, errors.New("LabelCraft is busy; retry your request later")
	}
	data, err := json.Marshal(map[string]any{"operation": operation, "input": input})
	if err != nil || len(data) > 1_000_000 {
		return nil, errors.New("invalid or oversized input")
	}
	ctx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	node := e.Node
	if node == "" {
		node = "node"
	}
	cmd := exec.CommandContext(ctx, node, e.Worker)
	cmd.Stdin = bytes.NewReader(data)
	var output limitedOutput
	cmd.Stdout = &output
	cmd.WaitDelay = time.Second
	// No model-generated code, arguments, URLs, or printer commands are executed.
	if err = cmd.Run(); err != nil {
		return nil, errors.New("shared label engine failed or timed out")
	}
	var result struct {
		OK     bool           `json:"ok"`
		Output map[string]any `json:"output"`
		Error  string         `json:"error"`
	}
	decoder := json.NewDecoder(&output)
	decoder.DisallowUnknownFields()
	if decoder.Decode(&result) != nil {
		return nil, errors.New("invalid label engine response")
	}
	if !result.OK {
		return nil, errors.New(result.Error)
	}
	if result.Output == nil {
		return nil, errors.New("missing label engine output")
	}
	return result.Output, nil
}
