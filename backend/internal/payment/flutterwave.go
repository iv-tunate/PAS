package payment

import (
	"bytes"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
)

type BookGateway interface {
	Name() string
	Initialize(email string, amount int64, currency, reference, callbackURL string) (checkoutURL string, err error)
	Verify(reference string) (status string, err error) // "success" | "failed" | "pending"
}

type flutterwaveGateway struct {
	secretKey         string
	webhookSecretHash string
	client            *http.Client
}

func NewFlutterwaveGateway(secretKey, webhookSecretHash string) BookGateway {
	return &flutterwaveGateway{secretKey: secretKey, webhookSecretHash: webhookSecretHash, client: &http.Client{}}
}

func (g *flutterwaveGateway) Name() string { return "flutterwave" }

const flutterwaveBaseURL = "https://api.flutterwave.com/v3"

type flwInitRequest struct {
	TxRef       string      `json:"tx_ref"`
	Amount      string      `json:"amount"`
	Currency    string      `json:"currency"`
	RedirectURL string      `json:"redirect_url"`
	Customer    flwCustomer `json:"customer"`
}

type flwCustomer struct {
	Email string `json:"email"`
}

type flwInitResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Link string `json:"link"`
	} `json:"data"`
}

func (g *flutterwaveGateway) Initialize(email string, amount int64, currency, reference, callbackURL string) (string, error) {
	major := float64(amount) / 100

	body, err := json.Marshal(flwInitRequest{
		TxRef:       reference,
		Amount:      fmt.Sprintf("%.2f", major),
		Currency:    currency,
		RedirectURL: callbackURL,
		Customer:    flwCustomer{Email: email},
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, flutterwaveBaseURL+"/payments", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+g.secretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out flwInitResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if out.Status != "success" {
		return "", fmt.Errorf("flutterwave: %s", out.Message)
	}
	return out.Data.Link, nil
}

type flwVerifyResponse struct {
	Status string `json:"status"`
	Data   struct {
		Status string `json:"status"` // "successful" | "failed"
	} `json:"data"`
}

func (g *flutterwaveGateway) Verify(reference string) (string, error) {
	req, err := http.NewRequest(http.MethodGet, flutterwaveBaseURL+"/transactions/verify_by_reference?tx_ref="+reference, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+g.secretKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out flwVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}

	if out.Data.Status == "successful" {
		return "success", nil
	}
	return "failed", nil
}

func (g *flutterwaveGateway) VerifyWebhookSignature(headerValue string) bool {
	return subtle.ConstantTimeCompare([]byte(headerValue), []byte(g.webhookSecretHash)) == 1
}
