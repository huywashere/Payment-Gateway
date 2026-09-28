package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

const maxBody = 1 << 20

type config struct {
	addr, coreURL, coreKey, edgeSecret string
	workers, queueSize                 int
}

type job struct{ bank, payload, bankSignature, requestID string }
type metrics struct{ accepted, rejected, queueFull, succeeded, failed atomic.Uint64 }
type server struct {
	cfg         config
	client      *http.Client
	jobs        chan job
	log         *slog.Logger
	metrics     metrics
	mu          sync.RWMutex
	subscribers map[chan []byte]struct{}
}

func main() {
	cfg := config{addr: env("INFRA_GATEWAY_ADDR", ":8090"), coreURL: strings.TrimRight(env("GATEWAY_CORE_URL", "http://localhost:8080"), "/"), coreKey: env("GATEWAY_CORE_SECRET_KEY", "sk_test_demo_gateway_key_999"), edgeSecret: env("INFRA_INGEST_SECRET", "sandbox-infra-ingest-secret"), workers: envInt("INFRA_WORKERS", 8), queueSize: envInt("INFRA_QUEUE_SIZE", 2048)}
	s := newServer(cfg)
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	for range cfg.workers {
		go s.worker(ctx)
	}
	// WriteTimeout remains disabled because this server exposes long-lived SSE responses.
	// Every mutating handler has an explicit body limit and the downstream client has its own timeout.
	httpServer := &http.Server{Addr: cfg.addr, Handler: s.routes(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 0, IdleTimeout: 60 * time.Second}
	go func() {
		<-ctx.Done()
		shutdown, done := context.WithTimeout(context.Background(), 10*time.Second)
		defer done()
		_ = httpServer.Shutdown(shutdown)
	}()
	s.log.Info("infra gateway listening", "address", cfg.addr, "workers", cfg.workers, "queue", cfg.queueSize)
	if err := httpServer.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		s.log.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func newServer(cfg config) *server {
	return &server{cfg: cfg, client: &http.Client{Timeout: 8 * time.Second}, jobs: make(chan job, cfg.queueSize), log: slog.New(slog.NewJSONHandler(os.Stdout, nil)), subscribers: map[chan []byte]struct{}{}}
}
func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"status": "ready", "queue_depth": len(s.jobs), "queue_capacity": cap(s.jobs)})
	})
	mux.HandleFunc("GET /metrics", s.handleMetrics)
	mux.HandleFunc("POST /v1/ingest/banks/{bank}", s.handleIngest)
	mux.HandleFunc("GET /v1/realtime/events", s.handleEvents)
	mux.HandleFunc("POST /v1/realtime/publish", s.handlePublish)
	return requestMiddleware(mux)
}

func (s *server) handleIngest(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxBody))
	if err != nil {
		s.metrics.rejected.Add(1)
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "payload_too_large"})
		return
	}
	if !verify(r.Header.Get("X-Infra-Timestamp"), r.Header.Get("X-Infra-Signature"), body, s.cfg.edgeSecret, time.Now()) {
		s.metrics.rejected.Add(1)
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid_edge_signature"})
		return
	}
	bank := strings.ToUpper(strings.TrimSpace(r.PathValue("bank")))
	if bank == "" || len(bank) > 30 {
		s.metrics.rejected.Add(1)
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_bank"})
		return
	}
	item := job{bank: bank, payload: string(body), bankSignature: r.Header.Get("X-Bank-Signature"), requestID: r.Header.Get("X-Request-ID")}
	select {
	case s.jobs <- item:
		s.metrics.accepted.Add(1)
		writeJSON(w, http.StatusAccepted, map[string]any{"accepted": true, "queue_depth": len(s.jobs), "request_id": item.requestID})
	default:
		s.metrics.rejected.Add(1)
		s.metrics.queueFull.Add(1)
		w.Header().Set("Retry-After", "1")
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "ingest_queue_full"})
	}
}

func (s *server) worker(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case item := <-s.jobs:
			var err error
			for attempt := 0; attempt < 3; attempt++ {
				if attempt > 0 {
					select {
					case <-ctx.Done():
						return
					case <-time.After(time.Duration(1<<attempt) * 150 * time.Millisecond):
					}
				}
				err = s.forward(ctx, item)
				if err == nil {
					break
				}
			}
			if err != nil {
				s.metrics.failed.Add(1)
				s.log.Error("bank ingest failed", "bank", item.bank, "request_id", item.requestID, "error", err)
			} else {
				s.metrics.succeeded.Add(1)
				s.publish([]byte(fmt.Sprintf(`{"type":"bank_transaction_ingested","bank":"%s","request_id":"%s","occurred_at":"%s"}`, item.bank, item.requestID, time.Now().UTC().Format(time.RFC3339))))
			}
		}
	}
}

func (s *server) forward(ctx context.Context, item job) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, s.cfg.coreURL+"/v1/bank_transactions/inbox/"+item.bank, strings.NewReader(item.payload))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+s.cfg.coreKey)
	request.Header.Set("X-Bank-Signature", item.bankSignature)
	request.Header.Set("X-Request-ID", item.requestID)
	response, err := s.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 64<<10))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("core returned %d", response.StatusCode)
	}
	return nil
}

func (s *server) handleEvents(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	channel := make(chan []byte, 32)
	s.mu.Lock()
	s.subscribers[channel] = struct{}{}
	s.mu.Unlock()
	defer func() { s.mu.Lock(); delete(s.subscribers, channel); s.mu.Unlock(); close(channel) }()
	fmt.Fprint(w, "event: ready\ndata: {\"status\":\"connected\"}\n\n")
	flusher.Flush()
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case payload := <-channel:
			fmt.Fprintf(w, "event: update\ndata: %s\n\n", payload)
			flusher.Flush()
		case <-ticker.C:
			fmt.Fprint(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}

func (s *server) handlePublish(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxBody))
	if err != nil {
		writeJSON(w, 413, map[string]string{"error": "payload_too_large"})
		return
	}
	if !verify(r.Header.Get("X-Infra-Timestamp"), r.Header.Get("X-Infra-Signature"), body, s.cfg.edgeSecret, time.Now()) {
		writeJSON(w, 401, map[string]string{"error": "invalid_edge_signature"})
		return
	}
	var payload json.RawMessage
	if err := json.Unmarshal(body, &payload); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid_json"})
		return
	}
	compact, _ := json.Marshal(payload)
	s.publish(compact)
	writeJSON(w, 202, map[string]bool{"published": true})
}
func (s *server) publish(payload []byte) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for channel := range s.subscribers {
		select {
		case channel <- payload:
		default:
		}
	}
}
func (s *server) handleMetrics(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	fmt.Fprintf(w, "novagate_ingest_accepted_total %d\nnovagate_ingest_rejected_total %d\nnovagate_ingest_queue_full_total %d\nnovagate_ingest_succeeded_total %d\nnovagate_ingest_failed_total %d\nnovagate_ingest_queue_depth %d\nnovagate_ingest_queue_capacity %d\nnovagate_realtime_clients %d\n", s.metrics.accepted.Load(), s.metrics.rejected.Load(), s.metrics.queueFull.Load(), s.metrics.succeeded.Load(), s.metrics.failed.Load(), len(s.jobs), cap(s.jobs), s.clientCount())
}
func (s *server) clientCount() int { s.mu.RLock(); defer s.mu.RUnlock(); return len(s.subscribers) }

func verify(timestamp, signature string, body []byte, secret string, now time.Time) bool {
	unix, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || now.Sub(time.Unix(unix, 0)).Abs() > 5*time.Minute {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(timestamp + "."))
	_, _ = mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	provided := strings.TrimPrefix(signature, "sha256=")
	return len(provided) == len(expected) && subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) == 1
}
func requestMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = fmt.Sprintf("go_%d", time.Now().UnixNano())
		}
		w.Header().Set("X-Request-ID", requestID)
		r.Header.Set("X-Request-ID", requestID)
		next.ServeHTTP(w, r)
	})
}
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(env(key, ""))
	if err != nil || value < 1 {
		return fallback
	}
	return value
}
