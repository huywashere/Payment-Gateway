package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestVerifySignature(t *testing.T) {
	now := time.Now()
	body := []byte(`{"amount":1000}`)
	timestamp := formatUnix(now)
	mac := hmac.New(sha256.New, []byte("secret"))
	_, _ = mac.Write([]byte(timestamp + "."))
	_, _ = mac.Write(body)
	signature := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	if !verify(timestamp, signature, body, "secret", now) {
		t.Fatal("expected valid signature")
	}
	if verify(timestamp, signature, []byte("changed"), "secret", now) {
		t.Fatal("tampered body must fail")
	}
}
func TestHealthAndQueueProtection(t *testing.T) {
	s := newServer(config{coreURL: "http://127.0.0.1:1", coreKey: "test", edgeSecret: "secret", workers: 1, queueSize: 1})
	health := httptest.NewRecorder()
	s.routes().ServeHTTP(health, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if health.Code != http.StatusOK {
		t.Fatalf("health status %d", health.Code)
	}
	body := `{"amount":1000}`
	timestamp := formatUnix(time.Now())
	signature := sign(timestamp, body, "secret")
	for expected, code := range []int{http.StatusAccepted, http.StatusServiceUnavailable} {
		request := httptest.NewRequest(http.MethodPost, "/v1/ingest/banks/ACB", strings.NewReader(body))
		request.Header.Set("X-Infra-Timestamp", timestamp)
		request.Header.Set("X-Infra-Signature", signature)
		response := httptest.NewRecorder()
		s.routes().ServeHTTP(response, request)
		if response.Code != code {
			t.Fatalf("request %d expected %d got %d", expected, code, response.Code)
		}
	}
}

func TestPublishRejectsSignedNonJSONPayload(t *testing.T) {
	s := newServer(config{coreURL: "http://127.0.0.1:1", coreKey: "test", edgeSecret: "secret", workers: 1, queueSize: 1})
	body := "event: injected"
	timestamp := formatUnix(time.Now())
	request := httptest.NewRequest(http.MethodPost, "/v1/realtime/publish", strings.NewReader(body))
	request.Header.Set("X-Infra-Timestamp", timestamp)
	request.Header.Set("X-Infra-Signature", sign(timestamp, body, "secret"))
	response := httptest.NewRecorder()
	s.routes().ServeHTTP(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected signed invalid JSON to be rejected, got %d", response.Code)
	}
}
func formatUnix(value time.Time) string { return strings.TrimSpace(timeToString(value.Unix())) }
func timeToString(value int64) string {
	const digits = "0123456789"
	if value == 0 {
		return "0"
	}
	buffer := make([]byte, 0, 20)
	for value > 0 {
		buffer = append([]byte{digits[value%10]}, buffer...)
		value /= 10
	}
	return string(buffer)
}
func sign(timestamp, body, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(timestamp + "."))
	_, _ = mac.Write([]byte(body))
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}
