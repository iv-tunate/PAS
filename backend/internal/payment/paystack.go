package payment

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Gateway interface {
	InitializeTransaction(email string, amountKobo int64, reference, callbackURL string) (authorizationURL string, err error)
	VerifyTransaction(reference string) (status string, amountKobo int64, err error)
	VerifyWebhookSignature(payload []byte, signatureHeader string) bool
}

type paystackGateway struct {
	secretKey string
	client    *http.Client
}

func NewPaystackGateway(secretKey string) Gateway {
	return &paystackGateway{secretKey: secretKey, client: &http.Client{}}
}

const paystackBaseURL = "https://api.paystack.co"

type initRequest struct {
	Email       string `json:"email"`
	Amount      int64  `json:"amount"`
	Reference   string `json:"reference"`
	CallbackURL string `json:"callback_url"`
}

type initResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

func (p *paystackGateway) InitializeTransaction(email string, amountKobo int64, reference, callbackURL string) (string, error) {
	body, err := json.Marshal(initRequest{
		Email:       email,
		Amount:      amountKobo,
		Reference:   reference,
		CallbackURL: callbackURL,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, paystackBaseURL+"/transaction/initialize", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+p.secretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out initResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if !out.Status {
		return "", fmt.Errorf("paystack: %s", out.Message)
	}
	return out.Data.AuthorizationURL, nil
}

type verifyResponse struct {
	Status bool `json:"status"`
	Data   struct {
		Status string `json:"status"` // "success" | "failed" | "abandoned"
		Amount int64  `json:"amount"`
	} `json:"data"`
}

func (p *paystackGateway) VerifyTransaction(reference string) (string, int64, error) {
	req, err := http.NewRequest(http.MethodGet, paystackBaseURL+"/transaction/verify/"+reference, nil)
	if err != nil {
		return "", 0, err
	}
	req.Header.Set("Authorization", "Bearer "+p.secretKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	var out verifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", 0, err
	}
	if !out.Status {
		return "", 0, fmt.Errorf("paystack: verification request failed")
	}
	return out.Data.Status, out.Data.Amount, nil
}

func (p *paystackGateway) VerifyWebhookSignature(payload []byte, signatureHeader string) bool {
	mac := hmac.New(sha512.New, []byte(p.secretKey))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signatureHeader))
}

type paystackBookGateway struct {
	inner *paystackGateway
}

func NewPaystackBookGateway(secretKey string) BookGateway {
	return &paystackBookGateway{inner: &paystackGateway{secretKey: secretKey, client: &http.Client{}}}
}

func (g *paystackBookGateway) Name() string { return "paystack" }

func (g *paystackBookGateway) Initialize(email string, amount int64, currency, reference, callbackURL string) (string, error) {
	return g.inner.InitializeTransaction(email, amount, reference, callbackURL)
}

func (g *paystackBookGateway) Verify(reference string) (string, error) {
	status, _, err := g.inner.VerifyTransaction(reference)
	if err != nil {
		return "", err
	}
	if status == "success" {
		return "success", nil
	}
	return "failed", nil
}

func (g *paystackBookGateway) VerifyWebhookSignature(payload []byte, signatureHeader string) bool {
	return g.inner.VerifyWebhookSignature(payload, signatureHeader)
}

func ReadAndRestoreBody(body io.ReadCloser) ([]byte, io.ReadCloser, error) {
	raw, err := io.ReadAll(body)
	if err != nil {
		return nil, nil, err
	}
	return raw, io.NopCloser(bytes.NewReader(raw)), nil
}
