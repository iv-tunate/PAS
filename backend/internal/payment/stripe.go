package payment

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type stripeGateway struct {
	secretKey     string
	webhookSecret string
	client        *http.Client
}

func NewStripeGateway(secretKey, webhookSecret string) *stripeGateway {
	return &stripeGateway{secretKey: secretKey, webhookSecret: webhookSecret, client: &http.Client{}}
}

func (g *stripeGateway) Name() string { return "stripe" }

const stripeBaseURL = "https://api.stripe.com/v1"

func (g *stripeGateway) Initialize(email string, amountCents int64, currency, reference, callbackURL string) (string, error) {
	form := url.Values{}
	form.Set("mode", "payment")
	form.Set("customer_email", email)
	form.Set("client_reference_id", reference)
	form.Set("success_url", callbackURL+"?reference="+reference)
	form.Set("cancel_url", callbackURL+"?reference="+reference+"&cancelled=true")
	form.Set("line_items[0][price_data][currency]", strings.ToLower(currency))
	form.Set("line_items[0][price_data][unit_amount]", strconv.FormatInt(amountCents, 10))
	form.Set("line_items[0][price_data][product_data][name]", "Book purchase")
	form.Set("line_items[0][quantity]", "1")
	form.Set("metadata[reference]", reference)

	req, err := http.NewRequest(http.MethodPost, stripeBaseURL+"/checkout/sessions", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+g.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := g.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out struct {
		URL   string `json:"url"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if out.URL == "" {
		return "", fmt.Errorf("stripe: %s", out.Error.Message)
	}
	return out.URL, nil
}

func (g *stripeGateway) Verify(reference string) (string, error) {
	req, err := http.NewRequest(http.MethodGet, stripeBaseURL+"/checkout/sessions?limit=1", nil)
	if err != nil {
		return "", err
	}
	q := req.URL.Query()
	q.Set("client_reference_id", reference)
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Authorization", "Bearer "+g.secretKey)

	resp, err := g.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out struct {
		Data []struct {
			PaymentStatus string `json:"payment_status"` // "paid" | "unpaid"
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if len(out.Data) == 0 {
		return "failed", nil
	}
	if out.Data[0].PaymentStatus == "paid" {
		return "success", nil
	}
	return "failed", nil
}

func (g *stripeGateway) VerifyWebhookSignature(payload []byte, signatureHeader string) bool {
	var timestamp, signature string
	for _, part := range strings.Split(signatureHeader, ",") {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			timestamp = kv[1]
		case "v1":
			signature = kv[1]
		}
	}
	if timestamp == "" || signature == "" {
		return false
	}

	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || time.Since(time.Unix(ts, 0)) > 5*time.Minute {
		return false
	}

	signedPayload := timestamp + "." + string(payload)
	mac := hmac.New(sha256.New, []byte(g.webhookSecret))
	mac.Write([]byte(signedPayload))
	expected := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(signature))
}

func ExtractReference(payload []byte) string {
	var event struct {
		Data struct {
			Object struct {
				ClientReferenceID string `json:"client_reference_id"`
			} `json:"object"`
		} `json:"data"`
	}
	_ = json.Unmarshal(payload, &event)
	return event.Data.Object.ClientReferenceID
}
